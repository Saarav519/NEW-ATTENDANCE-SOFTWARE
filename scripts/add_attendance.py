#!/usr/bin/env python3
"""
Script to add monthly attendance for testing
Usage:
  python3 add_attendance.py <EMP_ID> <MONTH> <YEAR>
  
Examples:
  python3 add_attendance.py EMP001 December 2025
  python3 add_attendance.py EMP002 January 2026
"""

import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient

MONTHS = {
    'January': 31, 'February': 28, 'March': 31, 'April': 30,
    'May': 31, 'June': 30, 'July': 31, 'August': 31,
    'September': 30, 'October': 31, 'November': 30, 'December': 31
}

async def add_attendance(emp_id, month, year):
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.test_database
    
    # Validate inputs
    if month not in MONTHS:
        print(f"❌ Invalid month: {month}")
        print(f"Valid months: {', '.join(MONTHS.keys())}")
        return
    
    # Get employee details
    user = await db.users.find_one({"id": emp_id}, {"_id": 0})
    if not user:
        print(f"❌ Employee {emp_id} not found")
        return
    
    print(f"📅 Adding {month} {year} attendance for {user['name']} ({emp_id})")
    
    # Get days in month
    days_in_month = MONTHS[month]
    if month == 'February' and year % 4 == 0:  # Leap year
        days_in_month = 29
    
    # Delete existing attendance for this month
    delete_result = await db.attendance.delete_many({
        "emp_id": emp_id,
        "month": month,
        "year": year
    })
    if delete_result.deleted_count > 0:
        print(f"🗑️  Deleted {delete_result.deleted_count} existing records")
    
    attendance_records = []
    month_num = list(MONTHS.keys()).index(month) + 1
    
    for day in range(1, days_in_month + 1):
        date_str = f"{year}-{month_num:02d}-{day:02d}"
        
        # Include ALL days (including Sundays/holidays)
        
        # Create attendance record with full day status
        record = {
            "id": f"ATT{year}{month_num:02d}{day:02d}{emp_id}",
            "emp_id": emp_id,
            "emp_name": user['name'],
            "date": date_str,
            "punch_in": f"{date_str}T10:00:00+00:00",
            "punch_out": f"{date_str}T19:00:00+00:00",
            "location": "Main Office",
            "shift_type": "day",
            "shift_start": "10:00",
            "shift_end": "19:00",
            "attendance_status": "full_day",
            "conveyance_amount": 200.0,
            "created_at": f"{date_str}T10:00:00+00:00",
            "month": month,
            "year": year
        }
        
        attendance_records.append(record)
    
    # Insert all records
    if attendance_records:
        await db.attendance.insert_many(attendance_records)
        print(f"✅ Added {len(attendance_records)} attendance records")
        print(f"   Full working days: {len(attendance_records)}")
        print(f"   Sundays/holidays skipped: {days_in_month - len(attendance_records)}")
        print(f"\n🎯 Now you can generate payslip for {emp_id} - {month} {year}")
    else:
        print("❌ No records to add")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python3 add_attendance.py <EMP_ID> <MONTH> <YEAR>")
        print("\nExamples:")
        print("  python3 add_attendance.py EMP001 December 2025")
        print("  python3 add_attendance.py EMP002 January 2026")
        sys.exit(1)
    
    emp_id = sys.argv[1]
    month = sys.argv[2]
    year = int(sys.argv[3])
    
    asyncio.run(add_attendance(emp_id, month, year))
