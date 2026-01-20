# Cashbook - Loan Section Flowchart

## Overview
The Loan section in Cashbook helps track company loans (bank loans, personal loans, etc.) and their EMI payments. It supports two types of loans:
1. **EMI-Based Loans** - Regular monthly EMI payments with interest
2. **Lump Sum Loans** - Pay anytime, no fixed EMI schedule

---

## 1. LOAN TYPES

### 1.1 EMI-Based Loan
```
Best for: Bank loans, Vehicle loans, Equipment loans
Features:
  - Fixed EMI amount
  - EMI payment day (1-28 of each month)
  - Interest rate tracking
  - Auto-calculated principal/interest split
  - Loan tenure in months
```

### 1.2 Lump Sum Loan
```
Best for: Personal loans, Informal loans
Features:
  - No fixed EMI
  - Due date for full payment
  - Pay any amount anytime
  - Full amount goes to principal (no interest split)
```

---

## 2. LOAN CREATION FLOW

### 2.1 Create EMI-Based Loan (NEW or CURRENT)
```
Admin goes to Cashbook → Loans tab → Add Loan

→ Fills in:
  - Loan Name (e.g., "HDFC Vehicle Loan")
  - Lender Name (e.g., "HDFC Bank")
  - Total Loan Amount (e.g., ₹5,00,000)
  - Loan Type: EMI-Based
  - EMI Amount (e.g., ₹15,000)
  - EMI Day (e.g., 10th of each month)
  - Interest Rate (e.g., 9.5%)
  - Loan Tenure (e.g., 36 months)
  - Loan Start Date (can be past date!)

→ System creates loan with:
  - Status: ACTIVE
  - Remaining Balance: ₹5,00,000
  - Total Paid: ₹0
  - EMIs Paid: 0

→ Reflected in:
  - Loans list
  - Loan Summary (Active Loans, Total Remaining)
```

### 2.2 Create HISTORICAL EMI-Based Loan (Past Start Date) ⭐ NEW
```
When loan start date is in the past, system AUTO-GENERATES historical EMIs:

Example:
  - Loan Start Date: November 1, 2025
  - EMI Day: 10th
  - Today's Date: January 20, 2026
  - EMI Amount: ₹15,000

→ System automatically calculates EMI dates that have passed:
  - November 10, 2025 ✓ (past)
  - December 10, 2025 ✓ (past)
  - January 10, 2026 ✓ (past)

→ System AUTO-CREATES for each past EMI:
  1. EMI Payment Record (with principal/interest split)
  2. Cash Out Entry (category: "loan_emi", marked [Historical])
  3. Updates loan balance

→ Result after adding loan:
  - Total Paid: ₹45,000 (3 EMIs)
  - EMIs Paid: 3
  - Remaining Balance: ₹4,66,612 (reduced)
  - Cash Out shows 3 historical entries

→ For FUTURE EMIs (February onwards):
  - Admin manually clicks "Pay EMI" each month
  - Normal flow continues
```

### 2.3 Create Lump Sum Loan
```
Admin goes to Cashbook → Loans tab → Add Loan

→ Fills in:
  - Loan Name (e.g., "Personal Loan from Partner")
  - Lender Name
  - Total Loan Amount
  - Loan Type: Lump Sum
  - Due Date (when full payment expected)
  - Loan Start Date

→ System creates loan with:
  - Status: ACTIVE
  - Remaining Balance: Full amount
  - No EMI fields
  - NO historical payments (lump sum has no EMI schedule)

→ Reflected in:
  - Loans list
  - Loan Summary
```

---

## 3. EMI PAYMENT FLOW (EMI-Based Loans)

### 3.1 Regular EMI Payment
```
Admin clicks "Pay EMI" on an active EMI-based loan

→ Dialog opens with:
  - EMI Amount (pre-filled from loan)
  - Payment Date
  - Notes (optional)

→ System calculates:
  - Interest Amount = (Remaining Balance × Annual Rate) / 12
  - Principal Amount = EMI Amount - Interest Amount

Example for ₹15,000 EMI on ₹5,00,000 balance at 9.5%:
  - Monthly Interest = (5,00,000 × 9.5%) / 12 = ₹3,958
  - Principal Paid = 15,000 - 3,958 = ₹11,042
  - New Balance = 5,00,000 - 11,042 = ₹4,88,958

→ On payment:
  - EMI Payment record created
  - Loan balance updated
  - EMIs Paid counter incremented
  - Cash Out entry created (category: "loan_emi")
  
→ Reflected in:
  - Loan Details (updated balance)
  - EMI Payment History
  - Cashbook (Cash Out section)
  - Reports (Loan payments)
```

### 3.2 Extra Payment (Part Prepayment)
```
Admin clicks "Pay EMI" and checks "Extra Payment"

→ Enters extra amount (e.g., ₹50,000)

→ System calculates:
  - Interest Amount = Regular monthly interest
  - Principal Amount = Extra Amount - Interest

OR Admin can manually specify:
  - Principal Amount
  - Interest Amount

→ On payment:
  - Payment record created (marked as extra)
  - Loan balance reduced more than regular EMI
  - Cash Out entry created

→ Benefits:
  - Reduces remaining balance faster
  - May close loan earlier
  - Future EMIs have lower interest component
```

### 3.3 Loan Closure via EMI
```
When EMI payment reduces balance to ₹0:

→ System automatically:
  - Sets Loan Status = "CLOSED"
  - Records final payment
  - Creates Cash Out entry

→ Loan shows as "Closed" in list
→ No more payments allowed
```

---

## 4. LUMP SUM PAYMENT FLOW

### 4.1 Pay Lump Sum
```
Admin clicks "Pay" on a lump sum loan

→ Dialog opens with:
  - Payment Amount (can be any amount)
  - Payment Date
  - Notes

→ Payment characteristics:
  - Full amount goes to principal
  - No interest calculation
  - Can pay partial or full amount

→ On payment:
  - Payment record created
  - Loan balance reduced
  - Cash Out entry created

→ If full balance paid:
  - Loan Status = "CLOSED"
```

---

## 5. PRECLOSURE FLOW

### 5.1 Preclose EMI-Based Loan
```
Admin clicks "Preclose" on an active loan

→ Dialog shows:
  - Current Outstanding: Remaining Balance
  - Preclosure Amount (editable, default = remaining)
  - Preclosure Date
  - Notes

→ On preclosure:
  - Final payment recorded (marked as preclose)
  - Loan Status = "PRECLOSED"
  - Cash Out entry created
  - Loan fully settled

→ Reflected in:
  - Loan shows "Preclosed" badge
  - Cashbook (large Cash Out entry)
```

---

## 6. CASH OUT INTEGRATION

### 6.1 Auto Cash Out Entries
```
Every loan payment automatically creates Cash Out:

EMI PAYMENT:
  - Category: "loan_emi"
  - Description: "Loan EMI - {Loan Name} ({Lender})"
  - Amount: EMI amount
  - Reference Type: "emi_payment"

EXTRA PAYMENT:
  - Category: "loan_emi"
  - Description: "Loan Extra Payment - {Loan Name} ({Lender})"
  - Amount: Extra payment amount
  - Reference Type: "emi_payment"

LUMP SUM PAYMENT:
  - Category: "loan_emi"
  - Description: "Loan Payment - {Loan Name} ({Lender})"
  - Amount: Payment amount
  - Reference Type: "lumpsum_payment"

PRECLOSURE:
  - Category: "loan_emi"
  - Description: "Loan Preclosure - {Loan Name}"
  - Amount: Preclosure amount
  - Reference Type: "preclosure"
```

---

## 7. LOAN SUMMARY & TRACKING

### 7.1 Summary Dashboard
```
Shows:
  - Total Loans: Count of all loans
  - Active Loans: Count of loans with status ACTIVE
  - Total Loan Amount: Sum of all loan amounts
  - Total Paid: Sum of all payments made
  - Total Remaining: Sum of remaining balances (active loans only)
  - Upcoming EMIs This Month: EMIs due this month (not yet paid)
```

### 7.2 Individual Loan Tracking
```
Each loan shows:
  - Loan Details (name, lender, type, dates)
  - Progress Bar (% paid vs total)
  - Remaining Balance
  - EMIs Paid count
  - Total Paid amount
  - Interest Rate (for EMI-based)
  - Status badge (Active/Closed/Preclosed)
```

---

## 8. PAYMENT HISTORY

### 8.1 View Payment History
```
Admin clicks "History" on a loan

→ Shows all payments:
  - Payment Date
  - Amount Paid
  - Principal Component
  - Interest Component
  - Balance After Payment
  - Payment Type (Regular/Extra/Lumpsum/Preclose)
```

---

## 9. EDIT & DELETE RULES

### 9.1 Edit Loan
```
ALLOWED: Only if no payments have been made
  - Can modify: Amount, EMI, Interest Rate, Dates, etc.

NOT ALLOWED: After any payment is made
  - Reason: Would break payment history accuracy
```

### 9.2 Delete Loan
```
ALLOWED: Only if no EMI payments recorded
  - Removes loan completely

NOT ALLOWED: After any EMI paid
  - Reason: Historical data integrity
```

---

## 10. COMPLETE LOAN LIFECYCLE FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOAN LIFECYCLE                               │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ▼
┌─────────────────┐
│  CREATE LOAN    │
│  (EMI or Lump)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────────────┐
│  Status: ACTIVE │────▶│ Can Edit/Delete         │
│  Balance: Full  │     │ (only if no payments)   │
└────────┬────────┘     └─────────────────────────┘
         │
         │ Make Payments
         │
         ▼
┌─────────────────────────────────────────────┐
│           PAYMENT OPTIONS                    │
├─────────────────────────────────────────────┤
│  EMI-Based:                                  │
│    • Regular EMI Payment                     │
│    • Extra Payment (prepay)                  │
│    • Preclose (pay full remaining)           │
├─────────────────────────────────────────────┤
│  Lump Sum:                                   │
│    • Pay any amount anytime                  │
│    • Full payment closes loan                │
└────────┬────────────────────────────────────┘
         │
         │ Each Payment
         │
         ▼
┌─────────────────────────────────────────────┐
│           ON EACH PAYMENT                    │
├─────────────────────────────────────────────┤
│  1. Payment record created                   │
│  2. Loan balance reduced                     │
│  3. Cash Out entry created                   │
│  4. Check if balance = 0                     │
└────────┬────────────────────────────────────┘
         │
         │ Is Balance = 0?
         │
    ┌────┴────┐
    │         │
    ▼         ▼
   NO        YES
    │         │
    │         ▼
    │    ┌─────────────────┐
    │    │ Status: CLOSED  │
    │    │ or PRECLOSED    │
    │    │ (if prepayment) │
    │    └────────┬────────┘
    │             │
    ▼             │
┌───────────┐     │
│ Continue  │     │
│ Payments  │     │
└───────────┘     │
                  │
                  ▼
              END (Loan Settled)
```

---

## 11. REPORTS & EXPORTS

### 11.1 Loan Export
```
Admin clicks "Export" → Loans

→ Downloads CSV/Excel with:
  - Loan ID
  - Loan Name
  - Lender
  - Total Amount
  - Remaining Balance
  - Total Paid
  - Status
  - Interest Rate
  - Start Date
```

### 11.2 Reflected in Cashbook Reports
```
All loan payments appear in:
  - Cash Out report (under "loan_emi" category)
  - Monthly summary (as expense)
```

---

## 12. KEY FORMULAS

### 12.1 Interest Calculation (EMI-Based)
```
Monthly Interest = (Remaining Balance × Annual Interest Rate) / 12

Example:
  Balance: ₹5,00,000
  Annual Rate: 9.5%
  Monthly Interest = (5,00,000 × 0.095) / 12 = ₹3,958.33
```

### 12.2 Principal in EMI
```
Principal Paid = EMI Amount - Interest Amount

Example:
  EMI: ₹15,000
  Interest: ₹3,958
  Principal: ₹15,000 - ₹3,958 = ₹11,042
```

### 12.3 New Balance After Payment
```
New Balance = Previous Balance - Principal Paid

Example:
  Previous: ₹5,00,000
  Principal: ₹11,042
  New Balance: ₹5,00,000 - ₹11,042 = ₹4,88,958
```

---

*Last Updated: January 20, 2026*
