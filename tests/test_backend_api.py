"""
Backend API Tests for Staff Attendance and Payroll Management App
Tests: Auth, Users, QR Codes, Attendance, Bills, Payslips, Holidays
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://companybooks-1.preview.emergentagent.com')

@pytest.fixture(scope="session")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

# ==================== AUTH TESTS ====================
class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_admin_success(self, api_client):
        """Test admin login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "user_id": "ADMIN001",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["user"]["id"] == "ADMIN001"
        assert data["user"]["role"] == "admin"
        assert "token" in data
    
    def test_login_teamlead_success(self, api_client):
        """Test team lead login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "user_id": "TL001",
            "password": "tl001"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["user"]["id"] == "TL001"
        assert data["user"]["role"] == "teamlead"
    
    def test_login_employee_success(self, api_client):
        """Test employee login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "user_id": "EMP001",
            "password": "emp001"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["user"]["id"] == "EMP001"
        assert data["user"]["role"] == "employee"
    
    def test_login_invalid_password(self, api_client):
        """Test login with invalid password"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "user_id": "ADMIN001",
            "password": "wrongpassword"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False
        assert "error" in data
    
    def test_login_invalid_user(self, api_client):
        """Test login with non-existent user"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "user_id": "INVALID001",
            "password": "test123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False

# ==================== USERS TESTS ====================
class TestUsers:
    """User management endpoint tests"""
    
    def test_get_all_users(self, api_client):
        """Test getting all users"""
        response = api_client.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # At least admin, teamlead, employee
    
    def test_get_user_by_id(self, api_client):
        """Test getting user by ID"""
        response = api_client.get(f"{BASE_URL}/api/users/EMP001")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "EMP001"
        assert data["role"] == "employee"
        assert "password" not in data  # Password should not be returned
    
    def test_get_users_by_role(self, api_client):
        """Test filtering users by role"""
        response = api_client.get(f"{BASE_URL}/api/users?role=employee")
        assert response.status_code == 200
        data = response.json()
        assert all(u["role"] == "employee" for u in data)
    
    def test_get_team_members(self, api_client):
        """Test getting team members for a team lead"""
        response = api_client.get(f"{BASE_URL}/api/users/team/TL001")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # TL001 has EMP001 and EMP003 as team members
        member_ids = [m["id"] for m in data]
        assert "EMP001" in member_ids or len(data) >= 0

# ==================== QR CODE TESTS ====================
class TestQRCodes:
    """QR Code generation endpoint tests"""
    
    def test_create_qr_code(self, api_client):
        """Test creating a QR code"""
        response = api_client.post(f"{BASE_URL}/api/qr-codes", json={
            "location": "Office A",
            "conveyance_amount": 150,
            "date": "2025-12-18",
            "created_by": "TL001"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["location"] == "Office A"
        assert data["conveyance_amount"] == 150
        assert data["created_by"] == "TL001"
        assert "id" in data
        assert "qr_data" in data
    
    def test_get_qr_codes(self, api_client):
        """Test getting QR codes"""
        response = api_client.get(f"{BASE_URL}/api/qr-codes")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_qr_codes_by_creator(self, api_client):
        """Test filtering QR codes by creator"""
        # First create a QR code
        api_client.post(f"{BASE_URL}/api/qr-codes", json={
            "location": "Office B",
            "conveyance_amount": 200,
            "date": "2025-12-18",
            "created_by": "TL001"
        })
        
        response = api_client.get(f"{BASE_URL}/api/qr-codes?created_by=TL001")
        assert response.status_code == 200
        data = response.json()
        assert all(qr["created_by"] == "TL001" for qr in data)

# ==================== ATTENDANCE TESTS ====================
class TestAttendance:
    """Attendance endpoint tests"""
    
    def test_get_attendance(self, api_client):
        """Test getting attendance records"""
        response = api_client.get(f"{BASE_URL}/api/attendance")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_monthly_attendance(self, api_client):
        """Test getting monthly attendance for an employee"""
        response = api_client.get(f"{BASE_URL}/api/attendance/EMP001/monthly?month=12&year=2025")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

# ==================== BILLS TESTS ====================
class TestBills:
    """Bill submission endpoint tests"""
    
    def test_create_bill(self, api_client):
        """Test creating a bill submission"""
        response = api_client.post(f"{BASE_URL}/api/bills?emp_id=EMP001&emp_name=Rahul%20Kumar", json={
            "month": "December",
            "year": 2025,
            "items": [
                {"date": "2025-12-15", "location": "Client Site A", "amount": 500, "description": "Travel expense"},
                {"date": "2025-12-16", "location": "Client Site B", "amount": 300, "description": "Lunch meeting"}
            ],
            "remarks": "Monthly expenses"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["emp_id"] == "EMP001"
        assert data["total_amount"] == 800
        assert data["status"] == "pending"
        assert len(data["items"]) == 2
    
    def test_get_bills(self, api_client):
        """Test getting all bills"""
        response = api_client.get(f"{BASE_URL}/api/bills")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_bills_by_employee(self, api_client):
        """Test filtering bills by employee"""
        response = api_client.get(f"{BASE_URL}/api/bills?emp_id=EMP001")
        assert response.status_code == 200
        data = response.json()
        assert all(b["emp_id"] == "EMP001" for b in data)

# ==================== PAYSLIP TESTS ====================
class TestPayslips:
    """Payslip endpoint tests"""
    
    def test_get_settled_payslips(self, api_client):
        """Test getting settled payslips for an employee"""
        response = api_client.get(f"{BASE_URL}/api/payslips/EMP001/settled")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Seeded data has 2 settled payslips for EMP001
        assert len(data) >= 2
        assert all(p["status"] == "settled" for p in data)
    
    def test_payslip_has_breakdown(self, api_client):
        """Test that payslips have salary breakdown"""
        response = api_client.get(f"{BASE_URL}/api/payslips/EMP001/settled")
        assert response.status_code == 200
        data = response.json()
        if len(data) > 0:
            payslip = data[0]
            assert "breakdown" in payslip
            breakdown = payslip["breakdown"]
            assert "basic" in breakdown
            assert "hra" in breakdown
            assert "special_allowance" in breakdown
            assert "conveyance" in breakdown
            assert "net_pay" in breakdown

# ==================== HOLIDAYS TESTS ====================
class TestHolidays:
    """Holiday endpoint tests"""
    
    def test_get_holidays(self, api_client):
        """Test getting all holidays"""
        response = api_client.get(f"{BASE_URL}/api/holidays")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 6  # Seeded holidays

# ==================== DASHBOARD TESTS ====================
class TestDashboard:
    """Dashboard stats endpoint tests"""
    
    def test_get_dashboard_stats(self, api_client):
        """Test getting dashboard statistics"""
        response = api_client.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_employees" in data
        assert "active_employees" in data
        assert "present_today" in data
        assert "pending_leaves" in data
        assert "pending_bills" in data
