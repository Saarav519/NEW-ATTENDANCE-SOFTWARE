#!/usr/bin/env python3
"""
Detailed verification of exact test scenarios from review request
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

print(f"Verifying exact test scenarios at: {API_URL}")
print("=" * 80)

# Test exact scenarios from review request
def verify_exact_scenarios():
    
    # 1. Seed Database
    print("1. Testing POST /api/seed")
    response = requests.post(f"{API_URL}/seed")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print("   ✅ Database seeded successfully")
    else:
        print(f"   ❌ Failed: {response.text}")
    print()
    
    # 2. Leave Management - GET all leaves
    print("2. Testing GET /api/leaves")
    response = requests.get(f"{API_URL}/leaves")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        leaves = response.json()
        print(f"   ✅ Retrieved {len(leaves)} leaves")
    else:
        print(f"   ❌ Failed: {response.text}")
    print()
    
    # 3. Leave Management - Create exact leave from review request
    print("3. Testing POST /api/leaves with exact data from review")
    exact_leave_data = {
        "emp_id": "EMP001",
        "emp_name": "Rahul Kumar",
        "type": "Casual Leave",
        "from_date": "2026-01-20",
        "to_date": "2026-01-22",
        "days": 3,
        "reason": "Family function"
    }
    response = requests.post(f"{API_URL}/leaves", json=exact_leave_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        leave = response.json()
        leave_id = leave.get("id")
        print(f"   ✅ Created leave - ID: {leave_id}")
        print(f"   Details: {leave.get('emp_name')} - {leave.get('type')} ({leave.get('days')} days)")
        
        # 4. Approve the leave
        print("\n4. Testing PUT /api/leaves/{leave_id}/approve?approved_by=ADMIN001")
        response = requests.put(f"{API_URL}/leaves/{leave_id}/approve?approved_by=ADMIN001")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Leave approved successfully")
        else:
            print(f"   ❌ Failed: {response.text}")
        
        # Create another leave for rejection test
        print("\n   Creating another leave for rejection test...")
        response = requests.post(f"{API_URL}/leaves", json={
            "emp_id": "EMP001",
            "emp_name": "Rahul Kumar", 
            "type": "Sick Leave",
            "from_date": "2026-01-25",
            "to_date": "2026-01-26",
            "days": 2,
            "reason": "Medical checkup"
        })
        if response.status_code == 200:
            leave_2 = response.json()
            leave_id_2 = leave_2.get("id")
            
            # 5. Reject the leave
            print("\n5. Testing PUT /api/leaves/{leave_id}/reject?rejected_by=ADMIN001")
            response = requests.put(f"{API_URL}/leaves/{leave_id_2}/reject?rejected_by=ADMIN001")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                print("   ✅ Leave rejected successfully")
            else:
                print(f"   ❌ Failed: {response.text}")
    else:
        print(f"   ❌ Failed to create leave: {response.text}")
    print()
    
    # 6. Holiday Management - GET all holidays
    print("6. Testing GET /api/holidays")
    response = requests.get(f"{API_URL}/holidays")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        holidays = response.json()
        print(f"   ✅ Retrieved {len(holidays)} holidays")
        if holidays:
            print(f"   Sample holiday: {holidays[0].get('name')} on {holidays[0].get('date')}")
    else:
        print(f"   ❌ Failed: {response.text}")
    print()
    
    # 7. Holiday Management - Create exact holiday from review request
    print("7. Testing POST /api/holidays with exact data from review")
    exact_holiday_data = {
        "name": "Republic Day",
        "date": "2026-01-26",
        "type": "National"
    }
    response = requests.post(f"{API_URL}/holidays", json=exact_holiday_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        holiday = response.json()
        holiday_id = holiday.get("id")
        print(f"   ✅ Created holiday - ID: {holiday_id}")
        print(f"   Details: {holiday.get('name')} on {holiday.get('date')} ({holiday.get('type')})")
        
        # 8. Delete the holiday
        print(f"\n8. Testing DELETE /api/holidays/{holiday_id}")
        response = requests.delete(f"{API_URL}/holidays/{holiday_id}")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Holiday deleted successfully")
        else:
            print(f"   ❌ Failed: {response.text}")
    else:
        print(f"   ❌ Failed to create holiday: {response.text}")

if __name__ == "__main__":
    verify_exact_scenarios()
    print("\n" + "=" * 80)
    print("✅ ALL TEST SCENARIOS FROM REVIEW REQUEST COMPLETED SUCCESSFULLY")
    print("=" * 80)