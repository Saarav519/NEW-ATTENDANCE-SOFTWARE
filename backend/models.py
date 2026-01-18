from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum
import uuid

def generate_id():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    TEAMLEAD = "teamlead"
    EMPLOYEE = "employee"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class LeaveStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class BillStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class PayslipStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    SETTLED = "settled"

class ShiftType(str, Enum):
    DAY = "day"
    NIGHT = "night"

class AttendanceStatus(str, Enum):
    FULL_DAY = "full_day"
    HALF_DAY = "half_day"
    ABSENT = "absent"
    PRESENT = "present"  # Legacy status

# User Models
class UserBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    role: UserRole
    department: Optional[str] = None
    designation: Optional[str] = None
    joining_date: Optional[str] = None
    salary: float = 0
    salary_type: str = "monthly"
    status: UserStatus = UserStatus.ACTIVE
    team_lead_id: Optional[str] = None
    team_members: Optional[List[str]] = []

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str

class UserLogin(BaseModel):
    user_id: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    user: Optional[UserResponse] = None
    token: Optional[str] = None
    error: Optional[str] = None

# QR Code Models
class QRCodeBase(BaseModel):
    location: str
    conveyance_amount: float
    date: str  # YYYY-MM-DD format
    created_by: str  # Team lead ID
    shift_type: ShiftType = ShiftType.DAY
    shift_start: str = "10:00"  # HH:MM format (24-hour)
    shift_end: str = "19:00"    # HH:MM format (24-hour)

class QRCodeCreate(QRCodeBase):
    pass

class QRCodeResponse(QRCodeBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    qr_data: str  # The actual QR code data string
    created_at: str
    is_active: bool = True

# Attendance Models
class AttendanceBase(BaseModel):
    emp_id: str
    date: str
    punch_in: Optional[str] = None
    punch_out: Optional[str] = None
    status: str = "absent"  # Legacy field
    attendance_status: AttendanceStatus = AttendanceStatus.ABSENT  # New: full_day, half_day, absent
    work_hours: float = 0
    qr_code_id: Optional[str] = None
    location: Optional[str] = None
    conveyance_amount: float = 0
    shift_type: Optional[ShiftType] = None
    shift_start: Optional[str] = None
    shift_end: Optional[str] = None

class AttendanceCreate(BaseModel):
    qr_data: str  # QR code data scanned by employee

class AttendancePunchOut(BaseModel):
    emp_id: str
    date: str

class AttendanceResponse(AttendanceBase):
    model_config = ConfigDict(extra="ignore")
    id: str

# Leave Models
class LeaveBase(BaseModel):
    emp_id: str
    emp_name: str
    type: str
    from_date: str
    to_date: str
    days: int
    reason: str

class LeaveCreate(LeaveBase):
    pass

class LeaveResponse(LeaveBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    status: LeaveStatus = LeaveStatus.PENDING
    applied_on: str

# Bill Submission Models
class BillItemBase(BaseModel):
    date: str
    location: str
    description: str
    amount: float
    has_attachment: bool = False
    attachment_url: Optional[str] = None

class BillSubmissionBase(BaseModel):
    emp_id: str
    emp_name: str
    month: str  # e.g., "December 2025"
    year: int
    items: List[BillItemBase] = []
    total_amount: float = 0
    remarks: Optional[str] = None

class BillSubmissionCreate(BaseModel):
    items: List[BillItemBase]
    month: str
    year: int
    remarks: Optional[str] = None

class BillSubmissionResponse(BillSubmissionBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    status: BillStatus = BillStatus.PENDING
    submitted_on: str
    approved_amount: float = 0
    approved_by: Optional[str] = None
    approved_on: Optional[str] = None

# Salary Breakdown Model
class SalaryBreakdown(BaseModel):
    basic: float = 0
    hra: float = 0
    special_allowance: float = 0
    conveyance: float = 0
    leave_adjustment: float = 0
    extra_conveyance: float = 0  # From approved bill submissions
    previous_pending_allowances: float = 0
    attendance_adjustment: float = 0  # New: Deduction for half days/absents
    full_days: int = 0  # New: Count of full days
    half_days: int = 0  # New: Count of half days
    absent_days: int = 0  # New: Count of absent days
    gross_pay: float = 0
    deductions: float = 0
    net_pay: float = 0

# Payslip Models
class PayslipBase(BaseModel):
    emp_id: str
    emp_name: str
    month: str
    year: int
    breakdown: SalaryBreakdown

class PayslipCreate(BaseModel):
    emp_id: str
    month: str
    year: int

class PayslipResponse(PayslipBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    status: PayslipStatus
    created_on: str
    paid_on: Optional[str] = None
    settled_on: Optional[str] = None

# Holiday Models
class HolidayBase(BaseModel):
    name: str
    date: str
    type: str  # National, Festival, etc.

class HolidayCreate(HolidayBase):
    pass

class HolidayResponse(HolidayBase):
    model_config = ConfigDict(extra="ignore")
    id: str

# Business Info Model
class BusinessInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "1"
    name: str = "Audix Solutions & Co."
    type: str = "Information Technology"
    email: str = "admin@audixsolutions.com"
    phone: str = "+91 98765 43210"
    address: str = "Bangalore, India"

# Profile Update Model
class ProfileUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    bank_account: Optional[str] = None
    bank_ifsc: Optional[str] = None

# Leave Balance Model
class LeaveBalance(BaseModel):
    casual_leave: int = 12
    sick_leave: int = 6
    vacation: int = 15
    casual_used: int = 0
    sick_used: int = 0
    vacation_used: int = 0

class LeaveBalanceResponse(LeaveBalance):
    emp_id: str
    year: int

# Salary Advance Models
class AdvanceStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    DISBURSED = "disbursed"

class SalaryAdvanceCreate(BaseModel):
    emp_id: str
    emp_name: str
    amount: float
    reason: str
    repayment_months: int = 3  # Number of months to repay

class SalaryAdvanceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    emp_id: str
    emp_name: str
    amount: float
    reason: str
    repayment_months: int
    monthly_deduction: float
    status: AdvanceStatus
    requested_on: str
    approved_by: Optional[str] = None
    approved_on: Optional[str] = None

# Shift Template Models
class ShiftTemplateCreate(BaseModel):
    name: str
    shift_type: ShiftType
    shift_start: str
    shift_end: str
    grace_period_minutes: int = 30
    half_day_cutoff_hours: int = 3
    default_conveyance: float = 0

class ShiftTemplateResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    shift_type: ShiftType
    shift_start: str
    shift_end: str
    grace_period_minutes: int
    half_day_cutoff_hours: int
    default_conveyance: float
    is_active: bool = True
    created_by: str
    created_at: str

# Bulk Action Models
class BulkApproveRequest(BaseModel):
    ids: List[str]
    approved_by: str

class BulkRejectRequest(BaseModel):
    ids: List[str]
    rejected_by: str
    reason: Optional[str] = None
