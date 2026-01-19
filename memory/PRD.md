# SuperManage - Staff Attendance & Payroll Management App
## Product Requirements Document

### Original Problem Statement
Build a clone of SuperManage application - a staff attendance and payroll management tool for **Audix Solutions & Co.** with three user roles:
- **Admin**: Desktop-oriented view, manages entire system
- **Team Leader**: Mobile-first view, manages team
- **Employee**: Mobile-first view, manages own attendance/leaves/expenses

---

## What's Been Implemented

### Phase 1: Frontend UI (Completed ✅)
- Role-based architecture with three distinct layouts
- Mobile-first design for Employee and Team Lead
- Desktop sidebar for Admin
- Login with quick-login demo buttons

### Phase 2: Backend & Database (Completed ✅) - January 2026
- **MongoDB Collections**: Users, QRCodes, Attendance, Leaves, Bills, Payslips, Holidays
- **FastAPI Backend**: Full CRUD APIs for all features
- **Authentication**: Role-based login with token generation
- **Database Seeding**: POST /api/seed for initial data

### Phase 3: QR-Based Attendance (Completed ✅) - January 2026
- Team Lead generates QR with **location** and **conveyance amount**
- Employee scans QR to punch in (using html5-qrcode library)
- QR details stored in attendance records
- Conveyance auto-adds to salary

### Phase 4: Bill Submission Module (Completed ✅) - January 2026
*Replaced Overtime feature*
- Employees submit expenses date-wise, location-wise
- PDF attachments supported (max 5MB)
- Monthly submission to Team Lead for approval
- Approved amount → Salary Breakdown

### Phase 5: Updated Payslip & Salary Breakdown (Completed ✅) - January 2026
- **Salary Breakdown Fields**:
  - Basic
  - HRA
  - Special Allowance
  - Conveyance
  - Leave Applied (adjustment)
  - Extra Conveyance (Approved by Admin/TL)
  - Previous Pending Allowances
  - Net Pay
- Shows only **settled payslips**
- PDF download using jsPDF

### Phase 6: Attendance Details Section (Completed ✅) - January 2026
- Year/Month dropdown selectors
- Date-wise attendance records
- Shows QR details (location, conveyance) per entry
- Monthly summary stats

### Phase 7: UI/UX Refinements (Completed ✅) - January 2026
- **Attendance Details moved to Home page** - Inline section on Employee dashboard
- **Payslip visible in mobile navigation** - 5-item bottom nav: Home, Attendance, Leaves, Bills, Payslip
- **Punch In only on Home page** - Attendance page shows only records
- **Back camera only for QR scan** - Using `facingMode: "environment"`

### Phase 8: Shift-Based Attendance & Salary (Completed ✅) - January 2026
**Two Shift Types:**
- **Day Shift**: Default 10:00 AM – 7:00 PM
- **Night Shift**: Default 9:00 PM – 6:00 AM

**QR Code Generation (Team Leader):**
- Includes shift_type, shift_start, shift_end
- Customizable shift timings
- Visual indicators for Day/Night shifts

**Attendance Status Calculation (Based on Scan Time):**
- **Full Day**: Scanned within 30 minutes of shift start → Full conveyance
- **Half Day**: Scanned 30 min to 3 hours late → Half conveyance
- **Absent**: Scanned more than 3 hours late → No conveyance

**Salary Calculation:**
- Automatic deduction for half days (0.5 × daily rate)
- Automatic deduction for absents (1 × daily rate)
- Payslip shows: full_days, half_days, absent_days, attendance_adjustment
- PDF includes attendance summary

### Phase 9: Nice to Have Features (Completed ✅) - January 2026
**Employee Self-Service:**
- Profile editing page (`/profile`)
- Leave balance viewing
- Salary advance requests

**Admin Controls:**
- Bulk approve/reject leave requests
- Shift templates management (`/shift-templates`)

**Team Leader Capabilities:**
- Direct punch-in without QR scan
- Approve/reject leaves and bills for team
- Access to own payslip ✅

### Phase 10: Bank Details & Team Leader Mapping (Completed ✅) - January 19, 2026

**Bank Details (Mandatory for Employees/Team Leads):**
- Added mandatory fields: `bank_name`, `bank_account_number`, `bank_ifsc` during employee creation
- Bank details visible on:
  - Employee View dialog (Admin view)
  - Payslip View page (Employee view)
  - Payslip PDF download
  - CSV Export (`/api/export/payslips` and `/api/export/employees`)
- Admin users don't require bank details

**Employee-Team Leader Mapping:**
- Assign Team Leader dropdown during employee creation (filters active TLs only)
- Employee cards show "TL: [Team Leader Name]" 
- View Employee dialog shows assigned Team Leader
- Team Leaders only see employees assigned to them via `team_lead_id`

**Admin Change TL with History:**
- Admin can change employee's Team Leader from Edit Employee dialog
- Optional "Reason for Change" field
- Change history logged to `team_leader_history` collection:
  - `emp_id`, `old_team_leader_id`, `new_team_leader_id`
  - `old_team_leader_name`, `new_team_leader_name`
  - `changed_by`, `changed_at`, `reason`
- View TL History button on employee cards

**Auto Payslip Creation:**
- Preview payslip auto-created when new employee/teamlead is added
- Initial breakdown with salary components, ready for attendance updates

---

## Technical Architecture

### Backend (FastAPI + MongoDB)
```
/app/backend/
├── server.py          # Main FastAPI app
├── routes.py          # All API endpoints
├── models.py          # Pydantic models
└── requirements.txt
```

### Frontend (React + Tailwind + Shadcn)
```
/app/frontend/src/
├── App.js                    # Routes
├── context/AuthContext.jsx   # Auth state
├── services/api.js           # API calls
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx         # Role-based
│   ├── MyAttendance.jsx      # QR scanning
│   ├── AttendanceDetails.jsx # Monthly view
│   ├── Team.jsx              # QR generation
│   ├── BillSubmission.jsx    # Expenses
│   ├── Payslip.jsx           # PDF download
│   ├── Profile.jsx           # User profile editing
│   ├── ShiftTemplates.jsx    # Admin shift management
│   └── ...
└── components/
    └── Layout/
        ├── MainLayout.jsx
        ├── Sidebar.jsx
        └── MobileBottomNav.jsx
```

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/auth/login | POST | User authentication |
| /api/users | GET/POST | User management |
| /api/users/profile | PUT | Update user profile |
| /api/qr-codes | GET/POST | QR generation |
| /api/attendance/punch-in | POST | QR-based punch in |
| /api/attendance/punch-in/direct | POST | Team Leader direct punch in |
| /api/attendance/punch-out | POST | Punch out |
| /api/attendance/{id}/monthly | GET | Monthly records |
| /api/bills | GET/POST | Bill submission |
| /api/bills/{id}/approve | PUT | Approve bill |
| /api/leaves | GET/POST | Leave management |
| /api/admin/leaves/bulk-action | POST | Bulk leave approval |
| /api/admin/shift-templates | GET/POST | Shift template management |
| /api/payslips/{id}/settled | GET | Settled payslips |
| /api/payslips/{id}/download | GET | Download PDF |
| /api/seed | POST | Seed database |

---

## Test Credentials
| Role | User ID | Password |
|------|---------|----------|
| Admin | ADMIN001 | admin123 |
| Team Lead | TL001 | tl001 |
| Employee | EMP001 | emp001 |

---

## Testing Status
- **Backend**: 45/45 tests passed (pytest)
  - 21 core API tests
  - 24 Cashbook module tests
- **Frontend**: 95% coverage
- Test files: `/app/tests/test_backend_api.py`, `/app/tests/test_cashbook_api.py`

---

## Prioritized Backlog

### P0 (Critical) - All Completed ✅
- ✅ QR-based attendance
- ✅ Bill Submission module
- ✅ Payslip PDF download
- ✅ Salary Breakdown update
- ✅ Shift-based attendance calculation
- ✅ Team Leader payslip access
- ✅ Cashbook / Company Finance Module

### P1 (Important)
- [ ] Real-time Attendance Sync (WebSocket-based live updates)
- [ ] Push Notifications for events (leave requests, bill submissions, payslip generation)
- [ ] Swipe gestures for approvals (Admin/Team Lead)
- [ ] Offline QR scanning with sync

### P2 (Nice to Have)
- [ ] Admin Dashboard analytics (charts/graphs)
- [ ] Reports/Analytics dashboard
- [ ] Export data to Excel
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Refactor Dashboard.jsx into role-specific components

### Code Quality
- [ ] Fix ESLint warnings (react-hooks/exhaustive-deps)

---

## Database Schema

### users Collection
```javascript
{
  id: "EMP001",
  name: "Rahul Kumar",
  email: "rahul@audixsolutions.com",
  phone: "+91 98765 43211",
  role: "employee", // admin, teamlead, employee
  department: "Development",
  designation: "Software Engineer",
  joining_date: "2023-01-15",
  salary: 50000,
  salary_type: "monthly",
  status: "active",
  team_lead_id: "TL001", // Assigned Team Leader (for employees)
  team_members: [], // Legacy field for backward compatibility
  bank_name: "State Bank of India",
  bank_account_number: "32456789012345",
  bank_ifsc: "SBIN0001234",
  password: "emp001"
}
```

### team_leader_history Collection
```javascript
{
  id: "TLH001",
  emp_id: "EMP001",
  emp_name: "Rahul Kumar",
  old_team_leader_id: "TL001",
  old_team_leader_name: "Rajesh Verma",
  new_team_leader_id: "TL002",
  new_team_leader_name: "Meera Joshi",
  changed_by: "ADMIN001",
  changed_at: "2026-01-19T15:00:00Z",
  reason: "Team restructuring"
}
```

---

## Known Issues
- None critical
- Minor: Dashboard.jsx is 900+ lines - consider refactoring

---

## Changelog

### January 19, 2026 (Session 2)
- **NEW FEATURE:** Bank Details (Mandatory for Employees/Team Leads) ✅
  - Added `bank_name`, `bank_account_number`, `bank_ifsc` fields to user model
  - Mandatory validation on POST /api/users for employees/teamleads
  - Bank details visible on View Employee dialog, Payslip page, PDF, CSV exports
  - Admin users don't require bank details

- **NEW FEATURE:** Employee-Team Leader Mapping ✅
  - `team_lead_id` field on employees links to assigned Team Leader
  - Team Leader dropdown in Add Employee dialog (filters active TLs only)
  - Employee cards display "TL: [Name]" 
  - GET /api/users/team/{team_lead_id} returns employees with matching team_lead_id

- **NEW FEATURE:** Admin Change TL with History ✅
  - Edit Employee dialog for Team Leader reassignment
  - "Reason for Change" optional field
  - Changes logged to `team_leader_history` collection
  - GET /api/users/{id}/team-leader-history returns audit trail
  - TL History dialog shows all changes with dates and admin who made change

- **NEW FEATURE:** Audit Expenses Report in Reports Page ✅
  - Added "Audit Expenses Report" to Generate Reports section
  - Shows Team Leader travel/audit expense claims
  - CSV export includes: Trip Name, Client, Dates, Ticket/Travel/Food/Hotel amounts, Status, Payments
  - New stat card showing "Audit Expenses" approved amount for selected month/year
  - Added row in Summary table for "Audit Expenses Approved"

- **UPDATED:** Bills & Advances Report (Merged) ✅
  - Combined Bills Report and Advance Report into single "Bills & Advances Report"
  - CSV includes both types with "Type" column (Bill/Advance)
  - Unified export: /api/export/bills-advances
  - Description: "Bill submissions and salary advances combined"

- **UPDATED:** Payslips CSV Export ✅
  - Added Bank Name, Account Number, IFSC Code columns to /api/export/payslips
  - Lookup employee bank details during export generation

- **UPDATED:** Seed Data ✅
  - All employees and team leads now have bank details in seed data
  - Bank details: State Bank of India (EMP001), Axis Bank (EMP002), etc.

### January 19, 2026
- **NEW FEATURE:** Loan / EMI Management (Completed ✅)
  - **Add External Loans:** Capture loan name, lender, total amount, EMI amount, EMI day (1-28), start date, interest rate, tenure
  - **EMI Payments:** Record regular EMI or extra payments with principal/interest split auto-calculated
  - **Pre-closure:** Close loans early with final settlement payment
  - **Auto Cash Out:** EMI payments automatically appear in Cash Out as "Loan EMI" category
  - **Payment History:** View complete payment history with principal, interest, and balance tracking
  - **Loan Summary:** Cards showing total loans, active loans, total paid, remaining balance
  - **Reports:** Added Loan Report option in Reports page with CSV export
  - **Balance Tracking:** Remaining balance auto-updates after each payment

- **NEW FEATURE:** Cashbook / Company Finance Module (Completed ✅)
  - **Cash In (Income):** Track client invoices with Client Name, Invoice Number, Date, Amount, Payment Status (Paid/Pending/Partial), Amount Received, PDF upload
  - **Cash Out (Expenses):** Auto-integrated from settled salaries, approved bills, and audit expenses + Manual entries with predefined categories
  - **Predefined Categories:** Rent, Utilities, Office Supplies, Travel, Marketing, Miscellaneous, Loan EMI, Other (Custom)
  - **Summary Cards:** Total Cash In, Total Cash Out, Net Profit/Loss with auto-calculation
  - **Month/Year Filters:** View data monthly or yearly
  - **Month Locking:** Admin can lock/unlock months to prevent edits
  - **Exports:** Cashbook CSV, Invoices CSV, Invoice PDFs (ZIP download), Loans CSV

- **Updated Backend:**
  - Added `/api/loans/*` endpoints for Loan CRUD, EMI payments, pre-closure
  - Added `/api/export/loans`, `/api/export/emi-payments` endpoints
  - EMI payments auto-create Cash Out entries with "loan_emi" category

- **Updated Frontend:**
  - Added Loans tab in Cashbook page with full loan management UI
  - Added Loan Report to Reports page

### January 18, 2026
- **NEW FEATURE:** Audit Expenses - Partial Payment & Balance Tracking
  - Admin can make partial payments (e.g., pay ₹3,000 of ₹8,000)
  - Remaining balance shown in stats and expense cards
  - Payment history tracked for each expense
  - Admin can pay remaining balance later
  
- **NEW FEATURE:** Audit Expenses - Revalidation Flow
  - Admin can request revalidation with reason
  - Team Leader sees reason and can edit & resubmit
  - Status changes: Pending → Revalidation → Pending (after resubmit)

- **NEW FEATURE:** Audit Expenses for Team Leaders
  - Team Leaders can submit travel/audit expenses (tickets, travel, food, hotel)
  - Admin can approve/reject or partially approve expenses
  - Approved expenses appear in payslip as "Audit Expenses (Reimbursement)"
  
- **Fixed:** Team Lead payslip showing empty - Added payslip seed data

### January 19, 2026
- **NEW FEATURE:** Leave Approval → Attendance Update
  - When Team Leader approves leave, attendance automatically updates:
    - `attendance_status` changes from "absent" to "leave"
    - Full day conveyance (₹200) credited
    - Full day duty amount credited
  - Approved leave days are NOT deducted from salary
  - Leave counts as full day for payroll purposes

- **NEW FEATURE:** Daily Duty Pricing
  - Daily duty calculated as: `Salary / 26 working days`
  - Full Day: 100% of daily rate
  - Half Day: 50% of daily rate  
  - Leave: 100% of daily rate (same as full day)
  - Absent: ₹0

- **UPDATED:** Attendance Status Types
  - `full_day`: Full day present
  - `half_day`: Half day present (< 6 hours)
  - `leave`: Approved leave (counts as full day)
  - `absent`: Absent without approved leave

- **UPDATED:** Payslip Calculation Rules
  - Attendance Adjustment = Deduction for half days and absents ONLY
  - Leave days: NO deduction (approved leave = full day credit)
  - `total_duty_earned`: Sum of all daily_duty_amount from attendance
  - `extra_conveyance`: From approved bill submissions
  - `leave_days`: Separate count shown in breakdown

- **UPDATED:** Reports Page
  - Stats now filter by selected month/year
  - Attendance chart shows 4 categories: Full Day, Half Day, Leave, Absent
  - Salary Paid shows only for selected month
  - Bills Approved shows only for selected month

- **FIXED:** Duplicate payslips removed
- **FIXED:** Reports showing incorrect attendance counts (was using wrong status field)

---

## Business Rules Summary

### Attendance Rules
| Status | Conveyance | Daily Duty | Salary Deduction |
|--------|------------|------------|------------------|
| Full Day | ₹200 | Salary/26 | None |
| Half Day | ₹100 | (Salary/26)/2 | 0.5 day |
| Leave | ₹200 | Salary/26 | None |
| Absent | ₹0 | ₹0 | 1 day |

### Payslip Breakdown
| Component | Calculation |
|-----------|-------------|
| Basic | 60% of Salary |
| HRA | 24% of Salary |
| Special Allowance | 16% of Salary |
| Conveyance | Sum from attendance records |
| Extra Conveyance | From approved bills |
| Attendance Adjustment | -(half_days × 0.5 + absent_days) × daily_rate |
| Total Duty Earned | Sum of daily_duty_amount |

### Leave Approval Flow
1. Employee applies leave for date (which may be marked absent)
2. Team Leader approves leave
3. System automatically:
   - Updates attendance_status to "leave"
   - Credits full day conveyance (₹200)
   - Credits full day duty amount
4. Payslip regeneration will not deduct for leave days

### Leave Balance Rules (Updated)
- **Accrual Rule**: Per month - if employee has **24+ full working days** (via QR punch-in) → **1 leave is added**
- **Working Days Count**: Only `full_day` attendance status counts (not half_day or leave)
- **Auto-calculated**: System automatically calculates leaves based on monthly attendance
- **Display**: Single "Total Leave" shown in Profile (not separate Casual/Sick/Vacation)
- **Leave Types for Application**: Casual Leave, Sick Leave, Vacation, Personal (4 options remain)
- **Example**: 
  - December 2025: 27 full days → 1 leave accrued
  - January 2026: 20 full days → 0 leave accrued
  - February 2026: 24 full days → 1 leave accrued

---

## Last Updated
January 19, 2026 (Session 2)
