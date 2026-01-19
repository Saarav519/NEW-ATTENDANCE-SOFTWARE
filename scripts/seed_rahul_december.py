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
    
    print("Clearing all existing data...")
    
    # Clear all collections except keeping structure
    await db.attendance.delete_many({})
    await db.leaves.delete_many({})
    await db.bills.delete_many({})
    await db.payslips.delete_many({})
    await db.qr_codes.delete_many({})
    await db.advances.delete_many({})
    await db.notifications.delete_many({})
    await db.audit_expenses.delete_many({})
    await db.cash_in.delete_many({})
    await db.cash_out.delete_many({})
    await db.loans.delete_many({})
    await db.emi_payments.delete_many({})
    await db.payables.delete_many({})
    await db.payable_payments.delete_many({})
    
    print("All test data cleared!")
    
    # Keep users and holidays - just re-seed them
    await db.users.delete_many({})
    await db.holidays.delete_many({})
    
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
    print("Users seeded!")
    
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
    print("Holidays seeded!")
    
    # Seed leave balances
    leave_balances = [
        {"emp_id": "EMP001", "year": 2025, "casual_leave": 12, "sick_leave": 6, "vacation": 15, "casual_used": 0, "sick_used": 0, "vacation_used": 0},
        {"emp_id": "EMP002", "year": 2025, "casual_leave": 12, "sick_leave": 6, "vacation": 15, "casual_used": 0, "sick_used": 0, "vacation_used": 0},
        {"emp_id": "EMP003", "year": 2025, "casual_leave": 12, "sick_leave": 6, "vacation": 15, "casual_used": 0, "sick_used": 0, "vacation_used": 0},
        {"emp_id": "TL001", "year": 2025, "casual_leave": 15, "sick_leave": 8, "vacation": 18, "casual_used": 0, "sick_used": 0, "vacation_used": 0},
        {"emp_id": "TL002", "year": 2025, "casual_leave": 15, "sick_leave": 8, "vacation": 18, "casual_used": 0, "sick_used": 0, "vacation_used": 0},
    ]
    await db.leave_balances.delete_many({})
    await db.leave_balances.insert_many(leave_balances)
    print("Leave balances seeded!")
    
    # Seed shift templates
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
    await db.shift_templates.delete_many({})
    await db.shift_templates.insert_many(shift_templates)
    print("Shift templates seeded!")
    
    # ===== SEED RAHUL'S DECEMBER 2025 ATTENDANCE =====
    print("\nSeeding Rahul Kumar's December 2025 attendance...")
    
    december_attendance = []
    
    # December 2025 working days (excluding weekends and Christmas holiday)
    # Sundays: 7, 14, 21, 28
    # Saturdays: 6, 13, 20, 27
    # Holiday: 25 (Christmas)
    
    working_days = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 26, 29, 30, 31]
    
    attendance_id = 1
    total_conveyance = 0
    full_days = 0
    half_days = 0
    absent_days = 0
    
    for day in working_days:
        date_str = f"2025-12-{day:02d}"
        
        # Create varied attendance patterns
        # 18 full days, 3 half days, 1 absent
        if day in [5, 12, 19]:  # Half days - came late
            punch_in = "11:45"  # Late by 1hr 45min (half day)
            attendance_status = "half_day"
            conveyance = 100  # Half conveyance
            half_days += 1
        elif day == 26:  # One absent day - came very late
            punch_in = "14:30"  # Very late (absent)
            attendance_status = "absent"
            conveyance = 0
            absent_days += 1
        else:  # Full days - on time
            # Vary punch-in times slightly
            minutes = random.randint(0, 25)
            punch_in = f"10:{minutes:02d}"
            attendance_status = "full_day"
            conveyance = 200
            full_days += 1
        
        # Punch out time (work 8-9 hours)
        work_hours = random.uniform(8.0, 9.5)
        punch_in_hour = int(punch_in.split(":")[0])
        punch_in_min = int(punch_in.split(":")[1])
        punch_out_hour = punch_in_hour + int(work_hours)
        punch_out_min = punch_in_min + int((work_hours % 1) * 60)
        if punch_out_min >= 60:
            punch_out_hour += 1
            punch_out_min -= 60
        punch_out = f"{punch_out_hour:02d}:{punch_out_min:02d}"
        
        total_conveyance += conveyance
        
        attendance_record = {
            "id": f"ATT{attendance_id:04d}",
            "emp_id": "EMP001",
            "date": date_str,
            "punch_in": punch_in,
            "punch_out": punch_out,
            "status": "present" if attendance_status != "absent" else "absent",
            "attendance_status": attendance_status,
            "work_hours": round(work_hours, 2),
            "qr_code_id": f"QR{day:02d}",
            "location": "Main Office",
            "conveyance_amount": conveyance,
            "shift_type": "day",
            "shift_start": "10:00",
            "shift_end": "19:00"
        }
        december_attendance.append(attendance_record)
        attendance_id += 1
    
    await db.attendance.insert_many(december_attendance)
    print(f"Added {len(december_attendance)} attendance records for Rahul (December 2025)")
    print(f"  - Full Days: {full_days}")
    print(f"  - Half Days: {half_days}")
    print(f"  - Absent Days: {absent_days}")
    print(f"  - Total Conveyance: ₹{total_conveyance}")
    
    # ===== CREATE DECEMBER PAYSLIP FOR RAHUL =====
    print("\nGenerating December 2025 payslip for Rahul...")
    
    basic = 50000
    hra = 20000  # 40% of basic
    special_allowance = 7500  # 15% of basic
    base_conveyance = 1600
    
    # Attendance-based conveyance
    attendance_conveyance = total_conveyance
    
    # Attendance adjustment (deductions)
    working_days_in_month = 26  # Standard
    daily_rate = basic / working_days_in_month
    attendance_adjustment = -((half_days * 0.5 * daily_rate) + (absent_days * daily_rate))
    attendance_adjustment = round(attendance_adjustment, 2)
    
    gross = basic + hra + special_allowance + base_conveyance + attendance_conveyance
    deductions = round(gross * 0.1, 2)  # 10% PF, Tax
    net_pay = round(gross + attendance_adjustment - deductions, 2)
    
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
            "leave_adjustment": 0,
            "extra_conveyance": 0,
            "previous_pending_allowances": 0,
            "attendance_adjustment": attendance_adjustment,
            "full_days": full_days,
            "half_days": half_days,
            "absent_days": absent_days,
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
    print(f"Created December 2025 payslip for Rahul Kumar")
    print(f"  - Gross Pay: ₹{gross:,.2f}")
    print(f"  - Attendance Adjustment: ₹{attendance_adjustment:,.2f}")
    print(f"  - Deductions: ₹{deductions:,.2f}")
    print(f"  - Net Pay: ₹{net_pay:,.2f}")
    
    print("\n✅ Database seeding completed successfully!")
    print("\nTest Credentials:")
    print("  Admin: ADMIN001 / admin123")
    print("  Team Lead: TL001 / tl001")
    print("  Employee (Rahul): EMP001 / emp001")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
