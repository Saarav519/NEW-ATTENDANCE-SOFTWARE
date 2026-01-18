#!/usr/bin/env python3
"""
Additional edge case and error handling tests for SuperManage Backend APIs
"""

import requests
import json

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

def log_test(test_name, success, details=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"    {details}")
    print()

def test_error_scenarios():
    """Test error handling scenarios"""
    print("=" * 60)
    print("TESTING: Error Handling Scenarios")
    print("=" * 60)
    
    # Test non-existent user
    try:
        response = requests.get(f"{API_URL}/users/NONEXISTENT")
        if response.status_code == 404:
            log_test("Non-existent User 404", True, "Correctly returns 404 for non-existent user")
        else:
            log_test("Non-existent User 404", False, f"Expected 404, got {response.status_code}")
    except Exception as e:
        log_test("Non-existent User 404", False, f"Exception: {str(e)}")
    
    # Test duplicate email creation
    try:
        duplicate_user = {
            "name": "Duplicate User",
            "email": "rahul@audixsolutions.com",  # This email already exists
            "role": "employee",
            "password": "test123"
        }
        response = requests.post(f"{API_URL}/users", json=duplicate_user)
        if response.status_code == 400:
            log_test("Duplicate Email Rejection", True, "Correctly rejects duplicate email")
        else:
            log_test("Duplicate Email Rejection", False, f"Expected 400, got {response.status_code}")
    except Exception as e:
        log_test("Duplicate Email Rejection", False, f"Exception: {str(e)}")
    
    # Test invalid QR code for punch-in
    try:
        invalid_qr = {"qr_data": "invalid_qr_data"}
        response = requests.post(f"{API_URL}/attendance/punch-in?emp_id=EMP001", json=invalid_qr)
        if response.status_code == 400:
            log_test("Invalid QR Code Rejection", True, "Correctly rejects invalid QR code")
        else:
            log_test("Invalid QR Code Rejection", False, f"Expected 400, got {response.status_code}")
    except Exception as e:
        log_test("Invalid QR Code Rejection", False, f"Exception: {str(e)}")
    
    # Test punch-out without punch-in
    try:
        punch_out_data = {"emp_id": "EMP002", "date": "2026-01-18"}
        response = requests.post(f"{API_URL}/attendance/punch-out", json=punch_out_data)
        if response.status_code == 404:
            log_test("Punch-out Without Punch-in", True, "Correctly handles punch-out without punch-in")
        else:
            log_test("Punch-out Without Punch-in", False, f"Expected 404, got {response.status_code}")
    except Exception as e:
        log_test("Punch-out Without Punch-in", False, f"Exception: {str(e)}")
    
    # Test approve non-existent leave
    try:
        response = requests.put(f"{API_URL}/leaves/NONEXISTENT/approve?approved_by=TL001")
        if response.status_code == 404:
            log_test("Non-existent Leave Approval", True, "Correctly handles non-existent leave")
        else:
            log_test("Non-existent Leave Approval", False, f"Expected 404, got {response.status_code}")
    except Exception as e:
        log_test("Non-existent Leave Approval", False, f"Exception: {str(e)}")
    
    # Test approve non-existent bill
    try:
        response = requests.put(f"{API_URL}/bills/NONEXISTENT/approve?approved_by=TL001&approved_amount=1000")
        if response.status_code == 404:
            log_test("Non-existent Bill Approval", True, "Correctly handles non-existent bill")
        else:
            log_test("Non-existent Bill Approval", False, f"Expected 404, got {response.status_code}")
    except Exception as e:
        log_test("Non-existent Bill Approval", False, f"Exception: {str(e)}")

def test_data_validation():
    """Test data validation scenarios"""
    print("=" * 60)
    print("TESTING: Data Validation")
    print("=" * 60)
    
    # Test payslip generation for non-existent employee
    try:
        payslip_data = {
            "emp_id": "NONEXISTENT",
            "month": "January 2026",
            "year": 2026
        }
        response = requests.post(f"{API_URL}/payslips/generate", json=payslip_data)
        if response.status_code == 404:
            log_test("Payslip for Non-existent Employee", True, "Correctly handles non-existent employee")
        else:
            log_test("Payslip for Non-existent Employee", False, f"Expected 404, got {response.status_code}")
    except Exception as e:
        log_test("Payslip for Non-existent Employee", False, f"Exception: {str(e)}")

def test_qr_based_attendance_flow():
    """Test the complete QR-based attendance flow"""
    print("=" * 60)
    print("TESTING: Complete QR-based Attendance Flow")
    print("=" * 60)
    
    # Create a new QR code
    qr_data = {
        "location": "Test Location",
        "conveyance_amount": 200.0,
        "date": "2026-01-19",
        "created_by": "TL001"
    }
    
    try:
        response = requests.post(f"{API_URL}/qr-codes", json=qr_data)
        if response.status_code == 200:
            qr_response = response.json()
            qr_code_data = qr_response.get("qr_data")
            
            # Test punch-in with this QR code
            punch_in_data = {"qr_data": qr_code_data}
            response = requests.post(f"{API_URL}/attendance/punch-in?emp_id=EMP002", json=punch_in_data)
            if response.status_code == 200:
                attendance = response.json()
                log_test("QR-based Attendance Flow", True, f"Successfully punched in at {attendance.get('location')} with ₹{attendance.get('conveyance_amount')} conveyance")
            else:
                log_test("QR-based Attendance Flow", False, f"Punch-in failed: {response.status_code}")
        else:
            log_test("QR-based Attendance Flow", False, f"QR creation failed: {response.status_code}")
    except Exception as e:
        log_test("QR-based Attendance Flow", False, f"Exception: {str(e)}")

def run_edge_case_tests():
    """Run all edge case tests"""
    print("🔍 Starting SuperManage Backend Edge Case Tests")
    print(f"Backend URL: {API_URL}")
    print("=" * 80)
    
    test_error_scenarios()
    test_data_validation()
    test_qr_based_attendance_flow()
    
    print("=" * 80)
    print("🏁 Edge Case Testing Complete")
    print("=" * 80)

if __name__ == "__main__":
    run_edge_case_tests()