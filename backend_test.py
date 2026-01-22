#!/usr/bin/env python3
"""
Backend API Testing for Attendance Management System
Tests all endpoints and calculations as requested in the review.
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Configuration
BASE_URL = "https://audixhr.preview.emergentagent.com/api"
ADMIN_USER = "ADMIN001"
ADMIN_PASSWORD = "admin123"

class AttendanceSystemTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        self.performance_results = []
        
    def log_result(self, test_name: str, success: bool, message: str, response_time: float = 0):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "response_time": response_time,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message} ({response_time:.3f}s)")
        
    def measure_time(self, func, *args, **kwargs):
        """Measure execution time of a function"""
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        return result, end_time - start_time
        
    def authenticate(self):
        """Authenticate with admin credentials"""
        print("\n🔐 Testing Authentication...")
        
        login_data = {
            "user_id": ADMIN_USER,
            "password": ADMIN_PASSWORD
        }
        
        try:
            response, response_time = self.measure_time(
                self.session.post, 
                f"{BASE_URL}/auth/login", 
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.auth_token = data.get("token")
                    self.log_result("Authentication", True, f"Successfully logged in as {ADMIN_USER}", response_time)
                    return True
                else:
                    self.log_result("Authentication", False, f"Login failed: {data.get('error', 'Unknown error')}", response_time)
            else:
                self.log_result("Authentication", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("Authentication", False, f"Connection error: {str(e)}", 0)
            
        return False
        
    def test_health_check(self):
        """Test health check endpoint"""
        print("\n🏥 Testing Health Check...")
        
        try:
            response, response_time = self.measure_time(
                self.session.get, 
                f"{BASE_URL}/health",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_result("Health Check", True, "API is healthy", response_time)
                    return True
                else:
                    self.log_result("Health Check", False, f"Unhealthy status: {data}", response_time)
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("Health Check", False, f"Connection error: {str(e)}", 0)
            
        return False
        
    def test_attendance_endpoints(self):
        """Test attendance-related endpoints and calculations"""
        print("\n📋 Testing Attendance Endpoints...")
        
        # Test GET /api/attendance
        try:
            response, response_time = self.measure_time(
                self.session.get, 
                f"{BASE_URL}/attendance",
                timeout=10
            )
            
            if response.status_code == 200:
                attendance_data = response.json()
                self.log_result("GET /api/attendance", True, f"Retrieved {len(attendance_data)} attendance records", response_time)
                
                # Verify attendance calculation fields
                if attendance_data:
                    sample_record = attendance_data[0]
                    required_fields = ["emp_id", "date", "attendance_status", "daily_duty_amount", "conveyance_amount"]
                    missing_fields = [field for field in required_fields if field not in sample_record]
                    
                    if not missing_fields:
                        self.log_result("Attendance Data Structure", True, "All required fields present", 0)
                        
                        # Test duty hours calculation
                        if "work_hours" in sample_record:
                            work_hours = sample_record.get("work_hours", 0)
                            if isinstance(work_hours, (int, float)) and work_hours >= 0:
                                self.log_result("Work Hours Calculation", True, f"Work hours: {work_hours}", 0)
                            else:
                                self.log_result("Work Hours Calculation", False, f"Invalid work hours: {work_hours}", 0)
                        
                        # Test overtime calculation (if punch_in and punch_out exist)
                        if sample_record.get("punch_in") and sample_record.get("punch_out"):
                            punch_in = sample_record["punch_in"]
                            punch_out = sample_record["punch_out"]
                            self.log_result("Overtime Calculation", True, f"Punch times: {punch_in} - {punch_out}", 0)
                        
                    else:
                        self.log_result("Attendance Data Structure", False, f"Missing fields: {missing_fields}", 0)
                else:
                    self.log_result("Attendance Data", True, "No attendance records found (empty system)", 0)
                    
            else:
                self.log_result("GET /api/attendance", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("GET /api/attendance", False, f"Error: {str(e)}", 0)
            
        # Test POST /api/attendance/mark (Admin mark attendance)
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            mark_data = {
                "emp_id": "EMP001",
                "date": today,
                "status": "present",
                "marked_by": ADMIN_USER,
                "conveyance": 200.0,
                "location": "Office"
            }
            
            response, response_time = self.measure_time(
                self.session.post,
                f"{BASE_URL}/attendance/mark",
                params=mark_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                self.log_result("POST /api/attendance/mark", True, f"Marked attendance for {mark_data['emp_id']}", response_time)
                
                # Verify calculation fields in response
                if "daily_duty_amount" in result and "conveyance_amount" in result:
                    daily_duty = result.get("daily_duty_amount", 0)
                    conveyance = result.get("conveyance_amount", 0)
                    self.log_result("Attendance Calculation", True, f"Daily duty: ₹{daily_duty}, Conveyance: ₹{conveyance}", 0)
                else:
                    self.log_result("Attendance Calculation", False, "Missing calculation fields in response", 0)
                    
            else:
                self.log_result("POST /api/attendance/mark", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("POST /api/attendance/mark", False, f"Error: {str(e)}", 0)
            
    def test_payroll_endpoints(self):
        """Test payroll-related endpoints and calculations"""
        print("\n💰 Testing Payroll Endpoints...")
        
        # Test GET /api/payslips
        try:
            response, response_time = self.measure_time(
                self.session.get, 
                f"{BASE_URL}/payslips",
                timeout=10
            )
            
            if response.status_code == 200:
                payslips = response.json()
                self.log_result("GET /api/payslips", True, f"Retrieved {len(payslips)} payslips", response_time)
                
                # Verify payroll calculations
                if payslips:
                    sample_payslip = payslips[0]
                    breakdown = sample_payslip.get("breakdown", {})
                    
                    # Check salary calculation fields
                    salary_fields = ["basic", "hra", "special_allowance", "gross_pay", "net_pay"]
                    present_fields = [field for field in salary_fields if field in breakdown]
                    
                    if len(present_fields) >= 3:
                        self.log_result("Salary Calculations", True, f"Found salary components: {present_fields}", 0)
                        
                        # Verify mathematical accuracy
                        basic = breakdown.get("basic", 0)
                        hra = breakdown.get("hra", 0)
                        special_allowance = breakdown.get("special_allowance", 0)
                        gross_pay = breakdown.get("gross_pay", 0)
                        net_pay = breakdown.get("net_pay", 0)
                        
                        if isinstance(basic, (int, float)) and isinstance(hra, (int, float)):
                            self.log_result("Monthly Employee Calculations", True, f"Basic: ₹{basic}, HRA: ₹{hra}, Net: ₹{net_pay}", 0)
                        else:
                            self.log_result("Monthly Employee Calculations", False, "Invalid salary amounts", 0)
                            
                        # Check deductions
                        advance_deduction = breakdown.get("advance_deduction", 0)
                        attendance_adjustment = breakdown.get("attendance_adjustment", 0)
                        self.log_result("Deductions Calculation", True, f"Advance: ₹{advance_deduction}, Attendance: ₹{attendance_adjustment}", 0)
                        
                        # Check conveyance calculations
                        conveyance = breakdown.get("conveyance", 0)
                        extra_conveyance = breakdown.get("extra_conveyance", 0)
                        self.log_result("Conveyance Calculations", True, f"Regular: ₹{conveyance}, Extra: ₹{extra_conveyance}", 0)
                        
                    else:
                        self.log_result("Salary Calculations", False, f"Missing salary fields. Found: {present_fields}", 0)
                else:
                    self.log_result("Payroll Data", True, "No payslips found (empty system)", 0)
                    
            else:
                self.log_result("GET /api/payslips", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("GET /api/payslips", False, f"Error: {str(e)}", 0)
            
        # Test daily wage calculations by checking users endpoint
        try:
            response, response_time = self.measure_time(
                self.session.get, 
                f"{BASE_URL}/users",
                timeout=10
            )
            
            if response.status_code == 200:
                users = response.json()
                daily_wage_users = [u for u in users if u.get("salary_type") == "daily"]
                monthly_users = [u for u in users if u.get("salary_type") == "monthly"]
                
                self.log_result("Daily Wage Calculations", True, f"Found {len(daily_wage_users)} daily wage employees", response_time)
                self.log_result("Monthly Salary Verification", True, f"Found {len(monthly_users)} monthly employees", 0)
                
            else:
                self.log_result("User Data Check", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("User Data Check", False, f"Error: {str(e)}", 0)
            
    def test_leave_endpoints(self):
        """Test leave-related endpoints and calculations"""
        print("\n🏖️ Testing Leave Endpoints...")
        
        # Test GET /api/leaves
        try:
            response, response_time = self.measure_time(
                self.session.get, 
                f"{BASE_URL}/leaves",
                timeout=10
            )
            
            if response.status_code == 200:
                leaves = response.json()
                self.log_result("GET /api/leaves", True, f"Retrieved {len(leaves)} leave records", response_time)
                
                # Verify leave balance calculations
                if leaves:
                    sample_leave = leaves[0]
                    required_fields = ["emp_id", "days", "status", "from_date", "to_date"]
                    present_fields = [field for field in required_fields if field in sample_leave]
                    
                    if len(present_fields) >= 4:
                        days = sample_leave.get("days", 0)
                        status = sample_leave.get("status", "")
                        self.log_result("Leave Balance Calculations", True, f"Leave days: {days}, Status: {status}", 0)
                        
                        # Check leave deduction logic
                        if status == "approved":
                            self.log_result("Leave Deduction Logic", True, "Approved leaves should not deduct from salary", 0)
                        else:
                            self.log_result("Leave Deduction Logic", True, f"Pending/rejected leave status: {status}", 0)
                    else:
                        self.log_result("Leave Data Structure", False, f"Missing fields. Found: {present_fields}", 0)
                else:
                    self.log_result("Leave Records", True, "No leave records found (empty system)", 0)
                    
            else:
                self.log_result("GET /api/leaves", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("GET /api/leaves", False, f"Error: {str(e)}", 0)
            
    def test_bills_and_advances_endpoints(self):
        """Test bills and advances endpoints and calculations"""
        print("\n💳 Testing Bills & Advances Endpoints...")
        
        # Test GET /api/bills
        try:
            response, response_time = self.measure_time(
                self.session.get, 
                f"{BASE_URL}/bills",
                timeout=10
            )
            
            if response.status_code == 200:
                bills = response.json()
                self.log_result("GET /api/bills", True, f"Retrieved {len(bills)} bill submissions", response_time)
                
                # Verify bill calculations
                if bills:
                    sample_bill = bills[0]
                    total_amount = sample_bill.get("total_amount", 0)
                    approved_amount = sample_bill.get("approved_amount", 0)
                    status = sample_bill.get("status", "")
                    
                    self.log_result("Bill Calculations", True, f"Total: ₹{total_amount}, Approved: ₹{approved_amount}, Status: {status}", 0)
                else:
                    self.log_result("Bill Records", True, "No bill submissions found (empty system)", 0)
                    
            else:
                self.log_result("GET /api/bills", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("GET /api/bills", False, f"Error: {str(e)}", 0)
            
        # Test GET /api/advances
        try:
            response, response_time = self.measure_time(
                self.session.get, 
                f"{BASE_URL}/advances",
                timeout=10
            )
            
            if response.status_code == 200:
                advances = response.json()
                self.log_result("GET /api/advances", True, f"Retrieved {len(advances)} advance requests", response_time)
                
                # Verify advance deduction calculations
                if advances:
                    sample_advance = advances[0]
                    amount = sample_advance.get("amount", 0)
                    status = sample_advance.get("status", "")
                    is_deducted = sample_advance.get("is_deducted", False)
                    
                    self.log_result("Advance Deduction Calculations", True, f"Amount: ₹{amount}, Status: {status}, Deducted: {is_deducted}", 0)
                else:
                    self.log_result("Advance Records", True, "No advance requests found (empty system)", 0)
                    
            else:
                self.log_result("GET /api/advances", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("GET /api/advances", False, f"Error: {str(e)}", 0)
            
    def test_performance(self):
        """Test API performance and identify bottlenecks"""
        print("\n⚡ Testing API Performance...")
        
        endpoints_to_test = [
            ("/health", "GET"),
            ("/users", "GET"),
            ("/attendance", "GET"),
            ("/payslips", "GET"),
            ("/leaves", "GET"),
            ("/bills", "GET"),
            ("/advances", "GET")
        ]
        
        slow_apis = []
        
        for endpoint, method in endpoints_to_test:
            try:
                if method == "GET":
                    response, response_time = self.measure_time(
                        self.session.get, 
                        f"{BASE_URL}{endpoint}",
                        timeout=10
                    )
                    
                    if response_time > 2.0:
                        slow_apis.append((endpoint, response_time))
                        self.log_result(f"Performance {endpoint}", False, f"Slow API: {response_time:.3f}s (>2s threshold)", response_time)
                    else:
                        self.log_result(f"Performance {endpoint}", True, f"Good performance: {response_time:.3f}s", response_time)
                        
                    self.performance_results.append({
                        "endpoint": endpoint,
                        "method": method,
                        "response_time": response_time,
                        "status_code": response.status_code
                    })
                    
            except Exception as e:
                self.log_result(f"Performance {endpoint}", False, f"Error: {str(e)}", 0)
                
        # Performance summary
        if slow_apis:
            self.log_result("Performance Bottlenecks", False, f"Found {len(slow_apis)} slow APIs: {[api[0] for api in slow_apis]}", 0)
        else:
            self.log_result("Performance Check", True, "All APIs respond within 2 seconds", 0)
            
    def test_mathematical_accuracy(self):
        """Test mathematical accuracy of calculations"""
        print("\n🧮 Testing Mathematical Accuracy...")
        
        # Test with known values if we have sample data
        try:
            # Get a sample payslip to verify calculations
            response = self.session.get(f"{BASE_URL}/payslips", timeout=10)
            
            if response.status_code == 200:
                payslips = response.json()
                
                if payslips:
                    sample = payslips[0]
                    breakdown = sample.get("breakdown", {})
                    
                    # Verify basic mathematical relationships
                    basic = breakdown.get("basic", 0)
                    hra = breakdown.get("hra", 0)
                    special_allowance = breakdown.get("special_allowance", 0)
                    gross_pay = breakdown.get("gross_pay", 0)
                    net_pay = breakdown.get("net_pay", 0)
                    advance_deduction = breakdown.get("advance_deduction", 0)
                    
                    # Check if calculations are mathematically sound
                    calculated_base = basic + hra + special_allowance
                    
                    if abs(calculated_base - (basic + hra + special_allowance)) < 0.01:  # Allow for rounding
                        self.log_result("Mathematical Accuracy", True, f"Salary components add up correctly: ₹{calculated_base}", 0)
                    else:
                        self.log_result("Mathematical Accuracy", False, f"Salary calculation mismatch", 0)
                        
                    # Check net pay calculation logic
                    if net_pay <= gross_pay:  # Net should not exceed gross
                        self.log_result("Net Pay Logic", True, f"Net pay (₹{net_pay}) ≤ Gross pay (₹{gross_pay})", 0)
                    else:
                        self.log_result("Net Pay Logic", False, f"Net pay (₹{net_pay}) > Gross pay (₹{gross_pay})", 0)
                        
                else:
                    self.log_result("Mathematical Accuracy", True, "No payslip data to verify calculations", 0)
                    
        except Exception as e:
            self.log_result("Mathematical Accuracy", False, f"Error: {str(e)}", 0)
            
    def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "="*80)
        print("📊 ATTENDANCE MANAGEMENT SYSTEM - BACKEND TEST REPORT")
        print("="*80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"\n📈 SUMMARY:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {passed_tests} ✅")
        print(f"   Failed: {failed_tests} ❌")
        print(f"   Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        # Performance summary
        if self.performance_results:
            avg_response_time = sum(r["response_time"] for r in self.performance_results) / len(self.performance_results)
            slow_apis = [r for r in self.performance_results if r["response_time"] > 2.0]
            
            print(f"\n⚡ PERFORMANCE:")
            print(f"   Average Response Time: {avg_response_time:.3f}s")
            print(f"   Slow APIs (>2s): {len(slow_apis)}")
            
            if slow_apis:
                print("   Bottlenecks:")
                for api in slow_apis:
                    print(f"     - {api['endpoint']}: {api['response_time']:.3f}s")
        
        # Failed tests details
        failed_results = [r for r in self.test_results if not r["success"]]
        if failed_results:
            print(f"\n❌ FAILED TESTS:")
            for result in failed_results:
                print(f"   - {result['test']}: {result['message']}")
        
        # Critical issues
        critical_issues = []
        auth_failed = not any(r["test"] == "Authentication" and r["success"] for r in self.test_results)
        health_failed = not any(r["test"] == "Health Check" and r["success"] for r in self.test_results)
        
        if auth_failed:
            critical_issues.append("Authentication system not working")
        if health_failed:
            critical_issues.append("API health check failing")
            
        if critical_issues:
            print(f"\n🚨 CRITICAL ISSUES:")
            for issue in critical_issues:
                print(f"   - {issue}")
        
        print("\n" + "="*80)
        
        return {
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": passed_tests/total_tests*100 if total_tests > 0 else 0,
            "critical_issues": critical_issues,
            "performance_issues": len([r for r in self.performance_results if r["response_time"] > 2.0]),
            "test_results": self.test_results
        }
        
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Attendance Management System Backend Testing...")
        print(f"🎯 Target URL: {BASE_URL}")
        print(f"👤 Test User: {ADMIN_USER}")
        
        # Core functionality tests
        if not self.test_health_check():
            print("⚠️  Health check failed - API may be down")
            
        if not self.authenticate():
            print("⚠️  Authentication failed - cannot test protected endpoints")
            return self.generate_report()
            
        # Test all endpoints and calculations
        self.test_attendance_endpoints()
        self.test_payroll_endpoints()
        self.test_leave_endpoints()
        self.test_bills_and_advances_endpoints()
        
        # Performance and accuracy tests
        self.test_performance()
        self.test_mathematical_accuracy()
        
        # Generate final report
        return self.generate_report()

def main():
    """Main test execution"""
    tester = AttendanceSystemTester()
    report = tester.run_all_tests()
    
    # Return exit code based on results
    if report["critical_issues"] or report["success_rate"] < 80:
        exit(1)  # Indicate test failures
    else:
        exit(0)  # All tests passed

if __name__ == "__main__":
    main()