#!/usr/bin/env python3
"""
Specific test for QR-based attendance punch-in flow as requested by user
Testing the exact API flow:
1. POST /api/seed - seed database
2. POST /api/qr-codes with specific data
3. POST /api/attendance/punch-in?emp_id=EMP001 with the qr_data from step 2
4. Verify the response contains punch_in time, location, and conveyance_amount
5. GET /api/attendance?emp_id=EMP001 to verify the record was saved
"""

import requests
import json
from datetime import datetime

# Get backend URL from frontend .env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except:
        pass
    return "http://localhost:8001"

BASE_URL = get_backend_url()
API_URL = f"{BASE_URL}/api"

print(f"Testing QR-based attendance punch-in flow at: {API_URL}")
print("=" * 80)

def log_step(step_num, description, success, details=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"Step {step_num}: {description}")
    print(f"Result: {status}")
    if details:
        print(f"Details: {details}")
    print("-" * 60)

# Step 1: Seed database
print("STEP 1: Seeding Database")
try:
    response = requests.post(f"{API_URL}/seed")
    if response.status_code == 200:
        log_step(1, "POST /api/seed", True, "Database seeded successfully")
    else:
        log_step(1, "POST /api/seed", False, f"Status: {response.status_code}, Response: {response.text}")
        exit(1)
except Exception as e:
    log_step(1, "POST /api/seed", False, f"Exception: {str(e)}")
    exit(1)

# Step 2: Login as Team Lead and create QR code
print("STEP 2: Creating QR Code as Team Lead")
try:
    # Login as Team Lead first
    login_response = requests.post(f"{API_URL}/auth/login", json={"user_id": "TL001", "password": "tl001"})
    if login_response.status_code != 200 or not login_response.json().get("success"):
        log_step(2, "Team Lead Login", False, "Failed to login as Team Lead")
        exit(1)
    
    # Create QR code with the exact data specified in the request
    qr_data = {
        "location": "Main Office",
        "conveyance_amount": 200,
        "date": "2026-01-18",
        "created_by": "TL001"
    }
    
    response = requests.post(f"{API_URL}/qr-codes", json=qr_data)
    if response.status_code == 200:
        qr_response = response.json()
        qr_code_data = qr_response.get("qr_data")
        qr_id = qr_response.get("id")
        log_step(2, "POST /api/qr-codes", True, f"QR ID: {qr_id}, QR Data: {qr_code_data}")
    else:
        log_step(2, "POST /api/qr-codes", False, f"Status: {response.status_code}, Response: {response.text}")
        exit(1)
except Exception as e:
    log_step(2, "POST /api/qr-codes", False, f"Exception: {str(e)}")
    exit(1)

# Step 3: Test employee punch-in with QR data
print("STEP 3: Employee Punch-in with QR Data")
try:
    punch_in_payload = {"qr_data": qr_code_data}
    response = requests.post(f"{API_URL}/attendance/punch-in?emp_id=EMP001", json=punch_in_payload)
    
    if response.status_code == 200:
        attendance_response = response.json()
        
        # Step 4: Verify response contains required fields
        punch_in_time = attendance_response.get("punch_in")
        location = attendance_response.get("location")
        conveyance_amount = attendance_response.get("conveyance_amount")
        attendance_id = attendance_response.get("id")
        
        if punch_in_time and location and conveyance_amount is not None:
            log_step(3, "POST /api/attendance/punch-in", True, 
                    f"Attendance ID: {attendance_id}, Punch-in: {punch_in_time}, Location: {location}, Conveyance: ₹{conveyance_amount}")
        else:
            log_step(3, "POST /api/attendance/punch-in", False, 
                    f"Missing required fields - punch_in: {punch_in_time}, location: {location}, conveyance_amount: {conveyance_amount}")
            exit(1)
    else:
        log_step(3, "POST /api/attendance/punch-in", False, f"Status: {response.status_code}, Response: {response.text}")
        exit(1)
except Exception as e:
    log_step(3, "POST /api/attendance/punch-in", False, f"Exception: {str(e)}")
    exit(1)

# Step 5: Verify the record was saved
print("STEP 5: Verifying Attendance Record Saved")
try:
    response = requests.get(f"{API_URL}/attendance?emp_id=EMP001")
    
    if response.status_code == 200:
        attendance_records = response.json()
        
        if isinstance(attendance_records, list) and len(attendance_records) > 0:
            # Find the record we just created
            latest_record = None
            for record in attendance_records:
                if record.get("id") == attendance_id:
                    latest_record = record
                    break
            
            if latest_record:
                saved_location = latest_record.get("location")
                saved_conveyance = latest_record.get("conveyance_amount")
                saved_punch_in = latest_record.get("punch_in")
                
                log_step(5, "GET /api/attendance?emp_id=EMP001", True, 
                        f"Record found - Location: {saved_location}, Conveyance: ₹{saved_conveyance}, Punch-in: {saved_punch_in}")
            else:
                log_step(5, "GET /api/attendance?emp_id=EMP001", False, "Created attendance record not found in database")
        else:
            log_step(5, "GET /api/attendance?emp_id=EMP001", False, "No attendance records returned")
    else:
        log_step(5, "GET /api/attendance?emp_id=EMP001", False, f"Status: {response.status_code}, Response: {response.text}")
except Exception as e:
    log_step(5, "GET /api/attendance?emp_id=EMP001", False, f"Exception: {str(e)}")

print("=" * 80)
print("🏁 QR-based Attendance Punch-in Flow Test Complete")
print("=" * 80)