"""
Test Bill Partial Approval & Revalidation Feature
Tests the backend APIs for:
- Bill approval with partial amount
- Send to revalidation flag
- Revalidate bill endpoint
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://payroll-hub-31.preview.emergentagent.com')

class TestBillPartialApprovalRevalidation:
    """Test Bill Partial Approval and Revalidation Feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.admin_id = "ADMIN001"
        self.test_emp_id = f"TEST_{uuid.uuid4().hex[:6].upper()}"
        self.test_emp_name = "Test Employee Revalidation"
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        yield
        # Cleanup - delete test bills
        self._cleanup_test_data()
    
    def _cleanup_test_data(self):
        """Clean up test data after tests"""
        try:
            # Get all bills for test employee and delete them
            response = self.session.get(f"{BASE_URL}/api/bills?emp_id={self.test_emp_id}")
            if response.status_code == 200:
                bills = response.json()
                for bill in bills:
                    # Note: No delete endpoint for bills, so we just leave them
                    pass
        except Exception as e:
            print(f"Cleanup error: {e}")
    
    def test_01_get_bills_endpoint_works(self):
        """Test GET /api/bills endpoint returns list"""
        response = self.session.get(f"{BASE_URL}/api/bills")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/bills returns {len(data)} bills")
    
    def test_02_get_bills_with_status_filter(self):
        """Test GET /api/bills with status filter"""
        # Test pending filter
        response = self.session.get(f"{BASE_URL}/api/bills?status=pending")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/bills?status=pending returns {len(data)} bills")
        
        # Test revalidation filter
        response = self.session.get(f"{BASE_URL}/api/bills?status=revalidation")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/bills?status=revalidation returns {len(data)} bills")
        
        # Test approved filter
        response = self.session.get(f"{BASE_URL}/api/bills?status=approved")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/bills?status=approved returns {len(data)} bills")
    
    def test_03_create_test_bill(self):
        """Create a test bill for approval testing"""
        bill_data = {
            "month": "December",
            "year": 2025,
            "remarks": "Test bill for revalidation testing",
            "items": [
                {
                    "date": "2025-12-15",
                    "location": "Test Location",
                    "description": "Test expense item 1",
                    "amount": 5000.0,
                    "has_attachment": False,
                    "attachment_url": None
                },
                {
                    "date": "2025-12-16",
                    "location": "Test Location 2",
                    "description": "Test expense item 2",
                    "amount": 3000.0,
                    "has_attachment": False,
                    "attachment_url": None
                }
            ]
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/bills?emp_id={self.test_emp_id}&emp_name={self.test_emp_name}",
            json=bill_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["total_amount"] == 8000.0
        assert data["status"] == "pending"
        assert data["emp_id"] == self.test_emp_id
        
        # Store bill ID for later tests
        self.__class__.test_bill_id = data["id"]
        print(f"✓ Created test bill with ID: {data['id']}, total: ₹{data['total_amount']}")
    
    def test_04_approve_bill_full_amount(self):
        """Test approving bill with full amount (no revalidation)"""
        # First create a new bill
        bill_data = {
            "month": "December",
            "year": 2025,
            "remarks": "Full approval test",
            "items": [{"date": "2025-12-17", "location": "Office", "description": "Full test", "amount": 2000.0, "has_attachment": False, "attachment_url": None}]
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/bills?emp_id={self.test_emp_id}&emp_name={self.test_emp_name}",
            json=bill_data
        )
        assert create_response.status_code == 200
        bill = create_response.json()
        bill_id = bill["id"]
        
        # Approve with full amount
        response = self.session.put(
            f"{BASE_URL}/api/bills/{bill_id}/approve?approved_by={self.admin_id}&approved_amount=2000.0"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data
        assert data["status"] == "approved"
        assert data.get("remaining_balance", 0) == 0
        print(f"✓ Full approval works: {data['message']}")
    
    def test_05_approve_bill_partial_without_revalidation(self):
        """Test partial approval without sending to revalidation"""
        # Create a new bill
        bill_data = {
            "month": "December",
            "year": 2025,
            "remarks": "Partial approval test (no revalidation)",
            "items": [{"date": "2025-12-18", "location": "Site", "description": "Partial test", "amount": 5000.0, "has_attachment": False, "attachment_url": None}]
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/bills?emp_id={self.test_emp_id}&emp_name={self.test_emp_name}",
            json=bill_data
        )
        assert create_response.status_code == 200
        bill = create_response.json()
        bill_id = bill["id"]
        
        # Approve with partial amount (no revalidation flag)
        response = self.session.put(
            f"{BASE_URL}/api/bills/{bill_id}/approve?approved_by={self.admin_id}&approved_amount=3000.0"
        )
        assert response.status_code == 200
        data = response.json()
        
        # Without revalidation flag, should still be approved
        assert data["status"] == "approved"
        assert data["remaining_balance"] == 2000.0
        print(f"✓ Partial approval without revalidation: status={data['status']}, remaining=₹{data['remaining_balance']}")
    
    def test_06_approve_bill_partial_with_revalidation(self):
        """Test partial approval WITH send_to_revalidation flag"""
        # Create a new bill
        bill_data = {
            "month": "December",
            "year": 2025,
            "remarks": "Partial approval test (with revalidation)",
            "items": [{"date": "2025-12-19", "location": "Client", "description": "Revalidation test", "amount": 10000.0, "has_attachment": False, "attachment_url": None}]
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/bills?emp_id={self.test_emp_id}&emp_name={self.test_emp_name}",
            json=bill_data
        )
        assert create_response.status_code == 200
        bill = create_response.json()
        bill_id = bill["id"]
        
        # Approve with partial amount AND revalidation flag
        response = self.session.put(
            f"{BASE_URL}/api/bills/{bill_id}/approve?approved_by={self.admin_id}&approved_amount=6000.0&send_to_revalidation=true"
        )
        assert response.status_code == 200
        data = response.json()
        
        # With revalidation flag, status should be "revalidation"
        assert data["status"] == "revalidation"
        assert data["remaining_balance"] == 4000.0
        
        # Store for revalidation test
        self.__class__.revalidation_bill_id = bill_id
        print(f"✓ Partial approval with revalidation: status={data['status']}, remaining=₹{data['remaining_balance']}")
    
    def test_07_revalidate_bill_endpoint(self):
        """Test PUT /api/bills/{id}/revalidate endpoint"""
        bill_id = getattr(self.__class__, 'revalidation_bill_id', None)
        
        if not bill_id:
            pytest.skip("No revalidation bill created in previous test")
        
        # Revalidate with additional amount
        response = self.session.put(
            f"{BASE_URL}/api/bills/{bill_id}/revalidate?revalidated_by={self.admin_id}&additional_amount=2000.0"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data
        assert data["total_approved"] == 8000.0  # 6000 + 2000
        assert data["remaining_balance"] == 2000.0  # 10000 - 8000
        print(f"✓ Revalidation works: total_approved=₹{data['total_approved']}, remaining=₹{data['remaining_balance']}")
    
    def test_08_revalidate_nonexistent_bill(self):
        """Test revalidate endpoint with non-existent bill"""
        response = self.session.put(
            f"{BASE_URL}/api/bills/NONEXISTENT123/revalidate?revalidated_by={self.admin_id}&additional_amount=1000.0"
        )
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data.get("detail", "").lower()
        print("✓ Revalidate non-existent bill returns 404")
    
    def test_09_revalidate_non_revalidation_status_bill(self):
        """Test revalidate endpoint on bill not in revalidation status"""
        # Create and fully approve a bill
        bill_data = {
            "month": "December",
            "year": 2025,
            "remarks": "Non-revalidation status test",
            "items": [{"date": "2025-12-20", "location": "HQ", "description": "Status test", "amount": 1000.0, "has_attachment": False, "attachment_url": None}]
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/bills?emp_id={self.test_emp_id}&emp_name={self.test_emp_name}",
            json=bill_data
        )
        bill = create_response.json()
        bill_id = bill["id"]
        
        # Fully approve it
        self.session.put(
            f"{BASE_URL}/api/bills/{bill_id}/approve?approved_by={self.admin_id}&approved_amount=1000.0"
        )
        
        # Try to revalidate an approved bill
        response = self.session.put(
            f"{BASE_URL}/api/bills/{bill_id}/revalidate?revalidated_by={self.admin_id}&additional_amount=500.0"
        )
        assert response.status_code == 400
        data = response.json()
        assert "not in revalidation status" in data.get("detail", "").lower()
        print("✓ Revalidate non-revalidation bill returns 400")
    
    def test_10_approve_nonexistent_bill(self):
        """Test approve endpoint with non-existent bill"""
        response = self.session.put(
            f"{BASE_URL}/api/bills/NONEXISTENT456/approve?approved_by={self.admin_id}&approved_amount=1000.0"
        )
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data.get("detail", "").lower()
        print("✓ Approve non-existent bill returns 404")
    
    def test_11_verify_bill_data_structure(self):
        """Verify bill response includes all required fields for revalidation feature"""
        # Get all bills
        response = self.session.get(f"{BASE_URL}/api/bills")
        assert response.status_code == 200
        bills = response.json()
        
        if len(bills) > 0:
            bill = bills[0]
            # Check required fields exist
            required_fields = ["id", "emp_id", "emp_name", "month", "year", "items", 
                             "total_amount", "status", "submitted_on"]
            for field in required_fields:
                assert field in bill, f"Missing field: {field}"
            
            # Check optional fields for approved/revalidation bills
            if bill.get("status") in ["approved", "revalidation"]:
                assert "approved_amount" in bill or bill.get("approved_amount") is not None or bill.get("approved_amount") == 0
            
            print(f"✓ Bill data structure verified with all required fields")
        else:
            print("⚠ No bills found to verify structure")


class TestBillAPIIntegration:
    """Integration tests for bill API with frontend expectations"""
    
    def test_filter_by_revalidation_status(self):
        """Test that revalidation status filter works correctly"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.get(f"{BASE_URL}/api/bills?status=revalidation")
        assert response.status_code == 200
        bills = response.json()
        
        # All returned bills should have revalidation status
        for bill in bills:
            assert bill.get("status") == "revalidation", f"Bill {bill.get('id')} has status {bill.get('status')}, expected revalidation"
        
        print(f"✓ Revalidation filter returns {len(bills)} bills, all with correct status")
    
    def test_approve_endpoint_accepts_send_to_revalidation_param(self):
        """Test that approve endpoint accepts send_to_revalidation parameter"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Create a test bill
        bill_data = {
            "month": "December",
            "year": 2025,
            "remarks": "Param test",
            "items": [{"date": "2025-12-21", "location": "Test", "description": "Param test", "amount": 3000.0, "has_attachment": False, "attachment_url": None}]
        }
        
        test_emp_id = f"TEST_{uuid.uuid4().hex[:6].upper()}"
        create_response = session.post(
            f"{BASE_URL}/api/bills?emp_id={test_emp_id}&emp_name=Test Param",
            json=bill_data
        )
        assert create_response.status_code == 200
        bill = create_response.json()
        
        # Test with send_to_revalidation=true
        response = session.put(
            f"{BASE_URL}/api/bills/{bill['id']}/approve?approved_by=ADMIN001&approved_amount=1500.0&send_to_revalidation=true"
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify the parameter was processed
        assert data["status"] == "revalidation"
        print("✓ send_to_revalidation parameter accepted and processed correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
