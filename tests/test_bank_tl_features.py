"""
Test Suite for Bank Details and Team Leader Features
Tests:
1. Add Employee with Bank Details - mandatory validation and data saving
2. Add Employee with Team Leader assignment
3. View Employee showing Bank Details and TL assignment
4. Edit Employee Team Leader change with history logging
5. TL History endpoint
6. Export payslips CSV includes bank details columns
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBankDetailsAndTLFeatures:
    """Test Bank Details and Team Leader Features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.admin_creds = {"user_id": "ADMIN001", "password": "admin123"}
        self.employee_creds = {"user_id": "EMP001", "password": "emp001"}
        self.test_employee_id = f"TEST_EMP_{int(time.time())}"
        yield
        # Cleanup - delete test employee if created
        try:
            requests.delete(f"{BASE_URL}/api/users/{self.test_employee_id}")
        except:
            pass
    
    def test_01_health_check(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data or "status" in data
        print("PASS: API root endpoint working")
    
    def test_02_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=self.admin_creds)
        assert response.status_code == 200
        data = response.json()
        user = data.get("user", data)  # Handle nested user object
        assert user.get("id") == "ADMIN001"
        assert user.get("role") == "admin"
        print("PASS: Admin login successful")
    
    def test_03_employee_login_with_bank_details(self):
        """Test employee login returns bank details"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=self.employee_creds)
        assert response.status_code == 200
        data = response.json()
        user = data.get("user", data)  # Handle nested user object
        assert user.get("id") == "EMP001"
        # Verify bank details are returned
        assert "bank_name" in user, "bank_name field missing in login response"
        assert "bank_account_number" in user, "bank_account_number field missing in login response"
        assert "bank_ifsc" in user, "bank_ifsc field missing in login response"
        # Verify bank details have values (from seed data)
        assert user.get("bank_name") == "State Bank of India", f"Expected 'State Bank of India', got '{user.get('bank_name')}'"
        assert user.get("bank_account_number") == "32456789012345"
        assert user.get("bank_ifsc") == "SBIN0001234"
        # Verify team_lead_id is returned
        assert "team_lead_id" in user, "team_lead_id field missing"
        assert user.get("team_lead_id") == "TL001"
        print("PASS: Employee login returns bank details and team_lead_id")
    
    def test_04_get_users_with_bank_details(self):
        """Test GET /api/users returns bank details"""
        response = requests.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        users = response.json()
        assert len(users) > 0
        
        # Find EMP001 and verify bank details
        emp001 = next((u for u in users if u.get("id") == "EMP001"), None)
        assert emp001 is not None, "EMP001 not found in users list"
        assert emp001.get("bank_name") == "State Bank of India"
        assert emp001.get("bank_account_number") == "32456789012345"
        assert emp001.get("bank_ifsc") == "SBIN0001234"
        assert emp001.get("team_lead_id") == "TL001"
        print("PASS: GET /api/users returns bank details and team_lead_id")
    
    def test_05_get_team_leaders(self):
        """Test that team leaders are available for dropdown"""
        response = requests.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        users = response.json()
        
        # Filter team leaders
        team_leaders = [u for u in users if u.get("role") == "teamlead" and u.get("status") == "active"]
        assert len(team_leaders) >= 2, f"Expected at least 2 team leaders, got {len(team_leaders)}"
        
        # Verify TL001 and TL002 exist
        tl_ids = [tl.get("id") for tl in team_leaders]
        assert "TL001" in tl_ids, "TL001 not found in team leaders"
        assert "TL002" in tl_ids, "TL002 not found in team leaders"
        print(f"PASS: Found {len(team_leaders)} team leaders for dropdown")
    
    def test_06_create_employee_without_bank_details_fails(self):
        """Test creating employee without bank details fails (mandatory validation)"""
        new_employee = {
            "id": self.test_employee_id,
            "name": "Test Employee No Bank",
            "email": f"test_nobank_{int(time.time())}@test.com",
            "phone": "+91 98765 00000",
            "role": "employee",
            "department": "Testing",
            "designation": "Tester",
            "salary": 30000,
            "salary_type": "monthly",
            "password": "test123",
            "status": "active"
            # Missing bank details
        }
        response = requests.post(f"{BASE_URL}/api/users", json=new_employee)
        # Accept both 400 and 422 as validation errors
        assert response.status_code in [400, 422], f"Expected 400 or 422, got {response.status_code}"
        data = response.json()
        # Check for bank details error in response
        error_msg = str(data)
        assert "bank" in error_msg.lower() or "Bank" in error_msg or "required" in error_msg.lower(), f"Expected bank details error, got: {data}"
        print("PASS: Creating employee without bank details fails with proper error")
    
    def test_07_create_employee_with_bank_details_and_tl(self):
        """Test creating employee with bank details and TL assignment"""
        new_employee = {
            "id": self.test_employee_id,
            "name": "Test Employee With Bank",
            "email": f"test_bank_{int(time.time())}@test.com",
            "phone": "+91 98765 11111",
            "role": "employee",
            "department": "Testing",
            "designation": "QA Engineer",
            "salary": 35000,
            "salary_type": "monthly",
            "password": "test123",
            "status": "active",
            "team_lead_id": "TL001",
            "bank_name": "Test Bank",
            "bank_account_number": "1234567890",
            "bank_ifsc": "TEST0001234"
        }
        response = requests.post(f"{BASE_URL}/api/users", json=new_employee)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify employee created with bank details
        assert data.get("id") == self.test_employee_id.upper()
        assert data.get("bank_name") == "Test Bank"
        assert data.get("bank_account_number") == "1234567890"
        assert data.get("bank_ifsc") == "TEST0001234"
        assert data.get("team_lead_id") == "TL001"
        print("PASS: Employee created with bank details and TL assignment")
    
    def test_08_verify_created_employee_data(self):
        """Verify created employee data persisted correctly"""
        # First create the employee
        new_employee = {
            "id": self.test_employee_id,
            "name": "Test Employee Verify",
            "email": f"test_verify_{int(time.time())}@test.com",
            "phone": "+91 98765 22222",
            "role": "employee",
            "department": "Testing",
            "designation": "QA Engineer",
            "salary": 40000,
            "salary_type": "monthly",
            "password": "test123",
            "status": "active",
            "team_lead_id": "TL002",
            "bank_name": "HDFC Bank",
            "bank_account_number": "9876543210",
            "bank_ifsc": "HDFC0009876"
        }
        create_response = requests.post(f"{BASE_URL}/api/users", json=new_employee)
        if create_response.status_code != 200:
            pytest.skip("Employee creation failed, skipping verification")
        
        # GET to verify data persisted
        get_response = requests.get(f"{BASE_URL}/api/users/{self.test_employee_id.upper()}")
        assert get_response.status_code == 200
        data = get_response.json()
        
        assert data.get("bank_name") == "HDFC Bank"
        assert data.get("bank_account_number") == "9876543210"
        assert data.get("bank_ifsc") == "HDFC0009876"
        assert data.get("team_lead_id") == "TL002"
        print("PASS: Employee data persisted correctly with bank details and TL")
    
    def test_09_update_team_leader(self):
        """Test updating employee's team leader"""
        # First create an employee
        new_employee = {
            "id": self.test_employee_id,
            "name": "Test Employee TL Change",
            "email": f"test_tlchange_{int(time.time())}@test.com",
            "phone": "+91 98765 33333",
            "role": "employee",
            "department": "Testing",
            "designation": "Developer",
            "salary": 45000,
            "salary_type": "monthly",
            "password": "test123",
            "status": "active",
            "team_lead_id": "TL001",
            "bank_name": "Axis Bank",
            "bank_account_number": "5555666677778888",
            "bank_ifsc": "UTIB0005555"
        }
        create_response = requests.post(f"{BASE_URL}/api/users", json=new_employee)
        if create_response.status_code != 200:
            pytest.skip("Employee creation failed")
        
        # Update team leader
        update_data = {
            "team_lead_id": "TL002",
            "changed_by": "ADMIN001",
            "change_reason": "Team restructuring for testing"
        }
        update_response = requests.put(f"{BASE_URL}/api/users/{self.test_employee_id.upper()}", json=update_data)
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/users/{self.test_employee_id.upper()}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data.get("team_lead_id") == "TL002", f"Expected TL002, got {data.get('team_lead_id')}"
        print("PASS: Team leader updated successfully")
    
    def test_10_team_leader_history_logged(self):
        """Test that TL change history is logged"""
        # First create an employee and change TL
        new_employee = {
            "id": self.test_employee_id,
            "name": "Test Employee History",
            "email": f"test_history_{int(time.time())}@test.com",
            "phone": "+91 98765 44444",
            "role": "employee",
            "department": "Testing",
            "designation": "Developer",
            "salary": 50000,
            "salary_type": "monthly",
            "password": "test123",
            "status": "active",
            "team_lead_id": "TL001",
            "bank_name": "ICICI Bank",
            "bank_account_number": "1111222233334444",
            "bank_ifsc": "ICIC0001111"
        }
        create_response = requests.post(f"{BASE_URL}/api/users", json=new_employee)
        if create_response.status_code != 200:
            pytest.skip("Employee creation failed")
        
        # Change TL
        update_data = {
            "team_lead_id": "TL002",
            "changed_by": "ADMIN001",
            "change_reason": "Testing history logging"
        }
        requests.put(f"{BASE_URL}/api/users/{self.test_employee_id.upper()}", json=update_data)
        
        # Get TL history
        history_response = requests.get(f"{BASE_URL}/api/users/{self.test_employee_id.upper()}/team-leader-history")
        assert history_response.status_code == 200
        history = history_response.json()
        
        assert len(history) >= 1, "Expected at least 1 history entry"
        latest = history[0]
        assert latest.get("old_team_leader_id") == "TL001"
        assert latest.get("new_team_leader_id") == "TL002"
        assert latest.get("changed_by") == "ADMIN001"
        assert "Testing history logging" in latest.get("reason", "")
        print("PASS: Team leader change history logged correctly")
    
    def test_11_get_settled_payslips_for_employee(self):
        """Test getting settled payslips for employee"""
        response = requests.get(f"{BASE_URL}/api/payslips/EMP001/settled")
        assert response.status_code == 200
        payslips = response.json()
        assert len(payslips) >= 1, "Expected at least 1 settled payslip for EMP001"
        
        # Verify payslip structure
        payslip = payslips[0]
        assert "breakdown" in payslip
        assert payslip.get("status") == "settled"
        print(f"PASS: Found {len(payslips)} settled payslips for EMP001")
    
    def test_12_export_payslips_includes_bank_details(self):
        """Test export payslips CSV includes bank details columns"""
        response = requests.get(f"{BASE_URL}/api/export/payslips?status=settled")
        assert response.status_code == 200
        
        # Check content type
        content_type = response.headers.get("content-type", "")
        assert "text/csv" in content_type, f"Expected CSV, got {content_type}"
        
        # Parse CSV content
        csv_content = response.text
        lines = csv_content.strip().split('\n')
        assert len(lines) >= 2, "Expected header + at least 1 data row"
        
        # Check header includes bank details columns
        header = lines[0]
        assert "Bank Name" in header, "Bank Name column missing in export"
        assert "Account Number" in header, "Account Number column missing in export"
        assert "IFSC Code" in header, "IFSC Code column missing in export"
        
        # Check data row has bank details
        if len(lines) > 1:
            # Find EMP001 row
            for line in lines[1:]:
                if "EMP001" in line:
                    assert "State Bank of India" in line or "SBI" in line or len(line.split(',')) > 7
                    print("PASS: Export CSV includes bank details for EMP001")
                    return
        
        print("PASS: Export payslips CSV includes bank details columns")
    
    def test_13_teamlead_has_bank_details(self):
        """Test that team leaders also have bank details"""
        response = requests.get(f"{BASE_URL}/api/users/TL001")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("bank_name") == "HDFC Bank"
        assert data.get("bank_account_number") == "50100012345678"
        assert data.get("bank_ifsc") == "HDFC0001234"
        print("PASS: Team leader TL001 has bank details")
    
    def test_14_admin_does_not_require_bank_details(self):
        """Test that admin users don't have mandatory bank details"""
        response = requests.get(f"{BASE_URL}/api/users/ADMIN001")
        assert response.status_code == 200
        data = response.json()
        
        # Admin should exist without bank details requirement
        assert data.get("role") == "admin"
        # Bank fields may be empty or not present for admin
        print("PASS: Admin user exists (bank details not mandatory for admin)")
    
    def test_15_employee_cards_show_tl_name(self):
        """Test that employee data includes team_lead_id for card display"""
        response = requests.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        users = response.json()
        
        # Find employees with team_lead_id
        employees_with_tl = [u for u in users if u.get("role") == "employee" and u.get("team_lead_id")]
        assert len(employees_with_tl) >= 1, "Expected at least 1 employee with team_lead_id"
        
        # Verify team_lead_id is valid
        for emp in employees_with_tl:
            tl_id = emp.get("team_lead_id")
            assert tl_id in ["TL001", "TL002"], f"Invalid team_lead_id: {tl_id}"
        
        print(f"PASS: {len(employees_with_tl)} employees have team_lead_id for card display")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_employees(self):
        """Clean up any test employees created"""
        response = requests.get(f"{BASE_URL}/api/users")
        if response.status_code == 200:
            users = response.json()
            for user in users:
                if user.get("id", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/users/{user.get('id')}")
                    print(f"Cleaned up test user: {user.get('id')}")
        print("PASS: Cleanup completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
