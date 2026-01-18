#!/usr/bin/env python3
"""
Leave and Holiday APIs Testing Script
Testing specific APIs as requested in the review.
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

print(f"Testing Leave and Holiday APIs at: {API_URL}")

# Global variables to store test data
leave_id = None
holiday_id = None

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
            log_test("POST /api/seed", True, "Database seeded successfully")
            return True
        else:
            log_test("POST /api/seed", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("POST /api/seed", False, f"Exception: {str(e)}")
        return False

def test_leave_apis():
    """Test Leave Management APIs"""
    print("=" * 60)
    print("TESTING: Leave Management APIs")
    print("=" * 60)
    
    global leave_id
    
    # Test 1: GET /api/leaves - Get all leaves
    try:
        response = requests.get(f"{API_URL}/leaves")
        if response.status_code == 200:
            leaves = response.json()
            log_test("GET /api/leaves", True, f"Retrieved {len(leaves)} leave requests")
        else:
            log_test("GET /api/leaves", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("GET /api/leaves", False, f"Exception: {str(e)}")
    
    # Test 2: POST /api/leaves - Create a new leave request
    try:
        leave_data = {
            "emp_id": "EMP001",
            "emp_name": "Rahul Kumar",
            "type": "Casual Leave",
            "from_date": "2026-01-20",
            "to_date": "2026-01-22",
            "days": 3,
            "reason": "Family function"
        }
        response = requests.post(f"{API_URL}/leaves", json=leave_data)
        if response.status_code == 200:
            leave = response.json()
            leave_id = leave.get("id")
            log_test("POST /api/leaves", True, f"Created leave request - ID: {leave_id}, Type: {leave.get('type')}, Days: {leave.get('days')}")
        else:
            log_test("POST /api/leaves", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("POST /api/leaves", False, f"Exception: {str(e)}")
    
    # Test 3: PUT /api/leaves/{leave_id}/approve - Approve leave
    if leave_id:
        try:
            response = requests.put(f"{API_URL}/leaves/{leave_id}/approve?approved_by=ADMIN001")
            if response.status_code == 200:
                result = response.json()
                log_test("PUT /api/leaves/{leave_id}/approve", True, f"Leave approved: {result.get('message')}")
            else:
                log_test("PUT /api/leaves/{leave_id}/approve", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test("PUT /api/leaves/{leave_id}/approve", False, f"Exception: {str(e)}")
    
    # Test 4: Create another leave for rejection test
    try:
        leave_data_2 = {
            "emp_id": "EMP001",
            "emp_name": "Rahul Kumar",
            "type": "Sick Leave",
            "from_date": "2026-01-25",
            "to_date": "2026-01-26",
            "days": 2,
            "reason": "Medical appointment"
        }
        response = requests.post(f"{API_URL}/leaves", json=leave_data_2)
        if response.status_code == 200:
            leave_2 = response.json()
            leave_id_2 = leave_2.get("id")
            
            # Test 5: PUT /api/leaves/{leave_id}/reject - Reject leave
            try:
                response = requests.put(f"{API_URL}/leaves/{leave_id_2}/reject?rejected_by=ADMIN001")
                if response.status_code == 200:
                    result = response.json()
                    log_test("PUT /api/leaves/{leave_id}/reject", True, f"Leave rejected: {result.get('message')}")
                else:
                    log_test("PUT /api/leaves/{leave_id}/reject", False, f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                log_test("PUT /api/leaves/{leave_id}/reject", False, f"Exception: {str(e)}")
        else:
            log_test("Create Leave for Rejection Test", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Create Leave for Rejection Test", False, f"Exception: {str(e)}")

def test_holiday_apis():
    """Test Holiday Management APIs"""
    print("=" * 60)
    print("TESTING: Holiday Management APIs")
    print("=" * 60)
    
    global holiday_id
    
    # Test 1: GET /api/holidays - Get all holidays
    try:
        response = requests.get(f"{API_URL}/holidays")
        if response.status_code == 200:
            holidays = response.json()
            log_test("GET /api/holidays", True, f"Retrieved {len(holidays)} holidays")
        else:
            log_test("GET /api/holidays", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("GET /api/holidays", False, f"Exception: {str(e)}")
    
    # Test 2: POST /api/holidays - Create a new holiday
    try:
        holiday_data = {
            "name": "Republic Day",
            "date": "2026-01-26",
            "type": "National"
        }
        response = requests.post(f"{API_URL}/holidays", json=holiday_data)
        if response.status_code == 200:
            holiday = response.json()
            holiday_id = holiday.get("id")
            log_test("POST /api/holidays", True, f"Created holiday - ID: {holiday_id}, Name: {holiday.get('name')}, Date: {holiday.get('date')}")
        else:
            log_test("POST /api/holidays", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("POST /api/holidays", False, f"Exception: {str(e)}")
    
    # Test 3: DELETE /api/holidays/{holiday_id} - Delete a holiday
    if holiday_id:
        try:
            response = requests.delete(f"{API_URL}/holidays/{holiday_id}")
            if response.status_code == 200:
                result = response.json()
                log_test("DELETE /api/holidays/{holiday_id}", True, f"Holiday deleted: {result.get('message')}")
            else:
                log_test("DELETE /api/holidays/{holiday_id}", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test("DELETE /api/holidays/{holiday_id}", False, f"Exception: {str(e)}")

def test_edge_cases():
    """Test edge cases and error handling"""
    print("=" * 60)
    print("TESTING: Edge Cases and Error Handling")
    print("=" * 60)
    
    # Test invalid leave ID for approval
    try:
        response = requests.put(f"{API_URL}/leaves/INVALID123/approve?approved_by=ADMIN001")
        if response.status_code == 404:
            log_test("Invalid Leave ID - Approve", True, "Correctly returned 404 for invalid leave ID")
        else:
            log_test("Invalid Leave ID - Approve", False, f"Expected 404, got {response.status_code}")
    except Exception as e:
        log_test("Invalid Leave ID - Approve", False, f"Exception: {str(e)}")
    
    # Test invalid holiday ID for deletion
    try:
        response = requests.delete(f"{API_URL}/holidays/INVALID123")
        if response.status_code == 404:
            log_test("Invalid Holiday ID - Delete", True, "Correctly returned 404 for invalid holiday ID")
        else:
            log_test("Invalid Holiday ID - Delete", False, f"Expected 404, got {response.status_code}")
    except Exception as e:
        log_test("Invalid Holiday ID - Delete", False, f"Exception: {str(e)}")
    
    # Test leave creation with missing fields
    try:
        incomplete_leave = {
            "emp_id": "EMP001",
            "type": "Casual Leave"
            # Missing required fields
        }
        response = requests.post(f"{API_URL}/leaves", json=incomplete_leave)
        if response.status_code == 422:  # Validation error
            log_test("Incomplete Leave Data", True, "Correctly rejected incomplete leave data")
        else:
            log_test("Incomplete Leave Data", False, f"Expected 422, got {response.status_code}")
    except Exception as e:
        log_test("Incomplete Leave Data", False, f"Exception: {str(e)}")

def run_leave_holiday_tests():
    """Run all Leave and Holiday API tests"""
    print("🚀 Starting Leave and Holiday API Tests")
    print(f"Backend URL: {API_URL}")
    print("=" * 80)
    
    # Run tests as specified in the review request
    test_seed_database()
    test_leave_apis()
    test_holiday_apis()
    test_edge_cases()
    
    print("=" * 80)
    print("🏁 Leave and Holiday API Testing Complete")
    print("=" * 80)

if __name__ == "__main__":
    run_leave_holiday_tests()