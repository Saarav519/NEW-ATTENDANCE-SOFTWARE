from fastapi import APIRouter, HTTPException, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Optional
from datetime import datetime, timezone, time, timedelta
from collections import defaultdict
import os
import uuid
import json
import base64
import csv
import io
import zipfile

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
    AuditExpenseCreate, AuditExpenseResponse, AuditExpenseStatus, AuditExpenseCategory,
    NotificationType, NotificationCreate, NotificationResponse,
    AnalyticsTimeFilter, AnalyticsResponse,
    CashInCreate, CashInResponse, CashOutCreate, CashOutResponse,
    CustomCategoryCreate, CustomCategoryResponse, MonthLockCreate, MonthLockResponse,
    CashbookSummary, PaymentStatus, CashOutCategory,
    LoanCreate, LoanResponse, LoanStatus, LoanType, EMIPaymentCreate, EMIPaymentResponse, LoanSummary,
    PayableCreate, PayableResponse, PayableStatus, PayablePaymentCreate, PayablePaymentResponse, PayableSummary
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
    
    # Use provided ID or generate one
    if user.id:
        # Validate uniqueness of provided ID
        existing_id = await db.users.find_one({"id": user.id.upper()})
        if existing_id:
            raise HTTPException(status_code=400, detail=f"Employee ID '{user.id}' already exists")
        user_dict["id"] = user.id.upper()  # Store in uppercase for consistency
    else:
        # Auto-generate ID if not provided
        user_dict["id"] = generate_id()
    
    # Check for duplicate email
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Validate bank details are provided (mandatory)
    if not user.bank_name or not user.bank_account_number or not user.bank_ifsc:
        raise HTTPException(status_code=400, detail="Bank details (Bank Name, Account Number, IFSC) are mandatory")
    
    # Validate team_lead_id if provided
    if user.team_lead_id:
        team_lead = await db.users.find_one({"id": user.team_lead_id, "role": "teamlead"})
        if not team_lead:
            raise HTTPException(status_code=400, detail="Invalid Team Leader ID")
    
    user_dict["created_at"] = get_utc_now_str()
    await db.users.insert_one(user_dict)
    
    # Auto-create payslip for current month (for employees and team leads)
    if user.role in ["employee", "teamlead"]:
        current_month = datetime.now().strftime("%B")  # January, February, etc.
        current_year = datetime.now().year
        
        # Calculate salary breakdown
        salary = user.salary or 0
        basic = round(salary * 0.60, 2)
        hra = round(salary * 0.24, 2)
        special_allowance = round(salary * 0.16, 2)
        
        payslip_doc = {
            "id": generate_id(),
            "emp_id": user_dict["id"],
            "emp_name": user.name,
            "month": current_month,
            "year": current_year,
            "breakdown": {
                "basic": basic,
                "hra": hra,
                "special_allowance": special_allowance,
                "conveyance": 0,
                "leave_adjustment": 0,
                "extra_conveyance": 0,
                "previous_pending_allowances": 0,
                "attendance_adjustment": 0,
                "full_days": 0,
                "half_days": 0,
                "absent_days": 0,
                "leave_days": 0,
                "total_duty_earned": 0,
                "audit_expenses": 0,
                "advance_deduction": 0,
                "gross_pay": salary,
                "deductions": 0,
                "net_pay": salary
            },
            "status": "preview",
            "created_on": get_utc_now_str()[:10],
            "paid_on": None,
            "settled_on": None,
            "generated_on": None,
            "advance_ids": []
        }
        await db.payslips.insert_one(payslip_doc)
    
    # Return without password
    del user_dict["password"]
    return UserResponse(**user_dict)

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, updates: dict):
    # Remove sensitive fields from updates
    updates.pop("_id", None)
    updates.pop("id", None)
    updates.pop("password", None)
    
    # Check if team_lead_id is being changed
    old_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not old_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    old_team_lead_id = old_user.get("team_lead_id")
    new_team_lead_id = updates.get("team_lead_id")
    
    # If team leader is being changed, log the history
    if new_team_lead_id and old_team_lead_id != new_team_lead_id:
        # Get team leader names
        old_tl_name = None
        if old_team_lead_id:
            old_tl = await db.users.find_one({"id": old_team_lead_id}, {"_id": 0, "name": 1})
            old_tl_name = old_tl.get("name") if old_tl else None
        
        new_tl = await db.users.find_one({"id": new_team_lead_id}, {"_id": 0, "name": 1})
        new_tl_name = new_tl.get("name") if new_tl else "Unknown"
        
        # Log the change
        history_doc = {
            "id": generate_id(),
            "emp_id": user_id,
            "emp_name": old_user.get("name"),
            "old_team_leader_id": old_team_lead_id,
            "old_team_leader_name": old_tl_name,
            "new_team_leader_id": new_team_lead_id,
            "new_team_leader_name": new_tl_name,
            "changed_by": updates.get("changed_by", "ADMIN001"),
            "changed_at": get_utc_now_str(),
            "reason": updates.get("change_reason", "Team Leader reassignment")
        }
        await db.team_leader_history.insert_one(history_doc)
        
        # Remove helper fields from updates
        updates.pop("changed_by", None)
        updates.pop("change_reason", None)
    
    result = await db.users.update_one({"id": user_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return UserResponse(**user)

# Get Team Leader change history
@router.get("/users/{user_id}/team-leader-history")
async def get_team_leader_history(user_id: str):
    """Get history of Team Leader changes for an employee"""
    history = await db.team_leader_history.find(
        {"emp_id": user_id}, {"_id": 0}
    ).sort("changed_at", -1).to_list(100)
    return history

@router.put("/users/{user_id}/reset-password")
async def reset_password(user_id: str, new_password: str, reset_by: str):
    """Reset user password - Only Admin and Team Leader can reset passwords"""
    # Verify the person resetting the password is Admin or Team Leader
    reset_by_user = await db.users.find_one({"id": reset_by}, {"_id": 0})
    if not reset_by_user:
        raise HTTPException(status_code=404, detail="Reset by user not found")
    
    if reset_by_user.get("role") not in ["admin", "teamlead"]:
        raise HTTPException(status_code=403, detail="Only Admin and Team Leader can reset passwords")
    
    # Find the user whose password needs to be reset
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"password": new_password}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"Password reset successfully for {user['name']}", "success": True}

@router.get("/users/team/{team_lead_id}", response_model=List[UserResponse])
async def get_team_members(team_lead_id: str):
    """Get all employees assigned to a specific team leader"""
    # Verify team lead exists
    team_lead = await db.users.find_one({"id": team_lead_id}, {"_id": 0})
    if not team_lead:
        raise HTTPException(status_code=404, detail="Team lead not found")
    
    # Get employees who have this team_lead_id assigned
    members = await db.users.find(
        {"team_lead_id": team_lead_id, "role": "employee"},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    # Also get from legacy team_members list for backward compatibility
    team_member_ids = team_lead.get("team_members", [])
    if team_member_ids:
        legacy_members = await db.users.find(
            {"id": {"$in": team_member_ids}, "team_lead_id": {"$ne": team_lead_id}},
            {"_id": 0, "password": 0}
        ).to_list(100)
        members.extend(legacy_members)
    
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
    
    # Get employee salary for daily duty calculation
    user = await db.users.find_one({"id": emp_id}, {"_id": 0})
    emp_salary = user.get("salary", 0) if user else 0
    daily_rate = emp_salary / 26  # 26 working days per month
    
    # Calculate daily duty based on attendance status
    if attendance_status == "full_day":
        daily_duty = round(daily_rate, 2)
    elif attendance_status == "half_day":
        daily_duty = round(daily_rate / 2, 2)
    else:
        daily_duty = 0
    
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
        "daily_duty_amount": daily_duty,
        "shift_type": shift_type,
        "shift_start": shift_start,
        "shift_end": shift_end
    }
    
    await db.attendance.insert_one(attendance_doc)
    attendance_doc.pop("_id", None)
    
    # Get employee name for notification
    emp_name = user.get("name", emp_id) if user else emp_id
    
    # Broadcast real-time attendance update to admins and team leads
    await manager.broadcast_to_admins_and_teamleads({
        "type": "attendance_update",
        "action": "punch_in",
        "data": {
            "emp_id": emp_id,
            "emp_name": emp_name,
            "punch_in": punch_in_time,
            "location": qr_code["location"],
            "attendance_status": attendance_status,
            "date": today
        }
    })
    
    # Create notification for admins/team leads
    await create_notification(
        recipient_id="",
        recipient_role="admin",
        title="Employee Punched In",
        message=f"{emp_name} punched in at {punch_in_time} from {qr_code['location']}",
        notification_type="attendance",
        related_id=attendance_doc["id"],
        data={"emp_id": emp_id, "action": "punch_in"}
    )
    
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
    
    # Get employee salary for daily duty calculation
    user = await db.users.find_one({"id": emp_id}, {"_id": 0})
    emp_salary = user.get("salary", 0) if user else 0
    daily_rate = emp_salary / 26  # 26 working days per month
    
    # Calculate daily duty based on attendance status
    if attendance_status == "full_day":
        daily_duty = round(daily_rate, 2)
    elif attendance_status == "half_day":
        daily_duty = round(daily_rate / 2, 2)
    else:
        daily_duty = 0
    
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
        "daily_duty_amount": daily_duty,
        "shift_type": shift_type,
        "shift_start": shift_start,
        "shift_end": shift_end
    }
    
    await db.attendance.insert_one(attendance_doc)
    attendance_doc.pop("_id", None)
    
    # Get user name for notification
    user = await db.users.find_one({"id": emp_id}, {"_id": 0})
    emp_name = user.get("name", emp_id) if user else emp_id
    punch_in_time = attendance_doc.get("punch_in", "")
    
    # Broadcast real-time attendance update to admins
    await manager.broadcast_to_role("admin", {
        "type": "attendance_update",
        "action": "punch_in",
        "data": {
            "emp_id": emp_id,
            "emp_name": emp_name,
            "punch_in": punch_in_time,
            "location": location,
            "attendance_status": attendance_status,
            "date": today,
            "is_direct_punch": True
        }
    })
    
    # Create notification for admins
    await create_notification(
        recipient_id="",
        recipient_role="admin",
        title="Team Lead Punched In",
        message=f"{emp_name} punched in directly at {punch_in_time} ({attendance_status})",
        notification_type="attendance",
        related_id=attendance_doc["id"],
        data={"emp_id": emp_id, "action": "direct_punch_in"}
    )
    
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
    
    # Get user name for notification
    user = await db.users.find_one({"id": data.emp_id}, {"_id": 0})
    emp_name = user.get("name", data.emp_id) if user else data.emp_id
    
    # Broadcast real-time attendance update
    await manager.broadcast_to_admins_and_teamleads({
        "type": "attendance_update",
        "action": "punch_out",
        "data": {
            "emp_id": data.emp_id,
            "emp_name": emp_name,
            "punch_out": punch_out_time,
            "work_hours": work_hours,
            "date": data.date
        }
    })
    
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

# Admin mark attendance endpoint
@router.post("/attendance/mark")
async def mark_attendance(
    emp_id: str,
    date: str,
    status: str,  # 'present' or 'absent'
    marked_by: str = "ADMIN001"
):
    """Admin marks attendance for employee/team leader - updates all related calculations"""
    
    # Get employee details for salary calculation
    user = await db.users.find_one({"id": emp_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    emp_salary = user.get("salary", 0)
    daily_rate = round(emp_salary / 26, 2)  # 26 working days per month
    
    # Determine attendance status, conveyance, and daily duty based on status
    if status == 'present':
        attendance_status = "full_day"
        conveyance = 200
        daily_duty = daily_rate
        punch_in = "10:00"
        punch_out = "19:00"
        work_hours = 9.0
    else:  # absent
        attendance_status = "absent"
        conveyance = 0
        daily_duty = 0
        punch_in = None
        punch_out = None
        work_hours = 0
    
    # Check if attendance record already exists for this date
    existing = await db.attendance.find_one({"emp_id": emp_id, "date": date})
    
    if existing:
        # Update existing record
        await db.attendance.update_one(
            {"emp_id": emp_id, "date": date},
            {"$set": {
                "status": status,
                "attendance_status": attendance_status,
                "punch_in": punch_in,
                "punch_out": punch_out,
                "work_hours": work_hours,
                "conveyance_amount": conveyance,
                "daily_duty_amount": daily_duty,
                "marked_by": marked_by,
                "updated_at": get_utc_now_str()
            }}
        )
        message = "Attendance updated"
    else:
        # Create new attendance record
        attendance_doc = {
            "id": generate_id(),
            "emp_id": emp_id,
            "date": date,
            "punch_in": punch_in,
            "punch_out": punch_out,
            "status": status,
            "attendance_status": attendance_status,
            "work_hours": work_hours,
            "qr_code_id": None,
            "location": "Marked by Admin",
            "conveyance_amount": conveyance,
            "daily_duty_amount": daily_duty,
            "shift_type": "day",
            "shift_start": "10:00",
            "shift_end": "19:00",
            "marked_by": marked_by,
            "created_at": get_utc_now_str()
        }
        await db.attendance.insert_one(attendance_doc)
        message = "Attendance created"
    
    return {
        "message": message,
        "emp_id": emp_id,
        "date": date,
        "status": status,
        "attendance_status": attendance_status,
        "conveyance_amount": conveyance,
        "daily_duty_amount": daily_duty,
        "work_hours": work_hours
    }

# ==================== LEAVE ROUTES ====================

@router.post("/leaves", response_model=LeaveResponse)
async def create_leave(leave: LeaveCreate):
    leave_doc = leave.model_dump()
    leave_doc["id"] = generate_id()
    leave_doc["status"] = LeaveStatus.PENDING
    leave_doc["applied_on"] = get_utc_now_str()[:10]
    
    await db.leaves.insert_one(leave_doc)
    leave_doc.pop("_id", None)
    
    # Send notification to admins and team leads
    await create_notification(
        recipient_id="",
        recipient_role="admin",
        title="New Leave Request",
        message=f"{leave.emp_name} requested {leave.days} days of {leave.type}",
        notification_type="leave",
        related_id=leave_doc["id"],
        data={"emp_id": leave.emp_id, "action": "created"}
    )
    
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
    leave = await db.leaves.find_one({"id": leave_id}, {"_id": 0})
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    result = await db.leaves.update_one(
        {"id": leave_id},
        {"$set": {"status": LeaveStatus.APPROVED, "approved_by": approved_by}}
    )
    
    # Update attendance records for leave dates to "leave" status
    # This converts absent days to approved leave with full day credit
    emp_id = leave["emp_id"]
    from_date = leave.get("from_date")
    to_date = leave.get("to_date", from_date)
    
    # Get employee salary for daily duty calculation
    user = await db.users.find_one({"id": emp_id}, {"_id": 0})
    emp_salary = user.get("salary", 0) if user else 0
    daily_rate = emp_salary / 26  # 26 working days per month
    full_day_duty = round(daily_rate, 2)
    full_conveyance = 200  # Default full day conveyance
    
    # Update all attendance records within the leave date range
    from datetime import datetime, timedelta
    start_date = datetime.strptime(from_date, "%Y-%m-%d")
    end_date = datetime.strptime(to_date, "%Y-%m-%d")
    
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        
        # Check if attendance record exists for this date
        existing_attendance = await db.attendance.find_one({
            "emp_id": emp_id,
            "date": date_str
        })
        
        if existing_attendance:
            # Update existing attendance to "leave" status with full day credits
            await db.attendance.update_one(
                {"emp_id": emp_id, "date": date_str},
                {"$set": {
                    "status": "leave",
                    "attendance_status": "leave",
                    "conveyance_amount": full_conveyance,
                    "daily_duty_amount": full_day_duty
                }}
            )
        else:
            # Create new attendance record for leave
            attendance_doc = {
                "id": generate_id(),
                "emp_id": emp_id,
                "date": date_str,
                "punch_in": None,
                "punch_out": None,
                "status": "leave",
                "attendance_status": "leave",
                "work_hours": 0,
                "qr_code_id": None,
                "location": None,
                "conveyance_amount": full_conveyance,
                "daily_duty_amount": full_day_duty,
                "shift_type": "day",
                "shift_start": "10:00",
                "shift_end": "19:00"
            }
            await db.attendance.insert_one(attendance_doc)
        
        current_date += timedelta(days=1)
    
    # Notify employee
    await create_notification(
        recipient_id=leave["emp_id"],
        title="Leave Approved",
        message=f"Your {leave['type']} request for {leave['days']} days has been approved",
        notification_type="leave",
        related_id=leave_id,
        data={"action": "approved"}
    )
    
    return {"message": "Leave approved", "attendance_updated": True}

@router.put("/leaves/{leave_id}/reject")
async def reject_leave(leave_id: str, rejected_by: str):
    leave = await db.leaves.find_one({"id": leave_id}, {"_id": 0})
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    result = await db.leaves.update_one(
        {"id": leave_id},
        {"$set": {"status": LeaveStatus.REJECTED, "rejected_by": rejected_by}}
    )
    
    # Notify employee
    await create_notification(
        recipient_id=leave["emp_id"],
        title="Leave Rejected",
        message=f"Your {leave['type']} request for {leave['days']} days has been rejected",
        notification_type="leave",
        related_id=leave_id,
        data={"action": "rejected"}
    )
    
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
    
    # Send notification to admins and team leads
    await create_notification(
        recipient_id="",
        recipient_role="admin",
        title="New Bill Submission",
        message=f"{emp_name} submitted a bill of ₹{total} for {bill.month}",
        notification_type="bill",
        related_id=bill_doc["id"],
        data={"emp_id": emp_id, "action": "created"}
    )
    
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
    bill = await db.bills.find_one({"id": bill_id}, {"_id": 0})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    result = await db.bills.update_one(
        {"id": bill_id},
        {"$set": {
            "status": BillStatus.APPROVED,
            "approved_by": approved_by,
            "approved_amount": approved_amount,
            "approved_on": get_utc_now_str()[:10]
        }}
    )
    
    # Notify employee
    await create_notification(
        recipient_id=bill["emp_id"],
        title="Bill Approved",
        message=f"Your bill of ₹{bill['total_amount']} for {bill['month']} has been approved (₹{approved_amount})",
        notification_type="bill",
        related_id=bill_id,
        data={"action": "approved", "approved_amount": approved_amount}
    )
    
    # Auto-create Cash Out entry for approved bill
    if approved_amount > 0:
        month_num = ["January", "February", "March", "April", "May", "June", 
                     "July", "August", "September", "October", "November", "December"].index(bill.get("month", "January")) + 1
        date_str = f"{bill.get('year', 2026)}-{month_num:02d}-{datetime.now().day:02d}"
        
        await create_auto_cash_out(
            category="bills",
            description=f"Bill Reimbursement - {bill.get('emp_name', '')} ({bill.get('month', '')} {bill.get('year', '')})",
            amount=approved_amount,
            date=date_str,
            reference_id=bill_id,
            reference_type="bill"
        )
    
    return {"message": "Bill approved"}

@router.put("/bills/{bill_id}/reject")
async def reject_bill(bill_id: str, rejected_by: str):
    bill = await db.bills.find_one({"id": bill_id}, {"_id": 0})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    result = await db.bills.update_one(
        {"id": bill_id},
        {"$set": {"status": BillStatus.REJECTED, "rejected_by": rejected_by}}
    )
    
    # Notify employee
    await create_notification(
        recipient_id=bill["emp_id"],
        title="Bill Rejected",
        message=f"Your bill of ₹{bill['total_amount']} for {bill['month']} has been rejected",
        notification_type="bill",
        related_id=bill_id,
        data={"action": "rejected"}
    )
    
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
    # Salary = Basic + HRA + Special Allowance (total = 100% of salary)
    total_salary = user.get("salary", 0)
    basic = round(total_salary * 0.60, 2)  # 60% of salary
    hra = round(total_salary * 0.24, 2)  # 24% of salary  
    special_allowance = round(total_salary * 0.16, 2)  # 16% of salary  
    # Note: basic + hra + special_allowance = 100% of salary = ₹50,000
    
    # Get approved bills for this month (Extra Conveyance / Reimbursements)
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
    leave_days = 0
    attendance_conveyance = 0
    total_duty_earned = 0
    
    for record in attendance_records:
        att_status = record.get("attendance_status", record.get("status", "present"))
        if att_status == "full_day" or att_status == "present":
            full_days += 1
        elif att_status == "half_day":
            half_days += 1
        elif att_status == "absent":
            absent_days += 1
        elif att_status == "leave":
            leave_days += 1
            # Leave counts as full day - already has conveyance and duty set
        attendance_conveyance += record.get("conveyance_amount", 0)
        total_duty_earned += record.get("daily_duty_amount", 0)
    
    # Calculate attendance adjustment (deductions for half days and absents ONLY)
    # Leave days are NOT deducted as they are approved
    # Assuming 26 working days per month
    working_days = 26
    daily_rate = basic / working_days
    
    # Half day = 0.5 day deduction, Absent = 1 day deduction, Leave = NO deduction
    attendance_adjustment = -((half_days * 0.5 * daily_rate) + (absent_days * daily_rate))
    attendance_adjustment = round(attendance_adjustment, 2)
    
    # Leave adjustment is now 0 since approved leaves don't get deducted
    # and attendance is already updated to "leave" status with full credits
    leave_adjustment = 0
    
    # Get approved advances for this month that need to be deducted
    # Handle both month formats: "January" and "January 2026"
    month_variants = [data.month, data.month.split()[0]]  # Try both "January 2026" and "January"
    advances = await db.advances.find({
        "emp_id": data.emp_id,
        "status": AdvanceStatus.APPROVED,
        "deduct_from_month": {"$in": month_variants},
        "deduct_from_year": data.year,
        "is_deducted": {"$ne": True}  # Not yet deducted
    }).to_list(100)
    advance_deduction = sum(a.get("amount", 0) for a in advances)
    
    # CORRECT CALCULATION:
    # Gross = Salary (Basic + HRA + Special) + Conveyance (from attendance) + Bills (approved)
    # Net = Gross - Attendance Adjustment - Advance Deduction
    
    gross = basic + hra + special_allowance + attendance_conveyance + extra_conveyance
    deductions = 0  # No PF/Tax deductions
    net_pay = round(gross + attendance_adjustment - deductions - advance_deduction, 2)
    
    breakdown = SalaryBreakdown(
        basic=basic,
        hra=hra,
        special_allowance=special_allowance,
        conveyance=attendance_conveyance,  # Conveyance from attendance only
        leave_adjustment=round(leave_adjustment, 2),
        extra_conveyance=extra_conveyance,  # From approved bills
        previous_pending_allowances=0,
        attendance_adjustment=attendance_adjustment,
        full_days=full_days,
        half_days=half_days,
        absent_days=absent_days,
        leave_days=leave_days,
        total_duty_earned=round(total_duty_earned, 2),
        advance_deduction=advance_deduction,
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
        "status": PayslipStatus.PREVIEW,  # Start as preview - not downloadable until admin generates
        "created_on": get_utc_now_str()[:10],
        "paid_on": None,
        "settled_on": None,
        "generated_on": None,  # Will be set when admin clicks Generate
        "advance_ids": [a["id"] for a in advances]  # Track which advances were included
    }
    
    await db.payslips.insert_one(payslip_doc)
    payslip_doc.pop("_id", None)
    
    return PayslipResponse(**payslip_doc)


@router.post("/payslips/create-monthly")
async def create_monthly_payslips(month: str, year: int):
    """
    Create preview payslips for all active employees/teamleads for a specific month.
    This should be called at the start of each month (manually or via cron job).
    Skips users who already have a payslip for that month.
    """
    # Get all active employees and team leads
    active_users = await db.users.find(
        {"status": "active", "role": {"$in": ["employee", "teamlead"]}},
        {"_id": 0}
    ).to_list(1000)
    
    created_count = 0
    skipped_count = 0
    
    for user in active_users:
        emp_id = user.get("id")
        
        # Check if payslip already exists for this month/year
        existing = await db.payslips.find_one({
            "emp_id": emp_id,
            "month": month,
            "year": year
        })
        
        if existing:
            skipped_count += 1
            continue
        
        # Calculate salary breakdown
        salary = user.get("salary", 0)
        basic = round(salary * 0.6, 2)
        hra = round(salary * 0.24, 2)
        special_allowance = round(salary * 0.16, 2)
        
        payslip_doc = {
            "id": generate_id(),
            "emp_id": emp_id,
            "emp_name": user.get("name"),
            "month": month,
            "year": year,
            "status": "preview",
            "breakdown": {
                "basic": basic,
                "hra": hra,
                "special_allowance": special_allowance,
                "conveyance": 0.0,
                "leave_adjustment": 0.0,
                "extra_conveyance": 0.0,
                "previous_pending_allowances": 0.0,
                "attendance_adjustment": 0.0,
                "full_days": 0,
                "half_days": 0,
                "absent_days": 0,
                "leave_days": 0,
                "total_duty_earned": 0.0,
                "audit_expenses": 0.0,
                "advance_deduction": 0.0,
                "gross_pay": salary,
                "deductions": 0.0,
                "net_pay": salary
            },
            "created_on": datetime.now().isoformat(),
            "paid_on": None
        }
        
        await db.payslips.insert_one(payslip_doc)
        created_count += 1
    
    return {
        "message": f"Monthly payslips created for {month} {year}",
        "created": created_count,
        "skipped": skipped_count,
        "total_users": len(active_users)
    }

# NEW: Admin Generate Payslip endpoint
@router.put("/payslips/{payslip_id}/generate")
async def generate_payslip_final(payslip_id: str):
    """Admin generates payslip - RECALCULATES from attendance, makes it downloadable and adds to cashbook"""
    payslip = await db.payslips.find_one({"id": payslip_id}, {"_id": 0})
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")
    
    if payslip.get("status") not in [PayslipStatus.PREVIEW, "preview", "pending"]:
        raise HTTPException(status_code=400, detail="Payslip already generated")
    
    # RECALCULATE payslip from attendance before generating
    emp_id = payslip.get("emp_id")
    month = payslip.get("month")
    year = payslip.get("year")
    
    # Get user details
    user = await db.users.find_one({"id": emp_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    total_salary = user.get("salary", 0)
    basic = round(total_salary * 0.60, 2)
    hra = round(total_salary * 0.24, 2)
    special_allowance = round(total_salary * 0.16, 2)
    
    # Get attendance records for the month
    month_num = ["January", "February", "March", "April", "May", "June", 
                 "July", "August", "September", "October", "November", "December"].index(month.split()[0]) + 1
    month_str = f"{year}-{month_num:02d}"
    attendance_records = await db.attendance.find({
        "emp_id": emp_id,
        "date": {"$regex": f"^{month_str}"}
    }).to_list(100)
    
    # Calculate attendance-based metrics
    full_days = 0
    half_days = 0
    absent_days = 0
    leave_days = 0
    attendance_conveyance = 0
    total_duty_earned = 0
    
    for record in attendance_records:
        att_status = record.get("attendance_status", record.get("status", "present"))
        if att_status == "full_day" or att_status == "present":
            full_days += 1
        elif att_status == "half_day":
            half_days += 1
        elif att_status == "absent":
            absent_days += 1
        elif att_status == "leave":
            leave_days += 1
        attendance_conveyance += record.get("conveyance_amount", 0)
        total_duty_earned += record.get("daily_duty_amount", 0)
    
    # Get approved bills for this month
    approved_bills = await db.bills.find({
        "emp_id": emp_id,
        "month": month,
        "year": year,
        "status": BillStatus.APPROVED
    }).to_list(100)
    extra_conveyance = sum(b.get("approved_amount", 0) for b in approved_bills)
    
    # Get approved audit expenses for this month
    start_date = f"{year}-{month_num:02d}-01"
    end_date = f"{year}-{month_num+1:02d}-01" if month_num < 12 else f"{year+1}-01-01"
    audit_expenses = await db.audit_expenses.find({
        "emp_id": emp_id,
        "status": "approved",
        "created_at": {"$gte": start_date, "$lt": end_date}
    }).to_list(100)
    total_audit_expenses = sum(e.get("approved_amount", 0) for e in audit_expenses)
    
    # Get approved advances to deduct
    month_variants = [month, month.split()[0]]
    advances = await db.advances.find({
        "emp_id": emp_id,
        "status": AdvanceStatus.APPROVED,
        "deduct_from_month": {"$in": month_variants},
        "deduct_from_year": year,
        "is_deducted": {"$ne": True}
    }).to_list(100)
    advance_deduction = sum(a.get("amount", 0) for a in advances)
    
    # Calculate attendance adjustment
    working_days = 26
    daily_rate = basic / working_days
    attendance_adjustment = -((half_days * 0.5 * daily_rate) + (absent_days * daily_rate))
    attendance_adjustment = round(attendance_adjustment, 2)
    
    # CORRECT CALCULATION: 
    # Net Pay = Total Duty Earned + Conveyance + Bills + Audit Expenses - Advance Deduction
    # If no attendance marked, net_pay should be 0 (not full salary)
    if len(attendance_records) == 0:
        # No attendance marked at all - salary should be 0
        gross = 0
        net_pay = 0
        attendance_conveyance = 0
        total_duty_earned = 0
    else:
        gross = total_duty_earned + attendance_conveyance + extra_conveyance + total_audit_expenses
        net_pay = round(gross - advance_deduction, 2)
    
    # Update payslip with recalculated values
    updated_breakdown = {
        "basic": basic,
        "hra": hra,
        "special_allowance": special_allowance,
        "conveyance": attendance_conveyance,
        "leave_adjustment": 0,
        "extra_conveyance": extra_conveyance,
        "previous_pending_allowances": 0,
        "attendance_adjustment": attendance_adjustment,
        "full_days": full_days,
        "half_days": half_days,
        "absent_days": absent_days,
        "leave_days": leave_days,
        "total_duty_earned": round(total_duty_earned, 2),
        "audit_expenses": total_audit_expenses,
        "advance_deduction": advance_deduction,
        "gross_pay": round(gross, 2),
        "deductions": 0,
        "net_pay": net_pay
    }
    
    # Update status to generated
    await db.payslips.update_one(
        {"id": payslip_id},
        {"$set": {
            "status": PayslipStatus.GENERATED,
            "breakdown": updated_breakdown,
            "generated_on": get_utc_now_str()[:10]
        }}
    )
    
    # Create Cash Out entry for salary (use recalculated net_pay)
    if net_pay > 0:
        # Delete any existing auto cash-out entry to avoid duplicates
        await db.cash_out.delete_many({
            "reference_type": "payslip",
            "month": month,
            "year": year,
            "description": {"$regex": f".*{payslip.get('emp_name', '')}.*"}
        })
        
        date_str = f"{year}-{month_num:02d}-28"
        await create_auto_cash_out(
            category="salary",
            description=f"Salary - {payslip.get('emp_name', '')} ({month} {year})",
            amount=net_pay,
            date=date_str,
            reference_id=payslip_id,
            reference_type="payslip",
            month=month,
            year=year
        )
    
    # Create notification for employee
    await create_notification(
        recipient_id=emp_id,
        title="Payslip Generated",
        message=f"Your payslip for {month} {year} is now available for download. Net Pay: ₹{net_pay:,.2f}",
        notification_type="payslip",
        related_id=payslip_id,
        data={"action": "generated", "net_pay": net_pay}
    )
    
    return {
        "message": "Payslip generated successfully", 
        "status": "generated",
        "breakdown": updated_breakdown
    }

@router.put("/payslips/{payslip_id}/settle")
async def settle_payslip(payslip_id: str):
    """Mark payslip as settled/paid - only for generated payslips"""
    payslip = await db.payslips.find_one({"id": payslip_id}, {"_id": 0})
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")
    
    current_status = payslip.get("status", "")
    if current_status not in [PayslipStatus.GENERATED, "generated"]:
        raise HTTPException(status_code=400, detail="Payslip must be generated before settling")
    
    # Mark the payslip as settled
    result = await db.payslips.update_one(
        {"id": payslip_id},
        {"$set": {
            "status": PayslipStatus.SETTLED,
            "paid_on": get_utc_now_str()[:10],
            "settled_on": get_utc_now_str()[:10]
        }}
    )
    
    # Mark associated advances as deducted
    advance_ids = payslip.get("advance_ids", [])
    if advance_ids:
        await db.advances.update_many(
            {"id": {"$in": advance_ids}},
            {"$set": {"is_deducted": True, "deducted_on": get_utc_now_str()[:10]}}
        )
    
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
            "team_members": ["EMP001", "EMP003"],
            "bank_name": "HDFC Bank",
            "bank_account_number": "50100012345678",
            "bank_ifsc": "HDFC0001234"
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
            "team_members": ["EMP002"],
            "bank_name": "ICICI Bank",
            "bank_account_number": "00110022334455",
            "bank_ifsc": "ICIC0005678"
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
            "team_members": [],
            "bank_name": "State Bank of India",
            "bank_account_number": "32456789012345",
            "bank_ifsc": "SBIN0001234"
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
            "team_members": [],
            "bank_name": "Axis Bank",
            "bank_account_number": "91234567890123",
            "bank_ifsc": "UTIB0002345"
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
            "team_members": [],
            "bank_name": "Kotak Mahindra Bank",
            "bank_account_number": "78123456789012",
            "bank_ifsc": "KKBK0003456"
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
    """Get employee leave balance for a year - calculated based on monthly working days"""
    if year is None:
        year = datetime.now().year
    
    # Calculate leave accrual per month
    # Rule: If employee has 24+ working days in a month, 1 leave is accrued for that month
    total_accrued = 0
    total_working_days = 0
    
    for month in range(1, 13):
        month_str = f"{year}-{month:02d}"
        
        # Get attendance records for this month
        attendance_records = await db.attendance.find({
            "emp_id": emp_id,
            "date": {"$regex": f"^{month_str}"}
        }).to_list(100)
        
        # Count full days (actual working days via QR punch-in)
        # Only full_day counts towards the 24 days requirement
        working_days_in_month = sum(1 for a in attendance_records 
                                    if a.get("attendance_status") == "full_day")
        
        total_working_days += working_days_in_month
        
        # If 24+ working days in this month, add 1 leave
        if working_days_in_month >= 24:
            total_accrued += 1
    
    # Get used leaves from approved leave requests
    approved_leaves = await db.leaves.find({
        "emp_id": emp_id,
        "status": "approved",
        "from_date": {"$gte": f"{year}-01-01", "$lte": f"{year}-12-31"}
    }).to_list(100)
    
    total_used = sum(l.get("days", 0) for l in approved_leaves)
    
    balance = {
        "emp_id": emp_id,
        "year": year,
        "total_leave": total_accrued,
        "total_used": total_used,
        "working_days_count": total_working_days
    }
    
    return LeaveBalanceResponse(**balance)

@router.put("/leave-balance/{emp_id}")
async def update_leave_balance(emp_id: str, days: int, year: int = None):
    """Update leave balance when leave is approved"""
    if year is None:
        year = datetime.now().year
    
    # Leave balance is now calculated dynamically, so this just validates
    # The actual used count comes from approved leaves in the database
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
        "deduct_from_month": data.deduct_from_month,
        "deduct_from_year": data.deduct_from_year,
        "repayment_months": data.repayment_months,
        "monthly_deduction": round(data.amount / data.repayment_months, 2),
        "status": AdvanceStatus.PENDING,
        "requested_on": get_utc_now_str(),
        "approved_by": None,
        "approved_on": None,
        "is_deducted": False,
        "deducted_on": None
    }
    
    await db.advances.insert_one(advance_doc)
    advance_doc.pop("_id", None)
    
    # Create notification for admin
    await create_notification(
        recipient_id="",
        recipient_role="admin",
        title="New Advance Request",
        message=f"{data.emp_name} requested an advance of ₹{data.amount} to be deducted from {data.deduct_from_month} {data.deduct_from_year}",
        notification_type="bill",
        related_id=advance_doc["id"],
        data={"emp_id": data.emp_id, "action": "advance_request"}
    )
    
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
    advance = await db.advances.find_one({"id": advance_id}, {"_id": 0})
    if not advance:
        raise HTTPException(status_code=404, detail="Advance not found")
    
    result = await db.advances.update_one(
        {"id": advance_id, "status": AdvanceStatus.PENDING},
        {"$set": {
            "status": AdvanceStatus.APPROVED,
            "approved_by": approved_by,
            "approved_on": get_utc_now_str()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Advance already processed")
    
    # Notify employee
    await create_notification(
        recipient_id=advance["emp_id"],
        title="Advance Approved",
        message=f"Your advance request of ₹{advance['amount']} has been approved. It will be deducted from {advance.get('deduct_from_month', '')} {advance.get('deduct_from_year', '')} salary.",
        notification_type="bill",
        related_id=advance_id,
        data={"action": "advance_approved"}
    )
    
    advance = await db.advances.find_one({"id": advance_id}, {"_id": 0})
    return advance

@router.put("/advances/{advance_id}/reject")
async def reject_advance(advance_id: str, rejected_by: str):
    """Reject a salary advance request"""
    advance = await db.advances.find_one({"id": advance_id}, {"_id": 0})
    if not advance:
        raise HTTPException(status_code=404, detail="Advance not found")
    
    result = await db.advances.update_one(
        {"id": advance_id, "status": AdvanceStatus.PENDING},
        {"$set": {
            "status": AdvanceStatus.REJECTED,
            "approved_by": rejected_by,
            "approved_on": get_utc_now_str()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Advance already processed")
    
    # Notify employee
    await create_notification(
        recipient_id=advance["emp_id"],
        title="Advance Rejected",
        message=f"Your advance request of ₹{advance['amount']} has been rejected.",
        notification_type="bill",
        related_id=advance_id,
        data={"action": "advance_rejected"}
    )
    
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
    
    # Auto-create Cash Out entry for approved audit expense
    if payment_amount > 0:
        date_str = get_utc_now_str()[:10]
        
        await create_auto_cash_out(
            category="audit_expenses",
            description=f"Audit Expense - {expense.get('emp_name', '')} ({expense.get('trip_purpose', '')})",
            amount=payment_amount,
            date=date_str,
            reference_id=expense_id,
            reference_type="audit_expense"
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


# ==================== WEBSOCKET CONNECTION MANAGER ====================

class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    def __init__(self):
        self.active_connections: dict = {}  # {user_id: WebSocket}
        self.role_connections: dict = defaultdict(list)  # {role: [WebSocket]}
    
    async def connect(self, websocket: WebSocket, user_id: str, role: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.role_connections[role].append(websocket)
    
    def disconnect(self, user_id: str, role: str):
        if user_id in self.active_connections:
            ws = self.active_connections[user_id]
            del self.active_connections[user_id]
            if ws in self.role_connections[role]:
                self.role_connections[role].remove(ws)
    
    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception:
                pass
    
    async def broadcast_to_role(self, role: str, message: dict):
        """Broadcast to all users with a specific role"""
        dead_connections = []
        for ws in self.role_connections[role]:
            try:
                await ws.send_json(message)
            except Exception:
                dead_connections.append(ws)
        # Clean up dead connections
        for ws in dead_connections:
            self.role_connections[role].remove(ws)
    
    async def broadcast_to_admins_and_teamleads(self, message: dict):
        """Broadcast to admins and team leads"""
        await self.broadcast_to_role("admin", message)
        await self.broadcast_to_role("teamlead", message)

manager = ConnectionManager()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, role: str = "employee"):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket, user_id, role)
    try:
        while True:
            # Keep connection alive and listen for messages
            data = await websocket.receive_text()
            # Echo back or handle commands if needed
            await websocket.send_json({"type": "pong", "message": "connected"})
    except WebSocketDisconnect:
        manager.disconnect(user_id, role)


# ==================== NOTIFICATION ROUTES ====================

async def create_notification(
    recipient_id: str,
    title: str,
    message: str,
    notification_type: str,
    related_id: str = None,
    data: dict = None,
    recipient_role: str = None
):
    """Helper function to create a notification"""
    notification_doc = {
        "id": generate_id(),
        "recipient_id": recipient_id,
        "recipient_role": recipient_role,
        "title": title,
        "message": message,
        "type": notification_type,
        "related_id": related_id,
        "data": data,
        "is_read": False,
        "created_at": get_utc_now_str()
    }
    await db.notifications.insert_one(notification_doc)
    
    # Send real-time notification via WebSocket
    ws_message = {
        "type": "notification",
        "notification": {k: v for k, v in notification_doc.items() if k != "_id"}
    }
    
    if recipient_id:
        await manager.send_to_user(recipient_id, ws_message)
    elif recipient_role:
        await manager.broadcast_to_role(recipient_role, ws_message)
    
    return notification_doc

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(user_id: str, unread_only: bool = False, limit: int = 50):
    """Get notifications for a user"""
    query = {"$or": [{"recipient_id": user_id}, {"recipient_role": {"$exists": True}}]}
    if unread_only:
        query["is_read"] = False
    
    notifications = await db.notifications.find(
        query, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return notifications

@router.get("/notifications/unread-count")
async def get_unread_count(user_id: str):
    """Get unread notification count"""
    count = await db.notifications.count_documents({
        "$or": [{"recipient_id": user_id}, {"recipient_role": {"$exists": True}}],
        "is_read": False
    })
    return {"count": count}

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a notification as read"""
    result = await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"is_read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

@router.put("/notifications/mark-all-read")
async def mark_all_notifications_read(user_id: str):
    """Mark all notifications as read for a user"""
    await db.notifications.update_many(
        {"$or": [{"recipient_id": user_id}, {"recipient_role": {"$exists": True}}]},
        {"$set": {"is_read": True}}
    )
    return {"message": "All notifications marked as read"}


# ==================== ANALYTICS ROUTES ====================

def get_date_range(time_filter: str):
    """Get start and end dates based on time filter"""
    today = datetime.now(timezone.utc)
    
    if time_filter == "this_week":
        start = today - timedelta(days=today.weekday())
        end = today
    elif time_filter == "this_month":
        start = today.replace(day=1)
        end = today
    elif time_filter == "this_quarter":
        quarter_month = ((today.month - 1) // 3) * 3 + 1
        start = today.replace(month=quarter_month, day=1)
        end = today
    elif time_filter == "this_year":
        start = today.replace(month=1, day=1)
        end = today
    else:
        start = today - timedelta(days=30)
        end = today
    
    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")

@router.get("/analytics/attendance-trends")
async def get_attendance_trends(time_filter: str = "this_month"):
    """Get attendance trends data for charts"""
    start_date, end_date = get_date_range(time_filter)
    
    attendance_records = await db.attendance.find({
        "date": {"$gte": start_date, "$lte": end_date}
    }, {"_id": 0}).to_list(10000)
    
    # Group by date
    daily_data = defaultdict(lambda: {"present": 0, "absent": 0, "half_day": 0, "total": 0})
    
    for record in attendance_records:
        date = record.get("date")
        status = record.get("attendance_status", record.get("status", "absent"))
        
        daily_data[date]["total"] += 1
        if status in ["full_day", "present"]:
            daily_data[date]["present"] += 1
        elif status == "half_day":
            daily_data[date]["half_day"] += 1
        else:
            daily_data[date]["absent"] += 1
    
    # Convert to list sorted by date
    result = [
        {"date": date, **data}
        for date, data in sorted(daily_data.items())
    ]
    
    return result

@router.get("/analytics/leave-distribution")
async def get_leave_distribution(time_filter: str = "this_month"):
    """Get leave distribution by type"""
    start_date, end_date = get_date_range(time_filter)
    
    leaves = await db.leaves.find({
        "from_date": {"$gte": start_date, "$lte": end_date}
    }, {"_id": 0}).to_list(1000)
    
    # Group by leave type
    type_counts = defaultdict(int)
    total = 0
    
    for leave in leaves:
        leave_type = leave.get("type", "Other")
        type_counts[leave_type] += 1
        total += 1
    
    result = [
        {
            "type": leave_type,
            "count": count,
            "percentage": round((count / total) * 100, 1) if total > 0 else 0
        }
        for leave_type, count in type_counts.items()
    ]
    
    return result

@router.get("/analytics/department-attendance")
async def get_department_attendance(time_filter: str = "this_month"):
    """Get attendance summary by department"""
    start_date, end_date = get_date_range(time_filter)
    
    # Get all users with their departments
    users = await db.users.find({"role": {"$ne": "admin"}}, {"_id": 0}).to_list(1000)
    user_dept = {u["id"]: u.get("department", "Unknown") for u in users}
    
    attendance_records = await db.attendance.find({
        "date": {"$gte": start_date, "$lte": end_date}
    }, {"_id": 0}).to_list(10000)
    
    # Group by department
    dept_data = defaultdict(lambda: {"present": 0, "absent": 0, "total": 0})
    
    for record in attendance_records:
        emp_id = record.get("emp_id")
        dept = user_dept.get(emp_id, "Unknown")
        status = record.get("attendance_status", record.get("status", "absent"))
        
        dept_data[dept]["total"] += 1
        if status in ["full_day", "present", "half_day"]:
            dept_data[dept]["present"] += 1
        else:
            dept_data[dept]["absent"] += 1
    
    result = [
        {
            "department": dept,
            "present": data["present"],
            "absent": data["absent"],
            "attendance_rate": round((data["present"] / data["total"]) * 100, 1) if data["total"] > 0 else 0
        }
        for dept, data in dept_data.items()
    ]
    
    return result

@router.get("/analytics/salary-overview")
async def get_salary_overview(time_filter: str = "this_year"):
    """Get salary/payroll overview"""
    start_date, end_date = get_date_range(time_filter)
    
    payslips = await db.payslips.find({
        "status": "settled"
    }, {"_id": 0}).to_list(1000)
    
    # Group by month
    monthly_data = defaultdict(lambda: {"total_salary": 0, "total_deductions": 0, "net_paid": 0})
    
    for payslip in payslips:
        month_key = f"{payslip.get('month', '')} {payslip.get('year', '')}"
        breakdown = payslip.get("breakdown", {})
        
        monthly_data[month_key]["total_salary"] += breakdown.get("gross_pay", 0)
        monthly_data[month_key]["total_deductions"] += breakdown.get("deductions", 0)
        monthly_data[month_key]["net_paid"] += breakdown.get("net_pay", 0)
    
    result = [
        {
            "month": month,
            "total_salary": round(data["total_salary"], 2),
            "total_deductions": round(data["total_deductions"], 2),
            "net_paid": round(data["net_paid"], 2)
        }
        for month, data in monthly_data.items()
    ]
    
    return result

@router.get("/analytics/employee-counts")
async def get_employee_counts():
    """Get employee counts by role and status"""
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    
    role_data = defaultdict(lambda: {"count": 0, "active": 0, "inactive": 0})
    
    for user in users:
        role = user.get("role", "employee")
        status = user.get("status", "active")
        
        role_data[role]["count"] += 1
        if status == "active":
            role_data[role]["active"] += 1
        else:
            role_data[role]["inactive"] += 1
    
    result = [
        {
            "role": role,
            "count": data["count"],
            "active": data["active"],
            "inactive": data["inactive"]
        }
        for role, data in role_data.items()
    ]
    
    return result

@router.get("/analytics/summary")
async def get_analytics_summary(time_filter: str = "this_month"):
    """Get all analytics data in one call"""
    attendance_trends = await get_attendance_trends(time_filter)
    leave_distribution = await get_leave_distribution(time_filter)
    department_attendance = await get_department_attendance(time_filter)
    salary_overview = await get_salary_overview(time_filter)
    employee_counts = await get_employee_counts()
    
    return {
        "attendance_trends": attendance_trends,
        "leave_distribution": leave_distribution,
        "department_attendance": department_attendance,
        "salary_overview": salary_overview,
        "employee_counts": employee_counts
    }


# ==================== EXPORT ROUTES (CSV) ====================

@router.get("/export/attendance")
async def export_attendance(
    month: Optional[int] = None,
    year: Optional[int] = None,
    emp_id: Optional[str] = None
):
    """Export attendance records to CSV"""
    query = {}
    if emp_id:
        query["emp_id"] = emp_id
    if month and year:
        month_str = f"{year}-{month:02d}"
        query["date"] = {"$regex": f"^{month_str}"}
    
    records = await db.attendance.find(query, {"_id": 0}).sort("date", -1).to_list(10000)
    
    # Get user names
    users = await db.users.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(1000)
    user_names = {u["id"]: u["name"] for u in users}
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Date", "Employee ID", "Employee Name", "Punch In", "Punch Out",
        "Work Hours", "Status", "Location", "Conveyance", "Daily Duty", "Shift Type"
    ])
    
    # Data rows
    for record in records:
        writer.writerow([
            record.get("date", ""),
            record.get("emp_id", ""),
            user_names.get(record.get("emp_id", ""), "Unknown"),
            record.get("punch_in", ""),
            record.get("punch_out", ""),
            record.get("work_hours", 0),
            record.get("attendance_status", record.get("status", "")),
            record.get("location", ""),
            record.get("conveyance_amount", 0),
            record.get("daily_duty_amount", 0),
            record.get("shift_type", "")
        ])
    
    output.seek(0)
    
    filename = f"attendance_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/employees")
async def export_employees():
    """Export employee list to CSV with bank details"""
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    
    # Get team leader names for mapping
    team_leads = {u["id"]: u["name"] for u in users if u.get("role") == "teamlead"}
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Employee ID", "Name", "Email", "Phone", "Role", "Department",
        "Designation", "Joining Date", "Salary", "Status",
        "Bank Name", "Account Number", "IFSC Code", "Team Leader ID", "Team Leader Name"
    ])
    
    # Data rows
    for user in users:
        tl_id = user.get("team_lead_id", "")
        tl_name = team_leads.get(tl_id, "") if tl_id else ""
        writer.writerow([
            user.get("id", ""),
            user.get("name", ""),
            user.get("email", ""),
            user.get("phone", ""),
            user.get("role", ""),
            user.get("department", ""),
            user.get("designation", ""),
            user.get("joining_date", ""),
            user.get("salary", 0),
            user.get("status", ""),
            user.get("bank_name", ""),
            user.get("bank_account_number", ""),
            user.get("bank_ifsc", ""),
            tl_id,
            tl_name
        ])
    
    output.seek(0)
    
    filename = f"employees_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/leaves")
async def export_leaves(
    status: Optional[str] = None,
    emp_id: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None
):
    """Export leave records to CSV"""
    query = {}
    if status:
        query["status"] = status
    if emp_id:
        query["emp_id"] = emp_id
    if month and year:
        # Filter leaves where from_date falls in the given month/year
        month_str = f"{year}-{month:02d}"
        query["from_date"] = {"$regex": f"^{month_str}"}
    
    leaves = await db.leaves.find(query, {"_id": 0}).sort("applied_on", -1).to_list(10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Leave ID", "Employee ID", "Employee Name", "Type", "From Date",
        "To Date", "Days", "Reason", "Status", "Applied On"
    ])
    
    # Data rows
    for leave in leaves:
        writer.writerow([
            leave.get("id", ""),
            leave.get("emp_id", ""),
            leave.get("emp_name", ""),
            leave.get("type", ""),
            leave.get("from_date", ""),
            leave.get("to_date", ""),
            leave.get("days", 0),
            leave.get("reason", ""),
            leave.get("status", ""),
            leave.get("applied_on", "")
        ])
    
    output.seek(0)
    
    filename = f"leaves_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/payslips")
async def export_payslips(
    status: Optional[str] = None,
    emp_id: Optional[str] = None,
    month: Optional[str] = None,
    year: Optional[int] = None
):
    """Export payslip records to CSV - Only exports generated/settled payslips"""
    query = {}
    
    # Only export generated or settled payslips (not preview)
    if status:
        query["status"] = status
    else:
        query["status"] = {"$in": ["generated", "settled"]}
    
    if emp_id:
        query["emp_id"] = emp_id
    if year:
        query["year"] = year
    if month:
        query["month"] = month
    
    payslips = await db.payslips.find(query, {"_id": 0}).sort("created_on", -1).to_list(10000)
    
    # Get all user data for bank details lookup
    users_data = {}
    users_list = await db.users.find({}, {"_id": 0}).to_list(10000)
    for u in users_list:
        users_data[u.get("id")] = u
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header - includes bank details
    writer.writerow([
        "Payslip ID", "Employee ID", "Employee Name", "Month", "Year",
        "Bank Name", "Account Number", "IFSC Code",
        "Basic", "HRA", "Special Allowance", "Conveyance", "Bills/Previous Pending Approved",
        "Leave Adjustment", "Attendance Adjustment", "Full Days", "Half Days",
        "Leave Days", "Absent Days", "Total Duty Earned", "Advance Deduction",
        "Gross Pay", "Deductions", "Net Pay", "Status", "Paid On"
    ])
    
    # Data rows
    for payslip in payslips:
        breakdown = payslip.get("breakdown", {})
        emp_user = users_data.get(payslip.get("emp_id"), {})
        writer.writerow([
            payslip.get("id", ""),
            payslip.get("emp_id", ""),
            payslip.get("emp_name", ""),
            payslip.get("month", ""),
            payslip.get("year", ""),
            emp_user.get("bank_name", ""),
            emp_user.get("bank_account_number", ""),
            emp_user.get("bank_ifsc", ""),
            breakdown.get("basic", 0),
            breakdown.get("hra", 0),
            breakdown.get("special_allowance", 0),
            breakdown.get("conveyance", 0),
            breakdown.get("extra_conveyance", 0),
            breakdown.get("leave_adjustment", 0),
            breakdown.get("attendance_adjustment", 0),
            breakdown.get("full_days", 0),
            breakdown.get("half_days", 0),
            breakdown.get("leave_days", 0),
            breakdown.get("absent_days", 0),
            breakdown.get("total_duty_earned", 0),
            breakdown.get("advance_deduction", 0),
            breakdown.get("gross_pay", 0),
            breakdown.get("deductions", 0),
            breakdown.get("net_pay", 0),
            payslip.get("status", ""),
            payslip.get("paid_on", "")
        ])
    
    output.seek(0)
    
    filename = f"payslips_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/bills")
async def export_bills(
    status: Optional[str] = None,
    emp_id: Optional[str] = None,
    month: Optional[str] = None,
    year: Optional[int] = None
):
    """Export bill/expense records to CSV"""
    query = {}
    if status:
        query["status"] = status
    if emp_id:
        query["emp_id"] = emp_id
    if month:
        query["month"] = month
    if year:
        query["year"] = year
    
    bills = await db.bills.find(query, {"_id": 0}).sort("submitted_on", -1).to_list(10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Bill ID", "Employee ID", "Employee Name", "Month", "Year",
        "Total Amount", "Approved Amount", "Status", "Submitted On",
        "Approved By", "Approved On", "Remarks"
    ])
    
    # Data rows
    for bill in bills:
        writer.writerow([
            bill.get("id", ""),
            bill.get("emp_id", ""),
            bill.get("emp_name", ""),
            bill.get("month", ""),
            bill.get("year", ""),
            bill.get("total_amount", 0),
            bill.get("approved_amount", 0),
            bill.get("status", ""),
            bill.get("submitted_on", ""),
            bill.get("approved_by", ""),
            bill.get("approved_on", ""),
            bill.get("remarks", "")
        ])
    
    output.seek(0)
    
    filename = f"bills_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/advances")
async def export_advances(
    status: Optional[str] = None,
    emp_id: Optional[str] = None,
    month: Optional[str] = None,
    year: Optional[int] = None
):
    """Export salary advance records to CSV"""
    query = {}
    if status:
        query["status"] = status
    if emp_id:
        query["emp_id"] = emp_id
    if month:
        query["deduct_from_month"] = month
    if year:
        query["deduct_from_year"] = year
    
    advances = await db.advances.find(query, {"_id": 0}).sort("requested_on", -1).to_list(10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Advance ID", "Employee ID", "Employee Name", "Amount", "Reason",
        "Deduct From Month", "Deduct From Year", "Status", "Requested On",
        "Approved By", "Approved On", "Is Deducted", "Deducted On"
    ])
    
    # Data rows
    for advance in advances:
        writer.writerow([
            advance.get("id", ""),
            advance.get("emp_id", ""),
            advance.get("emp_name", ""),
            advance.get("amount", 0),
            advance.get("reason", ""),
            advance.get("deduct_from_month", ""),
            advance.get("deduct_from_year", ""),
            advance.get("status", ""),
            advance.get("requested_on", ""),
            advance.get("approved_by", ""),
            advance.get("approved_on", ""),
            "Yes" if advance.get("is_deducted") else "No",
            advance.get("deducted_on", "")
        ])
    
    output.seek(0)
    
    filename = f"advances_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/audit-expenses")
async def export_audit_expenses(
    status: Optional[str] = None,
    emp_id: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None
):
    """Export audit expense records to CSV"""
    query = {}
    if status:
        query["status"] = status
    if emp_id:
        query["emp_id"] = emp_id
    
    audit_expenses = await db.audit_expenses.find(query, {"_id": 0}).sort("created_at", -1).to_list(10000)
    
    # Filter by month/year if provided
    if month and year:
        start_date = f"{year}-{str(month).zfill(2)}-01"
        if month == 12:
            end_date = f"{year + 1}-01-01"
        else:
            end_date = f"{year}-{str(month + 1).zfill(2)}-01"
        audit_expenses = [e for e in audit_expenses if e.get("created_at", "") >= start_date and e.get("created_at", "") < end_date]
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Expense ID", "Employee ID", "Employee Name", "Trip Name", "Client Name",
        "From Date", "To Date", "Ticket Amount", "Travel Amount", "Food Amount", 
        "Hotel Amount", "Other Amount", "Total Amount", "Approved Amount", 
        "Amount Paid", "Balance Remaining", "Status", "Created At",
        "Approved By", "Approved At", "Rejection Reason", "Revalidation Reason"
    ])
    
    # Data rows
    for expense in audit_expenses:
        writer.writerow([
            expense.get("id", ""),
            expense.get("emp_id", ""),
            expense.get("emp_name", ""),
            expense.get("trip_name", ""),
            expense.get("client_name", ""),
            expense.get("from_date", ""),
            expense.get("to_date", ""),
            expense.get("ticket_amount", 0),
            expense.get("travel_amount", 0),
            expense.get("food_amount", 0),
            expense.get("hotel_amount", 0),
            expense.get("other_amount", 0),
            expense.get("total_amount", 0),
            expense.get("approved_amount", 0),
            expense.get("amount_paid", 0),
            expense.get("balance_remaining", 0),
            expense.get("status", ""),
            expense.get("created_at", ""),
            expense.get("approved_by", ""),
            expense.get("approved_at", ""),
            expense.get("rejection_reason", ""),
            expense.get("revalidation_reason", "")
        ])
    
    output.seek(0)
    
    filename = f"audit_expenses_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/bills-advances")
async def export_bills_advances(
    status: Optional[str] = None,
    emp_id: Optional[str] = None,
    month: Optional[str] = None,
    year: Optional[int] = None
):
    """Export combined bills and advances records to CSV"""
    query = {}
    if status:
        query["status"] = status
    if emp_id:
        query["emp_id"] = emp_id
    if month:
        query["month"] = month
    if year:
        query["year"] = year
    
    # Get bills
    bills = await db.bills.find(query, {"_id": 0}).sort("submitted_on", -1).to_list(10000)
    
    # Get advances - use different field names
    adv_query = {}
    if status:
        adv_query["status"] = status
    if emp_id:
        adv_query["emp_id"] = emp_id
    if month:
        adv_query["deduct_from_month"] = month
    if year:
        adv_query["deduct_from_year"] = year
    
    advances = await db.advances.find(adv_query, {"_id": 0}).sort("requested_on", -1).to_list(10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Type", "ID", "Employee ID", "Employee Name", "Month", "Year",
        "Requested Amount", "Approved Amount", "Status", "Date",
        "Approved By", "Remarks/Reason"
    ])
    
    # Bills rows
    for bill in bills:
        writer.writerow([
            "Bill",
            bill.get("id", ""),
            bill.get("emp_id", ""),
            bill.get("emp_name", ""),
            bill.get("month", ""),
            bill.get("year", ""),
            bill.get("total_amount", 0),
            bill.get("approved_amount", 0),
            bill.get("status", ""),
            bill.get("submitted_on", ""),
            bill.get("approved_by", ""),
            bill.get("remarks", "")
        ])
    
    # Advances rows
    for advance in advances:
        writer.writerow([
            "Advance",
            advance.get("id", ""),
            advance.get("emp_id", ""),
            advance.get("emp_name", ""),
            advance.get("deduct_from_month", ""),
            advance.get("deduct_from_year", ""),
            advance.get("amount", 0),
            advance.get("amount", 0) if advance.get("status") == "approved" else 0,
            advance.get("status", ""),
            advance.get("requested_on", ""),
            advance.get("approved_by", ""),
            advance.get("reason", "")
        ])
    
    output.seek(0)
    
    filename = f"bills_advances_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ==================== CASHBOOK / COMPANY FINANCE ROUTES ====================

MONTHS_LIST = ["January", "February", "March", "April", "May", "June", 
               "July", "August", "September", "October", "November", "December"]

def get_month_year_from_date(date_str: str):
    """Extract month name and year from date string"""
    try:
        dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
        return MONTHS_LIST[dt.month - 1], dt.year
    except:
        return None, None

# --- Cash In (Client Invoices) ---

@router.post("/cashbook/cash-in", response_model=CashInResponse)
async def create_cash_in(data: CashInCreate):
    """Create a new cash in entry (client invoice) with GST calculation"""
    month, year = get_month_year_from_date(data.invoice_date)
    
    # Check if month is locked
    lock = await db.month_locks.find_one({"month": month, "year": year, "is_locked": True})
    if lock:
        raise HTTPException(status_code=400, detail=f"{month} {year} is locked. Cannot add entries.")
    
    # Auto-calculate GST amount if percentage is provided
    gst_amount = None
    if data.gst_percentage is not None and data.gst_percentage > 0:
        gst_amount = (data.invoice_amount * data.gst_percentage) / 100
    
    pending_balance = data.invoice_amount - data.amount_received
    
    cash_in_doc = {
        "id": generate_id(),
        "client_name": data.client_name,
        "invoice_number": data.invoice_number,
        "invoice_date": data.invoice_date,
        "invoice_amount": data.invoice_amount,
        "gst_percentage": data.gst_percentage,
        "gst_amount": gst_amount,
        "invoice_pdf_url": data.invoice_pdf_url,
        "payment_status": data.payment_status,
        "amount_received": data.amount_received,
        "pending_balance": pending_balance,
        "notes": data.notes,
        "created_at": get_utc_now_str(),
        "month": month,
        "year": year
    }
    
    await db.cash_in.insert_one(cash_in_doc)
    cash_in_doc.pop("_id", None)
    return CashInResponse(**cash_in_doc)

@router.get("/cashbook/cash-in", response_model=List[CashInResponse])
async def get_cash_in(month: Optional[str] = None, year: Optional[int] = None):
    """Get cash in entries filtered by month/year"""
    query = {}
    if month:
        query["month"] = month
    if year:
        query["year"] = year
    
    entries = await db.cash_in.find(query, {"_id": 0}).sort("invoice_date", -1).to_list(1000)
    return entries

@router.put("/cashbook/cash-in/{entry_id}", response_model=CashInResponse)
async def update_cash_in(entry_id: str, data: CashInCreate):
    """Update a cash in entry with GST calculation"""
    entry = await db.cash_in.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    # Check if month is locked
    lock = await db.month_locks.find_one({"month": entry["month"], "year": entry["year"], "is_locked": True})
    if lock:
        raise HTTPException(status_code=400, detail=f"{entry['month']} {entry['year']} is locked. Cannot edit entries.")
    
    month, year = get_month_year_from_date(data.invoice_date)
    pending_balance = data.invoice_amount - data.amount_received
    
    # Auto-calculate GST amount if percentage is provided
    gst_amount = None
    if data.gst_percentage is not None and data.gst_percentage > 0:
        gst_amount = (data.invoice_amount * data.gst_percentage) / 100
    
    # Auto-update payment status based on amounts
    if data.amount_received >= data.invoice_amount:
        payment_status = PaymentStatus.PAID
    elif data.amount_received > 0:
        payment_status = PaymentStatus.PARTIAL
    else:
        payment_status = PaymentStatus.PENDING
    
    update_data = {
        "client_name": data.client_name,
        "invoice_number": data.invoice_number,
        "invoice_date": data.invoice_date,
        "invoice_amount": data.invoice_amount,
        "gst_percentage": data.gst_percentage,
        "gst_amount": gst_amount,
        "invoice_pdf_url": data.invoice_pdf_url,
        "payment_status": payment_status,
        "amount_received": data.amount_received,
        "pending_balance": pending_balance,
        "notes": data.notes,
        "month": month,
        "year": year
    }
    
    await db.cash_in.update_one({"id": entry_id}, {"$set": update_data})
    updated = await db.cash_in.find_one({"id": entry_id}, {"_id": 0})
    return CashInResponse(**updated)

@router.delete("/cashbook/cash-in/{entry_id}")
async def delete_cash_in(entry_id: str):
    """Delete a cash in entry"""
    entry = await db.cash_in.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    # Check if month is locked
    lock = await db.month_locks.find_one({"month": entry["month"], "year": entry["year"], "is_locked": True})
    if lock:
        raise HTTPException(status_code=400, detail=f"{entry['month']} {entry['year']} is locked. Cannot delete entries.")
    
    await db.cash_in.delete_one({"id": entry_id})
    return {"message": "Entry deleted"}

# --- Invoice PDF Upload ---

@router.post("/cashbook/upload-invoice")
async def upload_invoice(file: UploadFile = File(...)):
    """Upload invoice PDF (max 10MB)"""
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    if not file.content_type == "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    file_id = generate_id()
    file_path = f"/app/backend/uploads/invoices/{file_id}.pdf"
    
    os.makedirs("/app/backend/uploads/invoices", exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(contents)
    
    return {"file_id": file_id, "url": f"/api/cashbook/invoices/{file_id}"}

@router.get("/cashbook/invoices/{file_id}")
async def get_invoice_pdf(file_id: str):
    """Download invoice PDF"""
    from fastapi.responses import FileResponse
    file_path = f"/app/backend/uploads/invoices/{file_id}.pdf"
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return FileResponse(file_path, media_type="application/pdf", filename=f"invoice_{file_id}.pdf")

# --- Cash Out (Expenses) ---

@router.post("/cashbook/cash-out", response_model=CashOutResponse)
async def create_cash_out(data: CashOutCreate):
    """Create a manual cash out entry"""
    month, year = get_month_year_from_date(data.date)
    
    # Check if month is locked
    lock = await db.month_locks.find_one({"month": month, "year": year, "is_locked": True})
    if lock:
        raise HTTPException(status_code=400, detail=f"{month} {year} is locked. Cannot add entries.")
    
    cash_out_doc = {
        "id": generate_id(),
        "category": data.category,
        "description": data.description,
        "amount": data.amount,
        "date": data.date,
        "reference_id": data.reference_id,
        "reference_type": data.reference_type or "manual",
        "notes": data.notes,
        "created_at": get_utc_now_str(),
        "month": month,
        "year": year,
        "is_auto": False
    }
    
    await db.cash_out.insert_one(cash_out_doc)
    cash_out_doc.pop("_id", None)
    return CashOutResponse(**cash_out_doc)

@router.get("/cashbook/cash-out", response_model=List[CashOutResponse])
async def get_cash_out(month: Optional[str] = None, year: Optional[int] = None):
    """Get cash out entries filtered by month/year"""
    query = {}
    if month:
        query["month"] = month
    if year:
        query["year"] = year
    
    entries = await db.cash_out.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return entries

@router.put("/cashbook/cash-out/{entry_id}", response_model=CashOutResponse)
async def update_cash_out(entry_id: str, data: CashOutCreate):
    """Update a manual cash out entry (only non-auto entries)"""
    entry = await db.cash_out.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    if entry.get("is_auto"):
        raise HTTPException(status_code=400, detail="Cannot edit auto-generated entries")
    
    # Check if month is locked
    lock = await db.month_locks.find_one({"month": entry["month"], "year": entry["year"], "is_locked": True})
    if lock:
        raise HTTPException(status_code=400, detail=f"{entry['month']} {entry['year']} is locked. Cannot edit entries.")
    
    month, year = get_month_year_from_date(data.date)
    
    update_data = {
        "category": data.category,
        "description": data.description,
        "amount": data.amount,
        "date": data.date,
        "notes": data.notes,
        "month": month,
        "year": year
    }
    
    await db.cash_out.update_one({"id": entry_id}, {"$set": update_data})
    updated = await db.cash_out.find_one({"id": entry_id}, {"_id": 0})
    return CashOutResponse(**updated)

@router.delete("/cashbook/cash-out/{entry_id}")
async def delete_cash_out(entry_id: str):
    """Delete a manual cash out entry"""
    entry = await db.cash_out.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    if entry.get("is_auto"):
        raise HTTPException(status_code=400, detail="Cannot delete auto-generated entries")
    
    # Check if month is locked
    lock = await db.month_locks.find_one({"month": entry["month"], "year": entry["year"], "is_locked": True})
    if lock:
        raise HTTPException(status_code=400, detail=f"{entry['month']} {entry['year']} is locked. Cannot delete entries.")
    
    await db.cash_out.delete_one({"id": entry_id})
    return {"message": "Entry deleted"}

# --- Custom Categories ---

@router.get("/cashbook/categories")
async def get_categories():
    """Get all expense categories (predefined + custom)"""
    predefined = [
        {"id": "salary", "name": "Salary", "is_predefined": True},
        {"id": "bills", "name": "Bills & Reimbursements", "is_predefined": True},
        {"id": "audit_expenses", "name": "Audit Expenses", "is_predefined": True},
        {"id": "advances", "name": "Salary Advances", "is_predefined": True},
        {"id": "loan_emi", "name": "Loan EMI", "is_predefined": True},
        {"id": "credit_payable", "name": "Credit / Payable", "is_predefined": True},
        {"id": "rent", "name": "Rent", "is_predefined": True},
        {"id": "utilities", "name": "Utilities", "is_predefined": True},
        {"id": "office_supplies", "name": "Office Supplies", "is_predefined": True},
        {"id": "travel", "name": "Travel", "is_predefined": True},
        {"id": "marketing", "name": "Marketing", "is_predefined": True},
        {"id": "miscellaneous", "name": "Miscellaneous", "is_predefined": True},
    ]
    
    custom = await db.custom_categories.find({}, {"_id": 0}).to_list(100)
    for c in custom:
        c["is_predefined"] = False
    
    return predefined + custom

@router.post("/cashbook/categories", response_model=CustomCategoryResponse)
async def create_custom_category(data: CustomCategoryCreate):
    """Create a custom expense category"""
    cat_doc = {
        "id": generate_id(),
        "name": data.name,
        "description": data.description,
        "created_at": get_utc_now_str()
    }
    await db.custom_categories.insert_one(cat_doc)
    cat_doc.pop("_id", None)
    return CustomCategoryResponse(**cat_doc)

@router.delete("/cashbook/categories/{category_id}")
async def delete_custom_category(category_id: str):
    """Delete a custom category"""
    result = await db.custom_categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}

# --- Month Lock/Unlock ---

@router.get("/cashbook/locks")
async def get_month_locks(year: Optional[int] = None):
    """Get all month locks"""
    query = {}
    if year:
        query["year"] = year
    locks = await db.month_locks.find(query, {"_id": 0}).to_list(100)
    return locks

@router.post("/cashbook/lock")
async def lock_month(data: MonthLockCreate, locked_by: str):
    """Lock a month to prevent edits"""
    existing = await db.month_locks.find_one({"month": data.month, "year": data.year})
    
    if existing:
        await db.month_locks.update_one(
            {"month": data.month, "year": data.year},
            {"$set": {
                "is_locked": True,
                "locked_by": locked_by,
                "locked_at": get_utc_now_str()
            }}
        )
    else:
        lock_doc = {
            "id": generate_id(),
            "month": data.month,
            "year": data.year,
            "is_locked": True,
            "locked_by": locked_by,
            "locked_at": get_utc_now_str(),
            "unlocked_by": None,
            "unlocked_at": None
        }
        await db.month_locks.insert_one(lock_doc)
    
    return {"message": f"{data.month} {data.year} locked successfully"}

@router.post("/cashbook/unlock")
async def unlock_month(data: MonthLockCreate, unlocked_by: str):
    """Unlock a month to allow edits (Admin only)"""
    result = await db.month_locks.update_one(
        {"month": data.month, "year": data.year},
        {"$set": {
            "is_locked": False,
            "unlocked_by": unlocked_by,
            "unlocked_at": get_utc_now_str()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lock record not found")
    
    return {"message": f"{data.month} {data.year} unlocked successfully"}

# --- Cashbook Summary ---

@router.get("/cashbook/summary", response_model=CashbookSummary)
async def get_cashbook_summary(month: Optional[str] = None, year: int = None):
    """Get cashbook summary (totals, profit/loss)"""
    if not year:
        year = datetime.now().year
    
    cash_in_query = {"year": year}
    cash_out_query = {"year": year}
    
    if month:
        cash_in_query["month"] = month
        cash_out_query["month"] = month
    
    # Get Cash In total (only amount_received, not invoice_amount)
    cash_in_entries = await db.cash_in.find(cash_in_query, {"_id": 0}).to_list(10000)
    total_cash_in = sum(entry.get("amount_received", 0) for entry in cash_in_entries)
    
    # Get Cash Out total
    cash_out_entries = await db.cash_out.find(cash_out_query, {"_id": 0}).to_list(10000)
    total_cash_out = sum(entry.get("amount", 0) for entry in cash_out_entries)
    
    # Check if locked
    lock_query = {"year": year, "is_locked": True}
    if month:
        lock_query["month"] = month
    is_locked = await db.month_locks.count_documents(lock_query) > 0
    
    return CashbookSummary(
        month=month,
        year=year,
        total_cash_in=round(total_cash_in, 2),
        total_cash_out=round(total_cash_out, 2),
        net_profit_loss=round(total_cash_in - total_cash_out, 2),
        is_locked=is_locked
    )

# --- Cashbook Exports ---

@router.get("/export/cashbook")
async def export_cashbook(month: Optional[str] = None, year: Optional[int] = None):
    """Export cashbook report to CSV"""
    cash_in_query = {}
    cash_out_query = {}
    
    if month:
        cash_in_query["month"] = month
        cash_out_query["month"] = month
    if year:
        cash_in_query["year"] = year
        cash_out_query["year"] = year
    
    cash_in_entries = await db.cash_in.find(cash_in_query, {"_id": 0}).sort("invoice_date", 1).to_list(10000)
    cash_out_entries = await db.cash_out.find(cash_out_query, {"_id": 0}).sort("date", 1).to_list(10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Cash In Section
    writer.writerow(["=== CASH IN (INCOME) ==="])
    writer.writerow(["Date", "Client Name", "Invoice No", "Invoice Amount", "Amount Received", "Pending Balance", "Status"])
    
    total_in = 0
    for entry in cash_in_entries:
        writer.writerow([
            entry.get("invoice_date", ""),
            entry.get("client_name", ""),
            entry.get("invoice_number", ""),
            entry.get("invoice_amount", 0),
            entry.get("amount_received", 0),
            entry.get("pending_balance", 0),
            entry.get("payment_status", "")
        ])
        total_in += entry.get("amount_received", 0)
    
    writer.writerow(["", "", "", "", f"Total: {total_in}", "", ""])
    writer.writerow([])
    
    # Cash Out Section
    writer.writerow(["=== CASH OUT (EXPENSES) ==="])
    writer.writerow(["Date", "Category", "Description", "Amount", "Reference Type", "Notes"])
    
    total_out = 0
    for entry in cash_out_entries:
        writer.writerow([
            entry.get("date", ""),
            entry.get("category", ""),
            entry.get("description", ""),
            entry.get("amount", 0),
            entry.get("reference_type", ""),
            entry.get("notes", "")
        ])
        total_out += entry.get("amount", 0)
    
    writer.writerow(["", "", f"Total:", total_out, "", ""])
    writer.writerow([])
    
    # Summary
    writer.writerow(["=== SUMMARY ==="])
    writer.writerow(["Total Cash In", total_in])
    writer.writerow(["Total Cash Out", total_out])
    writer.writerow(["Net Profit/Loss", total_in - total_out])
    
    output.seek(0)
    period = f"{month}_{year}" if month else f"Year_{year}"
    filename = f"cashbook_{period}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/invoices")
async def export_invoices(month: Optional[str] = None, year: Optional[int] = None):
    """Export invoice details to CSV"""
    query = {}
    if month:
        query["month"] = month
    if year:
        query["year"] = year
    
    invoices = await db.cash_in.find(query, {"_id": 0}).sort("invoice_date", -1).to_list(10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Invoice Date", "Client Name", "Invoice Number", "Invoice Amount",
        "Payment Status", "Amount Received", "Pending Balance", "Has PDF", "Notes"
    ])
    
    for inv in invoices:
        writer.writerow([
            inv.get("invoice_date", ""),
            inv.get("client_name", ""),
            inv.get("invoice_number", ""),
            inv.get("invoice_amount", 0),
            inv.get("payment_status", ""),
            inv.get("amount_received", 0),
            inv.get("pending_balance", 0),
            "Yes" if inv.get("invoice_pdf_url") else "No",
            inv.get("notes", "")
        ])
    
    output.seek(0)
    period = f"{month}_{year}" if month else f"Year_{year}"
    filename = f"invoices_{period}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/invoices-zip")
async def export_invoices_zip(month: Optional[str] = None, year: Optional[int] = None):
    """Export all invoice PDFs as a ZIP file"""
    query = {"invoice_pdf_url": {"$ne": None}}
    if month:
        query["month"] = month
    if year:
        query["year"] = year
    
    invoices = await db.cash_in.find(query, {"_id": 0}).to_list(10000)
    
    if not invoices:
        raise HTTPException(status_code=404, detail="No invoices with PDFs found")
    
    # Create ZIP in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for inv in invoices:
            pdf_url = inv.get("invoice_pdf_url", "")
            if pdf_url:
                file_id = pdf_url.split("/")[-1]
                file_path = f"/app/backend/uploads/invoices/{file_id}.pdf"
                if os.path.exists(file_path):
                    invoice_name = f"{inv.get('client_name', 'Unknown')}_{inv.get('invoice_number', 'Unknown')}.pdf"
                    invoice_name = invoice_name.replace(" ", "_").replace("/", "_")
                    zip_file.write(file_path, invoice_name)
    
    zip_buffer.seek(0)
    period = f"{month}_{year}" if month else f"Year_{year}"
    filename = f"invoices_pdfs_{period}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    
    return StreamingResponse(
        iter([zip_buffer.getvalue()]),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# --- Auto-Integration Helper Function ---

async def create_auto_cash_out(
    category: str,
    description: str,
    amount: float,
    date: str,
    reference_id: str,
    reference_type: str,
    month: str = None,
    year: int = None
):
    """Helper to create auto cash out entry from other modules"""
    # Use provided month/year or extract from date
    if month is None or year is None:
        month, year = get_month_year_from_date(date)
    
    # Check if entry already exists (prevent duplicates)
    existing = await db.cash_out.find_one({
        "reference_id": reference_id,
        "reference_type": reference_type
    })
    if existing:
        return  # Already exists
    
    cash_out_doc = {
        "id": generate_id(),
        "category": category,
        "description": description,
        "amount": amount,
        "date": date,
        "reference_id": reference_id,
        "reference_type": reference_type,
        "notes": f"Auto-generated from {reference_type}",
        "created_at": get_utc_now_str(),
        "month": month,
        "year": year,
        "is_auto": True
    }
    
    await db.cash_out.insert_one(cash_out_doc)



# ==================== LOAN / EMI ROUTES ====================

def calculate_emi_split(principal_remaining: float, annual_rate: float, emi_amount: float):
    """Calculate principal and interest split for an EMI payment"""
    if not annual_rate or annual_rate <= 0:
        return emi_amount, 0  # No interest, full principal
    
    monthly_rate = annual_rate / 12 / 100
    interest_amount = round(principal_remaining * monthly_rate, 2)
    principal_amount = round(emi_amount - interest_amount, 2)
    
    # Ensure principal doesn't go negative
    if principal_amount < 0:
        principal_amount = 0
        interest_amount = emi_amount
    
    return principal_amount, interest_amount


@router.post("/loans", response_model=LoanResponse)
async def create_loan(data: LoanCreate):
    """Create a new loan entry (EMI-based or Lump Sum)"""
    # Validate EMI fields are provided for EMI-based loans
    if data.loan_type == LoanType.EMI_BASED:
        if not data.emi_amount or not data.emi_day:
            raise HTTPException(status_code=400, detail="EMI amount and EMI day are required for EMI-based loans")
    
    loan_doc = {
        "id": f"LOAN{generate_id()}",
        "loan_name": data.loan_name,
        "lender_name": data.lender_name,
        "total_loan_amount": data.total_loan_amount,
        "loan_type": data.loan_type,
        "loan_start_date": data.loan_start_date,
        "total_paid": 0,
        "remaining_balance": data.total_loan_amount,
        "emis_paid": 0,
        "status": LoanStatus.ACTIVE,
        "notes": data.notes,
        "created_at": get_utc_now_str()
    }
    
    # Add EMI-specific fields only for EMI-based loans
    if data.loan_type == LoanType.EMI_BASED:
        loan_doc["emi_amount"] = data.emi_amount
        loan_doc["emi_day"] = min(max(data.emi_day, 1), 28)  # Ensure 1-28
        loan_doc["interest_rate"] = data.interest_rate
        loan_doc["loan_tenure_months"] = data.loan_tenure_months
    else:
        # Lump sum loan specific fields
        loan_doc["due_date"] = data.due_date
        loan_doc["emi_amount"] = None
        loan_doc["emi_day"] = None
        loan_doc["interest_rate"] = None
        loan_doc["loan_tenure_months"] = None
    
    await db.loans.insert_one(loan_doc)
    loan_doc.pop("_id", None)
    return LoanResponse(**loan_doc)


@router.get("/loans", response_model=List[LoanResponse])
async def get_loans(status: Optional[str] = None):
    """Get all loans, optionally filtered by status"""
    query = {}
    if status:
        query["status"] = status
    
    loans = await db.loans.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return loans


@router.get("/loans/summary", response_model=LoanSummary)
async def get_loan_summary():
    """Get overall loan summary"""
    loans = await db.loans.find({}, {"_id": 0}).to_list(100)
    
    active_loans = [l for l in loans if l.get("status") == LoanStatus.ACTIVE]
    
    # Calculate upcoming EMIs for current month
    current_day = datetime.now().day
    upcoming_emis = sum(
        l["emi_amount"] for l in active_loans 
        if l.get("emi_day", 0) >= current_day
    )
    
    return LoanSummary(
        total_loans=len(loans),
        active_loans=len(active_loans),
        total_loan_amount=sum(l.get("total_loan_amount", 0) for l in loans),
        total_paid=sum(l.get("total_paid", 0) for l in loans),
        total_remaining=sum(l.get("remaining_balance", 0) for l in active_loans),
        upcoming_emis_this_month=upcoming_emis
    )


@router.get("/loans/{loan_id}", response_model=LoanResponse)
async def get_loan(loan_id: str):
    """Get a single loan by ID"""
    loan = await db.loans.find_one({"id": loan_id}, {"_id": 0})
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan


@router.put("/loans/{loan_id}", response_model=LoanResponse)
async def update_loan(loan_id: str, data: LoanCreate):
    """Update loan details (only if no payments made yet)"""
    loan = await db.loans.find_one({"id": loan_id}, {"_id": 0})
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    if loan.get("total_paid", 0) > 0:
        raise HTTPException(status_code=400, detail="Cannot edit loan after payments have been made")
    
    # Validate EMI fields for EMI-based loans
    if data.loan_type == LoanType.EMI_BASED:
        if not data.emi_amount or not data.emi_day:
            raise HTTPException(status_code=400, detail="EMI amount and EMI day are required for EMI-based loans")
    
    update_data = {
        "loan_name": data.loan_name,
        "lender_name": data.lender_name,
        "total_loan_amount": data.total_loan_amount,
        "loan_type": data.loan_type,
        "loan_start_date": data.loan_start_date,
        "remaining_balance": data.total_loan_amount,
        "notes": data.notes
    }
    
    # Add type-specific fields
    if data.loan_type == LoanType.EMI_BASED:
        update_data.update({
            "emi_amount": data.emi_amount,
            "emi_day": min(max(data.emi_day, 1), 28),
            "interest_rate": data.interest_rate,
            "loan_tenure_months": data.loan_tenure_months,
            "due_date": None
        })
    else:
        update_data.update({
            "due_date": data.due_date,
            "emi_amount": None,
            "emi_day": None,
            "interest_rate": None,
            "loan_tenure_months": None
        })
    
    await db.loans.update_one({"id": loan_id}, {"$set": update_data})
    updated = await db.loans.find_one({"id": loan_id}, {"_id": 0})
    return LoanResponse(**updated)


@router.delete("/loans/{loan_id}")
async def delete_loan(loan_id: str):
    """Delete a loan (only if no EMIs paid)"""
    loan = await db.loans.find_one({"id": loan_id}, {"_id": 0})
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    if loan.get("emis_paid", 0) > 0:
        raise HTTPException(status_code=400, detail="Cannot delete loan with EMI payments")
    
    await db.loans.delete_one({"id": loan_id})
    return {"message": "Loan deleted"}


@router.post("/loans/{loan_id}/pay-emi", response_model=EMIPaymentResponse)
async def record_emi_payment(loan_id: str, data: EMIPaymentCreate):
    """Record an EMI payment (regular or extra payment)"""
    loan = await db.loans.find_one({"id": loan_id}, {"_id": 0})
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    if loan.get("status") != LoanStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Loan is already closed")
    
    # Calculate principal/interest split if not provided
    principal_amount = data.principal_amount
    interest_amount = data.interest_amount
    
    if principal_amount is None or interest_amount is None:
        principal_amount, interest_amount = calculate_emi_split(
            loan["remaining_balance"],
            loan.get("interest_rate"),
            data.amount
        )
    
    # Calculate new balance
    new_balance = max(0, loan["remaining_balance"] - principal_amount)
    new_total_paid = loan.get("total_paid", 0) + data.amount
    new_emis_paid = loan.get("emis_paid", 0) + (0 if data.is_extra_payment else 1)
    
    # Check if loan is now closed
    new_status = LoanStatus.ACTIVE
    if new_balance <= 0:
        new_status = LoanStatus.PRECLOSED if data.is_extra_payment else LoanStatus.CLOSED
    
    # Get month/year from payment date
    month, year = get_month_year_from_date(data.payment_date)
    
    # Create EMI payment record
    emi_doc = {
        "id": f"EMI{generate_id()}",
        "loan_id": loan_id,
        "loan_name": loan["loan_name"],
        "payment_date": data.payment_date,
        "amount": data.amount,
        "principal_amount": principal_amount,
        "interest_amount": interest_amount,
        "is_extra_payment": data.is_extra_payment,
        "is_auto_generated": False,
        "balance_after_payment": new_balance,
        "notes": data.notes,
        "created_at": get_utc_now_str(),
        "month": month,
        "year": year
    }
    
    await db.emi_payments.insert_one(emi_doc)
    
    # Update loan balance
    await db.loans.update_one(
        {"id": loan_id},
        {"$set": {
            "remaining_balance": new_balance,
            "total_paid": new_total_paid,
            "emis_paid": new_emis_paid,
            "status": new_status
        }}
    )
    
    # Create auto Cash Out entry for EMI
    payment_type = "Extra Payment" if data.is_extra_payment else "EMI"
    await create_auto_cash_out(
        category="loan_emi",
        description=f"Loan {payment_type} - {loan['loan_name']} ({loan['lender_name']})",
        amount=data.amount,
        date=data.payment_date,
        reference_id=emi_doc["id"],
        reference_type="emi_payment"
    )
    
    emi_doc.pop("_id", None)
    return EMIPaymentResponse(**emi_doc)



@router.post("/loans/{loan_id}/pay-lumpsum", response_model=EMIPaymentResponse)
async def record_lumpsum_payment(loan_id: str, data: EMIPaymentCreate):
    """Record a lump sum payment for personal loans"""
    loan = await db.loans.find_one({"id": loan_id}, {"_id": 0})
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    if loan.get("status") != LoanStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Loan is already closed")
    
    if loan.get("loan_type") != LoanType.LUMP_SUM:
        raise HTTPException(status_code=400, detail="This endpoint is for lump sum loans only. Use /pay-emi for EMI-based loans.")
    
    # For lump sum, entire amount goes to principal
    principal_amount = data.amount
    interest_amount = 0
    
    # Calculate new balance
    new_balance = max(0, loan["remaining_balance"] - principal_amount)
    new_total_paid = loan.get("total_paid", 0) + data.amount
    
    # Check if loan is now fully paid
    new_status = LoanStatus.CLOSED if new_balance <= 0 else LoanStatus.ACTIVE
    
    # Get month/year from payment date
    month, year = get_month_year_from_date(data.payment_date)
    
    # Create payment record
    payment_doc = {
        "id": f"LUMP{generate_id()}",
        "loan_id": loan_id,
        "loan_name": loan["loan_name"],
        "payment_date": data.payment_date,
        "amount": data.amount,
        "principal_amount": principal_amount,
        "interest_amount": interest_amount,
        "is_extra_payment": False,
        "is_auto_generated": False,
        "balance_after_payment": new_balance,
        "notes": data.notes,
        "created_at": get_utc_now_str(),
        "month": month,
        "year": year
    }
    
    await db.emi_payments.insert_one(payment_doc)
    
    # Update loan balance and status
    await db.loans.update_one(
        {"id": loan_id},
        {"$set": {
            "remaining_balance": new_balance,
            "total_paid": new_total_paid,
            "status": new_status
        }}
    )
    
    # Create auto Cash Out entry
    await create_auto_cash_out(
        category="loan_payment",
        description=f"Lump Sum Payment - {loan['loan_name']} ({loan['lender_name']})",
        amount=data.amount,
        date=data.payment_date,
        reference_id=payment_doc["id"],
        reference_type="lumpsum_payment"
    )
    
    payment_doc.pop("_id", None)
    return EMIPaymentResponse(**payment_doc)


@router.get("/loans/{loan_id}/payments", response_model=List[EMIPaymentResponse])
async def get_loan_payments(loan_id: str):
    """Get all EMI payments for a loan"""
    payments = await db.emi_payments.find(
        {"loan_id": loan_id}, {"_id": 0}
    ).sort("payment_date", -1).to_list(500)
    return payments


@router.get("/emi-payments", response_model=List[EMIPaymentResponse])
async def get_all_emi_payments(month: Optional[str] = None, year: Optional[int] = None):
    """Get all EMI payments, optionally filtered by month/year"""
    query = {}
    if month:
        query["month"] = month
    if year:
        query["year"] = year
    
    payments = await db.emi_payments.find(query, {"_id": 0}).sort("payment_date", -1).to_list(1000)
    return payments


@router.post("/loans/{loan_id}/preclose")
async def preclose_loan(loan_id: str, payment_date: str, final_amount: float, notes: Optional[str] = None):
    """Pre-close a loan with final payment"""
    loan = await db.loans.find_one({"id": loan_id}, {"_id": 0})
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    if loan.get("status") != LoanStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Loan is already closed")
    
    # Record final payment
    month, year = get_month_year_from_date(payment_date)
    
    emi_doc = {
        "id": f"EMI{generate_id()}",
        "loan_id": loan_id,
        "loan_name": loan["loan_name"],
        "payment_date": payment_date,
        "amount": final_amount,
        "principal_amount": final_amount,
        "interest_amount": 0,
        "is_extra_payment": True,
        "is_auto_generated": False,
        "balance_after_payment": 0,
        "notes": notes or "Pre-closure payment",
        "created_at": get_utc_now_str(),
        "month": month,
        "year": year
    }
    
    await db.emi_payments.insert_one(emi_doc)
    
    # Update loan status
    await db.loans.update_one(
        {"id": loan_id},
        {"$set": {
            "remaining_balance": 0,
            "total_paid": loan.get("total_paid", 0) + final_amount,
            "status": LoanStatus.PRECLOSED
        }}
    )
    
    # Create Cash Out entry
    await create_auto_cash_out(
        category="loan_emi",
        description=f"Loan Pre-closure - {loan['loan_name']} ({loan['lender_name']})",
        amount=final_amount,
        date=payment_date,
        reference_id=emi_doc["id"],
        reference_type="emi_payment"
    )
    
    return {"message": "Loan pre-closed successfully", "final_payment": final_amount}


@router.get("/export/loans")
async def export_loans():
    """Export loan details to CSV"""
    loans = await db.loans.find({}, {"_id": 0}).to_list(100)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Loan ID", "Loan Name", "Lender", "Total Amount", "EMI Amount", "EMI Day",
        "Interest Rate (%)", "Tenure (Months)", "Total Paid", "Remaining Balance",
        "EMIs Paid", "Status", "Start Date", "Created At"
    ])
    
    for loan in loans:
        writer.writerow([
            loan.get("id", ""),
            loan.get("loan_name", ""),
            loan.get("lender_name", ""),
            loan.get("total_loan_amount", 0),
            loan.get("emi_amount", 0),
            loan.get("emi_day", ""),
            loan.get("interest_rate", "N/A"),
            loan.get("loan_tenure_months", "N/A"),
            loan.get("total_paid", 0),
            loan.get("remaining_balance", 0),
            loan.get("emis_paid", 0),
            loan.get("status", ""),
            loan.get("loan_start_date", ""),
            loan.get("created_at", "")[:10]
        ])
    
    output.seek(0)
    filename = f"loans_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/emi-payments")
async def export_emi_payments(month: Optional[str] = None, year: Optional[int] = None):
    """Export EMI payments to CSV"""
    query = {}
    if month:
        query["month"] = month
    if year:
        query["year"] = year
    
    payments = await db.emi_payments.find(query, {"_id": 0}).sort("payment_date", -1).to_list(1000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Payment ID", "Loan Name", "Payment Date", "Amount", "Principal", "Interest",
        "Balance After", "Payment Type", "Month", "Year", "Notes"
    ])
    
    for payment in payments:
        payment_type = "Extra Payment" if payment.get("is_extra_payment") else "Regular EMI"
        writer.writerow([
            payment.get("id", ""),
            payment.get("loan_name", ""),
            payment.get("payment_date", ""),
            payment.get("amount", 0),
            payment.get("principal_amount", "N/A"),
            payment.get("interest_amount", "N/A"),
            payment.get("balance_after_payment", 0),
            payment_type,
            payment.get("month", ""),
            payment.get("year", ""),
            payment.get("notes", "")
        ])
    
    period = f"{month}_{year}" if month and year else "all"
    output.seek(0)
    filename = f"emi_payments_{period}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )



# ==================== PAYABLE / CREDIT ROUTES ====================

@router.post("/payables", response_model=PayableResponse)
async def create_payable(data: PayableCreate):
    """Create a new payable/credit entry"""
    payable_doc = {
        "id": f"PAY{generate_id()}",
        "creditor_name": data.creditor_name,
        "total_amount": data.total_amount,
        "due_date": data.due_date,
        "description": data.description,
        "amount_paid": 0,
        "remaining_balance": data.total_amount,
        "status": PayableStatus.PENDING,
        "notes": data.notes,
        "created_at": get_utc_now_str()
    }
    
    await db.payables.insert_one(payable_doc)
    payable_doc.pop("_id", None)
    return PayableResponse(**payable_doc)


@router.get("/payables", response_model=List[PayableResponse])
async def get_payables(status: Optional[str] = None):
    """Get all payables, optionally filtered by status"""
    query = {}
    if status:
        query["status"] = status
    
    payables = await db.payables.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return payables


@router.get("/payables/summary", response_model=PayableSummary)
async def get_payable_summary():
    """Get overall payable summary"""
    payables = await db.payables.find({}, {"_id": 0}).to_list(100)
    
    pending = [p for p in payables if p.get("status") in [PayableStatus.PENDING, PayableStatus.PARTIAL]]
    
    return PayableSummary(
        total_payables=len(payables),
        pending_payables=len(pending),
        total_payable_amount=sum(p.get("total_amount", 0) for p in payables),
        total_paid=sum(p.get("amount_paid", 0) for p in payables),
        total_remaining=sum(p.get("remaining_balance", 0) for p in pending)
    )


@router.get("/payables/{payable_id}", response_model=PayableResponse)
async def get_payable(payable_id: str):
    """Get a single payable by ID"""
    payable = await db.payables.find_one({"id": payable_id}, {"_id": 0})
    if not payable:
        raise HTTPException(status_code=404, detail="Payable not found")
    return payable


@router.put("/payables/{payable_id}", response_model=PayableResponse)
async def update_payable(payable_id: str, data: PayableCreate):
    """Update payable details (only if no payments made)"""
    payable = await db.payables.find_one({"id": payable_id}, {"_id": 0})
    if not payable:
        raise HTTPException(status_code=404, detail="Payable not found")
    
    if payable.get("amount_paid", 0) > 0:
        raise HTTPException(status_code=400, detail="Cannot edit payable after payments have been made")
    
    update_data = {
        "creditor_name": data.creditor_name,
        "total_amount": data.total_amount,
        "due_date": data.due_date,
        "description": data.description,
        "remaining_balance": data.total_amount,
        "notes": data.notes
    }
    
    await db.payables.update_one({"id": payable_id}, {"$set": update_data})
    updated = await db.payables.find_one({"id": payable_id}, {"_id": 0})
    return PayableResponse(**updated)


@router.delete("/payables/{payable_id}")
async def delete_payable(payable_id: str):
    """Delete a payable (only if no payments made)"""
    payable = await db.payables.find_one({"id": payable_id}, {"_id": 0})
    if not payable:
        raise HTTPException(status_code=404, detail="Payable not found")
    
    if payable.get("amount_paid", 0) > 0:
        raise HTTPException(status_code=400, detail="Cannot delete payable with payments")
    
    await db.payables.delete_one({"id": payable_id})
    return {"message": "Payable deleted"}


@router.post("/payables/{payable_id}/pay", response_model=PayablePaymentResponse)
async def record_payable_payment(payable_id: str, data: PayablePaymentCreate):
    """Record a payment for a payable"""
    payable = await db.payables.find_one({"id": payable_id}, {"_id": 0})
    if not payable:
        raise HTTPException(status_code=404, detail="Payable not found")
    
    if payable.get("status") == PayableStatus.PAID:
        raise HTTPException(status_code=400, detail="Payable is already fully paid")
    
    # Calculate new balance
    new_balance = max(0, payable["remaining_balance"] - data.amount)
    new_total_paid = payable.get("amount_paid", 0) + data.amount
    
    # Determine new status
    new_status = PayableStatus.PENDING
    if new_balance <= 0:
        new_status = PayableStatus.PAID
    elif new_total_paid > 0:
        new_status = PayableStatus.PARTIAL
    
    # Get month/year from payment date
    month, year = get_month_year_from_date(data.payment_date)
    
    # Create payment record
    payment_doc = {
        "id": f"PAYPMT{generate_id()}",
        "payable_id": payable_id,
        "creditor_name": payable["creditor_name"],
        "payment_date": data.payment_date,
        "amount": data.amount,
        "balance_after_payment": new_balance,
        "notes": data.notes,
        "created_at": get_utc_now_str(),
        "month": month,
        "year": year
    }
    
    await db.payable_payments.insert_one(payment_doc)
    
    # Update payable balance
    await db.payables.update_one(
        {"id": payable_id},
        {"$set": {
            "remaining_balance": new_balance,
            "amount_paid": new_total_paid,
            "status": new_status
        }}
    )
    
    # Create auto Cash Out entry
    await create_auto_cash_out(
        category="credit_payable",
        description=f"Payment to {payable['creditor_name']}" + (f" - {payable.get('description', '')}" if payable.get('description') else ""),
        amount=data.amount,
        date=data.payment_date,
        reference_id=payment_doc["id"],
        reference_type="payable_payment"
    )
    
    payment_doc.pop("_id", None)
    return PayablePaymentResponse(**payment_doc)


@router.get("/payables/{payable_id}/payments", response_model=List[PayablePaymentResponse])
async def get_payable_payments(payable_id: str):
    """Get all payments for a payable"""
    payments = await db.payable_payments.find(
        {"payable_id": payable_id}, {"_id": 0}
    ).sort("payment_date", -1).to_list(100)
    return payments


@router.get("/payable-payments", response_model=List[PayablePaymentResponse])
async def get_all_payable_payments(month: Optional[str] = None, year: Optional[int] = None):
    """Get all payable payments, optionally filtered by month/year"""
    query = {}
    if month:
        query["month"] = month
    if year:
        query["year"] = year
    
    payments = await db.payable_payments.find(query, {"_id": 0}).sort("payment_date", -1).to_list(500)
    return payments


@router.get("/export/payables")
async def export_payables():
    """Export payable details to CSV"""
    payables = await db.payables.find({}, {"_id": 0}).to_list(100)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Payable ID", "Creditor Name", "Description", "Total Amount", "Amount Paid",
        "Remaining Balance", "Due Date", "Status", "Created At"
    ])
    
    for p in payables:
        writer.writerow([
            p.get("id", ""),
            p.get("creditor_name", ""),
            p.get("description", ""),
            p.get("total_amount", 0),
            p.get("amount_paid", 0),
            p.get("remaining_balance", 0),
            p.get("due_date", "N/A"),
            p.get("status", ""),
            p.get("created_at", "")[:10]
        ])
    
    output.seek(0)
    filename = f"payables_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
