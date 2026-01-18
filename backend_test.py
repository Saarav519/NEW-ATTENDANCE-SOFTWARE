#!/usr/bin/env python3
"""
SuperManage Staff Attendance & Payroll Management Backend API Tests
Testing all backend APIs to identify bugs and issues.
"""

import requests
import json
import os
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

print(f"Testing backend at: {API_URL}")

# Test credentials
ADMIN_CREDS = {"user_id": "ADMIN001", "password": "admin123"}
TL_CREDS = {"user_id": "TL001", "password": "tl001"}
EMP_CREDS = {"user_id": "EMP001", "password": "emp001"}

# Global variables to store test data
auth_tokens = {}
qr_code_data = None
attendance_id = None
leave_id = None
bill_id = None
payslip_id = None

def log_test(test_name, success, details=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"    {details}")
    print()

def test_seed_database():
    """Test database seeding"""
    print("=" * 60)
    print("TESTING: Database Seeding")
    print("=" * 60)
    
    try:
        response = requests.post(f"{API_URL}/seed")
        if response.status_code == 200:
            log_test("Database Seeding", True, "Database seeded successfully")
            return True
        else:
            log_test("Database Seeding", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Database Seeding", False, f"Exception: {str(e)}")
        return False

def test_authentication():
    """Test authentication APIs"""
    print("=" * 60)
    print("TESTING: Authentication APIs")
    print("=" * 60)
    
    global auth_tokens
    
    # Test admin login
    try:
        response = requests.post(f"{API_URL}/auth/login", json=ADMIN_CREDS)
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                auth_tokens["admin"] = data.get("token")
                log_test("Admin Login", True, f"Token: {auth_tokens['admin'][:20]}...")
            else:
                log_test("Admin Login", False, f"Login failed: {data.get('error')}")
        else:
            log_test("Admin Login", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Admin Login", False, f"Exception: {str(e)}")
    
    # Test team lead login
    try:
        response = requests.post(f"{API_URL}/auth/login", json=TL_CREDS)
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                auth_tokens["teamlead"] = data.get("token")
                log_test("Team Lead Login", True, f"Token: {auth_tokens['teamlead'][:20]}...")
            else:
                log_test("Team Lead Login", False, f"Login failed: {data.get('error')}")
        else:
            log_test("Team Lead Login", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Team Lead Login", False, f"Exception: {str(e)}")
    
    # Test employee login
    try:
        response = requests.post(f"{API_URL}/auth/login", json=EMP_CREDS)
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                auth_tokens["employee"] = data.get("token")
                log_test("Employee Login", True, f"Token: {auth_tokens['employee'][:20]}...")
            else:
                log_test("Employee Login", False, f"Login failed: {data.get('error')}")
        else:
            log_test("Employee Login", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Employee Login", False, f"Exception: {str(e)}")
    
    # Test invalid credentials
    try:
        response = requests.post(f"{API_URL}/auth/login", json={"user_id": "INVALID", "password": "wrong"})
        if response.status_code == 200:
            data = response.json()
            if not data.get("success"):
                log_test("Invalid Login Rejection", True, "Correctly rejected invalid credentials")
            else:
                log_test("Invalid Login Rejection", False, "Should have rejected invalid credentials")
        else:
            log_test("Invalid Login Rejection", False, f"Unexpected status: {response.status_code}")
    except Exception as e:
        log_test("Invalid Login Rejection", False, f"Exception: {str(e)}")

def test_user_apis():
    """Test user management APIs"""
    print("=" * 60)
    print("TESTING: User Management APIs")
    print("=" * 60)
    
    # Test get all users
    try:
        response = requests.get(f"{API_URL}/users")
        if response.status_code == 200:
            users = response.json()
            if isinstance(users, list) and len(users) > 0:
                log_test("Get All Users", True, f"Retrieved {len(users)} users")
            else:
                log_test("Get All Users", False, "No users returned")
        else:
            log_test("Get All Users", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Get All Users", False, f"Exception: {str(e)}")
    
    # Test get specific user
    try:
        response = requests.get(f"{API_URL}/users/EMP001")
        if response.status_code == 200:
            user = response.json()
            if user.get("id") == "EMP001":
                log_test("Get Specific User", True, f"Retrieved user: {user.get('name')}")
            else:
                log_test("Get Specific User", False, "Wrong user returned")
        else:
            log_test("Get Specific User", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Get Specific User", False, f"Exception: {str(e)}")
    
    # Test create new user
    try:
        new_user = {
            "name": "Test Employee",
            "email": "test@audixsolutions.com",
            "phone": "+91 98765 43299",
            "role": "employee",
            "department": "Testing",
            "designation": "Test Engineer",
            "joining_date": "2025-01-01",
            "salary": 40000,
            "password": "test123"
        }
        response = requests.post(f"{API_URL}/users", json=new_user)
        if response.status_code == 200:
            user = response.json()
            if user.get("name") == "Test Employee":
                log_test("Create New User", True, f"Created user with ID: {user.get('id')}")
            else:
                log_test("Create New User", False, "User creation failed")
        else:
            log_test("Create New User", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Create New User", False, f"Exception: {str(e)}")

def test_qr_code_apis():
    """Test QR code APIs"""
    print("=" * 60)
    print("TESTING: QR Code APIs")
    print("=" * 60)
    
    global qr_code_data
    
    # Test create QR code (as team lead)
    try:
        qr_data = {
            "location": "Bangalore Office",
            "conveyance_amount": 150.0,
            "date": "2026-01-15",
            "created_by": "TL001"
        }
        response = requests.post(f"{API_URL}/qr-codes", json=qr_data)
        if response.status_code == 200:
            qr_response = response.json()
            qr_code_data = qr_response.get("qr_data")
            log_test("Create QR Code", True, f"QR ID: {qr_response.get('id')}")
        else:
            log_test("Create QR Code", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Create QR Code", False, f"Exception: {str(e)}")
    
    # Test get QR codes
    try:
        response = requests.get(f"{API_URL}/qr-codes")
        if response.status_code == 200:
            qr_codes = response.json()
            if isinstance(qr_codes, list) and len(qr_codes) > 0:
                log_test("Get QR Codes", True, f"Retrieved {len(qr_codes)} QR codes")
            else:
                log_test("Get QR Codes", False, "No QR codes returned")
        else:
            log_test("Get QR Codes", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Get QR Codes", False, f"Exception: {str(e)}")

def test_attendance_apis():
    """Test attendance APIs"""
    print("=" * 60)
    print("TESTING: Attendance APIs")
    print("=" * 60)
    
    global attendance_id
    
    if not qr_code_data:
        log_test("Attendance Tests", False, "No QR code data available for testing")
        return
    
    # Test punch-in
    try:
        punch_in_data = {"qr_data": qr_code_data}
        response = requests.post(f"{API_URL}/attendance/punch-in?emp_id=EMP001", json=punch_in_data)
        if response.status_code == 200:
            attendance = response.json()
            attendance_id = attendance.get("id")
            log_test("Punch In", True, f"Attendance ID: {attendance_id}, Time: {attendance.get('punch_in')}")
        else:
            log_test("Punch In", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Punch In", False, f"Exception: {str(e)}")
    
    # Test punch-out
    try:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        punch_out_data = {"emp_id": "EMP001", "date": today}
        response = requests.post(f"{API_URL}/attendance/punch-out", json=punch_out_data)
        if response.status_code == 200:
            attendance = response.json()
            log_test("Punch Out", True, f"Work hours: {attendance.get('work_hours')}")
        else:
            log_test("Punch Out", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Punch Out", False, f"Exception: {str(e)}")
    
    # Test get monthly attendance
    try:
        response = requests.get(f"{API_URL}/attendance/EMP001/monthly?month=1&year=2026")
        if response.status_code == 200:
            attendance_records = response.json()
            log_test("Get Monthly Attendance", True, f"Retrieved {len(attendance_records)} records")
        else:
            log_test("Get Monthly Attendance", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Get Monthly Attendance", False, f"Exception: {str(e)}")

def test_leave_apis():
    """Test leave management APIs"""
    print("=" * 60)
    print("TESTING: Leave Management APIs")
    print("=" * 60)
    
    global leave_id
    
    # Test create leave request
    try:
        leave_data = {
            "emp_id": "EMP001",
            "emp_name": "Rahul Kumar",
            "type": "Sick Leave",
            "from_date": "2026-01-20",
            "to_date": "2026-01-21",
            "days": 2,
            "reason": "Medical appointment"
        }
        response = requests.post(f"{API_URL}/leaves", json=leave_data)
        if response.status_code == 200:
            leave = response.json()
            leave_id = leave.get("id")
            log_test("Create Leave Request", True, f"Leave ID: {leave_id}")
        else:
            log_test("Create Leave Request", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Create Leave Request", False, f"Exception: {str(e)}")
    
    # Test get leaves
    try:
        response = requests.get(f"{API_URL}/leaves")
        if response.status_code == 200:
            leaves = response.json()
            log_test("Get Leaves", True, f"Retrieved {len(leaves)} leave requests")
        else:
            log_test("Get Leaves", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Get Leaves", False, f"Exception: {str(e)}")
    
    # Test approve leave
    if leave_id:
        try:
            response = requests.put(f"{API_URL}/leaves/{leave_id}/approve?approved_by=TL001")
            if response.status_code == 200:
                log_test("Approve Leave", True, "Leave approved successfully")
            else:
                log_test("Approve Leave", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test("Approve Leave", False, f"Exception: {str(e)}")

def test_bill_apis():
    """Test bill submission APIs"""
    print("=" * 60)
    print("TESTING: Bill Submission APIs")
    print("=" * 60)
    
    global bill_id
    
    # Test create bill submission
    try:
        bill_data = {
            "items": [
                {
                    "date": "2026-01-10",
                    "location": "Client Office",
                    "description": "Travel to client meeting",
                    "amount": 500.0,
                    "has_attachment": False
                },
                {
                    "date": "2026-01-12",
                    "location": "Airport",
                    "description": "Business trip expenses",
                    "amount": 800.0,
                    "has_attachment": False
                }
            ],
            "month": "January 2026",
            "year": 2026,
            "remarks": "Client visit expenses"
        }
        response = requests.post(f"{API_URL}/bills?emp_id=EMP001&emp_name=Rahul Kumar", json=bill_data)
        if response.status_code == 200:
            bill = response.json()
            bill_id = bill.get("id")
            log_test("Create Bill Submission", True, f"Bill ID: {bill_id}, Total: ₹{bill.get('total_amount')}")
        else:
            log_test("Create Bill Submission", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Create Bill Submission", False, f"Exception: {str(e)}")
    
    # Test get bills
    try:
        response = requests.get(f"{API_URL}/bills")
        if response.status_code == 200:
            bills = response.json()
            log_test("Get Bills", True, f"Retrieved {len(bills)} bill submissions")
        else:
            log_test("Get Bills", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Get Bills", False, f"Exception: {str(e)}")
    
    # Test approve bill
    if bill_id:
        try:
            response = requests.put(f"{API_URL}/bills/{bill_id}/approve?approved_by=TL001&approved_amount=1200.0")
            if response.status_code == 200:
                log_test("Approve Bill", True, "Bill approved successfully")
            else:
                log_test("Approve Bill", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test("Approve Bill", False, f"Exception: {str(e)}")

def test_payslip_apis():
    """Test payslip APIs"""
    print("=" * 60)
    print("TESTING: Payslip APIs")
    print("=" * 60)
    
    global payslip_id
    
    # Test get settled payslips
    try:
        response = requests.get(f"{API_URL}/payslips/EMP001/settled")
        if response.status_code == 200:
            payslips = response.json()
            log_test("Get Settled Payslips", True, f"Retrieved {len(payslips)} settled payslips")
        else:
            log_test("Get Settled Payslips", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Get Settled Payslips", False, f"Exception: {str(e)}")
    
    # Test generate payslip
    try:
        payslip_data = {
            "emp_id": "EMP001",
            "month": "January 2026",
            "year": 2026
        }
        response = requests.post(f"{API_URL}/payslips/generate", json=payslip_data)
        if response.status_code == 200:
            payslip = response.json()
            payslip_id = payslip.get("id")
            net_pay = payslip.get("breakdown", {}).get("net_pay", 0)
            log_test("Generate Payslip", True, f"Payslip ID: {payslip_id}, Net Pay: ₹{net_pay}")
        else:
            log_test("Generate Payslip", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Generate Payslip", False, f"Exception: {str(e)}")

def test_dashboard_apis():
    """Test dashboard APIs"""
    print("=" * 60)
    print("TESTING: Dashboard APIs")
    print("=" * 60)
    
    # Test dashboard stats
    try:
        response = requests.get(f"{API_URL}/dashboard/stats")
        if response.status_code == 200:
            stats = response.json()
            log_test("Dashboard Stats", True, f"Total employees: {stats.get('total_employees')}, Present today: {stats.get('present_today')}")
        else:
            log_test("Dashboard Stats", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Dashboard Stats", False, f"Exception: {str(e)}")

def test_holiday_apis():
    """Test holiday APIs"""
    print("=" * 60)
    print("TESTING: Holiday APIs")
    print("=" * 60)
    
    # Test get holidays
    try:
        response = requests.get(f"{API_URL}/holidays")
        if response.status_code == 200:
            holidays = response.json()
            log_test("Get Holidays", True, f"Retrieved {len(holidays)} holidays")
        else:
            log_test("Get Holidays", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Get Holidays", False, f"Exception: {str(e)}")

def run_all_tests():
    """Run all backend API tests"""
    print("🚀 Starting SuperManage Backend API Tests")
    print(f"Backend URL: {API_URL}")
    print("=" * 80)
    
    # Run tests in sequence as specified in the review request
    test_seed_database()
    test_authentication()
    test_user_apis()
    test_qr_code_apis()
    test_attendance_apis()
    test_leave_apis()
    test_bill_apis()
    test_payslip_apis()
    test_dashboard_apis()
    test_holiday_apis()
    
    print("=" * 80)
    print("🏁 Backend API Testing Complete")
    print("=" * 80)

if __name__ == "__main__":
    run_all_tests()