import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timedelta
import random

async def seed_database():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'supermanage')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("=" * 60)
    print("CLEARING ALL EXISTING DATA...")
    print("=" * 60)
    
    # Clear all collections
    collections_to_clear = [
        'attendance', 'leaves', 'bills', 'payslips', 'qr_codes', 
        'advances', 'notifications', 'audit_expenses', 'cash_in', 
        'cash_out', 'loans', 'emi_payments', 'payables', 'payable_payments',
        'users', 'holidays', 'leave_balances', 'shift_templates'
    ]
    
    for collection in collections_to_clear:
        await db[collection].delete_many({})
    
    print("✅ All test data cleared!")
    
    # ==================== SEED USERS ====================
    print("\n📦 Seeding Users...")
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
    print("✅ 6 Users created")
    
    # ==================== SEED HOLIDAYS ====================
    print("\n📦 Seeding Holidays...")
    holidays = [
        {"id": "HOL001", "name": "New Year", "date": "2025-01-01", "type": "National"},
        {"id": "HOL002", "name": "Republic Day", "date": "2025-01-26", "type": "National"},
        {"id": "HOL003", "name": "Holi", "date": "2025-03-14", "type": "Festival"},
        {"id": "HOL004", "name": "Independence Day", "date": "2025-08-15", "type": "National"},
        {"id": "HOL005", "name": "Diwali", "date": "2025-10-20", "type": "Festival"},
        {"id": "HOL006", "name": "Christmas", "date": "2025-12-25", "type": "Festival"},
    ]
    await db.holidays.insert_many(holidays)
    print("✅ 6 Holidays created")
    
    # ==================== SEED SHIFT TEMPLATES ====================
    print("\n📦 Seeding Shift Templates...")
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
            "created_at": datetime.utcnow().isoformat()
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
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    await db.shift_templates.insert_many(shift_templates)
    print("✅ 2 Shift Templates created")
    
    # ==================== SEED QR CODES FOR DECEMBER ====================
    print("\n📦 Seeding QR Codes for December 2025...")
    qr_codes = []
    for day in range(1, 32):
        date_str = f"2025-12-{day:02d}"
        qr_doc = {
            "id": f"QR{day:02d}DEC",
            "location": "Main Office",
            "conveyance_amount": 200,
            "date": date_str,
            "created_by": "TL001",
            "shift_type": "day",
            "shift_start": "10:00",
            "shift_end": "19:00",
            "qr_data": f'{{"id": "QR{day:02d}DEC", "location": "Main Office", "conveyance": 200, "date": "{date_str}", "created_by": "TL001", "shift_type": "day", "shift_start": "10:00", "shift_end": "19:00"}}',
            "created_at": datetime.utcnow().isoformat(),
            "is_active": True
        }
        qr_codes.append(qr_doc)
    await db.qr_codes.insert_many(qr_codes)
    print("✅ 31 QR Codes created for December 2025")
    
    # ==================== SEED RAHUL'S FULL DECEMBER ATTENDANCE (31 DAYS) ====================
    print("\n" + "=" * 60)
    print("📅 SEEDING RAHUL'S DECEMBER 2025 ATTENDANCE (ALL 31 DAYS)")
    print("=" * 60)
    
    december_attendance = []
    
    # December 2025 calendar:
    # Sundays: 7, 14, 21, 28
    # Saturdays: 6, 13, 20, 27
    # Holiday: 25 (Christmas)
    
    sundays = [7, 14, 21, 28]
    saturdays = [6, 13, 20, 27]
    holidays_dec = [25]  # Christmas
    
    # Attendance pattern for 31 days:
    # - Full days: Most working days (on time)
    # - Half days: 3 days (late arrival)
    # - Absent: 1 day (very late)
    # - Weekends: Working but marked as weekend shift
    # - Holiday: Off (Christmas)
    
    half_day_dates = [5, 12, 19]  # 3 half days
    absent_dates = [26]  # 1 absent day
    
    attendance_id = 1
    total_conveyance = 0
    full_days = 0
    half_days = 0
    absent_days = 0
    weekend_days = 0
    holiday_offs = 0
    total_work_hours = 0
    
    for day in range(1, 32):
        date_str = f"2025-12-{day:02d}"
        
        # Check if holiday (Christmas)
        if day in holidays_dec:
            holiday_offs += 1
            print(f"  Dec {day:02d}: 🎄 Holiday (Christmas) - No attendance")
            continue
        
        # Determine attendance type
        is_weekend = day in sundays or day in saturdays
        
        if day in half_day_dates:
            punch_in = "11:45"  # Late by 1hr 45min
            attendance_status = "half_day"
            conveyance = 100  # Half conveyance
            status = "present"
            half_days += 1
            work_hours = round(random.uniform(5.0, 6.5), 2)
            day_type = "Half Day (Late)"
        elif day in absent_dates:
            punch_in = "14:30"  # Very late
            attendance_status = "absent"
            conveyance = 0
            status = "absent"
            absent_days += 1
            work_hours = round(random.uniform(3.0, 4.5), 2)
            day_type = "Absent (Very Late)"
        elif is_weekend:
            # Weekend work - still counts but different
            minutes = random.randint(0, 20)
            punch_in = f"10:{minutes:02d}"
            attendance_status = "full_day"
            conveyance = 250  # Extra weekend conveyance
            status = "present"
            weekend_days += 1
            work_hours = round(random.uniform(6.0, 8.0), 2)
            day_type = "Weekend (Full Day)"
        else:
            # Normal full day
            minutes = random.randint(0, 25)
            punch_in = f"10:{minutes:02d}"
            attendance_status = "full_day"
            conveyance = 200
            status = "present"
            full_days += 1
            work_hours = round(random.uniform(8.0, 9.5), 2)
            day_type = "Full Day"
        
        # Calculate punch out time
        punch_in_hour = int(punch_in.split(":")[0])
        punch_in_min = int(punch_in.split(":")[1])
        punch_out_hour = punch_in_hour + int(work_hours)
        punch_out_min = punch_in_min + int((work_hours % 1) * 60)
        if punch_out_min >= 60:
            punch_out_hour += 1
            punch_out_min -= 60
        punch_out = f"{punch_out_hour:02d}:{punch_out_min:02d}"
        
        total_conveyance += conveyance
        total_work_hours += work_hours
        
        day_name = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][datetime(2025, 12, day).weekday()]
        print(f"  Dec {day:02d} ({day_name}): {day_type} | {punch_in}-{punch_out} | {work_hours}h | ₹{conveyance}")
        
        attendance_record = {
            "id": f"ATT{attendance_id:04d}",
            "emp_id": "EMP001",
            "date": date_str,
            "punch_in": punch_in,
            "punch_out": punch_out,
            "status": status,
            "attendance_status": attendance_status,
            "work_hours": work_hours,
            "qr_code_id": f"QR{day:02d}DEC",
            "location": "Main Office",
            "conveyance_amount": conveyance,
            "shift_type": "day",
            "shift_start": "10:00",
            "shift_end": "19:00"
        }
        december_attendance.append(attendance_record)
        attendance_id += 1
    
    await db.attendance.insert_many(december_attendance)
    
    print("\n" + "-" * 40)
    print("📊 ATTENDANCE SUMMARY:")
    print("-" * 40)
    print(f"  Total Days Recorded: {len(december_attendance)}")
    print(f"  Full Days (Weekdays): {full_days}")
    print(f"  Weekend Days: {weekend_days}")
    print(f"  Half Days: {half_days}")
    print(f"  Absent Days: {absent_days}")
    print(f"  Holiday (Off): {holiday_offs}")
    print(f"  Total Conveyance: ₹{total_conveyance:,}")
    print(f"  Total Work Hours: {total_work_hours:.2f}h")
    
    # ==================== SEED LEAVE REQUEST ====================
    print("\n📦 Seeding Leave Request for Rahul...")
    leave_doc = {
        "id": "LV001",
        "emp_id": "EMP001",
        "emp_name": "Rahul Kumar",
        "type": "Casual Leave",
        "from_date": "2025-12-25",
        "to_date": "2025-12-25",
        "days": 1,
        "reason": "Christmas Holiday",
        "status": "approved",
        "applied_on": "2025-12-20",
        "approved_by": "TL001",
        "approved_on": "2025-12-21"
    }
    await db.leaves.insert_one(leave_doc)
    print("✅ 1 Leave request created (Christmas)")
    
    # ==================== SEED BILL SUBMISSION ====================
    print("\n📦 Seeding Bill Submission for Rahul...")
    bill_doc = {
        "id": "BILL001",
        "emp_id": "EMP001",
        "emp_name": "Rahul Kumar",
        "month": "December",
        "year": 2025,
        "items": [
            {"date": "2025-12-05", "location": "Client Site A", "description": "Travel Expense", "amount": 500},
            {"date": "2025-12-12", "location": "Client Site B", "description": "Lunch Meeting", "amount": 350},
            {"date": "2025-12-19", "location": "Conference", "description": "Conference Registration", "amount": 1500}
        ],
        "total_amount": 2350,
        "remarks": "December work expenses",
        "status": "approved",
        "submitted_on": "2025-12-31",
        "approved_amount": 2350,
        "approved_by": "TL001",
        "approved_on": "2026-01-02"
    }
    await db.bills.insert_one(bill_doc)
    print("✅ 1 Bill submission created (₹2,350)")
    
    # ==================== GENERATE DECEMBER PAYSLIP ====================
    print("\n" + "=" * 60)
    print("💰 GENERATING DECEMBER 2025 PAYSLIP FOR RAHUL")
    print("=" * 60)
    
    basic = 50000
    hra = 20000  # 40% of basic
    special_allowance = 7500  # 15% of basic
    base_conveyance = 1600
    
    # Attendance-based conveyance (from attendance records)
    attendance_conveyance = total_conveyance
    
    # Extra conveyance from approved bills
    extra_conveyance = 2350  # Approved bill amount
    
    # Attendance adjustment (deductions for half days and absents)
    working_days_in_month = 26  # Standard
    daily_rate = basic / working_days_in_month
    
    # Half day = 0.5 day deduction, Absent = 1 day deduction
    attendance_adjustment = -((half_days * 0.5 * daily_rate) + (absent_days * daily_rate))
    attendance_adjustment = round(attendance_adjustment, 2)
    
    # Leave adjustment (1 day approved leave - Christmas)
    leave_adjustment = 0  # Approved leave, no deduction
    
    gross = basic + hra + special_allowance + base_conveyance + attendance_conveyance + extra_conveyance
    deductions = round(gross * 0.1, 2)  # 10% PF, Tax
    net_pay = round(gross + attendance_adjustment + leave_adjustment - deductions, 2)
    
    december_payslip = {
        "id": "PAY001",
        "emp_id": "EMP001",
        "emp_name": "Rahul Kumar",
        "month": "December",
        "year": 2025,
        "breakdown": {
            "basic": basic,
            "hra": hra,
            "special_allowance": special_allowance,
            "conveyance": base_conveyance + attendance_conveyance,
            "leave_adjustment": leave_adjustment,
            "extra_conveyance": extra_conveyance,
            "previous_pending_allowances": 0,
            "attendance_adjustment": attendance_adjustment,
            "full_days": full_days + weekend_days,  # Include weekends in full days
            "half_days": half_days,
            "absent_days": absent_days,
            "audit_expenses": 0,
            "advance_deduction": 0,
            "gross_pay": round(gross, 2),
            "deductions": deductions,
            "net_pay": net_pay
        },
        "status": "settled",
        "created_on": "2025-12-31",
        "paid_on": "2026-01-05",
        "settled_on": "2026-01-05"
    }
    
    await db.payslips.insert_one(december_payslip)
    
    print("\n💵 PAYSLIP BREAKDOWN:")
    print("-" * 40)
    print(f"  Basic:               ₹{basic:>10,}")
    print(f"  HRA:                 ₹{hra:>10,}")
    print(f"  Special Allowance:   ₹{special_allowance:>10,}")
    print(f"  Base Conveyance:     ₹{base_conveyance:>10,}")
    print(f"  Attendance Conv:     ₹{attendance_conveyance:>10,}")
    print(f"  Extra Conv (Bills):  ₹{extra_conveyance:>10,}")
    print("-" * 40)
    print(f"  Gross Pay:           ₹{gross:>10,.2f}")
    print(f"  Attendance Adj:      ₹{attendance_adjustment:>10,.2f}")
    print(f"  Deductions (10%):    ₹{-deductions:>10,.2f}")
    print("-" * 40)
    print(f"  NET PAY:             ₹{net_pay:>10,.2f}")
    print("-" * 40)
    
    # ==================== SEED LEAVE BALANCES ====================
    print("\n📦 Seeding Leave Balances...")
    leave_balances = [
        {"emp_id": "EMP001", "year": 2025, "casual_leave": 12, "sick_leave": 6, "vacation": 15, "casual_used": 1, "sick_used": 0, "vacation_used": 0},
        {"emp_id": "EMP002", "year": 2025, "casual_leave": 12, "sick_leave": 6, "vacation": 15, "casual_used": 0, "sick_used": 0, "vacation_used": 0},
        {"emp_id": "EMP003", "year": 2025, "casual_leave": 12, "sick_leave": 6, "vacation": 15, "casual_used": 0, "sick_used": 0, "vacation_used": 0},
        {"emp_id": "TL001", "year": 2025, "casual_leave": 15, "sick_leave": 8, "vacation": 18, "casual_used": 0, "sick_used": 0, "vacation_used": 0},
        {"emp_id": "TL002", "year": 2025, "casual_leave": 15, "sick_leave": 8, "vacation": 18, "casual_used": 0, "sick_used": 0, "vacation_used": 0},
    ]
    await db.leave_balances.insert_many(leave_balances)
    print("✅ Leave balances created")
    
    # ==================== SEED CASH OUT (AUTO FROM PAYSLIP) ====================
    print("\n📦 Seeding Cash Out entries...")
    cash_out_entries = [
        {
            "id": "CO001",
            "category": "salary",
            "description": f"Salary - Rahul Kumar (December 2025)",
            "amount": net_pay,
            "date": "2026-01-05",
            "reference_id": "PAY001",
            "reference_type": "payslip",
            "is_auto": True,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "CO002",
            "category": "bills",
            "description": f"Bill Reimbursement - Rahul Kumar (December 2025)",
            "amount": 2350,
            "date": "2026-01-02",
            "reference_id": "BILL001",
            "reference_type": "bill",
            "is_auto": True,
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    await db.cash_out.insert_many(cash_out_entries)
    print("✅ 2 Cash Out entries created")
    
    # ==================== SUMMARY ====================
    print("\n" + "=" * 60)
    print("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print("\n📋 DATA SUMMARY:")
    print(f"  • Users: 6")
    print(f"  • Holidays: 6")
    print(f"  • QR Codes: 31 (December 2025)")
    print(f"  • Attendance Records: {len(december_attendance)} (Rahul - Dec 2025)")
    print(f"  • Leave Requests: 1 (Christmas)")
    print(f"  • Bill Submissions: 1 (₹2,350)")
    print(f"  • Payslips: 1 (December 2025 - ₹{net_pay:,.2f})")
    print(f"  • Cash Out Entries: 2")
    
    print("\n🔐 TEST CREDENTIALS:")
    print("  Admin:     ADMIN001 / admin123")
    print("  Team Lead: TL001 / tl001")
    print("  Employee:  EMP001 / emp001 (Rahul Kumar)")
    
    print("\n🔗 DATA CONNECTIONS:")
    print("  ✓ Attendance → Payslip (conveyance, adjustments)")
    print("  ✓ Leave → Payslip (leave adjustment)")
    print("  ✓ Bills → Payslip (extra conveyance)")
    print("  ✓ Payslip → Cash Out (salary disbursement)")
    print("  ✓ Bills → Cash Out (reimbursement)")
    print("  ✓ QR Codes → Attendance (linked)")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
