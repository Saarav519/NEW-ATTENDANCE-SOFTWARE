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
emi_loan_id = None
lumpsum_loan_id = None

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

def test_shift_based_qr_codes():
    """Test new shift-based QR code features"""
    print("=" * 60)
    print("TESTING: Shift-Based QR Code Features")
    print("=" * 60)
    
    global qr_code_data
    
    # Test 1: Create Day Shift QR (10:00-19:00)
    try:
        day_shift_qr = {
            "location": "Main Office",
            "conveyance_amount": 200,
            "date": "2026-01-18",
            "created_by": "TL001",
            "shift_type": "day",
            "shift_start": "10:00",
            "shift_end": "19:00"
        }
        response = requests.post(f"{API_URL}/qr-codes", json=day_shift_qr)
        if response.status_code == 200:
            qr_response = response.json()
            # Verify shift info is included in response
            if (qr_response.get("shift_type") == "day" and 
                qr_response.get("shift_start") == "10:00" and 
                qr_response.get("shift_end") == "19:00"):
                qr_code_data = qr_response.get("qr_data")
                log_test("Create Day Shift QR", True, f"Day shift QR created with shift info: {qr_response.get('shift_type')} {qr_response.get('shift_start')}-{qr_response.get('shift_end')}")
            else:
                log_test("Create Day Shift QR", False, "Shift information missing in response")
        else:
            log_test("Create Day Shift QR", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Create Day Shift QR", False, f"Exception: {str(e)}")
    
    # Test 2: Create Night Shift QR (21:00-06:00)
    try:
        night_shift_qr = {
            "location": "Night Site",
            "conveyance_amount": 300,
            "date": "2026-01-18",
            "created_by": "TL001",
            "shift_type": "night",
            "shift_start": "21:00",
            "shift_end": "06:00"
        }
        response = requests.post(f"{API_URL}/qr-codes", json=night_shift_qr)
        if response.status_code == 200:
            qr_response = response.json()
            # Verify shift info is included in response
            if (qr_response.get("shift_type") == "night" and 
                qr_response.get("shift_start") == "21:00" and 
                qr_response.get("shift_end") == "06:00"):
                log_test("Create Night Shift QR", True, f"Night shift QR created with shift info: {qr_response.get('shift_type')} {qr_response.get('shift_start')}-{qr_response.get('shift_end')}")
            else:
                log_test("Create Night Shift QR", False, "Shift information missing in response")
        else:
            log_test("Create Night Shift QR", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Create Night Shift QR", False, f"Exception: {str(e)}")
    
    # Test 3: Verify QR data includes shift information
    if qr_code_data:
        try:
            qr_info = json.loads(qr_code_data)
            required_fields = ["shift_type", "shift_start", "shift_end"]
            missing_fields = [field for field in required_fields if field not in qr_info]
            
            if not missing_fields:
                log_test("QR Data Contains Shift Info", True, f"QR includes: shift_type={qr_info.get('shift_type')}, shift_start={qr_info.get('shift_start')}, shift_end={qr_info.get('shift_end')}")
            else:
                log_test("QR Data Contains Shift Info", False, f"Missing fields in QR data: {missing_fields}")
        except Exception as e:
            log_test("QR Data Contains Shift Info", False, f"Exception parsing QR data: {str(e)}")

def test_shift_based_attendance():
    """Test shift-based attendance status calculation"""
    print("=" * 60)
    print("TESTING: Shift-Based Attendance Status")
    print("=" * 60)
    
    if not qr_code_data:
        log_test("Shift-Based Attendance Tests", False, "No QR code data available for testing")
        return
    
    # Test attendance with different scan times to verify status calculation
    try:
        punch_in_data = {"qr_data": qr_code_data}
        response = requests.post(f"{API_URL}/attendance/punch-in?emp_id=EMP001", json=punch_in_data)
        if response.status_code == 200:
            attendance = response.json()
            
            # Verify attendance_status field exists and has valid value
            attendance_status = attendance.get("attendance_status")
            valid_statuses = ["full_day", "half_day", "absent"]
            
            if attendance_status in valid_statuses:
                log_test("Attendance Status Calculation", True, f"Attendance status: {attendance_status}, Conveyance: ₹{attendance.get('conveyance_amount', 0)}")
                
                # Verify conveyance adjustment based on status
                original_conveyance = 200  # From day shift QR
                actual_conveyance = attendance.get("conveyance_amount", 0)
                
                if attendance_status == "full_day" and actual_conveyance == original_conveyance:
                    log_test("Full Day Conveyance", True, f"Full conveyance ₹{actual_conveyance} for full_day status")
                elif attendance_status == "half_day" and actual_conveyance == original_conveyance / 2:
                    log_test("Half Day Conveyance", True, f"Half conveyance ₹{actual_conveyance} for half_day status")
                elif attendance_status == "absent" and actual_conveyance == 0:
                    log_test("Absent Conveyance", True, f"No conveyance ₹{actual_conveyance} for absent status")
                else:
                    log_test("Conveyance Adjustment", False, f"Incorrect conveyance ₹{actual_conveyance} for status {attendance_status}")
                
            else:
                log_test("Attendance Status Calculation", False, f"Invalid attendance status: {attendance_status}")
        else:
            log_test("Attendance Status Calculation", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Attendance Status Calculation", False, f"Exception: {str(e)}")

def test_shift_based_payslip():
    """Test payslip generation with shift-based attendance breakdown"""
    print("=" * 60)
    print("TESTING: Shift-Based Payslip Generation")
    print("=" * 60)
    
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
            
            # Verify new attendance breakdown fields
            required_fields = ["full_days", "half_days", "absent_days", "attendance_adjustment"]
            missing_fields = [field for field in required_fields if field not in breakdown]
            
            if not missing_fields:
                log_test("Payslip Attendance Breakdown", True, 
                        f"Full days: {breakdown.get('full_days')}, Half days: {breakdown.get('half_days')}, "
                        f"Absent days: {breakdown.get('absent_days')}, Adjustment: ₹{breakdown.get('attendance_adjustment')}")
            else:
                log_test("Payslip Attendance Breakdown", False, f"Missing fields in payslip breakdown: {missing_fields}")
                
            # Verify net pay calculation includes attendance adjustment
            net_pay = breakdown.get("net_pay", 0)
            if net_pay > 0:
                log_test("Payslip Net Pay Calculation", True, f"Net pay calculated: ₹{net_pay}")
            else:
                log_test("Payslip Net Pay Calculation", False, "Net pay calculation failed")
                
        else:
            log_test("Shift-Based Payslip Generation", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Shift-Based Payslip Generation", False, f"Exception: {str(e)}")

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

def test_analytics_apis():
    """Test NEW Analytics APIs"""
    print("=" * 60)
    print("TESTING: NEW Analytics APIs")
    print("=" * 60)
    
    # Test 1: Employee Counts
    try:
        response = requests.get(f"{API_URL}/analytics/employee-counts")
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                total_employees = sum(item.get('count', 0) for item in data)
                roles = [item.get('role') for item in data]
                log_test("Analytics - Employee Counts", True, f"Total: {total_employees}, Roles: {roles}")
            else:
                log_test("Analytics - Employee Counts", False, "Invalid response format or empty data")
        else:
            log_test("Analytics - Employee Counts", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Analytics - Employee Counts", False, f"Exception: {str(e)}")
    
    # Test 2: Attendance Trends
    try:
        response = requests.get(f"{API_URL}/analytics/attendance-trends?time_filter=this_month")
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Analytics - Attendance Trends", True, f"Retrieved {len(data)} trend data points")
            else:
                log_test("Analytics - Attendance Trends", False, "Expected list response format")
        else:
            log_test("Analytics - Attendance Trends", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Analytics - Attendance Trends", False, f"Exception: {str(e)}")
    
    # Test 3: Leave Distribution
    try:
        response = requests.get(f"{API_URL}/analytics/leave-distribution?time_filter=this_month")
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Analytics - Leave Distribution", True, f"Retrieved {len(data)} leave distribution data points")
            else:
                log_test("Analytics - Leave Distribution", False, "Expected list response format")
        else:
            log_test("Analytics - Leave Distribution", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Analytics - Leave Distribution", False, f"Exception: {str(e)}")
    
    # Test 4: Department Attendance
    try:
        response = requests.get(f"{API_URL}/analytics/department-attendance?time_filter=this_month")
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Analytics - Department Attendance", True, f"Retrieved {len(data)} department data points")
            else:
                log_test("Analytics - Department Attendance", False, "Expected list response format")
        else:
            log_test("Analytics - Department Attendance", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Analytics - Department Attendance", False, f"Exception: {str(e)}")
    
    # Test 5: Salary Overview
    try:
        response = requests.get(f"{API_URL}/analytics/salary-overview?time_filter=this_year")
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Analytics - Salary Overview", True, f"Retrieved {len(data)} salary overview data points")
            else:
                log_test("Analytics - Salary Overview", False, "Expected list response format")
        else:
            log_test("Analytics - Salary Overview", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Analytics - Salary Overview", False, f"Exception: {str(e)}")
    
    # Test 6: Summary Analytics (All in one)
    try:
        response = requests.get(f"{API_URL}/analytics/summary?time_filter=this_month")
        if response.status_code == 200:
            data = response.json()
            required_fields = ["employee_counts", "attendance_trends", "leave_distribution", "department_attendance", "salary_overview"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                log_test("Analytics - Summary (All in One)", True, f"All analytics data retrieved in single call")
            else:
                log_test("Analytics - Summary (All in One)", False, f"Missing fields: {missing_fields}")
        else:
            log_test("Analytics - Summary (All in One)", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Analytics - Summary (All in One)", False, f"Exception: {str(e)}")

def test_export_csv_apis():
    """Test NEW Export to CSV APIs"""
    print("=" * 60)
    print("TESTING: NEW Export to CSV APIs")
    print("=" * 60)
    
    # Test 1: Export Employees
    try:
        response = requests.get(f"{API_URL}/export/employees")
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'text/csv' in content_type or 'application/csv' in content_type:
                csv_content = response.text
                lines = csv_content.strip().split('\n')
                log_test("Export - Employees CSV", True, f"CSV exported with {len(lines)} lines (including header)")
            else:
                log_test("Export - Employees CSV", False, f"Wrong content type: {content_type}")
        else:
            log_test("Export - Employees CSV", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Export - Employees CSV", False, f"Exception: {str(e)}")
    
    # Test 2: Export Attendance
    try:
        response = requests.get(f"{API_URL}/export/attendance")
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'text/csv' in content_type or 'application/csv' in content_type:
                csv_content = response.text
                lines = csv_content.strip().split('\n')
                log_test("Export - Attendance CSV", True, f"CSV exported with {len(lines)} lines (including header)")
            else:
                log_test("Export - Attendance CSV", False, f"Wrong content type: {content_type}")
        else:
            log_test("Export - Attendance CSV", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Export - Attendance CSV", False, f"Exception: {str(e)}")
    
    # Test 3: Export Leaves
    try:
        response = requests.get(f"{API_URL}/export/leaves")
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'text/csv' in content_type or 'application/csv' in content_type:
                csv_content = response.text
                lines = csv_content.strip().split('\n')
                log_test("Export - Leaves CSV", True, f"CSV exported with {len(lines)} lines (including header)")
            else:
                log_test("Export - Leaves CSV", False, f"Wrong content type: {content_type}")
        else:
            log_test("Export - Leaves CSV", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Export - Leaves CSV", False, f"Exception: {str(e)}")
    
    # Test 4: Export Payslips
    try:
        response = requests.get(f"{API_URL}/export/payslips")
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'text/csv' in content_type or 'application/csv' in content_type:
                csv_content = response.text
                lines = csv_content.strip().split('\n')
                log_test("Export - Payslips CSV", True, f"CSV exported with {len(lines)} lines (including header)")
            else:
                log_test("Export - Payslips CSV", False, f"Wrong content type: {content_type}")
        else:
            log_test("Export - Payslips CSV", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Export - Payslips CSV", False, f"Exception: {str(e)}")
    
    # Test 5: Export Bills
    try:
        response = requests.get(f"{API_URL}/export/bills")
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'text/csv' in content_type or 'application/csv' in content_type:
                csv_content = response.text
                lines = csv_content.strip().split('\n')
                log_test("Export - Bills CSV", True, f"CSV exported with {len(lines)} lines (including header)")
            else:
                log_test("Export - Bills CSV", False, f"Wrong content type: {content_type}")
        else:
            log_test("Export - Bills CSV", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Export - Bills CSV", False, f"Exception: {str(e)}")

def test_notification_apis():
    """Test NEW Notification APIs"""
    print("=" * 60)
    print("TESTING: NEW Notification APIs")
    print("=" * 60)
    
    global leave_id, bill_id
    notification_id = None
    
    # Test 1: Get initial notifications (may be empty)
    try:
        response = requests.get(f"{API_URL}/notifications?user_id=ADMIN001")
        if response.status_code == 200:
            notifications = response.json()
            initial_count = len(notifications)
            log_test("Get Initial Notifications", True, f"Retrieved {initial_count} notifications for ADMIN001")
        else:
            log_test("Get Initial Notifications", False, f"Status: {response.status_code}, Response: {response.text}")
            initial_count = 0
    except Exception as e:
        log_test("Get Initial Notifications", False, f"Exception: {str(e)}")
        initial_count = 0
    
    # Test 2: Get unread count
    try:
        response = requests.get(f"{API_URL}/notifications/unread-count?user_id=ADMIN001")
        if response.status_code == 200:
            data = response.json()
            if "count" in data:
                log_test("Get Unread Count", True, f"Unread count: {data.get('count')}")
            else:
                log_test("Get Unread Count", False, "Missing count field")
        else:
            log_test("Get Unread Count", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get Unread Count", False, f"Exception: {str(e)}")
    
    # Test 3: Create a leave request to trigger notification
    try:
        leave_data = {
            "emp_id": "EMP001",
            "emp_name": "Rahul Kumar",
            "type": "Casual Leave",
            "from_date": "2026-01-25",
            "to_date": "2026-01-27",
            "days": 3,
            "reason": "Family function"
        }
        response = requests.post(f"{API_URL}/leaves", json=leave_data)
        if response.status_code == 200:
            leave = response.json()
            leave_id = leave.get("id")
            log_test("Create Leave (Notification Trigger)", True, f"Leave created: {leave_id}")
        else:
            log_test("Create Leave (Notification Trigger)", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Create Leave (Notification Trigger)", False, f"Exception: {str(e)}")
    
    # Test 4: Check if notification was created
    try:
        response = requests.get(f"{API_URL}/notifications?user_id=ADMIN001")
        if response.status_code == 200:
            notifications = response.json()
            new_count = len(notifications)
            if new_count > initial_count:
                # Find the newest notification
                newest_notification = max(notifications, key=lambda x: x.get('created_at', ''))
                notification_id = newest_notification.get('id')
                log_test("Notification Created for Leave", True, f"New notification created: {notification_id}, Type: {newest_notification.get('type')}")
            else:
                log_test("Notification Created for Leave", False, f"No new notification found. Count: {new_count} (was {initial_count})")
        else:
            log_test("Notification Created for Leave", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Notification Created for Leave", False, f"Exception: {str(e)}")
    
    # Test 5: Mark notification as read
    if notification_id:
        try:
            response = requests.put(f"{API_URL}/notifications/{notification_id}/read")
            if response.status_code == 200:
                log_test("Mark Notification as Read", True, f"Notification {notification_id} marked as read")
            else:
                log_test("Mark Notification as Read", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test("Mark Notification as Read", False, f"Exception: {str(e)}")
    
    # Test 6: Create a bill to trigger another notification
    try:
        bill_data = {
            "items": [
                {
                    "date": "2026-01-20",
                    "location": "Client Site",
                    "description": "Travel expenses for client meeting",
                    "amount": 750.0,
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
            log_test("Create Bill (Notification Trigger)", True, f"Bill created: {bill_id}")
        else:
            log_test("Create Bill (Notification Trigger)", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Create Bill (Notification Trigger)", False, f"Exception: {str(e)}")
    
    # Test 7: Mark all notifications as read
    try:
        response = requests.put(f"{API_URL}/notifications/mark-all-read?user_id=ADMIN001")
        if response.status_code == 200:
            log_test("Mark All Notifications as Read", True, "All notifications marked as read for ADMIN001")
        else:
            log_test("Mark All Notifications as Read", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Mark All Notifications as Read", False, f"Exception: {str(e)}")
    
    # Test 8: Verify unread count is now 0
    try:
        response = requests.get(f"{API_URL}/notifications/unread-count?user_id=ADMIN001")
        if response.status_code == 200:
            data = response.json()
            unread_count = data.get("count", -1)
            if unread_count == 0:
                log_test("Verify All Read", True, "Unread count is 0 after marking all as read")
            else:
                log_test("Verify All Read", False, f"Unread count should be 0, but is {unread_count}")
        else:
            log_test("Verify All Read", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Verify All Read", False, f"Exception: {str(e)}")

def test_dual_loan_type_support():
    """Test NEW Dual Loan Type Support (EMI-based & Lump Sum)"""
    print("=" * 60)
    print("TESTING: NEW Dual Loan Type Support")
    print("=" * 60)
    
    global emi_loan_id, lumpsum_loan_id
    emi_loan_id = None
    lumpsum_loan_id = None
    
    # Test 1: Create EMI-Based Loan
    try:
        emi_loan_data = {
            "loan_type": "emi_based",
            "loan_name": "Home Loan - HDFC",
            "lender_name": "HDFC Bank",
            "total_loan_amount": 500000,
            "emi_amount": 15000,
            "emi_day": 10,
            "loan_start_date": "2026-01-01",
            "interest_rate": 8.5,
            "loan_tenure_months": 60
        }
        response = requests.post(f"{API_URL}/loans", json=emi_loan_data)
        if response.status_code == 200:
            loan = response.json()
            emi_loan_id = loan.get("id")
            if (loan.get("loan_type") == "emi_based" and 
                loan.get("emi_amount") == 15000 and 
                loan.get("emi_day") == 10 and
                loan.get("interest_rate") == 8.5):
                log_test("Create EMI-Based Loan", True, f"EMI Loan created: {emi_loan_id}, Type: {loan.get('loan_type')}, EMI: ₹{loan.get('emi_amount')}")
            else:
                log_test("Create EMI-Based Loan", False, f"EMI fields missing or incorrect in response")
        else:
            log_test("Create EMI-Based Loan", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Create EMI-Based Loan", False, f"Exception: {str(e)}")
    
    # Test 2: Create Lump Sum Loan
    try:
        lumpsum_loan_data = {
            "loan_type": "lump_sum",
            "loan_name": "Personal Loan - Friend John",
            "lender_name": "John Doe",
            "total_loan_amount": 50000,
            "loan_start_date": "2026-01-15",
            "due_date": "2026-06-15",
            "notes": "Borrowed for emergency"
        }
        response = requests.post(f"{API_URL}/loans", json=lumpsum_loan_data)
        if response.status_code == 200:
            loan = response.json()
            lumpsum_loan_id = loan.get("id")
            if (loan.get("loan_type") == "lump_sum" and 
                loan.get("emi_amount") is None and 
                loan.get("emi_day") is None and
                loan.get("due_date") == "2026-06-15"):
                log_test("Create Lump Sum Loan", True, f"Lump Sum Loan created: {lumpsum_loan_id}, Type: {loan.get('loan_type')}, Due: {loan.get('due_date')}")
            else:
                log_test("Create Lump Sum Loan", False, f"Lump sum fields incorrect in response")
        else:
            log_test("Create Lump Sum Loan", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Create Lump Sum Loan", False, f"Exception: {str(e)}")
    
    # Test 3: Validation - EMI loan without emi_amount should fail
    try:
        invalid_emi_data = {
            "loan_type": "emi_based",
            "loan_name": "Invalid EMI Loan",
            "lender_name": "Test Bank",
            "total_loan_amount": 100000,
            "loan_start_date": "2026-01-01"
            # Missing emi_amount and emi_day
        }
        response = requests.post(f"{API_URL}/loans", json=invalid_emi_data)
        if response.status_code == 400:
            log_test("EMI Validation - Missing EMI Fields", True, "Correctly rejected EMI loan without emi_amount/emi_day")
        else:
            log_test("EMI Validation - Missing EMI Fields", False, f"Should have failed with 400, got {response.status_code}")
    except Exception as e:
        log_test("EMI Validation - Missing EMI Fields", False, f"Exception: {str(e)}")
    
    # Test 4: Pay EMI for EMI-Based Loan
    if emi_loan_id:
        try:
            emi_payment_data = {
                "loan_id": emi_loan_id,
                "payment_date": "2026-01-10",
                "amount": 15000
            }
            response = requests.post(f"{API_URL}/loans/{emi_loan_id}/pay-emi", json=emi_payment_data)
            if response.status_code == 200:
                payment = response.json()
                if (payment.get("amount") == 15000 and 
                    payment.get("principal_amount") is not None and
                    payment.get("interest_amount") is not None):
                    log_test("Pay EMI for EMI Loan", True, f"EMI payment recorded: ₹{payment.get('amount')}, Principal: ₹{payment.get('principal_amount')}, Interest: ₹{payment.get('interest_amount')}")
                else:
                    log_test("Pay EMI for EMI Loan", False, "EMI payment fields missing")
            else:
                log_test("Pay EMI for EMI Loan", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test("Pay EMI for EMI Loan", False, f"Exception: {str(e)}")
    
    # Test 5: Pay Lump Sum for Personal Loan (Partial Payment)
    if lumpsum_loan_id:
        try:
            lumpsum_payment_data = {
                "loan_id": lumpsum_loan_id,
                "payment_date": "2026-01-20",
                "amount": 25000
            }
            response = requests.post(f"{API_URL}/loans/{lumpsum_loan_id}/pay-lumpsum", json=lumpsum_payment_data)
            if response.status_code == 200:
                payment = response.json()
                if (payment.get("amount") == 25000 and 
                    payment.get("principal_amount") == 25000 and
                    payment.get("interest_amount") == 0):
                    log_test("Pay Lump Sum (Partial)", True, f"Lump sum payment recorded: ₹{payment.get('amount')}, Balance after: ₹{payment.get('balance_after_payment')}")
                else:
                    log_test("Pay Lump Sum (Partial)", False, "Lump sum payment fields incorrect")
            else:
                log_test("Pay Lump Sum (Partial)", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test("Pay Lump Sum (Partial)", False, f"Exception: {str(e)}")
    
    # Test 6: Pay Full Remaining Lump Sum
    if lumpsum_loan_id:
        try:
            final_payment_data = {
                "loan_id": lumpsum_loan_id,
                "payment_date": "2026-02-01",
                "amount": 25000
            }
            response = requests.post(f"{API_URL}/loans/{lumpsum_loan_id}/pay-lumpsum", json=final_payment_data)
            if response.status_code == 200:
                payment = response.json()
                if payment.get("balance_after_payment") == 0:
                    log_test("Pay Full Lump Sum", True, f"Final payment recorded, balance: ₹{payment.get('balance_after_payment')}")
                    
                    # Verify loan status is now closed
                    loan_response = requests.get(f"{API_URL}/loans/{lumpsum_loan_id}")
                    if loan_response.status_code == 200:
                        loan = loan_response.json()
                        if loan.get("status") == "closed":
                            log_test("Loan Status Update", True, f"Loan status updated to: {loan.get('status')}")
                        else:
                            log_test("Loan Status Update", False, f"Expected 'closed', got: {loan.get('status')}")
                else:
                    log_test("Pay Full Lump Sum", False, f"Balance should be 0, got: ₹{payment.get('balance_after_payment')}")
            else:
                log_test("Pay Full Lump Sum", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test("Pay Full Lump Sum", False, f"Exception: {str(e)}")
    
    # Test 7: Cross-Endpoint Validation - Try using /pay-lumpsum on EMI loan
    if emi_loan_id:
        try:
            invalid_payment_data = {
                "loan_id": emi_loan_id,
                "payment_date": "2026-01-15",
                "amount": 10000
            }
            response = requests.post(f"{API_URL}/loans/{emi_loan_id}/pay-lumpsum", json=invalid_payment_data)
            if response.status_code == 400:
                log_test("Cross-Endpoint Validation", True, "Correctly rejected lump sum payment on EMI loan")
            else:
                log_test("Cross-Endpoint Validation", False, f"Should have failed with 400, got {response.status_code}")
        except Exception as e:
            log_test("Cross-Endpoint Validation", False, f"Exception: {str(e)}")
    
    # Test 8: Get All Loans
    try:
        response = requests.get(f"{API_URL}/loans")
        if response.status_code == 200:
            loans = response.json()
            emi_loans = [l for l in loans if l.get("loan_type") == "emi_based"]
            lumpsum_loans = [l for l in loans if l.get("loan_type") == "lump_sum"]
            log_test("Get All Loans", True, f"Retrieved {len(loans)} loans: {len(emi_loans)} EMI-based, {len(lumpsum_loans)} Lump Sum")
        else:
            log_test("Get All Loans", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Get All Loans", False, f"Exception: {str(e)}")
    
    # Test 9: Get Loan Summary
    try:
        response = requests.get(f"{API_URL}/loans/summary")
        if response.status_code == 200:
            summary = response.json()
            if ("total_loans" in summary and 
                "active_loans" in summary and 
                "total_loan_amount" in summary):
                log_test("Get Loan Summary", True, f"Summary: {summary.get('total_loans')} total, {summary.get('active_loans')} active, ₹{summary.get('total_loan_amount')} total amount")
            else:
                log_test("Get Loan Summary", False, "Missing fields in summary response")
        else:
            log_test("Get Loan Summary", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Get Loan Summary", False, f"Exception: {str(e)}")
    
    # Test 10: Verify Cash Out entries were auto-created
    try:
        response = requests.get(f"{API_URL}/cash-out")
        if response.status_code == 200:
            cash_outs = response.json()
            loan_payments = [co for co in cash_outs if "loan" in co.get("description", "").lower()]
            if len(loan_payments) > 0:
                log_test("Auto Cash Out Creation", True, f"Found {len(loan_payments)} auto-created Cash Out entries for loan payments")
            else:
                log_test("Auto Cash Out Creation", False, "No Cash Out entries found for loan payments")
        else:
            log_test("Auto Cash Out Creation", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Auto Cash Out Creation", False, f"Exception: {str(e)}")

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
    
    # NEW: Test shift-based features
    test_shift_based_qr_codes()
    test_shift_based_attendance()
    
    test_attendance_apis()
    test_leave_apis()
    test_bill_apis()
    test_payslip_apis()
    
    # NEW: Test shift-based payslip
    test_shift_based_payslip()
    
    test_dashboard_apis()
    test_holiday_apis()
    
    print("=" * 80)
    print("🚀 TESTING NEW FEATURES (Review Request)")
    print("=" * 80)
    
    # NEW FEATURES TESTING (as per review request)
    test_analytics_apis()
    test_export_csv_apis()
    test_notification_apis()
    
    print("=" * 80)
    print("🚀 TESTING DUAL LOAN TYPE SUPPORT (Latest Feature)")
    print("=" * 80)
    
    # NEW: Test Dual Loan Type Support
    test_dual_loan_type_support()
    
    print("=" * 80)
    print("🏁 Backend API Testing Complete")
    print("=" * 80)

if __name__ == "__main__":
    run_all_tests()