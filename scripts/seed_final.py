import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import random

async def seed_database():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    # Clear all data
    for coll in ['attendance', 'leaves', 'bills', 'payslips', 'qr_codes', 'advances', 
                 'notifications', 'cash_in', 'cash_out', 'loans', 'users', 'holidays', 
                 'leave_balances', 'shift_templates']:
        await db[coll].delete_many({})
    
    print("✅ Data cleared")
    
    # Seed users
    users = [
        {"id": "ADMIN001", "name": "Admin User", "email": "admin@audixsolutions.com", "phone": "+91 98765 43200", "role": "admin", "department": "Management", "designation": "Administrator", "joining_date": "2021-01-01", "salary": 100000, "salary_type": "monthly", "status": "active", "password": "admin123", "team_members": []},
        {"id": "TL001", "name": "Rajesh Verma", "email": "rajesh@audixsolutions.com", "phone": "+91 98765 43201", "role": "teamlead", "department": "Development", "designation": "Tech Lead", "joining_date": "2021-06-15", "salary": 85000, "salary_type": "monthly", "status": "active", "password": "tl001", "team_members": ["EMP001", "EMP003"]},
        {"id": "TL002", "name": "Meera Joshi", "email": "meera@audixsolutions.com", "phone": "+91 98765 43202", "role": "teamlead", "department": "Design", "designation": "Design Lead", "joining_date": "2021-08-20", "salary": 80000, "salary_type": "monthly", "status": "active", "password": "tl002", "team_members": ["EMP002"]},
        {"id": "EMP001", "name": "Rahul Kumar", "email": "rahul@audixsolutions.com", "phone": "+91 98765 43211", "role": "employee", "department": "Development", "designation": "Software Engineer", "joining_date": "2023-01-15", "salary": 50000, "salary_type": "monthly", "status": "active", "password": "emp001", "team_lead_id": "TL001", "team_members": []},
        {"id": "EMP002", "name": "Priya Singh", "email": "priya@audixsolutions.com", "phone": "+91 98765 43212", "role": "employee", "department": "Design", "designation": "UI/UX Designer", "joining_date": "2023-03-20", "salary": 45000, "salary_type": "monthly", "status": "active", "password": "emp002", "team_lead_id": "TL002", "team_members": []},
        {"id": "EMP003", "name": "Amit Sharma", "email": "amit@audixsolutions.com", "phone": "+91 98765 43213", "role": "employee", "department": "Development", "designation": "Senior Developer", "joining_date": "2022-06-10", "salary": 75000, "salary_type": "monthly", "status": "active", "password": "emp003", "team_lead_id": "TL001", "team_members": []}
    ]
    await db.users.insert_many(users)
    print("✅ Users created")
    
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
    print("✅ Holidays created")
    
    # SEED ALL 31 DAYS OF DECEMBER 2025 FOR RAHUL
    print("\n📅 Creating 31 days attendance for Rahul (December 2025)...")
    
    half_day_dates = [5, 12, 19]
    absent_dates = [26]
    
    attendance_records = []
    full_days = 0
    half_days = 0
    absent_days = 0
    total_conveyance = 0
    
    for day in range(1, 32):
        date_str = f"2025-12-{day:02d}"
        
        if day in half_day_dates:
            punch_in, punch_out, work_hours = "11:45", "17:30", 5.75
            attendance_status, conveyance, status = "half_day", 100, "present"
            half_days += 1
        elif day in absent_dates:
            punch_in, punch_out, work_hours = "14:30", "17:00", 2.5
            attendance_status, conveyance, status = "absent", 0, "absent"
            absent_days += 1
        else:
            in_min = random.randint(0, 25)
            punch_in = f"10:{in_min:02d}"
            work_hours = round(random.uniform(8.0, 9.0), 2)
            out_hour = 10 + int(work_hours)
            out_min = in_min + int((work_hours % 1) * 60)
            if out_min >= 60:
                out_hour += 1
                out_min -= 60
            punch_out = f"{out_hour:02d}:{out_min:02d}"
            attendance_status, conveyance, status = "full_day", 200, "present"
            full_days += 1
        
        total_conveyance += conveyance
        
        attendance_records.append({
            "id": f"ATT{day:04d}",
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
        })
    
    await db.attendance.insert_many(attendance_records)
    print(f"✅ 31 attendance records: {full_days} Full + {half_days} Half + {absent_days} Absent")
    
    # CREATE PAYSLIP WITH NEW BREAKDOWN (Option C)
    # Rahul's salary: ₹50,000
    total_salary = 50000
    
    # Breakdown: 60% Basic, 24% HRA, 16% Special Allowance
    basic = round(total_salary * 0.60, 2)           # ₹30,000
    hra = round(total_salary * 0.24, 2)             # ₹12,000
    special_allowance = round(total_salary * 0.16, 2)  # ₹8,000
    
    # Conveyance from attendance
    attendance_conveyance = total_conveyance  # ₹5,700
    
    # Attendance adjustment (half days = 0.5 day deduction, absent = 1 day deduction)
    daily_rate = total_salary / 26  # ~₹1,923.08 per day
    attendance_adjustment = -round((half_days * 0.5 * daily_rate) + (absent_days * daily_rate), 2)
    
    # Gross = Basic + HRA + Special Allowance + Conveyance
    gross = basic + hra + special_allowance + attendance_conveyance
    
    # No PF/Tax deductions
    deductions = 0
    
    # Net Pay
    net_pay = round(gross + attendance_adjustment - deductions, 2)
    
    payslip = {
        "id": "PAY001",
        "emp_id": "EMP001",
        "emp_name": "Rahul Kumar",
        "month": "December",
        "year": 2025,
        "breakdown": {
            "basic": basic,
            "hra": hra,
            "special_allowance": special_allowance,
            "conveyance": attendance_conveyance,
            "leave_adjustment": 0,
            "extra_conveyance": 0,
            "previous_pending_allowances": 0,
            "attendance_adjustment": attendance_adjustment,
            "full_days": full_days,
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
    await db.payslips.insert_one(payslip)
    
    print(f"\n💰 PAYSLIP BREAKDOWN (Option C):")
    print(f"   Total Salary: ₹{total_salary:,}")
    print(f"   ─────────────────────────────")
    print(f"   Basic (60%):           ₹{basic:>10,.2f}")
    print(f"   HRA (24%):             ₹{hra:>10,.2f}")
    print(f"   Special Allowance (16%):₹{special_allowance:>10,.2f}")
    print(f"   Conveyance:            ₹{attendance_conveyance:>10,.2f}")
    print(f"   ─────────────────────────────")
    print(f"   Gross Pay:             ₹{gross:>10,.2f}")
    print(f"   Attendance Adj:        ₹{attendance_adjustment:>10,.2f}")
    print(f"   Deductions (PF/Tax):   ₹{deductions:>10,.2f}")
    print(f"   ─────────────────────────────")
    print(f"   NET PAY:               ₹{net_pay:>10,.2f}")
    
    # Cash Out entry
    await db.cash_out.insert_one({
        "id": "CO001",
        "category": "salary",
        "description": "Salary - Rahul Kumar (December 2025)",
        "amount": net_pay,
        "date": "2026-01-05",
        "month": "January",
        "year": 2026,
        "is_auto": True,
        "created_at": datetime.utcnow().isoformat()
    })
    
    print("\n✅ ALL DONE!")
    print("\n🔐 Test Credentials:")
    print("   Admin: ADMIN001 / admin123")
    print("   Team Lead: TL001 / tl001")
    print("   Employee: EMP001 / emp001")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
