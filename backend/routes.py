from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Optional
from datetime import datetime, timezone, time
import os
import uuid
import json
import base64

from models import (
    UserCreate, UserResponse, UserLogin, LoginResponse, UserRole, UserStatus,
    QRCodeCreate, QRCodeResponse, ShiftType,
    AttendanceCreate, AttendanceResponse, AttendancePunchOut, AttendanceStatus,
    LeaveCreate, LeaveResponse, LeaveStatus,
    BillSubmissionCreate, BillSubmissionResponse, BillItemBase, BillStatus,
    PayslipCreate, PayslipResponse, PayslipStatus, SalaryBreakdown,
    HolidayCreate, HolidayResponse,
    BusinessInfo
)

router = APIRouter()

# Get DB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Helper functions
def generate_id():
    return str(uuid.uuid4())[:8].upper()

def get_utc_now_str():
    return datetime.now(timezone.utc).isoformat()

def parse_time(time_str: str) -> time:
    """Parse HH:MM time string to time object"""
    h, m = map(int, time_str.split(':'))
    return time(h, m)

def calculate_attendance_status(scan_time_str: str, shift_start: str, shift_end: str, shift_type: str) -> str:
    """
    Calculate attendance status based on scan time and shift timings.
    
    Rules:
    - Scan on or before (shift_start + 30 min) → Full Day
    - Scan between (shift_start + 30 min) and (shift_start + 3 hours) → Half Day
    - Scan after (shift_start + 3 hours) → Absent
    """
    scan_time = parse_time(scan_time_str)
    shift_start_time = parse_time(shift_start)
    
    # Calculate grace period (30 minutes after shift start)
    grace_minutes = shift_start_time.hour * 60 + shift_start_time.minute + 30
    grace_hour = grace_minutes // 60
    grace_min = grace_minutes % 60
    grace_time = time(grace_hour % 24, grace_min)
    
    # Calculate half-day cutoff (3 hours after shift start)
    halfday_minutes = shift_start_time.hour * 60 + shift_start_time.minute + 180  # 3 hours
    halfday_hour = halfday_minutes // 60
    halfday_min = halfday_minutes % 60
    halfday_time = time(halfday_hour % 24, halfday_min)
    
    # Handle night shift where times cross midnight
    if shift_type == "night":
        # For night shift, we need different logic
        # Night shift: e.g., 21:00 - 06:00
        scan_minutes = scan_time.hour * 60 + scan_time.minute
        shift_start_minutes = shift_start_time.hour * 60 + shift_start_time.minute
        
        # Normalize for comparison (if scan time is past midnight, add 24 hours)
        if scan_minutes < 12 * 60:  # Before noon, assume it's next day
            scan_minutes += 24 * 60
        if shift_start_minutes < 12 * 60:
            shift_start_minutes += 24 * 60
            
        grace_limit = shift_start_minutes + 30
        halfday_limit = shift_start_minutes + 180
        
        if scan_minutes <= grace_limit:
            return "full_day"
        elif scan_minutes <= halfday_limit:
            return "half_day"
        else:
            return "absent"
    else:
        # Day shift logic
        if scan_time <= grace_time:
            return "full_day"
        elif scan_time <= halfday_time:
            return "half_day"
        else:
            return "absent"

# ==================== AUTH ROUTES ====================

@router.post("/auth/login", response_model=LoginResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one(
        {"$or": [
            {"id": credentials.user_id.upper()},
            {"id": credentials.user_id},
            {"email": credentials.user_id.lower()}
        ]},
        {"_id": 0}
    )
    
    if not user:
        return LoginResponse(success=False, error="User not found")
    
    if user.get("password") != credentials.password:
        return LoginResponse(success=False, error="Invalid password")
    
    # Remove password from response
    user_data = {k: v for k, v in user.items() if k != "password"}
    
    # Generate simple token (in production, use JWT)
    token = base64.b64encode(f"{user['id']}:{get_utc_now_str()}".encode()).decode()
    
    return LoginResponse(
        success=True,
        user=UserResponse(**user_data),
        token=token
    )

# ==================== USER ROUTES ====================

@router.get("/users", response_model=List[UserResponse])
async def get_users(role: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if role:
        query["role"] = role
    if status:
        query["status"] = status
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate):
    user_dict = user.model_dump()
    user_dict["id"] = generate_id()
    
    # Check for duplicate email
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    await db.users.insert_one(user_dict)
    
    # Return without password
    del user_dict["password"]
    return UserResponse(**user_dict)

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, updates: dict):
    # Remove sensitive fields from updates
    updates.pop("_id", None)
    updates.pop("id", None)
    updates.pop("password", None)
    
    result = await db.users.update_one({"id": user_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return UserResponse(**user)

@router.get("/users/team/{team_lead_id}", response_model=List[UserResponse])
async def get_team_members(team_lead_id: str):
    # Get team lead to find team members
    team_lead = await db.users.find_one({"id": team_lead_id}, {"_id": 0})
    if not team_lead:
        raise HTTPException(status_code=404, detail="Team lead not found")
    
    team_member_ids = team_lead.get("team_members", [])
    members = await db.users.find(
        {"id": {"$in": team_member_ids}},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    return members

# ==================== QR CODE ROUTES ====================

@router.post("/qr-codes", response_model=QRCodeResponse)
async def create_qr_code(qr_data: QRCodeCreate):
    qr_id = generate_id()
    
    # Create QR data string (will be encoded in actual QR)
    qr_string = json.dumps({
        "id": qr_id,
        "location": qr_data.location,
        "conveyance": qr_data.conveyance_amount,
        "date": qr_data.date,
        "created_by": qr_data.created_by
    })
    
    qr_doc = {
        "id": qr_id,
        "location": qr_data.location,
        "conveyance_amount": qr_data.conveyance_amount,
        "date": qr_data.date,
        "created_by": qr_data.created_by,
        "qr_data": qr_string,
        "created_at": get_utc_now_str(),
        "is_active": True
    }
    
    await db.qr_codes.insert_one(qr_doc)
    qr_doc.pop("_id", None)
    
    return QRCodeResponse(**qr_doc)

@router.get("/qr-codes", response_model=List[QRCodeResponse])
async def get_qr_codes(created_by: Optional[str] = None, date: Optional[str] = None):
    query = {}
    if created_by:
        query["created_by"] = created_by
    if date:
        query["date"] = date
    
    qr_codes = await db.qr_codes.find(query, {"_id": 0}).to_list(100)
    return qr_codes

@router.get("/qr-codes/{qr_id}", response_model=QRCodeResponse)
async def get_qr_code(qr_id: str):
    qr = await db.qr_codes.find_one({"id": qr_id}, {"_id": 0})
    if not qr:
        raise HTTPException(status_code=404, detail="QR code not found")
    return qr

@router.put("/qr-codes/{qr_id}/deactivate")
async def deactivate_qr_code(qr_id: str):
    result = await db.qr_codes.update_one(
        {"id": qr_id},
        {"$set": {"is_active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="QR code not found")
    return {"message": "QR code deactivated"}

# ==================== ATTENDANCE ROUTES ====================

@router.post("/attendance/punch-in", response_model=AttendanceResponse)
async def punch_in(data: AttendanceCreate, emp_id: str):
    # Parse QR data
    try:
        qr_info = json.loads(data.qr_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid QR code data: {str(e)}")
    
    # Verify QR code exists and is active
    qr_code = await db.qr_codes.find_one({"id": qr_info.get("id")}, {"_id": 0})
    if not qr_code:
        raise HTTPException(status_code=404, detail="QR code not found. Please ask your Team Leader to generate a new QR code.")
    if not qr_code.get("is_active", False):
        raise HTTPException(status_code=400, detail="This QR code has expired. Please ask your Team Leader for a new one.")
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Check if already punched in today - return existing record instead of error
    existing = await db.attendance.find_one({"emp_id": emp_id, "date": today}, {"_id": 0})
    if existing:
        # Return the existing attendance record
        return AttendanceResponse(**existing)
    
    attendance_doc = {
        "id": generate_id(),
        "emp_id": emp_id,
        "date": today,
        "punch_in": datetime.now(timezone.utc).strftime("%H:%M"),
        "punch_out": None,
        "status": "present",
        "work_hours": 0,
        "qr_code_id": qr_code["id"],
        "location": qr_code["location"],
        "conveyance_amount": qr_code["conveyance_amount"]
    }
    
    await db.attendance.insert_one(attendance_doc)
    attendance_doc.pop("_id", None)
    
    return AttendanceResponse(**attendance_doc)

@router.post("/attendance/punch-out", response_model=AttendanceResponse)
async def punch_out(data: AttendancePunchOut):
    attendance = await db.attendance.find_one(
        {"emp_id": data.emp_id, "date": data.date},
        {"_id": 0}
    )
    
    if not attendance:
        raise HTTPException(status_code=404, detail="No punch-in record found for today")
    
    if attendance.get("punch_out"):
        raise HTTPException(status_code=400, detail="Already punched out")
    
    punch_out_time = datetime.now(timezone.utc).strftime("%H:%M")
    
    # Calculate work hours
    punch_in = attendance["punch_in"]
    in_hour, in_min = map(int, punch_in.split(":"))
    out_hour, out_min = map(int, punch_out_time.split(":"))
    
    work_hours = (out_hour - in_hour) + (out_min - in_min) / 60
    work_hours = round(max(0, work_hours), 2)
    
    await db.attendance.update_one(
        {"emp_id": data.emp_id, "date": data.date},
        {"$set": {"punch_out": punch_out_time, "work_hours": work_hours}}
    )
    
    attendance["punch_out"] = punch_out_time
    attendance["work_hours"] = work_hours
    
    return AttendanceResponse(**attendance)

@router.get("/attendance", response_model=List[AttendanceResponse])
async def get_attendance(
    emp_id: Optional[str] = None,
    date: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None
):
    query = {}
    if emp_id:
        query["emp_id"] = emp_id
    if date:
        query["date"] = date
    if month and year:
        # Filter by month/year using regex
        month_str = f"{year}-{month:02d}"
        query["date"] = {"$regex": f"^{month_str}"}
    
    attendance = await db.attendance.find(query, {"_id": 0}).to_list(1000)
    return attendance

@router.get("/attendance/{emp_id}/monthly", response_model=List[AttendanceResponse])
async def get_monthly_attendance(emp_id: str, month: int, year: int):
    month_str = f"{year}-{month:02d}"
    attendance = await db.attendance.find(
        {"emp_id": emp_id, "date": {"$regex": f"^{month_str}"}},
        {"_id": 0}
    ).to_list(100)
    return attendance

# ==================== LEAVE ROUTES ====================

@router.post("/leaves", response_model=LeaveResponse)
async def create_leave(leave: LeaveCreate):
    leave_doc = leave.model_dump()
    leave_doc["id"] = generate_id()
    leave_doc["status"] = LeaveStatus.PENDING
    leave_doc["applied_on"] = get_utc_now_str()[:10]
    
    await db.leaves.insert_one(leave_doc)
    leave_doc.pop("_id", None)
    
    return LeaveResponse(**leave_doc)

@router.get("/leaves", response_model=List[LeaveResponse])
async def get_leaves(emp_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if emp_id:
        query["emp_id"] = emp_id
    if status:
        query["status"] = status
    
    leaves = await db.leaves.find(query, {"_id": 0}).to_list(1000)
    return leaves

@router.put("/leaves/{leave_id}/approve")
async def approve_leave(leave_id: str, approved_by: str):
    result = await db.leaves.update_one(
        {"id": leave_id},
        {"$set": {"status": LeaveStatus.APPROVED, "approved_by": approved_by}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Leave request not found")
    return {"message": "Leave approved"}

@router.put("/leaves/{leave_id}/reject")
async def reject_leave(leave_id: str, rejected_by: str):
    result = await db.leaves.update_one(
        {"id": leave_id},
        {"$set": {"status": LeaveStatus.REJECTED, "rejected_by": rejected_by}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Leave request not found")
    return {"message": "Leave rejected"}

# ==================== BILL SUBMISSION ROUTES ====================

@router.post("/bills", response_model=BillSubmissionResponse)
async def create_bill_submission(bill: BillSubmissionCreate, emp_id: str, emp_name: str):
    total = sum(item.amount for item in bill.items)
    
    bill_doc = {
        "id": generate_id(),
        "emp_id": emp_id,
        "emp_name": emp_name,
        "month": bill.month,
        "year": bill.year,
        "items": [item.model_dump() for item in bill.items],
        "total_amount": total,
        "remarks": bill.remarks,
        "status": BillStatus.PENDING,
        "submitted_on": get_utc_now_str()[:10],
        "approved_amount": 0,
        "approved_by": None,
        "approved_on": None
    }
    
    await db.bills.insert_one(bill_doc)
    bill_doc.pop("_id", None)
    
    return BillSubmissionResponse(**bill_doc)

@router.get("/bills", response_model=List[BillSubmissionResponse])
async def get_bills(
    emp_id: Optional[str] = None,
    status: Optional[str] = None,
    month: Optional[str] = None,
    year: Optional[int] = None
):
    query = {}
    if emp_id:
        query["emp_id"] = emp_id
    if status:
        query["status"] = status
    if month:
        query["month"] = month
    if year:
        query["year"] = year
    
    bills = await db.bills.find(query, {"_id": 0}).to_list(1000)
    return bills

@router.put("/bills/{bill_id}/approve")
async def approve_bill(bill_id: str, approved_by: str, approved_amount: float):
    result = await db.bills.update_one(
        {"id": bill_id},
        {"$set": {
            "status": BillStatus.APPROVED,
            "approved_by": approved_by,
            "approved_amount": approved_amount,
            "approved_on": get_utc_now_str()[:10]
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bill not found")
    return {"message": "Bill approved"}

@router.put("/bills/{bill_id}/reject")
async def reject_bill(bill_id: str, rejected_by: str):
    result = await db.bills.update_one(
        {"id": bill_id},
        {"$set": {"status": BillStatus.REJECTED, "rejected_by": rejected_by}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bill not found")
    return {"message": "Bill rejected"}

# File upload for bill attachments
@router.post("/bills/upload-attachment")
async def upload_attachment(file: UploadFile = File(...)):
    # Check file size (5MB max)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")
    
    # Check file type
    if not file.content_type == "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Save file
    file_id = generate_id()
    file_path = f"/app/backend/uploads/{file_id}.pdf"
    
    os.makedirs("/app/backend/uploads", exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(contents)
    
    return {"file_id": file_id, "url": f"/api/bills/attachments/{file_id}"}

@router.get("/bills/attachments/{file_id}")
async def get_attachment(file_id: str):
    from fastapi.responses import FileResponse
    file_path = f"/app/backend/uploads/{file_id}.pdf"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="application/pdf")

# ==================== PAYSLIP ROUTES ====================

@router.get("/payslips", response_model=List[PayslipResponse])
async def get_payslips(
    emp_id: Optional[str] = None,
    status: Optional[str] = None
):
    query = {}
    if emp_id:
        query["emp_id"] = emp_id
    if status:
        query["status"] = status
    
    payslips = await db.payslips.find(query, {"_id": 0}).to_list(1000)
    return payslips

@router.get("/payslips/{emp_id}/settled", response_model=List[PayslipResponse])
async def get_settled_payslips(emp_id: str):
    """Get only settled payslips for an employee"""
    payslips = await db.payslips.find(
        {"emp_id": emp_id, "status": PayslipStatus.SETTLED},
        {"_id": 0}
    ).to_list(100)
    return payslips

@router.post("/payslips/generate", response_model=PayslipResponse)
async def generate_payslip(data: PayslipCreate):
    # Get user details
    user = await db.users.find_one({"id": data.emp_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Calculate salary breakdown
    basic = user.get("salary", 0)
    hra = round(basic * 0.4, 2)  # 40% of basic
    special_allowance = round(basic * 0.15, 2)  # 15%
    conveyance = 1600  # Fixed
    
    # Get approved bills for this month (Extra Conveyance)
    approved_bills = await db.bills.find({
        "emp_id": data.emp_id,
        "month": data.month,
        "year": data.year,
        "status": BillStatus.APPROVED
    }).to_list(100)
    extra_conveyance = sum(b.get("approved_amount", 0) for b in approved_bills)
    
    # Get attendance conveyance for the month
    month_num = ["January", "February", "March", "April", "May", "June", 
                 "July", "August", "September", "October", "November", "December"].index(data.month.split()[0]) + 1
    month_str = f"{data.year}-{month_num:02d}"
    attendance_records = await db.attendance.find({
        "emp_id": data.emp_id,
        "date": {"$regex": f"^{month_str}"}
    }).to_list(100)
    attendance_conveyance = sum(a.get("conveyance_amount", 0) for a in attendance_records)
    
    # Calculate leave adjustment
    leaves = await db.leaves.find({
        "emp_id": data.emp_id,
        "status": LeaveStatus.APPROVED,
        "from_date": {"$regex": f"^{month_str}"}
    }).to_list(100)
    leave_days = sum(l.get("days", 0) for l in leaves)
    daily_rate = basic / 30
    leave_adjustment = -(leave_days * daily_rate) if leave_days > 0 else 0
    
    gross = basic + hra + special_allowance + conveyance + extra_conveyance + attendance_conveyance
    deductions = round(gross * 0.1, 2)  # 10% deductions (PF, Tax, etc.)
    net_pay = round(gross + leave_adjustment - deductions, 2)
    
    breakdown = SalaryBreakdown(
        basic=basic,
        hra=hra,
        special_allowance=special_allowance,
        conveyance=conveyance + attendance_conveyance,
        leave_adjustment=round(leave_adjustment, 2),
        extra_conveyance=extra_conveyance,
        previous_pending_allowances=0,
        gross_pay=round(gross, 2),
        deductions=deductions,
        net_pay=net_pay
    )
    
    payslip_doc = {
        "id": generate_id(),
        "emp_id": data.emp_id,
        "emp_name": user.get("name", ""),
        "month": data.month,
        "year": data.year,
        "breakdown": breakdown.model_dump(),
        "status": PayslipStatus.PENDING,
        "created_on": get_utc_now_str()[:10],
        "paid_on": None,
        "settled_on": None
    }
    
    await db.payslips.insert_one(payslip_doc)
    payslip_doc.pop("_id", None)
    
    return PayslipResponse(**payslip_doc)

@router.put("/payslips/{payslip_id}/settle")
async def settle_payslip(payslip_id: str):
    result = await db.payslips.update_one(
        {"id": payslip_id},
        {"$set": {
            "status": PayslipStatus.SETTLED,
            "paid_on": get_utc_now_str()[:10],
            "settled_on": get_utc_now_str()[:10]
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payslip not found")
    return {"message": "Payslip settled"}

@router.get("/payslips/{payslip_id}/download")
async def download_payslip(payslip_id: str):
    """Generate and download payslip as PDF"""
    from fastapi.responses import Response
    
    payslip = await db.payslips.find_one({"id": payslip_id}, {"_id": 0})
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")
    
    # Generate PDF content (simple text-based PDF)
    # In production, use a proper PDF library like reportlab
    breakdown = payslip.get("breakdown", {})
    
    pdf_content = f"""
    PAYSLIP - {payslip['month']} {payslip['year']}
    =========================================
    
    Employee: {payslip['emp_name']}
    Employee ID: {payslip['emp_id']}
    
    EARNINGS:
    ---------
    Basic Salary:      ₹{breakdown.get('basic', 0):,.2f}
    HRA:               ₹{breakdown.get('hra', 0):,.2f}
    Special Allowance: ₹{breakdown.get('special_allowance', 0):,.2f}
    Conveyance:        ₹{breakdown.get('conveyance', 0):,.2f}
    Extra Conveyance:  ₹{breakdown.get('extra_conveyance', 0):,.2f}
    
    ADJUSTMENTS:
    ------------
    Leave Adjustment:  ₹{breakdown.get('leave_adjustment', 0):,.2f}
    
    DEDUCTIONS:
    -----------
    PF & Tax:          ₹{breakdown.get('deductions', 0):,.2f}
    
    =========================================
    NET PAY:           ₹{breakdown.get('net_pay', 0):,.2f}
    =========================================
    
    Status: {payslip['status']}
    Generated: {payslip.get('created_on', '')}
    
    Audix Solutions & Co.
    """
    
    return Response(
        content=pdf_content.encode(),
        media_type="text/plain",
        headers={
            "Content-Disposition": f"attachment; filename=payslip_{payslip['emp_id']}_{payslip['month']}_{payslip['year']}.txt"
        }
    )

# ==================== HOLIDAY ROUTES ====================

@router.post("/holidays", response_model=HolidayResponse)
async def create_holiday(holiday: HolidayCreate):
    holiday_doc = holiday.model_dump()
    holiday_doc["id"] = generate_id()
    
    await db.holidays.insert_one(holiday_doc)
    holiday_doc.pop("_id", None)
    
    return HolidayResponse(**holiday_doc)

@router.get("/holidays", response_model=List[HolidayResponse])
async def get_holidays():
    holidays = await db.holidays.find({}, {"_id": 0}).to_list(100)
    return holidays

@router.delete("/holidays/{holiday_id}")
async def delete_holiday(holiday_id: str):
    result = await db.holidays.delete_one({"id": holiday_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Holiday not found")
    return {"message": "Holiday deleted"}

# ==================== DASHBOARD STATS ====================

@router.get("/dashboard/stats")
async def get_dashboard_stats():
    total_users = await db.users.count_documents({"role": {"$ne": "admin"}})
    active_users = await db.users.count_documents({"role": {"$ne": "admin"}, "status": "active"})
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    present_today = await db.attendance.count_documents({"date": today, "status": "present"})
    
    pending_leaves = await db.leaves.count_documents({"status": "pending"})
    pending_bills = await db.bills.count_documents({"status": "pending"})
    
    return {
        "total_employees": total_users,
        "active_employees": active_users,
        "present_today": present_today,
        "absent_today": active_users - present_today,
        "pending_leaves": pending_leaves,
        "pending_bills": pending_bills
    }

# ==================== SEED DATA ====================

@router.post("/seed")
async def seed_database():
    """Seed the database with initial data"""
    
    # Clear existing data
    await db.users.delete_many({})
    await db.holidays.delete_many({})
    await db.qr_codes.delete_many({})
    await db.attendance.delete_many({})
    await db.leaves.delete_many({})
    await db.bills.delete_many({})
    await db.payslips.delete_many({})
    
    # Seed users
    users = [
        {
            "id": "ADMIN001",
            "name": "Admin User",
            "email": "admin@audixsolutions.com",
            "phone": "+91 98765 43200",
            "role": "admin",
            "department": "Management",
            "designation": "Administrator",
            "joining_date": "2021-01-01",
            "salary": 100000,
            "salary_type": "monthly",
            "status": "active",
            "password": "admin123",
            "team_members": []
        },
        {
            "id": "TL001",
            "name": "Rajesh Verma",
            "email": "rajesh@audixsolutions.com",
            "phone": "+91 98765 43201",
            "role": "teamlead",
            "department": "Development",
            "designation": "Tech Lead",
            "joining_date": "2021-06-15",
            "salary": 85000,
            "salary_type": "monthly",
            "status": "active",
            "password": "tl001",
            "team_members": ["EMP001", "EMP003"]
        },
        {
            "id": "TL002",
            "name": "Meera Joshi",
            "email": "meera@audixsolutions.com",
            "phone": "+91 98765 43202",
            "role": "teamlead",
            "department": "Design",
            "designation": "Design Lead",
            "joining_date": "2021-08-20",
            "salary": 80000,
            "salary_type": "monthly",
            "status": "active",
            "password": "tl002",
            "team_members": ["EMP002"]
        },
        {
            "id": "EMP001",
            "name": "Rahul Kumar",
            "email": "rahul@audixsolutions.com",
            "phone": "+91 98765 43211",
            "role": "employee",
            "department": "Development",
            "designation": "Software Engineer",
            "joining_date": "2023-01-15",
            "salary": 50000,
            "salary_type": "monthly",
            "status": "active",
            "password": "emp001",
            "team_lead_id": "TL001",
            "team_members": []
        },
        {
            "id": "EMP002",
            "name": "Priya Singh",
            "email": "priya@audixsolutions.com",
            "phone": "+91 98765 43212",
            "role": "employee",
            "department": "Design",
            "designation": "UI/UX Designer",
            "joining_date": "2023-03-20",
            "salary": 45000,
            "salary_type": "monthly",
            "status": "active",
            "password": "emp002",
            "team_lead_id": "TL002",
            "team_members": []
        },
        {
            "id": "EMP003",
            "name": "Amit Sharma",
            "email": "amit@audixsolutions.com",
            "phone": "+91 98765 43213",
            "role": "employee",
            "department": "Development",
            "designation": "Senior Developer",
            "joining_date": "2022-06-10",
            "salary": 75000,
            "salary_type": "monthly",
            "status": "active",
            "password": "emp003",
            "team_lead_id": "TL001",
            "team_members": []
        }
    ]
    
    await db.users.insert_many(users)
    
    # Seed holidays
    holidays = [
        {"id": "HOL001", "name": "New Year", "date": "2025-01-01", "type": "National"},
        {"id": "HOL002", "name": "Republic Day", "date": "2025-01-26", "type": "National"},
        {"id": "HOL003", "name": "Holi", "date": "2025-03-14", "type": "Festival"},
        {"id": "HOL004", "name": "Independence Day", "date": "2025-08-15", "type": "National"},
        {"id": "HOL005", "name": "Diwali", "date": "2025-10-20", "type": "Festival"},
        {"id": "HOL006", "name": "Christmas", "date": "2025-12-25", "type": "Festival"},
    ]
    
    await db.holidays.insert_many(holidays)
    
    # Seed some settled payslips for demo
    settled_payslips = [
        {
            "id": "PAY001",
            "emp_id": "EMP001",
            "emp_name": "Rahul Kumar",
            "month": "November",
            "year": 2025,
            "breakdown": {
                "basic": 50000,
                "hra": 20000,
                "special_allowance": 7500,
                "conveyance": 1600,
                "leave_adjustment": 0,
                "extra_conveyance": 2000,
                "previous_pending_allowances": 0,
                "gross_pay": 81100,
                "deductions": 8110,
                "net_pay": 72990
            },
            "status": "settled",
            "created_on": "2025-11-30",
            "paid_on": "2025-12-01",
            "settled_on": "2025-12-01"
        },
        {
            "id": "PAY002",
            "emp_id": "EMP001",
            "emp_name": "Rahul Kumar",
            "month": "October",
            "year": 2025,
            "breakdown": {
                "basic": 50000,
                "hra": 20000,
                "special_allowance": 7500,
                "conveyance": 1600,
                "leave_adjustment": -1666.67,
                "extra_conveyance": 1500,
                "previous_pending_allowances": 0,
                "gross_pay": 80600,
                "deductions": 8060,
                "net_pay": 70873.33
            },
            "status": "settled",
            "created_on": "2025-10-31",
            "paid_on": "2025-11-01",
            "settled_on": "2025-11-01"
        }
    ]
    
    await db.payslips.insert_many(settled_payslips)
    
    return {"message": "Database seeded successfully"}
