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
| /api/qr-codes | GET/POST | QR generation |
| /api/attendance/punch-in | POST | QR-based punch in |
| /api/attendance/punch-out | POST | Punch out |
| /api/attendance/{id}/monthly | GET | Monthly records |
| /api/bills | GET/POST | Bill submission |
| /api/bills/{id}/approve | PUT | Approve bill |
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
- **Backend**: 21/21 tests passed (pytest)
- **Frontend**: 95% coverage
- Test files: `/app/tests/test_backend_api.py`

---

## Prioritized Backlog

### P0 (Critical)
- ✅ QR-based attendance
- ✅ Bill Submission module
- ✅ Payslip PDF download
- ✅ Salary Breakdown update

### P1 (Important)
- [ ] Real-time attendance sync
- [ ] Push notifications for approvals
- [ ] Admin payroll generation workflow
- [ ] Employee profile edit

### P2 (Nice to Have)
- [ ] Reports/Analytics dashboard
- [ ] Export data to Excel
- [ ] Multi-language support
- [ ] Dark mode

---

## Known Issues
- None critical

## Last Updated
January 18, 2026
