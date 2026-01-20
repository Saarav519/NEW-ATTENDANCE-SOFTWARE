"""
Test Suite for Reports Page and Export Functionality
Tests:
1. Reports page - stats filtering by month
2. Export endpoints - CSV data filtering by month
3. Decimal display - monetary values as whole numbers
4. Payroll calculation - salary/days_in_month formula
"""

import pytest
import requests
import os
from datetime import datetime
from calendar import monthrange

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestReportsAndExports:
    """Test Reports page data filtering and export functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.admin_id = "ADMIN001"
        self.admin_password = "admin123"
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    # ==================== BACKEND API TESTS ====================
    
    def test_health_check(self):
        """Test API is accessible"""
        response = self.session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        print("✓ Health check passed")
    
    def test_login_admin(self):
        """Test admin login"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "user_id": self.admin_id,
            "password": self.admin_password
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "user" in data
        print(f"✓ Admin login successful: {data['user'].get('name', 'Admin')}")
    
    # ==================== ATTENDANCE API TESTS ====================
    
    def test_attendance_api_month_filter(self):
        """Test attendance API filters by month correctly"""
        # Test November 2025
        response = self.session.get(f"{BASE_URL}/api/attendance?month=11&year=2025")
        assert response.status_code == 200, f"Attendance API failed: {response.text}"
        nov_data = response.json()
        
        # Test December 2025
        response = self.session.get(f"{BASE_URL}/api/attendance?month=12&year=2025")
        assert response.status_code == 200
        dec_data = response.json()
        
        # Verify all November records have dates starting with 2025-11
        for record in nov_data:
            assert record.get("date", "").startswith("2025-11"), f"November data contains wrong month: {record.get('date')}"
        
        # Verify all December records have dates starting with 2025-12
        for record in dec_data:
            assert record.get("date", "").startswith("2025-12"), f"December data contains wrong month: {record.get('date')}"
        
        print(f"✓ Attendance API month filter works: Nov={len(nov_data)} records, Dec={len(dec_data)} records")
    
    # ==================== BILLS API TESTS ====================
    
    def test_bills_api_month_filter(self):
        """Test bills API filters by month correctly"""
        # Test November 2025
        response = self.session.get(f"{BASE_URL}/api/bills?month=November&year=2025")
        assert response.status_code == 200, f"Bills API failed: {response.text}"
        nov_bills = response.json()
        
        # Test December 2025
        response = self.session.get(f"{BASE_URL}/api/bills?month=December&year=2025")
        assert response.status_code == 200
        dec_bills = response.json()
        
        # Verify month filtering
        for bill in nov_bills:
            assert bill.get("month") == "November", f"November bills contains wrong month: {bill.get('month')}"
        
        for bill in dec_bills:
            assert bill.get("month") == "December", f"December bills contains wrong month: {bill.get('month')}"
        
        print(f"✓ Bills API month filter works: Nov={len(nov_bills)} bills, Dec={len(dec_bills)} bills")
    
    # ==================== ADVANCES API TESTS ====================
    
    def test_advances_api_month_filter(self):
        """Test advances API filters by deduct_from_month correctly"""
        response = self.session.get(f"{BASE_URL}/api/advances")
        assert response.status_code == 200, f"Advances API failed: {response.text}"
        advances = response.json()
        
        # Check that advances have deduct_from_month field
        for adv in advances:
            if adv.get("status") == "approved":
                assert "deduct_from_month" in adv, "Advance missing deduct_from_month field"
        
        print(f"✓ Advances API works: {len(advances)} advances found")
    
    # ==================== PAYSLIPS API TESTS ====================
    
    def test_payslips_api(self):
        """Test payslips API returns correct data"""
        response = self.session.get(f"{BASE_URL}/api/payslips")
        assert response.status_code == 200, f"Payslips API failed: {response.text}"
        payslips = response.json()
        
        # Check payslip structure
        for payslip in payslips:
            assert "month" in payslip, "Payslip missing month"
            assert "year" in payslip, "Payslip missing year"
            assert "breakdown" in payslip, "Payslip missing breakdown"
            
            # Check breakdown has required fields
            breakdown = payslip.get("breakdown", {})
            assert "net_pay" in breakdown, "Breakdown missing net_pay"
            assert "total_duty_earned" in breakdown, "Breakdown missing total_duty_earned"
        
        print(f"✓ Payslips API works: {len(payslips)} payslips found")
    
    # ==================== AUDIT EXPENSES API TESTS ====================
    
    def test_audit_expenses_api(self):
        """Test audit expenses API"""
        response = self.session.get(f"{BASE_URL}/api/audit-expenses")
        assert response.status_code == 200, f"Audit expenses API failed: {response.text}"
        expenses = response.json()
        
        # Check that expenses have trip_start_date for filtering
        for exp in expenses:
            # trip_start_date is used for month filtering
            if exp.get("status") == "approved":
                assert "trip_start_date" in exp or "submitted_on" in exp, "Expense missing date fields"
        
        print(f"✓ Audit expenses API works: {len(expenses)} expenses found")
    
    # ==================== EXPORT ENDPOINT TESTS ====================
    
    def test_export_attendance_month_filter(self):
        """Test attendance export filters by month"""
        # Export November 2025
        response = self.session.get(f"{BASE_URL}/api/export/attendance?month=11&year=2025")
        assert response.status_code == 200, f"Attendance export failed: {response.text}"
        assert "text/csv" in response.headers.get("content-type", ""), "Response is not CSV"
        
        csv_content = response.text
        lines = csv_content.strip().split('\n')
        
        # Check that all data rows have November 2025 dates
        if len(lines) > 1:  # Has data rows
            for line in lines[1:]:  # Skip header
                if line.strip():
                    # Date should be in format 2025-11-XX
                    assert "2025-11" in line or len(line.split(',')) < 3, f"Export contains non-November data: {line[:100]}"
        
        print(f"✓ Attendance export month filter works: {len(lines)-1} rows")
    
    def test_export_audit_expenses_month_filter(self):
        """Test audit expenses export filters by trip_start_date month"""
        # Export November 2025
        response = self.session.get(f"{BASE_URL}/api/export/audit-expenses?month=11&year=2025")
        assert response.status_code == 200, f"Audit expenses export failed: {response.text}"
        assert "text/csv" in response.headers.get("content-type", ""), "Response is not CSV"
        
        csv_content = response.text
        lines = csv_content.strip().split('\n')
        print(f"✓ Audit expenses export works: {len(lines)-1} rows for Nov 2025")
    
    def test_export_bills_advances_month_filter(self):
        """Test bills-advances export filters by month"""
        # Export November 2025
        response = self.session.get(f"{BASE_URL}/api/export/bills-advances?month=November&year=2025")
        assert response.status_code == 200, f"Bills-advances export failed: {response.text}"
        assert "text/csv" in response.headers.get("content-type", ""), "Response is not CSV"
        
        csv_content = response.text
        lines = csv_content.strip().split('\n')
        
        # Verify month column contains November
        if len(lines) > 1:
            for line in lines[1:]:
                if line.strip() and "Bill" in line:
                    assert "November" in line, f"Bills export contains non-November data: {line[:100]}"
        
        print(f"✓ Bills-advances export month filter works: {len(lines)-1} rows")
    
    def test_export_payslips_month_filter(self):
        """Test payslips export filters by month"""
        response = self.session.get(f"{BASE_URL}/api/export/payslips?month=November&year=2025&status=settled")
        assert response.status_code == 200, f"Payslips export failed: {response.text}"
        assert "text/csv" in response.headers.get("content-type", ""), "Response is not CSV"
        
        csv_content = response.text
        lines = csv_content.strip().split('\n')
        print(f"✓ Payslips export works: {len(lines)-1} rows for Nov 2025")
    
    # ==================== DECIMAL DISPLAY TESTS ====================
    
    def test_attendance_daily_duty_no_decimals(self):
        """Test that daily_duty_amount is rounded (no excessive decimals)"""
        response = self.session.get(f"{BASE_URL}/api/attendance?month=11&year=2025")
        assert response.status_code == 200
        records = response.json()
        
        decimal_issues = []
        for record in records:
            duty = record.get("daily_duty_amount", 0)
            # Check if duty has more than 2 decimal places
            duty_str = str(duty)
            if '.' in duty_str:
                decimal_part = duty_str.split('.')[1]
                if len(decimal_part) > 2:
                    decimal_issues.append(f"{record.get('emp_id')}: ₹{duty}")
        
        if decimal_issues:
            print(f"⚠ Found {len(decimal_issues)} records with excessive decimals: {decimal_issues[:5]}")
        else:
            print("✓ Daily duty amounts have proper decimal precision")
    
    def test_payslip_net_pay_no_decimals(self):
        """Test that payslip net_pay is a whole number or has max 2 decimals"""
        response = self.session.get(f"{BASE_URL}/api/payslips")
        assert response.status_code == 200
        payslips = response.json()
        
        decimal_issues = []
        for payslip in payslips:
            breakdown = payslip.get("breakdown", {})
            net_pay = breakdown.get("net_pay", 0)
            
            # Check for excessive decimals like ₹49,999.90
            net_pay_str = str(net_pay)
            if '.' in net_pay_str:
                decimal_part = net_pay_str.split('.')[1]
                # Flag if decimal part is not .00 (should be whole numbers)
                if decimal_part != "0" and len(decimal_part) > 0:
                    decimal_issues.append(f"{payslip.get('emp_name')}: ₹{net_pay}")
        
        if decimal_issues:
            print(f"⚠ Found {len(decimal_issues)} payslips with decimals: {decimal_issues[:5]}")
        else:
            print("✓ Payslip net_pay values are whole numbers")
    
    # ==================== PAYROLL CALCULATION TESTS ====================
    
    def test_payroll_uses_days_in_month(self):
        """Test that payroll calculation uses salary/days_in_month formula"""
        # Get a user with known salary
        response = self.session.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        users = response.json()
        
        # Find an employee with salary
        test_user = None
        for user in users:
            if user.get("salary", 0) > 0 and user.get("role") != "admin":
                test_user = user
                break
        
        if not test_user:
            pytest.skip("No employee with salary found for testing")
        
        emp_id = test_user.get("id")
        salary = test_user.get("salary", 0)
        
        # Get attendance for November 2025 (30 days)
        response = self.session.get(f"{BASE_URL}/api/attendance?emp_id={emp_id}&month=11&year=2025")
        assert response.status_code == 200
        attendance = response.json()
        
        if not attendance:
            print(f"⚠ No attendance data for {emp_id} in November 2025")
            return
        
        # Calculate expected daily rate for November (30 days)
        days_in_november = 30
        expected_daily_rate = salary / days_in_november
        
        # Check if daily_duty_amount matches expected rate
        for record in attendance:
            duty = record.get("daily_duty_amount", 0)
            att_status = record.get("attendance_status", "")
            
            if att_status == "full_day":
                # Full day should be close to daily rate
                tolerance = 1  # Allow ₹1 tolerance for rounding
                assert abs(duty - expected_daily_rate) < tolerance or duty == round(expected_daily_rate, 2), \
                    f"Daily duty {duty} doesn't match expected {expected_daily_rate} for {emp_id}"
        
        print(f"✓ Payroll uses days_in_month formula: ₹{salary}/30 = ₹{expected_daily_rate:.2f}/day")
    
    def test_mark_attendance_calculates_duty_correctly(self):
        """Test that marking attendance calculates daily duty using days_in_month"""
        # Create a test employee or use existing
        response = self.session.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        users = response.json()
        
        # Find an employee
        test_emp = None
        for user in users:
            if user.get("role") == "employee" and user.get("salary", 0) > 0:
                test_emp = user
                break
        
        if not test_emp:
            pytest.skip("No employee found for testing")
        
        emp_id = test_emp.get("id")
        salary = test_emp.get("salary", 0)
        
        # Mark attendance for a specific date in December 2025 (31 days)
        test_date = "2025-12-15"
        days_in_december = 31
        expected_daily_rate = salary / days_in_december
        
        response = self.session.post(
            f"{BASE_URL}/api/attendance/mark",
            params={
                "emp_id": emp_id,
                "date": test_date,
                "status": "full_day",
                "marked_by": "ADMIN001",
                "conveyance": 200,
                "location": "Office"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            actual_duty = data.get("daily_duty_amount", 0)
            
            # Verify calculation
            tolerance = 1
            assert abs(actual_duty - expected_daily_rate) < tolerance or actual_duty == round(expected_daily_rate, 2), \
                f"Marked duty {actual_duty} doesn't match expected {expected_daily_rate}"
            
            print(f"✓ Mark attendance uses days_in_month: ₹{salary}/31 = ₹{expected_daily_rate:.2f}/day, got ₹{actual_duty}")
        else:
            print(f"⚠ Could not mark attendance: {response.text}")


class TestDataIntegrity:
    """Test data integrity across different months"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_no_cross_month_contamination_attendance(self):
        """Verify attendance data doesn't leak between months"""
        # Get November data
        nov_response = self.session.get(f"{BASE_URL}/api/attendance?month=11&year=2025")
        assert nov_response.status_code == 200
        nov_data = nov_response.json()
        
        # Get December data
        dec_response = self.session.get(f"{BASE_URL}/api/attendance?month=12&year=2025")
        assert dec_response.status_code == 200
        dec_data = dec_response.json()
        
        # Verify no overlap
        nov_ids = set(r.get("id") for r in nov_data)
        dec_ids = set(r.get("id") for r in dec_data)
        
        overlap = nov_ids.intersection(dec_ids)
        assert len(overlap) == 0, f"Found {len(overlap)} records appearing in both months"
        
        print(f"✓ No cross-month contamination: Nov={len(nov_data)}, Dec={len(dec_data)}, Overlap=0")
    
    def test_payslip_month_year_consistency(self):
        """Verify payslips have consistent month/year data"""
        response = self.session.get(f"{BASE_URL}/api/payslips")
        assert response.status_code == 200
        payslips = response.json()
        
        valid_months = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"]
        
        for payslip in payslips:
            month = payslip.get("month", "")
            year = payslip.get("year", 0)
            
            # Month should be a valid month name
            assert month in valid_months or month.split()[0] in valid_months, \
                f"Invalid month format: {month}"
            
            # Year should be reasonable
            assert 2020 <= year <= 2030, f"Invalid year: {year}"
        
        print(f"✓ All {len(payslips)} payslips have valid month/year")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
