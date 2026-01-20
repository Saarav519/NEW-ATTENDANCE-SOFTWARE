# SuperManage - Application Working Flow

## Overview
This document explains how each action in the system flows through different modules and where the data reflects.

---

## 1. EMPLOYEE MANAGEMENT

### 1.1 Add New Employee
```
Admin creates employee
→ Employee details saved (ID, Name, Role, Salary, Team Leader)
→ Bank details captured (mandatory for Emp/TL)
→ Employee appears in Employees list
→ Employee can now login
→ Reflected in: Dashboard stats, Reports (Employee List)
```

### 1.2 Assign Team Leader
```
Admin assigns Team Leader to Employee
→ Mapping saved in users collection
→ History logged in team_leader_history
→ Team Leader can now see employee in "My Team"
→ Team Leader receives notifications for this employee
→ Reflected in: Team page, Employee details, Audit History
```

### 1.3 Update Employee Salary
```
Admin updates salary components (Basic, HRA, DA, etc.)
→ New salary structure saved
→ Future payslips will use new structure
→ Existing payslips remain unchanged
→ Reflected in: Employee details, Future Payroll calculations
```

---

## 2. ATTENDANCE MODULE

### 2.1 Employee Marks Attendance (QR Code)
```
Employee scans QR code at work location
→ System captures: Time, Location (GPS), Photo
→ Attendance record created with status "present"
→ Daily duty amount calculated (Monthly Salary ÷ Working Days)
→ Conveyance amount set (from employee's conveyance allowance)
→ Reflected in: Employee Dashboard, Admin Attendance page
→ Notification sent to: Team Leader, Admin
→ Included in: Monthly Payroll calculation
→ Exportable in: Attendance Report
```

### 2.2 Employee Marks Attendance (Direct/Manual)
```
Employee clicks "Mark Attendance" button
→ System captures: Time, Location (manual entry)
→ Attendance record created with status "present"
→ Daily duty amount calculated
→ Conveyance amount set
→ Same flow as QR attendance
```

### 2.3 Admin/Team Leader Marks Attendance for Employee
```
Admin/TL opens Attendance page
→ Clicks Edit icon for employee
→ Enters: Date, Status, Conveyance (manual), Location (manual text)
→ Attendance record created/updated
→ If Half Day: Daily duty = 50% of full day
→ Reflected in: Employee's attendance record
→ Included in: Payroll calculation
→ Exportable in: Attendance Report
```

### 2.4 Half Day Attendance
```
Admin marks employee as "Half Day"
→ Daily duty amount = (Monthly Salary ÷ Working Days) × 0.5
→ Conveyance = 50% of daily conveyance
→ Reflected in: Attendance records
→ Payroll shows: Reduced earned salary proportionally
```

### 2.5 Attendance Summary (Monthly)
```
System aggregates attendance for month
→ Counts: Present days, Half days, Absent days, Leaves
→ Calculates: Total duty earned, Total conveyance
→ Used by: Payroll module for salary calculation
→ Reflected in: Payroll preview, Reports
```

---

## 3. LEAVE MANAGEMENT

### 3.1 Auto Leave Accrual
```
System tracks working days for each employee
→ After every 24 working days (present/half-day)
→ 1 leave automatically added to "Total Leaves" balance
→ Reflected in: Employee's leave balance
→ Accrual continues throughout employment
```

### 3.2 Employee Applies for Leave
```
Employee submits leave request
→ Selects: Leave type, Start date, End date, Reason
→ Leave request status = "pending"
→ Notification sent to: Team Leader, Admin
→ Reflected in: Employee's leave history
→ Visible in: Admin Leaves page, TL dashboard
```

### 3.3 Leave Approved (PAID LEAVE)
```
Admin/TL approves leave request
→ Leave status = "approved"
→ Leave deducted from employee's Total Leaves balance
→ Attendance status = "Leave" for those days
→ Daily duty amount = FULL DAY amount (paid leave)
→ Conveyance = Applied as per rules
→ Notification sent to: Employee
→ Reflected in:
  - Attendance calendar (marked as Leave)
  - Leave history
  - Employee view
  - Admin attendance view
→ Affects: Payroll (leave treated as PAID day)
→ Exportable in: Leave Report, Attendance Report
```

### 3.4 Leave Rejected
```
Admin/TL rejects leave request
→ Leave status = "rejected"
→ No impact on attendance
→ No deduction from leave balance
→ Notification sent to: Employee
→ Reflected in: Employee's leave history
```

### 3.5 Leave Balance Summary
```
Total Leaves = Auto-accrued leaves (1 per 24 working days)
Used Leaves = Approved leaves taken
Available Leaves = Total Leaves - Used Leaves
→ Reflected in: Employee dashboard, Leave page
```

---

## 4. BILLS & EXPENSES

### 4.1 Employee Submits Bill
```
Employee creates bill submission
→ Adds expense items: Date, Location, Amount, Description
→ Optionally attaches PDF receipts
→ Bill status = "pending"
→ Total amount calculated
→ Notification sent to: Team Leader, Admin
→ Reflected in: Bills & Advances page
→ Visible in: Admin's pending bills queue
```

### 4.2 Admin Fully Approves Bill
```
Admin clicks "Approve" → Enters full amount
→ Bill status = "approved"
→ Approved amount = Total amount
→ Remaining balance = ₹0
→ Cash Out entry created automatically (category: "bill")
→ Amount added to employee's payslip as "Extra Conveyance"
→ Notification sent to: Employee
→ Reflected in: 
  - Cashbook (Cash Out section)
  - Employee's approved bills
  - Payroll (adds to Net Pay)
→ Exportable in: Bills Report, Cashbook Report
```

### 4.3 Admin Partially Approves Bill (with Revalidation)
```
Admin clicks "Revalidate" → Enters partial amount (e.g., ₹2000 of ₹4000)
→ Bill status = "revalidation"
→ Approved amount = ₹2000
→ Remaining balance = ₹2000 (clearly displayed)
→ Cash Out entry created for approved amount
→ Approved amount added to payslip
→ Notification sent to: Employee
→ Remaining amount awaits further approval
→ Reflected in:
  - Bills page (orange "Revalidation" badge)
  - Cashbook (partial amount)
  - Payroll (partial amount in Extra Conveyance)
```

### 4.4 Admin Revalidates Remaining Balance
```
Admin opens bill in "revalidation" status
→ Clicks "Revalidate" button
→ Enters additional amount to approve
→ If full remaining approved: status = "approved"
→ Additional Cash Out entry created
→ Additional amount added to next payslip
→ Reflected in: Cashbook, Payroll
```

### 4.5 Admin Rejects Bill
```
Admin clicks "Reject"
→ Bill status = "rejected"
→ No Cash Out entry created
→ No amount added to payslip
→ Notification sent to: Employee
→ Reflected in: Employee's rejected bills
```

---

## 5. ADVANCES (SALARY ADVANCE)

### 5.1 Employee Requests Advance
```
Employee submits advance request
→ Enters: Amount, Reason, Deduction Month/Year
→ Advance status = "pending"
→ Notification sent to: Admin
→ Reflected in: Bills & Advances page (Advances tab)
```

### 5.2 Admin Approves Advance
```
Admin approves advance request
→ Advance status = "approved"
→ Cash Out entry created (category: "advance")
→ Notification sent to: Employee
→ Advance marked for deduction in specified month
→ Reflected in:
  - Cashbook (Cash Out - Advance given)
  - Employee's approved advances
```

### 5.3 Advance Deducted from Salary
```
When payslip generated for deduction month
→ System finds approved advances for that month
→ Advance amount deducted from Net Pay
→ Advance marked as "is_deducted = true"
→ Reflected in:
  - Payslip breakdown (Advance Deduction line)
  - Payroll calculation
→ Formula: Net Pay = Earned Salary + Conveyance + Bills - Advance
```

---

## 6. PAYROLL & PAYSLIPS

### 6.1 Admin Creates Monthly Payslips (Preview)
```
Admin goes to Payroll → Selects Month/Year
→ Clicks "Create Payslips"
→ System creates payslip for each employee
→ Initial status = "preview"
→ Initial Net Pay = ₹0 (awaiting attendance data)
→ Reflected in: Payroll page with "Preview" badge
```

### 6.2 Admin Refreshes/Recalculates Payslip
```
Admin clicks "Refresh" icon on payslip
→ System fetches attendance data for that month
→ Calculates:
  - Working days (from attendance records)
  - Total Duty Earned = Sum of daily_duty_amount
  - Total Conveyance = Sum of conveyance from attendance
  - Extra Conveyance = Approved bills for that month
  - Advance Deduction = Approved advances for that month
  - Audit Expenses = Approved audit expenses for that month
→ Distributes Total Duty Earned proportionally:
  - Basic = (Basic% of CTC) × (Earned/Total Monthly)
  - HRA = (HRA% of CTC) × (Earned/Total Monthly)
  - DA, Other Allowances similarly
→ Net Pay = Total Duty Earned + Conveyance + Bills + Audit - Advance
→ Reflected in: Updated payslip breakdown
```

### 6.3 Admin Generates Payslip (Final)
```
Admin clicks "Generate" on preview payslip
→ Final calculation performed
→ Payslip status = "generated"
→ Cash Out entry created for SALARY (Duty Earned + Conveyance - Advance only)
→ Note: Bills NOT included in salary Cash Out (they have separate entries)
→ Reflected in:
  - Payroll page (status changes to "Generated")
  - Cashbook (Cash Out - Salary)
→ Payslip ready for settlement
```

### 6.4 Admin Settles Payslip
```
Admin clicks "Settle" on generated payslip
→ Payslip status = "settled"
→ Employee can view/download payslip
→ Reflected in:
  - Employee's Payslips page
  - Reports (Payroll Report)
→ Exportable as: PDF payslip
```

### 6.5 Payroll Calculation Formula
```
EARNED SALARY CALCULATION:
─────────────────────────
Daily Duty Amount = Monthly CTC ÷ Working Days in Month
Total Duty Earned = Sum of (daily_duty_amount for each present day)
Half Day = 50% of Daily Duty Amount

SALARY DISTRIBUTION (Proportional):
───────────────────────────────────
If employee earns 70% of month:
  Basic = (Basic Component) × 0.70
  HRA = (HRA Component) × 0.70
  DA = (DA Component) × 0.70
  ... and so on

NET PAY FORMULA:
────────────────
Net Pay = Total Duty Earned 
        + Attendance Conveyance (from daily attendance)
        + Extra Conveyance (approved bills)
        + Audit Expenses (approved audit claims)
        - Advance Deduction

CASH OUT FOR SALARY:
────────────────────
Salary Cash Out = Total Duty Earned + Attendance Conveyance - Advance
(Bills & Audit Expenses have separate Cash Out entries to avoid double counting)
```

---

## 7. CASHBOOK

### 7.1 Cash In Entry
```
Admin adds Cash In entry
→ Selects: Category, Amount, Date, Description
→ Entry saved in cash_in collection
→ Reflected in:
  - Cashbook page (Cash In tab)
  - Monthly Cash In total
  - Dashboard summary
→ Exportable in: Cashbook Report
```

### 7.2 Cash Out Entry (Manual)
```
Admin adds Cash Out entry
→ Selects: Category, Amount, Date, Description
→ Entry saved in cash_out collection
→ Reflected in: Cashbook page (Cash Out tab)
→ Exportable in: Cashbook Report
```

### 7.3 Automatic Cash Out Entries
```
These are created automatically:

1. SALARY (when payslip generated):
   → Amount = Duty Earned + Conveyance - Advance
   → Category = "salary"
   → Reference = payslip_id

2. BILL (when bill approved):
   → Amount = Approved bill amount
   → Category = "bill"
   → Reference = bill_id

3. ADVANCE (when advance approved):
   → Amount = Advance amount given
   → Category = "advance"
   → Reference = advance_id

4. AUDIT EXPENSE (when audit expense approved):
   → Amount = Approved audit amount
   → Category = "audit_expense"
   → Reference = audit_id
```

### 7.4 Cashbook Summary
```
Monthly summary calculation:
→ Total Cash In = Sum of all cash_in entries
→ Total Cash Out = Sum of all cash_out entries
→ Balance = Cash In - Cash Out
→ Reflected in: Cashbook dashboard, Reports
```

---

## 8. AUDIT EXPENSES

### 8.1 Admin Creates Audit Expense
```
Admin creates audit expense entry
→ Selects: Employee, Amount, Description, Month/Year
→ Status = "pending" or "approved"
→ If approved: Cash Out entry created
→ Amount added to employee's payslip
→ Reflected in:
  - Audit Expenses page
  - Employee's payslip (if approved)
  - Cashbook (if approved)
```

---

## 9. HOLIDAYS

### 9.1 Admin Adds Holiday
```
Admin creates holiday entry
→ Enters: Date, Name, Type (full/half)
→ Holiday saved in holidays collection
→ Reflected in:
  - Holidays page
  - Attendance calendar (highlighted)
→ Note: Holidays reduce working days for salary calculation
```

---

## 10. REPORTS & EXPORTS

### 10.1 Available Reports
```
1. ATTENDANCE REPORT
   → Data from: attendance collection
   → Shows: Employee-wise daily attendance
   → Filters: Date range, Employee, Status
   → Export: Excel/PDF

2. LEAVE REPORT
   → Data from: leaves collection
   → Shows: Leave requests and status
   → Filters: Date range, Employee, Status
   → Export: Excel/PDF

3. PAYROLL REPORT
   → Data from: payslips collection
   → Shows: Monthly salary breakdown
   → Filters: Month, Year, Employee
   → Export: Excel/PDF

4. BILLS REPORT
   → Data from: bills collection
   → Shows: Expense submissions and approvals
   → Filters: Month, Year, Employee, Status
   → Export: Excel/PDF

5. CASHBOOK REPORT
   → Data from: cash_in, cash_out collections
   → Shows: All financial transactions
   → Filters: Month, Year, Category
   → Export: Excel/PDF

6. EMPLOYEE REPORT
   → Data from: users collection
   → Shows: Employee master list
   → Export: Excel/PDF
```

---

## 11. NOTIFICATIONS

### 11.1 Real-time Notifications Flow
```
EVENT                          → NOTIFIED TO
─────────────────────────────────────────────
Employee marks attendance      → Team Leader, Admin
Employee applies leave         → Team Leader, Admin
Leave approved/rejected        → Employee
Employee submits bill          → Team Leader, Admin
Bill approved/rejected         → Employee
Advance request               → Admin
Advance approved/rejected     → Employee
Payslip generated             → Employee
Payslip settled               → Employee
```

---

## 12. COMPLETE MONTHLY CYCLE FLOW

```
START OF MONTH
│
├─→ Admin sets up holidays for month
│
├─→ DAILY OPERATIONS:
│   │
│   ├─→ Employees mark attendance (QR/Direct)
│   │   → Daily duty amount recorded
│   │   → Conveyance recorded
│   │
│   ├─→ Admin/TL can manually mark attendance
│   │   → Location entered manually
│   │   → Conveyance entered manually
│   │
│   ├─→ Employees apply for leaves
│   │   → Approved leaves = no duty that day
│   │
│   └─→ Employees submit bills
│       → Approved bills → Cash Out + Payslip
│
├─→ END OF MONTH:
│   │
│   ├─→ Admin creates payslips (preview)
│   │   → All employees get preview payslip
│   │
│   ├─→ Admin refreshes each payslip
│   │   → System calculates from attendance
│   │   → Adds conveyance
│   │   → Adds approved bills
│   │   → Deducts approved advances
│   │
│   ├─→ Admin generates payslips
│   │   → Status = "generated"
│   │   → Cash Out entry created (salary only)
│   │
│   └─→ Admin settles payslips
│       → Status = "settled"
│       → Employees can download
│
└─→ REPORTS:
    → Export attendance report
    → Export payroll report
    → Export cashbook report
    → All data available for audit
```

---

## 13. DATA FLOW SUMMARY TABLE

| Action | Creates/Updates | Reflects In | Cash Impact |
|--------|-----------------|-------------|-------------|
| Mark Attendance | attendance record | Attendance, Payroll | Adds to Duty Earned |
| Apply Leave | leave record | Leaves, Attendance | FULL duty (paid leave) |
| Submit Bill | bill record | Bills page | None until approved |
| Approve Bill | bill status, cash_out | Cashbook, Payslip | Cash Out + Payslip |
| Request Advance | advance record | Advances page | None until approved |
| Approve Advance | advance status, cash_out | Cashbook | Cash Out (given) |
| Generate Payslip | payslip, cash_out | Payroll, Cashbook | Salary Cash Out |
| Settle Payslip | payslip status | Reports, Employee view | Final settlement |

---

## 14. KEY FORMULAS REFERENCE

```
DAILY DUTY AMOUNT:
  = Monthly CTC ÷ Working Days in Month

HALF DAY DUTY:
  = Daily Duty Amount × 0.5

TOTAL DUTY EARNED:
  = Sum of all daily_duty_amount for present days

NET PAY:
  = Total Duty Earned 
  + Attendance Conveyance 
  + Approved Bills 
  + Approved Audit Expenses 
  - Advance Deduction

SALARY CASH OUT (to avoid double counting):
  = Total Duty Earned + Attendance Conveyance - Advance
  (Bills & Audit have separate Cash Out entries)

MONTHLY BALANCE:
  = Total Cash In - Total Cash Out
```

---

*Last Updated: January 19, 2026*
