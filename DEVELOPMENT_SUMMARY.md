# SuperManage - Development Summary
## Last Updated: January 19, 2026

---

## Quick Start Command for Emergent
When you open this repository in Emergent, type:
```
Continue development on this SuperManage project from where I left off. 
Please read the DEVELOPMENT_SUMMARY.md and memory/PRD.md files first.
```

---

## Test Credentials
| Role | User ID | Password |
|------|---------|----------|
| Admin | ADMIN001 | admin123 |
| Team Lead | TL001 | tl001 |
| Employee (Rahul) | EMP001 | emp001 |

---

## What's Been Implemented

### Core Features
1. ✅ Role-based authentication (Admin/Team Lead/Employee)
2. ✅ QR-based attendance with shift support
3. ✅ Leave management with approval workflow
4. ✅ Bill submission & approval
5. ✅ Payslip generation with PDF download
6. ✅ Cashbook / Company Finance module
7. ✅ Loan/EMI Management
8. ✅ Audit Expenses with partial payments
9. ✅ Analytics dashboard
10. ✅ Reports with CSV export
11. ✅ Notification system

---

## Business Rules Implemented (January 19, 2026)

### 1. Attendance Status Types
| Status | Conveyance | Daily Duty | Salary Deduction |
|--------|------------|------------|------------------|
| full_day | ₹200 | Salary/26 | None |
| half_day | ₹100 | (Salary/26)/2 | 0.5 day |
| leave | ₹200 | Salary/26 | None |
| absent | ₹0 | ₹0 | 1 day |

### 2. Daily Duty Calculation
- Daily Rate = Monthly Salary ÷ 26 working days
- Example (₹50,000 salary): ₹1,923.08 per day

### 3. Leave Approval → Attendance Update
When leave is approved:
- attendance_status changes from "absent" to "leave"
- Full day conveyance (₹200) credited
- Full day duty amount credited
- No salary deduction for approved leave

### 4. Leave Balance Accrual Rule
- **Per month**: 24+ full working days = 1 leave accrued
- Only `full_day` attendance counts (not half_day or leave)
- Auto-calculated based on monthly attendance
- Profile shows single "Total Leave" (not Casual/Sick/Vacation)

### 5. Payslip Calculation
| Component | Calculation |
|-----------|-------------|
| Basic | 60% of Salary |
| HRA | 24% of Salary |
| Special Allowance | 16% of Salary |
| Conveyance | Sum from attendance |
| Extra Conveyance | From approved bills |
| Attendance Adjustment | -(half_days × 0.5 + absent_days) × daily_rate |
| Total Duty Earned | Sum of daily_duty_amount |

---

## Sample Data (Rahul - December 2025)

### Attendance Summary
| Field | Value |
|-------|-------|
| Full Days | 27 |
| Half Days | 3 |
| Leave Days | 1 |
| Absent Days | 0 |
| Total | 31 |

### Payslip
| Component | Amount |
|-----------|--------|
| Basic | ₹30,000 |
| HRA | ₹12,000 |
| Special Allowance | ₹8,000 |
| Conveyance | ₹7,500 |
| Extra Conveyance (Bills) | ₹153 |
| Attendance Adjustment | -₹1,730.77 |
| Total Duty Earned | ₹56,730.86 |
| **Net Pay** | **₹55,922.23** |

### Leave Balance
| Field | Value |
|-------|-------|
| Working Days | 27 |
| Leave Accrued | 1 |
| Leave Used | 1 |
| Available | 0 |

---

## Key Files Modified

### Backend
- `/app/backend/models.py` - Updated LeaveBalance, AttendanceStatus, SalaryBreakdown models
- `/app/backend/routes.py` - Updated leave approval, payslip generation, leave balance calculation

### Frontend
- `/app/frontend/src/pages/Profile.jsx` - Single "Total Leave" display
- `/app/frontend/src/pages/Reports.jsx` - Month/year filtering, 4 attendance categories
- `/app/frontend/src/pages/Payslip.jsx` - Added leave_days, total_duty_earned display
- `/app/frontend/src/pages/AttendanceDetails.jsx` - Separate Leave/Absent display
- `/app/frontend/src/pages/EmployeeAttendance.jsx` - Added Leave category
- `/app/frontend/src/data/mockData.js` - Added "My Attendance" for Team Lead

### Seed Scripts
- `/app/scripts/seed_with_duty.py` - Comprehensive seed with daily_duty_amount

---

## Commands to Reseed Data
```bash
cd /app/scripts && python seed_with_duty.py
```

---

## To Continue Development
1. Open repository in Emergent
2. Type: "Continue development from where I left off"
3. Reference this file and `/app/memory/PRD.md` for context
