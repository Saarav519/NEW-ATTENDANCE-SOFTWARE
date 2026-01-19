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
    REVALIDATION = "revalidation"

class PayslipStatus(str, Enum):
    PREVIEW = "preview"      # Auto-calculated, viewable but not downloadable
    GENERATED = "generated"  # Admin generated, downloadable, in reports/cashbook
    SETTLED = "settled"      # Marked as paid

class ShiftType(str, Enum):
    DAY = "day"
    NIGHT = "night"

class AttendanceStatus(str, Enum):
    FULL_DAY = "full_day"
    HALF_DAY = "half_day"
    ABSENT = "absent"
    PRESENT = "present"  # Legacy status
    LEAVE = "leave"  # Approved leave

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
    team_lead_id: Optional[str] = None  # Assigned Team Leader ID
    team_members: Optional[List[str]] = []
    # Bank Details (Mandatory)
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None

class UserCreate(UserBase):
    id: Optional[str] = None  # Allow manual employee ID
    password: str
    # Bank details mandatory for new employees
    bank_name: str
    bank_account_number: str
    bank_ifsc: str

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

# Team Leader Change History
class TeamLeaderChangeHistory(BaseModel):
    emp_id: str
    old_team_leader_id: Optional[str] = None
    old_team_leader_name: Optional[str] = None
    new_team_leader_id: str
    new_team_leader_name: str
    changed_by: str
    changed_at: str
    reason: Optional[str] = None

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
    daily_duty_amount: float = 0  # Daily duty based on attendance status
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
    attendance_adjustment: float = 0  # Deduction for half days/absents
    full_days: int = 0  # Count of full days (includes approved leave days)
    half_days: int = 0  # Count of half days
    absent_days: int = 0  # Count of absent days
    leave_days: int = 0  # Count of approved leave days
    total_duty_earned: float = 0  # Total daily duty amount earned
    audit_expenses: float = 0  # Approved audit expense reimbursements
    advance_deduction: float = 0  # Salary advance deduction
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
    total_leave: int = 0  # Accrued based on working days (1 leave per 24 working days)
    total_used: int = 0
    working_days_count: int = 0  # Track working days for accrual calculation

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
    deduct_from_month: str  # Month name (e.g., "January")
    deduct_from_year: int  # Year (e.g., 2026)
    repayment_months: int = 1  # Number of months to repay (default 1 for single deduction)

class SalaryAdvanceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    emp_id: str
    emp_name: str
    amount: float
    reason: str
    deduct_from_month: Optional[str] = None
    deduct_from_year: Optional[int] = None
    repayment_months: int = 1
    monthly_deduction: float = 0
    status: AdvanceStatus
    requested_on: str
    approved_by: Optional[str] = None
    approved_on: Optional[str] = None
    is_deducted: bool = False
    deducted_on: Optional[str] = None

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

# Audit Expense Models
class AuditExpenseCategory(str, Enum):
    TICKETS = "tickets"  # Flight/Train/Bus
    TRAVEL = "travel"    # Local transport/Cab
    FOOD = "food"
    HOTEL = "hotel"      # Accommodation
    OTHER = "other"

class AuditExpenseStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PARTIALLY_APPROVED = "partially_approved"
    REVALIDATION = "revalidation"  # Admin requests Team Lead to fix and resubmit

class AuditExpenseItemBase(BaseModel):
    date: str
    category: AuditExpenseCategory
    location: str
    amount: float
    description: str
    receipt_url: Optional[str] = None

class AuditExpenseCreate(BaseModel):
    items: List[AuditExpenseItemBase]
    trip_purpose: str
    trip_location: str
    trip_start_date: str
    trip_end_date: str
    remarks: Optional[str] = None

class AuditExpenseResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    emp_id: str
    emp_name: str
    items: List[AuditExpenseItemBase]
    total_amount: float
    trip_purpose: str
    trip_location: str
    trip_start_date: str
    trip_end_date: str
    remarks: Optional[str] = None
    status: AuditExpenseStatus = AuditExpenseStatus.PENDING
    approved_amount: float = 0
    remaining_balance: float = 0  # Track unpaid balance for partial payments
    submitted_on: str
    approved_by: Optional[str] = None
    approved_on: Optional[str] = None
    rejection_reason: Optional[str] = None
    revalidation_reason: Optional[str] = None  # Why Admin requested revalidation
    payment_history: Optional[List[dict]] = []  # Track multiple partial payments


# ==================== NOTIFICATION MODELS ====================

class NotificationType(str, Enum):
    ATTENDANCE = "attendance"
    LEAVE = "leave"
    BILL = "bill"
    PAYSLIP = "payslip"
    SYSTEM = "system"

class NotificationCreate(BaseModel):
    recipient_id: str  # User ID who should receive this
    recipient_role: Optional[str] = None  # Or send to all users with this role
    title: str
    message: str
    type: NotificationType
    related_id: Optional[str] = None  # ID of related entity (leave_id, bill_id, etc.)
    data: Optional[dict] = None  # Additional data

class NotificationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    recipient_id: str
    recipient_role: Optional[str] = None
    title: str
    message: str
    type: NotificationType
    related_id: Optional[str] = None
    data: Optional[dict] = None
    is_read: bool = False
    created_at: str


# ==================== ANALYTICS MODELS ====================

class AnalyticsTimeFilter(str, Enum):
    THIS_WEEK = "this_week"
    THIS_MONTH = "this_month"
    THIS_QUARTER = "this_quarter"
    THIS_YEAR = "this_year"

class AttendanceTrendData(BaseModel):
    date: str
    present: int
    absent: int
    half_day: int
    total: int

class LeaveDistributionData(BaseModel):
    type: str
    count: int
    percentage: float

class DepartmentAttendanceData(BaseModel):
    department: str
    present: int
    absent: int
    attendance_rate: float

class SalaryOverviewData(BaseModel):
    month: str
    total_salary: float
    total_deductions: float
    net_paid: float

class EmployeeCountData(BaseModel):
    role: str
    count: int
    active: int
    inactive: int

class AnalyticsResponse(BaseModel):
    attendance_trends: List[AttendanceTrendData] = []
    leave_distribution: List[LeaveDistributionData] = []
    department_attendance: List[DepartmentAttendanceData] = []
    salary_overview: List[SalaryOverviewData] = []
    employee_counts: List[EmployeeCountData] = []


# ==================== CASHBOOK MODELS ====================

class PaymentStatus(str, Enum):
    PAID = "paid"
    PENDING = "pending"
    PARTIAL = "partial"

class CashOutCategory(str, Enum):
    SALARY = "salary"
    BILLS = "bills"
    AUDIT_EXPENSES = "audit_expenses"
    ADVANCES = "advances"
    RENT = "rent"
    UTILITIES = "utilities"
    OFFICE_EXPENSES = "office_expenses"
    CUSTOM = "custom"

class CashInCreate(BaseModel):
    client_name: str
    invoice_number: str
    invoice_date: str  # YYYY-MM-DD
    invoice_amount: float
    gst_percentage: Optional[float] = None  # GST percentage (e.g., 18)
    gst_amount: Optional[float] = None  # Calculated GST amount
    invoice_pdf_url: Optional[str] = None
    payment_status: PaymentStatus = PaymentStatus.PENDING
    amount_received: float = 0
    notes: Optional[str] = None

class CashInResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    client_name: str
    invoice_number: str
    invoice_date: str
    invoice_amount: float
    gst_percentage: Optional[float] = None
    gst_amount: Optional[float] = None
    invoice_pdf_url: Optional[str] = None
    payment_status: PaymentStatus
    amount_received: float
    pending_balance: float
    notes: Optional[str] = None
    created_at: str
    month: str  # e.g., "January"
    year: int

class CashOutCreate(BaseModel):
    category: str  # CashOutCategory or custom
    description: str
    amount: float
    date: str  # YYYY-MM-DD
    tds_percentage: Optional[float] = None  # TDS percentage (e.g., 10)
    tds_amount: Optional[float] = None  # Calculated TDS amount
    reference_id: Optional[str] = None  # Link to payslip/bill/expense ID
    reference_type: Optional[str] = None  # "payslip", "bill", "audit_expense", "manual"
    notes: Optional[str] = None

class CashOutResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    category: str
    description: str
    amount: float
    date: str
    tds_percentage: Optional[float] = None
    tds_amount: Optional[float] = None
    reference_id: Optional[str] = None
    reference_type: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    month: str
    year: int
    is_auto: bool = False  # True if auto-generated from other modules

class CustomCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CustomCategoryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: Optional[str] = None
    created_at: str

class MonthLockCreate(BaseModel):
    month: str  # e.g., "January"
    year: int

class MonthLockResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    month: str
    year: int
    is_locked: bool
    locked_by: Optional[str] = None
    locked_at: Optional[str] = None
    unlocked_by: Optional[str] = None
    unlocked_at: Optional[str] = None

class CashbookSummary(BaseModel):
    month: Optional[str] = None
    year: int
    total_cash_in: float
    total_cash_out: float
    net_profit_loss: float
    is_locked: bool = False


# ==================== LOAN / EMI MODELS ====================

class LoanType(str, Enum):
    EMI_BASED = "emi_based"
    LUMP_SUM = "lump_sum"

class LoanStatus(str, Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    PRECLOSED = "preclosed"

class LoanCreate(BaseModel):
    loan_name: str  # e.g., "Home Loan - HDFC", "Personal Loan - Friend"
    lender_name: str  # Bank/NBFC name or person's name
    total_loan_amount: float
    loan_type: LoanType = LoanType.EMI_BASED  # emi_based or lump_sum
    # EMI-based loan fields (required only for EMI loans)
    emi_amount: Optional[float] = None
    emi_day: Optional[int] = None  # Day of month (1-28)
    interest_rate: Optional[float] = None  # Annual interest rate (%)
    loan_tenure_months: Optional[int] = None  # Total tenure in months
    # Common fields
    loan_start_date: str  # YYYY-MM-DD (or loan taken date for lump sum)
    due_date: Optional[str] = None  # For lump sum loans
    notes: Optional[str] = None

class LoanResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    loan_name: str
    lender_name: str
    total_loan_amount: float
    loan_type: LoanType = LoanType.EMI_BASED
    emi_amount: Optional[float] = None
    emi_day: Optional[int] = None
    loan_start_date: str
    due_date: Optional[str] = None
    interest_rate: Optional[float] = None
    loan_tenure_months: Optional[int] = None
    total_paid: float = 0
    remaining_balance: float
    emis_paid: int = 0
    status: LoanStatus = LoanStatus.ACTIVE
    notes: Optional[str] = None
    created_at: str

class EMIPaymentCreate(BaseModel):
    loan_id: str
    payment_date: str  # YYYY-MM-DD
    amount: float
    principal_amount: Optional[float] = None
    interest_amount: Optional[float] = None
    is_extra_payment: bool = False  # For pre-closure or extra payments
    notes: Optional[str] = None

class EMIPaymentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    loan_id: str
    loan_name: str
    payment_date: str
    amount: float
    principal_amount: Optional[float] = None
    interest_amount: Optional[float] = None
    is_extra_payment: bool = False
    is_auto_generated: bool = False
    balance_after_payment: float
    notes: Optional[str] = None
    created_at: str
    month: str
    year: int

class LoanSummary(BaseModel):
    total_loans: int
    active_loans: int
    total_loan_amount: float
    total_paid: float
    total_remaining: float
    upcoming_emis_this_month: float


# ==================== PAYABLE / CREDIT MODELS ====================

class PayableStatus(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"

class PayableCreate(BaseModel):
    creditor_name: str
    total_amount: float
    due_date: Optional[str] = None  # YYYY-MM-DD
    description: Optional[str] = None
    notes: Optional[str] = None

class PayableResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    creditor_name: str
    total_amount: float
    due_date: Optional[str] = None
    description: Optional[str] = None
    amount_paid: float = 0
    remaining_balance: float
    status: PayableStatus = PayableStatus.PENDING
    notes: Optional[str] = None
    created_at: str

class PayablePaymentCreate(BaseModel):
    payable_id: str
    payment_date: str  # YYYY-MM-DD
    amount: float
    notes: Optional[str] = None

class PayablePaymentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    payable_id: str
    creditor_name: str
    payment_date: str
    amount: float
    balance_after_payment: float
    notes: Optional[str] = None
    created_at: str
    month: str
    year: int

class PayableSummary(BaseModel):
    total_payables: int
    pending_payables: int
    total_payable_amount: float
    total_paid: float
    total_remaining: float
