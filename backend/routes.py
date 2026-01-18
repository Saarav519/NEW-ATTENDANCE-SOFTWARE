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
    BusinessInfo,
    ProfileUpdate, LeaveBalanceResponse,
    SalaryAdvanceCreate, SalaryAdvanceResponse, AdvanceStatus,
    ShiftTemplateCreate, ShiftTemplateResponse,
    BulkApproveRequest, BulkRejectRequest,
    AuditExpenseCreate, AuditExpenseResponse, AuditExpenseStatus, AuditExpenseCategory
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
    
    # Create QR data string (will be encoded in actual QR) - includes shift info
    qr_string = json.dumps({
        "id": qr_id,
        "location": qr_data.location,
        "conveyance": qr_data.conveyance_amount,
        "date": qr_data.date,
        "created_by": qr_data.created_by,
        "shift_type": qr_data.shift_type,
        "shift_start": qr_data.shift_start,
        "shift_end": qr_data.shift_end
    })
    
    qr_doc = {
        "id": qr_id,
        "location": qr_data.location,
        "conveyance_amount": qr_data.conveyance_amount,
        "date": qr_data.date,
        "created_by": qr_data.created_by,
        "shift_type": qr_data.shift_type,
        "shift_start": qr_data.shift_start,
        "shift_end": qr_data.shift_end,
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
    
    punch_in_time = datetime.now(timezone.utc).strftime("%H:%M")
    
    # Get shift info from QR code (with defaults for backward compatibility)
    shift_type = qr_info.get("shift_type", qr_code.get("shift_type", "day"))
    shift_start = qr_info.get("shift_start", qr_code.get("shift_start", "10:00"))
    shift_end = qr_info.get("shift_end", qr_code.get("shift_end", "19:00"))
    
    # Calculate attendance status based on punch-in time and shift
    attendance_status = calculate_attendance_status(punch_in_time, shift_start, shift_end, shift_type)
    
    # Determine conveyance based on attendance status
    full_conveyance = qr_code["conveyance_amount"]
    if attendance_status == "full_day":
        actual_conveyance = full_conveyance
    elif attendance_status == "half_day":
        actual_conveyance = full_conveyance / 2  # Half conveyance for half day
    else:
        actual_conveyance = 0  # No conveyance for absent
    
    attendance_doc = {
        "id": generate_id(),
        "emp_id": emp_id,
        "date": today,
        "punch_in": punch_in_time,
        "punch_out": None,
        "status": "present" if attendance_status != "absent" else "absent",
        "attendance_status": attendance_status,
        "work_hours": 0,
        "qr_code_id": qr_code["id"],
        "location": qr_code["location"],
        "conveyance_amount": actual_conveyance,
        "shift_type": shift_type,
        "shift_start": shift_start,
        "shift_end": shift_end
    }
    
    await db.attendance.insert_one(attendance_doc)
    attendance_doc.pop("_id", None)
    
    return AttendanceResponse(**attendance_doc)

# Direct punch-in for Team Leaders (without QR)
@router.post("/attendance/direct-punch-in", response_model=AttendanceResponse)
async def direct_punch_in(emp_id: str, location: str = "Office", shift_type: str = "day", shift_start: str = "10:00", shift_end: str = "19:00", conveyance_amount: float = 200):
    """
    Direct punch-in for Team Leaders without QR code.
    Same attendance rules apply (full_day/half_day/absent based on punch time).
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Check if already punched in today
    existing = await db.attendance.find_one({"emp_id": emp_id, "date": today}, {"_id": 0})
    if existing:
        return AttendanceResponse(**existing)
    
    punch_in_time = datetime.now(timezone.utc).strftime("%H:%M")
    
    # Calculate attendance status based on punch-in time and shift
    attendance_status = calculate_attendance_status(punch_in_time, shift_start, shift_end, shift_type)
    
    # Determine conveyance based on attendance status
    if attendance_status == "full_day":
        actual_conveyance = conveyance_amount
    elif attendance_status == "half_day":
        actual_conveyance = conveyance_amount / 2
    else:
        actual_conveyance = 0
    
    attendance_doc = {
        "id": generate_id(),
        "emp_id": emp_id,
        "date": today,
        "punch_in": punch_in_time,
        "punch_out": None,
        "status": "present" if attendance_status != "absent" else "absent",
        "attendance_status": attendance_status,
        "work_hours": 0,
        "qr_code_id": None,
        "location": location,
        "conveyance_amount": actual_conveyance,
        "shift_type": shift_type,
        "shift_start": shift_start,
        "shift_end": shift_end
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
    conveyance = 1600  # Fixed base conveyance
    
    # Get approved bills for this month (Extra Conveyance)
    approved_bills = await db.bills.find({
        "emp_id": data.emp_id,
        "month": data.month,
        "year": data.year,
        "status": BillStatus.APPROVED
    }).to_list(100)
    extra_conveyance = sum(b.get("approved_amount", 0) for b in approved_bills)
    
    # Get attendance records for the month
    month_num = ["January", "February", "March", "April", "May", "June", 
                 "July", "August", "September", "October", "November", "December"].index(data.month.split()[0]) + 1
    month_str = f"{data.year}-{month_num:02d}"
    attendance_records = await db.attendance.find({
        "emp_id": data.emp_id,
        "date": {"$regex": f"^{month_str}"}
    }).to_list(100)
    
    # Calculate attendance-based metrics
    full_days = 0
    half_days = 0
    absent_days = 0
    attendance_conveyance = 0
    
    for record in attendance_records:
        att_status = record.get("attendance_status", record.get("status", "present"))
        if att_status == "full_day" or att_status == "present":
            full_days += 1
        elif att_status == "half_day":
            half_days += 1
        elif att_status == "absent":
            absent_days += 1
        attendance_conveyance += record.get("conveyance_amount", 0)
    
    # Calculate attendance adjustment (deductions for half days and absents)
    # Assuming 26 working days per month
    working_days = 26
    daily_rate = basic / working_days
    
    # Half day = 0.5 day deduction, Absent = 1 day deduction
    attendance_adjustment = -((half_days * 0.5 * daily_rate) + (absent_days * daily_rate))
    attendance_adjustment = round(attendance_adjustment, 2)
    
    # Calculate leave adjustment
    leaves = await db.leaves.find({
        "emp_id": data.emp_id,
        "status": LeaveStatus.APPROVED,
        "from_date": {"$regex": f"^{month_str}"}
    }).to_list(100)
    leave_days = sum(l.get("days", 0) for l in leaves)
    leave_adjustment = -(leave_days * daily_rate) if leave_days > 0 else 0
    
    gross = basic + hra + special_allowance + conveyance + extra_conveyance + attendance_conveyance
    deductions = round(gross * 0.1, 2)  # 10% deductions (PF, Tax, etc.)
    net_pay = round(gross + leave_adjustment + attendance_adjustment - deductions, 2)
    
    breakdown = SalaryBreakdown(
        basic=basic,
        hra=hra,
        special_allowance=special_allowance,
        conveyance=conveyance + attendance_conveyance,
        leave_adjustment=round(leave_adjustment, 2),
        extra_conveyance=extra_conveyance,
        previous_pending_allowances=0,
        attendance_adjustment=attendance_adjustment,
        full_days=full_days,
        half_days=half_days,
        absent_days=absent_days,
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
    
    # Seed some settled payslips for demo (Employees and Team Leads)
    settled_payslips = [
        # Employee payslips
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
        },
        # Team Lead TL001 payslips
        {
            "id": "PAY003",
            "emp_id": "TL001",
            "emp_name": "Rajesh Verma",
            "month": "November",
            "year": 2025,
            "breakdown": {
                "basic": 85000,
                "hra": 34000,
                "special_allowance": 12750,
                "conveyance": 2400,
                "leave_adjustment": 0,
                "extra_conveyance": 1000,
                "previous_pending_allowances": 0,
                "full_days": 22,
                "half_days": 0,
                "absent_days": 0,
                "attendance_adjustment": 0,
                "gross_pay": 135150,
                "deductions": 13515,
                "net_pay": 121635
            },
            "status": "settled",
            "created_on": "2025-11-30",
            "paid_on": "2025-12-01",
            "settled_on": "2025-12-01"
        },
        {
            "id": "PAY004",
            "emp_id": "TL001",
            "emp_name": "Rajesh Verma",
            "month": "October",
            "year": 2025,
            "breakdown": {
                "basic": 85000,
                "hra": 34000,
                "special_allowance": 12750,
                "conveyance": 2200,
                "leave_adjustment": -2833.33,
                "extra_conveyance": 800,
                "previous_pending_allowances": 0,
                "full_days": 20,
                "half_days": 1,
                "absent_days": 1,
                "attendance_adjustment": -4250,
                "gross_pay": 131916.67,
                "deductions": 13191.67,
                "net_pay": 114475
            },
            "status": "settled",
            "created_on": "2025-10-31",
            "paid_on": "2025-11-01",
            "settled_on": "2025-11-01"
        },
        # Team Lead TL002 payslips
        {
            "id": "PAY005",
            "emp_id": "TL002",
            "emp_name": "Meera Joshi",
            "month": "November",
            "year": 2025,
            "breakdown": {
                "basic": 80000,
                "hra": 32000,
                "special_allowance": 12000,
                "conveyance": 2200,
                "leave_adjustment": 0,
                "extra_conveyance": 500,
                "previous_pending_allowances": 0,
                "full_days": 22,
                "half_days": 0,
                "absent_days": 0,
                "attendance_adjustment": 0,
                "gross_pay": 126700,
                "deductions": 12670,
                "net_pay": 114030
            },
            "status": "settled",
            "created_on": "2025-11-30",
            "paid_on": "2025-12-01",
            "settled_on": "2025-12-01"
        }
    ]
    
    await db.payslips.insert_many(settled_payslips)
    
    # Seed default shift templates
    shift_templates = [
        {
            "id": "SHIFT001",
            "name": "Day Shift (Standard)",
            "shift_type": "day",
            "shift_start": "10:00",
            "shift_end": "19:00",
            "grace_period_minutes": 30,
            "half_day_cutoff_hours": 3,
            "default_conveyance": 200,
            "is_active": True,
            "created_by": "ADMIN001",
            "created_at": get_utc_now_str()
        },
        {
            "id": "SHIFT002",
            "name": "Night Shift (Standard)",
            "shift_type": "night",
            "shift_start": "21:00",
            "shift_end": "06:00",
            "grace_period_minutes": 30,
            "half_day_cutoff_hours": 3,
            "default_conveyance": 300,
            "is_active": True,
            "created_by": "ADMIN001",
            "created_at": get_utc_now_str()
        },
        {
            "id": "SHIFT003",
            "name": "Morning Shift",
            "shift_type": "day",
            "shift_start": "06:00",
            "shift_end": "14:00",
            "grace_period_minutes": 15,
            "half_day_cutoff_hours": 2,
            "default_conveyance": 150,
            "is_active": True,
            "created_by": "ADMIN001",
            "created_at": get_utc_now_str()
        }
    ]
    
    await db.shift_templates.delete_many({})
    await db.shift_templates.insert_many(shift_templates)
    
    # Seed leave balances for employees and team leads
    leave_balances = [
        {
            "emp_id": "EMP001",
            "year": 2026,
            "casual_leave": 12,
            "sick_leave": 6,
            "vacation": 15,
            "casual_used": 2,
            "sick_used": 1,
            "vacation_used": 0
        },
        {
            "emp_id": "EMP002",
            "year": 2026,
            "casual_leave": 12,
            "sick_leave": 6,
            "vacation": 15,
            "casual_used": 3,
            "sick_used": 0,
            "vacation_used": 5
        },
        {
            "emp_id": "EMP003",
            "year": 2026,
            "casual_leave": 12,
            "sick_leave": 6,
            "vacation": 15,
            "casual_used": 0,
            "sick_used": 2,
            "vacation_used": 3
        },
        {
            "emp_id": "TL001",
            "year": 2026,
            "casual_leave": 15,
            "sick_leave": 8,
            "vacation": 18,
            "casual_used": 1,
            "sick_used": 0,
            "vacation_used": 2
        },
        {
            "emp_id": "TL002",
            "year": 2026,
            "casual_leave": 15,
            "sick_leave": 8,
            "vacation": 18,
            "casual_used": 2,
            "sick_used": 1,
            "vacation_used": 0
        }
    ]
    
    await db.leave_balances.delete_many({})
    await db.leave_balances.insert_many(leave_balances)
    
    return {"message": "Database seeded successfully"}

# ==================== PROFILE ROUTES ====================

@router.put("/users/{user_id}/profile")
async def update_profile(user_id: str, profile: ProfileUpdate):
    """Update user profile (phone, address, etc.)"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {k: v for k, v in profile.dict().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return updated_user

@router.post("/users/{user_id}/photo")
async def upload_profile_photo(user_id: str, photo: UploadFile = File(...)):
    """Upload profile photo"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Read and encode photo
    contents = await photo.read()
    if len(contents) > 2 * 1024 * 1024:  # 2MB limit
        raise HTTPException(status_code=400, detail="Photo size must be less than 2MB")
    
    photo_base64 = base64.b64encode(contents).decode()
    photo_data = f"data:{photo.content_type};base64,{photo_base64}"
    
    await db.users.update_one({"id": user_id}, {"$set": {"photo": photo_data}})
    
    return {"message": "Photo uploaded successfully", "photo": photo_data}

# ==================== LEAVE BALANCE ROUTES ====================

@router.get("/leave-balance/{emp_id}", response_model=LeaveBalanceResponse)
async def get_leave_balance(emp_id: str, year: int = None):
    """Get employee leave balance for a year"""
    if year is None:
        year = datetime.now().year
    
    balance = await db.leave_balances.find_one(
        {"emp_id": emp_id, "year": year}, {"_id": 0}
    )
    
    if not balance:
        # Return default balance
        balance = {
            "emp_id": emp_id,
            "year": year,
            "casual_leave": 12,
            "sick_leave": 6,
            "vacation": 15,
            "casual_used": 0,
            "sick_used": 0,
            "vacation_used": 0
        }
        await db.leave_balances.insert_one(balance)
    
    return LeaveBalanceResponse(**balance)

@router.put("/leave-balance/{emp_id}")
async def update_leave_balance(emp_id: str, leave_type: str, days: int, year: int = None):
    """Update leave balance when leave is approved"""
    if year is None:
        year = datetime.now().year
    
    field_map = {
        "Casual Leave": "casual_used",
        "Sick Leave": "sick_used",
        "Vacation": "vacation_used",
        "Personal": "casual_used"
    }
    
    field = field_map.get(leave_type, "casual_used")
    
    await db.leave_balances.update_one(
        {"emp_id": emp_id, "year": year},
        {"$inc": {field: days}},
        upsert=True
    )
    
    return {"message": "Leave balance updated"}

# ==================== SALARY ADVANCE ROUTES ====================

@router.post("/advances", response_model=SalaryAdvanceResponse)
async def create_advance_request(data: SalaryAdvanceCreate):
    """Create a salary advance request"""
    advance_doc = {
        "id": generate_id(),
        "emp_id": data.emp_id,
        "emp_name": data.emp_name,
        "amount": data.amount,
        "reason": data.reason,
        "repayment_months": data.repayment_months,
        "monthly_deduction": round(data.amount / data.repayment_months, 2),
        "status": AdvanceStatus.PENDING,
        "requested_on": get_utc_now_str(),
        "approved_by": None,
        "approved_on": None
    }
    
    await db.advances.insert_one(advance_doc)
    advance_doc.pop("_id", None)
    
    return SalaryAdvanceResponse(**advance_doc)

@router.get("/advances")
async def get_advances(emp_id: str = None, status: str = None):
    """Get salary advance requests"""
    query = {}
    if emp_id:
        query["emp_id"] = emp_id
    if status:
        query["status"] = status
    
    advances = await db.advances.find(query, {"_id": 0}).to_list(100)
    return advances

@router.put("/advances/{advance_id}/approve")
async def approve_advance(advance_id: str, approved_by: str):
    """Approve a salary advance request"""
    result = await db.advances.update_one(
        {"id": advance_id, "status": AdvanceStatus.PENDING},
        {"$set": {
            "status": AdvanceStatus.APPROVED,
            "approved_by": approved_by,
            "approved_on": get_utc_now_str()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Advance not found or already processed")
    
    advance = await db.advances.find_one({"id": advance_id}, {"_id": 0})
    return advance

@router.put("/advances/{advance_id}/reject")
async def reject_advance(advance_id: str, rejected_by: str):
    """Reject a salary advance request"""
    result = await db.advances.update_one(
        {"id": advance_id, "status": AdvanceStatus.PENDING},
        {"$set": {
            "status": AdvanceStatus.REJECTED,
            "approved_by": rejected_by,
            "approved_on": get_utc_now_str()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Advance not found or already processed")
    
    advance = await db.advances.find_one({"id": advance_id}, {"_id": 0})
    return advance

# ==================== SHIFT TEMPLATE ROUTES ====================

@router.get("/shift-templates")
async def get_shift_templates(active_only: bool = True):
    """Get all shift templates"""
    query = {"is_active": True} if active_only else {}
    templates = await db.shift_templates.find(query, {"_id": 0}).to_list(100)
    return templates

@router.post("/shift-templates", response_model=ShiftTemplateResponse)
async def create_shift_template(data: ShiftTemplateCreate, created_by: str):
    """Create a new shift template"""
    template_doc = {
        "id": generate_id(),
        "name": data.name,
        "shift_type": data.shift_type,
        "shift_start": data.shift_start,
        "shift_end": data.shift_end,
        "grace_period_minutes": data.grace_period_minutes,
        "half_day_cutoff_hours": data.half_day_cutoff_hours,
        "default_conveyance": data.default_conveyance,
        "is_active": True,
        "created_by": created_by,
        "created_at": get_utc_now_str()
    }
    
    await db.shift_templates.insert_one(template_doc)
    template_doc.pop("_id", None)
    
    return ShiftTemplateResponse(**template_doc)

@router.put("/shift-templates/{template_id}")
async def update_shift_template(template_id: str, data: ShiftTemplateCreate):
    """Update a shift template"""
    update_data = data.dict()
    result = await db.shift_templates.update_one(
        {"id": template_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = await db.shift_templates.find_one({"id": template_id}, {"_id": 0})
    return template

@router.delete("/shift-templates/{template_id}")
async def delete_shift_template(template_id: str):
    """Soft delete a shift template"""
    result = await db.shift_templates.update_one(
        {"id": template_id},
        {"$set": {"is_active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"message": "Template deleted successfully"}

# ==================== BULK ACTION ROUTES ====================

@router.post("/leaves/bulk-approve")
async def bulk_approve_leaves(data: BulkApproveRequest):
    """Bulk approve multiple leave requests"""
    result = await db.leaves.update_many(
        {"id": {"$in": data.ids}, "status": "pending"},
        {"$set": {
            "status": LeaveStatus.APPROVED,
            "approved_by": data.approved_by,
            "approved_on": get_utc_now_str()
        }}
    )
    
    # Update leave balances for each approved leave
    for leave_id in data.ids:
        leave = await db.leaves.find_one({"id": leave_id})
        if leave:
            await update_leave_balance(leave["emp_id"], leave["type"], leave["days"])
    
    return {"message": f"{result.modified_count} leaves approved", "count": result.modified_count}

@router.post("/leaves/bulk-reject")
async def bulk_reject_leaves(data: BulkRejectRequest):
    """Bulk reject multiple leave requests"""
    result = await db.leaves.update_many(
        {"id": {"$in": data.ids}, "status": "pending"},
        {"$set": {
            "status": LeaveStatus.REJECTED,
            "rejected_by": data.rejected_by,
            "rejected_on": get_utc_now_str(),
            "rejection_reason": data.reason
        }}
    )
    
    return {"message": f"{result.modified_count} leaves rejected", "count": result.modified_count}

@router.post("/bills/bulk-approve")
async def bulk_approve_bills(data: BulkApproveRequest):
    """Bulk approve multiple bill submissions"""
    result = await db.bills.update_many(
        {"id": {"$in": data.ids}, "status": "pending"},
        {"$set": {
            "status": BillStatus.APPROVED,
            "approved_by": data.approved_by,
            "approved_on": get_utc_now_str()
        }}
    )
    
    # Set approved_amount = total_amount for each approved bill
    for bill_id in data.ids:
        bill = await db.bills.find_one({"id": bill_id})
        if bill:
            await db.bills.update_one(
                {"id": bill_id},
                {"$set": {"approved_amount": bill.get("total_amount", 0)}}
            )
    
    return {"message": f"{result.modified_count} bills approved", "count": result.modified_count}

@router.post("/bills/bulk-reject")
async def bulk_reject_bills(data: BulkRejectRequest):
    """Bulk reject multiple bill submissions"""
    result = await db.bills.update_many(
        {"id": {"$in": data.ids}, "status": "pending"},
        {"$set": {
            "status": BillStatus.REJECTED,
            "rejected_by": data.rejected_by,
            "rejected_on": get_utc_now_str(),
            "rejection_reason": data.reason,
            "approved_amount": 0
        }}
    )
    
    return {"message": f"{result.modified_count} bills rejected", "count": result.modified_count}


# ==================== AUDIT EXPENSE ROUTES ====================

@router.post("/audit-expenses", response_model=AuditExpenseResponse)
async def create_audit_expense(expense: AuditExpenseCreate, emp_id: str):
    """Create a new audit expense submission (Team Lead only)"""
    user = await db.users.find_one({"id": emp_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("role") != "teamlead":
        raise HTTPException(status_code=403, detail="Only Team Leaders can submit audit expenses")
    
    total_amount = sum(item.amount for item in expense.items)
    
    expense_doc = {
        "id": f"AUD{generate_id()}",
        "emp_id": emp_id,
        "emp_name": user.get("name"),
        "items": [item.model_dump() for item in expense.items],
        "total_amount": total_amount,
        "trip_purpose": expense.trip_purpose,
        "trip_location": expense.trip_location,
        "trip_start_date": expense.trip_start_date,
        "trip_end_date": expense.trip_end_date,
        "remarks": expense.remarks,
        "status": AuditExpenseStatus.PENDING,
        "approved_amount": 0,
        "remaining_balance": total_amount,  # Initially, full amount is remaining
        "submitted_on": get_utc_now_str(),
        "approved_by": None,
        "approved_on": None,
        "rejection_reason": None,
        "revalidation_reason": None,
        "payment_history": []
    }
    
    await db.audit_expenses.insert_one(expense_doc)
    return expense_doc

@router.get("/audit-expenses", response_model=List[AuditExpenseResponse])
async def get_audit_expenses(emp_id: Optional[str] = None, status: Optional[str] = None):
    """Get audit expenses - filter by emp_id for Team Lead, all for Admin"""
    query = {}
    if emp_id:
        query["emp_id"] = emp_id
    if status:
        query["status"] = status
    
    expenses = await db.audit_expenses.find(query, {"_id": 0}).sort("submitted_on", -1).to_list(100)
    return expenses

@router.get("/audit-expenses/{expense_id}", response_model=AuditExpenseResponse)
async def get_audit_expense(expense_id: str):
    """Get a single audit expense by ID"""
    expense = await db.audit_expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Audit expense not found")
    return expense

@router.put("/audit-expenses/{expense_id}")
async def update_audit_expense(expense_id: str, expense: AuditExpenseCreate, emp_id: str):
    """Update an audit expense (only if pending)"""
    existing = await db.audit_expenses.find_one({"id": expense_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Audit expense not found")
    
    if existing.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Cannot edit expense that is already approved or rejected")
    
    if existing.get("emp_id") != emp_id:
        raise HTTPException(status_code=403, detail="You can only edit your own expenses")
    
    total_amount = sum(item.amount for item in expense.items)
    
    await db.audit_expenses.update_one(
        {"id": expense_id},
        {"$set": {
            "items": [item.model_dump() for item in expense.items],
            "total_amount": total_amount,
            "trip_purpose": expense.trip_purpose,
            "trip_location": expense.trip_location,
            "trip_start_date": expense.trip_start_date,
            "trip_end_date": expense.trip_end_date,
            "remarks": expense.remarks
        }}
    )
    
    updated = await db.audit_expenses.find_one({"id": expense_id}, {"_id": 0})
    return updated

@router.put("/audit-expenses/{expense_id}/approve")
async def approve_audit_expense(expense_id: str, approved_by: str, approved_amount: Optional[float] = None):
    """Approve an audit expense (Admin only) - supports partial approval with balance tracking"""
    expense = await db.audit_expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Audit expense not found")
    
    current_status = expense.get("status")
    if current_status not in ["pending", "partially_approved"]:
        raise HTTPException(status_code=400, detail="Expense cannot be approved in current state")
    
    total_amount = expense.get("total_amount", 0)
    previous_approved = expense.get("approved_amount", 0)
    
    # Calculate new payment amount
    payment_amount = approved_amount if approved_amount is not None else (total_amount - previous_approved)
    new_total_approved = previous_approved + payment_amount
    remaining_balance = total_amount - new_total_approved
    
    # Ensure we don't approve more than total
    if new_total_approved > total_amount:
        new_total_approved = total_amount
        remaining_balance = 0
        payment_amount = total_amount - previous_approved
    
    # Determine status based on remaining balance
    if remaining_balance <= 0:
        status = AuditExpenseStatus.APPROVED
        remaining_balance = 0
    else:
        status = AuditExpenseStatus.PARTIALLY_APPROVED
    
    # Add to payment history
    payment_history = expense.get("payment_history", []) or []
    payment_history.append({
        "amount": payment_amount,
        "paid_by": approved_by,
        "paid_on": get_utc_now_str(),
        "note": f"Payment of ₹{payment_amount}"
    })
    
    await db.audit_expenses.update_one(
        {"id": expense_id},
        {"$set": {
            "status": status,
            "approved_amount": new_total_approved,
            "remaining_balance": remaining_balance,
            "approved_by": approved_by,
            "approved_on": get_utc_now_str(),
            "payment_history": payment_history
        }}
    )
    
    return {
        "message": f"Expense {status.value}",
        "payment_amount": payment_amount,
        "total_approved": new_total_approved,
        "remaining_balance": remaining_balance
    }

@router.put("/audit-expenses/{expense_id}/revalidate")
async def revalidate_audit_expense(expense_id: str, requested_by: str, reason: str):
    """Request revalidation of an audit expense (Admin only) - Team Lead can then edit and resubmit"""
    expense = await db.audit_expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Audit expense not found")
    
    current_status = expense.get("status")
    if current_status not in ["pending", "partially_approved"]:
        raise HTTPException(status_code=400, detail="Only pending or partially approved expenses can be sent for revalidation")
    
    await db.audit_expenses.update_one(
        {"id": expense_id},
        {"$set": {
            "status": AuditExpenseStatus.REVALIDATION,
            "revalidation_reason": reason,
            "approved_by": requested_by,
            "approved_on": get_utc_now_str()
        }}
    )
    
    return {"message": "Expense sent for revalidation", "reason": reason}

@router.put("/audit-expenses/{expense_id}/resubmit")
async def resubmit_audit_expense(expense_id: str, expense: AuditExpenseCreate, emp_id: str):
    """Resubmit an expense after revalidation (Team Lead only)"""
    existing = await db.audit_expenses.find_one({"id": expense_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Audit expense not found")
    
    if existing.get("status") != "revalidation":
        raise HTTPException(status_code=400, detail="Only expenses in revalidation can be resubmitted")
    
    if existing.get("emp_id") != emp_id:
        raise HTTPException(status_code=403, detail="You can only resubmit your own expenses")
    
    total_amount = sum(item.amount for item in expense.items)
    previous_approved = existing.get("approved_amount", 0)
    
    await db.audit_expenses.update_one(
        {"id": expense_id},
        {"$set": {
            "items": [item.model_dump() for item in expense.items],
            "total_amount": total_amount,
            "trip_purpose": expense.trip_purpose,
            "trip_location": expense.trip_location,
            "trip_start_date": expense.trip_start_date,
            "trip_end_date": expense.trip_end_date,
            "remarks": expense.remarks,
            "status": AuditExpenseStatus.PENDING,
            "remaining_balance": total_amount - previous_approved,
            "revalidation_reason": None,
            "submitted_on": get_utc_now_str()
        }}
    )
    
    updated = await db.audit_expenses.find_one({"id": expense_id}, {"_id": 0})
    return updated

@router.put("/audit-expenses/{expense_id}/reject")
async def reject_audit_expense(expense_id: str, rejected_by: str, reason: Optional[str] = None):
    """Reject an audit expense (Admin only)"""
    expense = await db.audit_expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Audit expense not found")
    
    current_status = expense.get("status")
    if current_status not in ["pending", "partially_approved"]:
        raise HTTPException(status_code=400, detail="Expense cannot be rejected in current state")
    
    await db.audit_expenses.update_one(
        {"id": expense_id},
        {"$set": {
            "status": AuditExpenseStatus.REJECTED,
            "approved_amount": 0,
            "approved_by": rejected_by,
            "approved_on": get_utc_now_str(),
            "rejection_reason": reason
        }}
    )
    
    return {"message": "Expense rejected"}

@router.delete("/audit-expenses/{expense_id}")
async def delete_audit_expense(expense_id: str):
    """Delete an audit expense (only if pending)"""
    expense = await db.audit_expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Audit expense not found")
    
    if expense.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Can only delete pending expenses")
    
    await db.audit_expenses.delete_one({"id": expense_id})
    return {"message": "Expense deleted"}

@router.get("/audit-expenses/summary/{emp_id}")
async def get_audit_expense_summary(emp_id: str, month: Optional[str] = None, year: Optional[int] = None):
    """Get summary of approved audit expenses for an employee (for salary calculation)"""
    query = {"emp_id": emp_id, "status": {"$in": ["approved", "partially_approved"]}}
    
    expenses = await db.audit_expenses.find(query, {"_id": 0}).to_list(100)
    
    total_approved = sum(e.get("approved_amount", 0) for e in expenses)
    
    return {
        "emp_id": emp_id,
        "total_approved_expenses": total_approved,
        "expense_count": len(expenses)
    }

