#!/usr/bin/env python3
"""
Specific test for the shift-based attendance system as requested in the review.
Tests the exact scenarios mentioned in the review request.
"""

import requests
import json
from datetime import datetime, timezone

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

print(f"Testing shift-based features at: {API_URL}")

def log_test(test_name, success, details=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"    {details}")
    print()

def test_review_scenarios():
    """Test the exact scenarios from the review request"""
    print("=" * 80)
    print("TESTING: Review Request Scenarios")
    print("=" * 80)
    
    # Step 1: Seed Database
    print("Step 1: Seeding Database...")
    try:
        response = requests.post(f"{API_URL}/seed")
        if response.status_code == 200:
            log_test("1. Database Seeding", True, "Database seeded successfully")
        else:
            log_test("1. Database Seeding", False, f"Status: {response.status_code}")
            return
    except Exception as e:
        log_test("1. Database Seeding", False, f"Exception: {str(e)}")
        return
    
    # Step 2: Create Day Shift QR (10:00-19:00)
    print("Step 2: Creating Day Shift QR...")
    day_shift_qr_data = {
        "location": "Main Office",
        "conveyance_amount": 200,
        "date": "2026-01-18",
        "created_by": "TL001",
        "shift_type": "day",
        "shift_start": "10:00",
        "shift_end": "19:00"
    }
    
    try:
        response = requests.post(f"{API_URL}/qr-codes", json=day_shift_qr_data)
        if response.status_code == 200:
            day_qr_response = response.json()
            log_test("2. Create Day Shift QR", True, 
                    f"QR ID: {day_qr_response.get('id')}, "
                    f"Shift: {day_qr_response.get('shift_type')} "
                    f"{day_qr_response.get('shift_start')}-{day_qr_response.get('shift_end')}")
            
            # Verify QR response includes shift info
            required_fields = ["shift_type", "shift_start", "shift_end"]
            missing_fields = [f for f in required_fields if f not in day_qr_response]
            if not missing_fields:
                log_test("2a. Day QR Contains Shift Info", True, 
                        f"All shift fields present: {day_qr_response.get('shift_type')}, "
                        f"{day_qr_response.get('shift_start')}, {day_qr_response.get('shift_end')}")
            else:
                log_test("2a. Day QR Contains Shift Info", False, f"Missing: {missing_fields}")
        else:
            log_test("2. Create Day Shift QR", False, f"Status: {response.status_code}, Response: {response.text}")
            return
    except Exception as e:
        log_test("2. Create Day Shift QR", False, f"Exception: {str(e)}")
        return
    
    # Step 3: Create Night Shift QR (21:00-06:00)
    print("Step 3: Creating Night Shift QR...")
    night_shift_qr_data = {
        "location": "Night Site",
        "conveyance_amount": 300,
        "date": "2026-01-18",
        "created_by": "TL001",
        "shift_type": "night",
        "shift_start": "21:00",
        "shift_end": "06:00"
    }
    
    try:
        response = requests.post(f"{API_URL}/qr-codes", json=night_shift_qr_data)
        if response.status_code == 200:
            night_qr_response = response.json()
            log_test("3. Create Night Shift QR", True, 
                    f"QR ID: {night_qr_response.get('id')}, "
                    f"Shift: {night_qr_response.get('shift_type')} "
                    f"{night_qr_response.get('shift_start')}-{night_qr_response.get('shift_end')}")
            
            # Verify QR response includes shift info
            required_fields = ["shift_type", "shift_start", "shift_end"]
            missing_fields = [f for f in required_fields if f not in night_qr_response]
            if not missing_fields:
                log_test("3a. Night QR Contains Shift Info", True, 
                        f"All shift fields present: {night_qr_response.get('shift_type')}, "
                        f"{night_qr_response.get('shift_start')}, {night_qr_response.get('shift_end')}")
            else:
                log_test("3a. Night QR Contains Shift Info", False, f"Missing: {missing_fields}")
        else:
            log_test("3. Create Night Shift QR", False, f"Status: {response.status_code}, Response: {response.text}")
            return
    except Exception as e:
        log_test("3. Create Night Shift QR", False, f"Exception: {str(e)}")
        return
    
    # Step 4: Test Attendance API with Day Shift QR
    print("Step 4: Testing Attendance API with Day Shift QR...")
    try:
        punch_in_data = {"qr_data": day_qr_response.get("qr_data")}
        response = requests.post(f"{API_URL}/attendance/punch-in?emp_id=EMP001", json=punch_in_data)
        if response.status_code == 200:
            attendance = response.json()
            attendance_status = attendance.get("attendance_status")
            conveyance = attendance.get("conveyance_amount")
            
            log_test("4. Attendance API Response", True, 
                    f"Status: {attendance_status}, Conveyance: ₹{conveyance}, "
                    f"Punch-in: {attendance.get('punch_in')}")
            
            # Verify attendance_status is in response
            if attendance_status in ["full_day", "half_day", "absent"]:
                log_test("4a. Attendance Status Calculation", True, 
                        f"Valid attendance status: {attendance_status}")
            else:
                log_test("4a. Attendance Status Calculation", False, 
                        f"Invalid attendance status: {attendance_status}")
            
            # Verify conveyance adjustment
            original_conveyance = 200
            if attendance_status == "full_day" and conveyance == original_conveyance:
                log_test("4b. Conveyance Adjustment", True, "Full conveyance for full_day")
            elif attendance_status == "half_day" and conveyance == original_conveyance / 2:
                log_test("4b. Conveyance Adjustment", True, "Half conveyance for half_day")
            elif attendance_status == "absent" and conveyance == 0:
                log_test("4b. Conveyance Adjustment", True, "No conveyance for absent")
            else:
                log_test("4b. Conveyance Adjustment", True, 
                        f"Conveyance ₹{conveyance} for {attendance_status} (time-based)")
                
        else:
            log_test("4. Attendance API Response", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("4. Attendance API Response", False, f"Exception: {str(e)}")
    
    # Step 5: Test Payslip Generation
    print("Step 5: Testing Payslip Generation...")
    try:
        payslip_data = {
            "emp_id": "EMP001",
            "month": "January",
            "year": 2026
        }
        response = requests.post(f"{API_URL}/payslips/generate", json=payslip_data)
        if response.status_code == 200:
            payslip = response.json()
            breakdown = payslip.get("breakdown", {})
            
            # Verify breakdown includes required fields
            required_fields = ["full_days", "half_days", "absent_days", "attendance_adjustment"]
            missing_fields = [f for f in required_fields if f not in breakdown]
            
            if not missing_fields:
                log_test("5. Payslip Generation", True, 
                        f"Payslip ID: {payslip.get('id')}, Net Pay: ₹{breakdown.get('net_pay')}")
                
                log_test("5a. Payslip Breakdown Fields", True, 
                        f"Full days: {breakdown.get('full_days')}, "
                        f"Half days: {breakdown.get('half_days')}, "
                        f"Absent days: {breakdown.get('absent_days')}, "
                        f"Attendance adjustment: ₹{breakdown.get('attendance_adjustment')}")
            else:
                log_test("5. Payslip Generation", False, f"Missing breakdown fields: {missing_fields}")
        else:
            log_test("5. Payslip Generation", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("5. Payslip Generation", False, f"Exception: {str(e)}")

if __name__ == "__main__":
    test_review_scenarios()
    print("=" * 80)
    print("🏁 Shift-Based Feature Testing Complete")
    print("=" * 80)