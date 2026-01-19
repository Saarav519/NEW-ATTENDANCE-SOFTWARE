"""
Backend API Tests for Cashbook / Company Finance Module
Tests: Cash In (Invoices), Cash Out (Expenses), Categories, Month Locks, Summary, Exports
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://employee-tracker-99.preview.emergentagent.com')

@pytest.fixture(scope="session")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

# ==================== CASHBOOK CATEGORIES TESTS ====================
class TestCashbookCategories:
    """Expense categories endpoint tests"""
    
    def test_get_categories(self, api_client):
        """Test getting all expense categories (predefined + custom)"""
        response = api_client.get(f"{BASE_URL}/api/cashbook/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have predefined categories
        category_ids = [c["id"] for c in data]
        assert "salary" in category_ids
        assert "rent" in category_ids
        assert "utilities" in category_ids
        assert "office_supplies" in category_ids
        assert "travel" in category_ids
        assert "marketing" in category_ids
        assert "miscellaneous" in category_ids
        print(f"✓ Found {len(data)} categories including predefined ones")
    
    def test_create_custom_category(self, api_client):
        """Test creating a custom expense category"""
        response = api_client.post(f"{BASE_URL}/api/cashbook/categories", json={
            "name": "TEST_Custom Category",
            "description": "Test custom category for testing"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Custom Category"
        assert "id" in data
        print(f"✓ Created custom category with ID: {data['id']}")
        return data["id"]
    
    def test_delete_custom_category(self, api_client):
        """Test deleting a custom category"""
        # First create a category
        create_response = api_client.post(f"{BASE_URL}/api/cashbook/categories", json={
            "name": "TEST_ToDelete",
            "description": "Category to be deleted"
        })
        assert create_response.status_code == 200
        cat_id = create_response.json()["id"]
        
        # Delete it
        delete_response = api_client.delete(f"{BASE_URL}/api/cashbook/categories/{cat_id}")
        assert delete_response.status_code == 200
        print(f"✓ Deleted custom category {cat_id}")


# ==================== CASH IN (INVOICES) TESTS ====================
class TestCashIn:
    """Cash In (Client Invoices) endpoint tests"""
    
    def test_create_cash_in_invoice(self, api_client):
        """Test creating a cash in entry (client invoice)"""
        response = api_client.post(f"{BASE_URL}/api/cashbook/cash-in", json={
            "client_name": "TEST_Client ABC",
            "invoice_number": "INV-TEST-001",
            "invoice_date": "2025-12-15",
            "invoice_amount": 50000,
            "payment_status": "pending",
            "amount_received": 0,
            "notes": "Test invoice for testing"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["client_name"] == "TEST_Client ABC"
        assert data["invoice_number"] == "INV-TEST-001"
        assert data["invoice_amount"] == 50000
        assert data["pending_balance"] == 50000
        assert "id" in data
        print(f"✓ Created cash in entry with ID: {data['id']}")
        return data["id"]
    
    def test_create_cash_in_with_partial_payment(self, api_client):
        """Test creating invoice with partial payment"""
        response = api_client.post(f"{BASE_URL}/api/cashbook/cash-in", json={
            "client_name": "TEST_Client XYZ",
            "invoice_number": "INV-TEST-002",
            "invoice_date": "2025-12-16",
            "invoice_amount": 100000,
            "payment_status": "partial",
            "amount_received": 40000,
            "notes": "Partial payment received"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["invoice_amount"] == 100000
        assert data["amount_received"] == 40000
        assert data["pending_balance"] == 60000
        print(f"✓ Created partial payment invoice with pending balance: {data['pending_balance']}")
    
    def test_get_cash_in_entries(self, api_client):
        """Test getting all cash in entries"""
        response = api_client.get(f"{BASE_URL}/api/cashbook/cash-in")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} cash in entries")
    
    def test_get_cash_in_by_month_year(self, api_client):
        """Test filtering cash in by month and year"""
        response = api_client.get(f"{BASE_URL}/api/cashbook/cash-in?month=December&year=2025")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All entries should be from December 2025
        for entry in data:
            assert entry["month"] == "December"
            assert entry["year"] == 2025
        print(f"✓ Retrieved {len(data)} cash in entries for December 2025")
    
    def test_update_cash_in_entry(self, api_client):
        """Test updating a cash in entry"""
        # First create an entry
        create_response = api_client.post(f"{BASE_URL}/api/cashbook/cash-in", json={
            "client_name": "TEST_Update Client",
            "invoice_number": "INV-TEST-UPDATE",
            "invoice_date": "2025-12-17",
            "invoice_amount": 25000,
            "payment_status": "pending",
            "amount_received": 0
        })
        assert create_response.status_code == 200
        entry_id = create_response.json()["id"]
        
        # Update it with payment received
        update_response = api_client.put(f"{BASE_URL}/api/cashbook/cash-in/{entry_id}", json={
            "client_name": "TEST_Update Client",
            "invoice_number": "INV-TEST-UPDATE",
            "invoice_date": "2025-12-17",
            "invoice_amount": 25000,
            "payment_status": "paid",
            "amount_received": 25000
        })
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["amount_received"] == 25000
        assert data["pending_balance"] == 0
        print(f"✓ Updated cash in entry {entry_id} - payment received")
    
    def test_delete_cash_in_entry(self, api_client):
        """Test deleting a cash in entry"""
        # First create an entry
        create_response = api_client.post(f"{BASE_URL}/api/cashbook/cash-in", json={
            "client_name": "TEST_Delete Client",
            "invoice_number": "INV-TEST-DELETE",
            "invoice_date": "2025-12-18",
            "invoice_amount": 10000,
            "payment_status": "pending",
            "amount_received": 0
        })
        assert create_response.status_code == 200
        entry_id = create_response.json()["id"]
        
        # Delete it
        delete_response = api_client.delete(f"{BASE_URL}/api/cashbook/cash-in/{entry_id}")
        assert delete_response.status_code == 200
        print(f"✓ Deleted cash in entry {entry_id}")


# ==================== CASH OUT (EXPENSES) TESTS ====================
class TestCashOut:
    """Cash Out (Expenses) endpoint tests"""
    
    def test_create_cash_out_expense(self, api_client):
        """Test creating a manual cash out entry"""
        response = api_client.post(f"{BASE_URL}/api/cashbook/cash-out", json={
            "category": "rent",
            "description": "TEST_Office rent for December",
            "amount": 50000,
            "date": "2025-12-01",
            "notes": "Monthly rent payment"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "rent"
        assert data["amount"] == 50000
        assert data["is_auto"] == False
        assert "id" in data
        print(f"✓ Created cash out entry with ID: {data['id']}")
        return data["id"]
    
    def test_create_cash_out_with_different_categories(self, api_client):
        """Test creating expenses with different predefined categories"""
        categories = ["utilities", "office_supplies", "travel", "marketing", "miscellaneous"]
        
        for cat in categories:
            response = api_client.post(f"{BASE_URL}/api/cashbook/cash-out", json={
                "category": cat,
                "description": f"TEST_{cat} expense",
                "amount": 5000,
                "date": "2025-12-10"
            })
            assert response.status_code == 200
            data = response.json()
            assert data["category"] == cat
            print(f"✓ Created {cat} expense")
    
    def test_get_cash_out_entries(self, api_client):
        """Test getting all cash out entries"""
        response = api_client.get(f"{BASE_URL}/api/cashbook/cash-out")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} cash out entries")
    
    def test_get_cash_out_by_month_year(self, api_client):
        """Test filtering cash out by month and year"""
        response = api_client.get(f"{BASE_URL}/api/cashbook/cash-out?month=December&year=2025")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for entry in data:
            assert entry["month"] == "December"
            assert entry["year"] == 2025
        print(f"✓ Retrieved {len(data)} cash out entries for December 2025")
    
    def test_update_cash_out_entry(self, api_client):
        """Test updating a manual cash out entry"""
        # First create an entry
        create_response = api_client.post(f"{BASE_URL}/api/cashbook/cash-out", json={
            "category": "utilities",
            "description": "TEST_Electricity bill",
            "amount": 15000,
            "date": "2025-12-05"
        })
        assert create_response.status_code == 200
        entry_id = create_response.json()["id"]
        
        # Update it
        update_response = api_client.put(f"{BASE_URL}/api/cashbook/cash-out/{entry_id}", json={
            "category": "utilities",
            "description": "TEST_Electricity bill - Updated",
            "amount": 18000,
            "date": "2025-12-05",
            "notes": "Updated amount after final bill"
        })
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["amount"] == 18000
        assert "Updated" in data["description"]
        print(f"✓ Updated cash out entry {entry_id}")
    
    def test_delete_cash_out_entry(self, api_client):
        """Test deleting a manual cash out entry"""
        # First create an entry
        create_response = api_client.post(f"{BASE_URL}/api/cashbook/cash-out", json={
            "category": "miscellaneous",
            "description": "TEST_To be deleted",
            "amount": 1000,
            "date": "2025-12-20"
        })
        assert create_response.status_code == 200
        entry_id = create_response.json()["id"]
        
        # Delete it
        delete_response = api_client.delete(f"{BASE_URL}/api/cashbook/cash-out/{entry_id}")
        assert delete_response.status_code == 200
        print(f"✓ Deleted cash out entry {entry_id}")


# ==================== MONTH LOCK TESTS ====================
class TestMonthLock:
    """Month lock/unlock endpoint tests"""
    
    def test_get_locks(self, api_client):
        """Test getting all month locks"""
        response = api_client.get(f"{BASE_URL}/api/cashbook/locks")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} month locks")
    
    def test_get_locks_by_year(self, api_client):
        """Test filtering locks by year"""
        response = api_client.get(f"{BASE_URL}/api/cashbook/locks?year=2025")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for lock in data:
            assert lock["year"] == 2025
        print(f"✓ Retrieved {len(data)} locks for 2025")
    
    def test_lock_and_unlock_month(self, api_client):
        """Test locking and unlocking a month"""
        # Lock November 2025
        lock_response = api_client.post(
            f"{BASE_URL}/api/cashbook/lock?locked_by=ADMIN001",
            json={"month": "November", "year": 2025}
        )
        assert lock_response.status_code == 200
        print("✓ Locked November 2025")
        
        # Verify lock prevents adding entries
        add_response = api_client.post(f"{BASE_URL}/api/cashbook/cash-in", json={
            "client_name": "TEST_Locked Month Client",
            "invoice_number": "INV-LOCKED",
            "invoice_date": "2025-11-15",
            "invoice_amount": 10000,
            "payment_status": "pending",
            "amount_received": 0
        })
        assert add_response.status_code == 400
        assert "locked" in add_response.json()["detail"].lower()
        print("✓ Verified locked month prevents adding entries")
        
        # Unlock the month
        unlock_response = api_client.post(
            f"{BASE_URL}/api/cashbook/unlock?unlocked_by=ADMIN001",
            json={"month": "November", "year": 2025}
        )
        assert unlock_response.status_code == 200
        print("✓ Unlocked November 2025")


# ==================== CASHBOOK SUMMARY TESTS ====================
class TestCashbookSummary:
    """Cashbook summary endpoint tests"""
    
    def test_get_summary_yearly(self, api_client):
        """Test getting yearly cashbook summary"""
        response = api_client.get(f"{BASE_URL}/api/cashbook/summary?year=2025")
        assert response.status_code == 200
        data = response.json()
        assert "total_cash_in" in data
        assert "total_cash_out" in data
        assert "net_profit_loss" in data
        assert data["year"] == 2025
        print(f"✓ Yearly summary - Cash In: {data['total_cash_in']}, Cash Out: {data['total_cash_out']}, Net: {data['net_profit_loss']}")
    
    def test_get_summary_monthly(self, api_client):
        """Test getting monthly cashbook summary"""
        response = api_client.get(f"{BASE_URL}/api/cashbook/summary?month=December&year=2025")
        assert response.status_code == 200
        data = response.json()
        assert data["month"] == "December"
        assert data["year"] == 2025
        assert "total_cash_in" in data
        assert "total_cash_out" in data
        assert "net_profit_loss" in data
        # Verify net calculation
        assert data["net_profit_loss"] == data["total_cash_in"] - data["total_cash_out"]
        print(f"✓ December 2025 summary - Cash In: {data['total_cash_in']}, Cash Out: {data['total_cash_out']}, Net: {data['net_profit_loss']}")


# ==================== EXPORT TESTS ====================
class TestCashbookExports:
    """Cashbook export endpoint tests"""
    
    def test_export_cashbook_csv(self, api_client):
        """Test exporting cashbook to CSV"""
        response = api_client.get(f"{BASE_URL}/api/export/cashbook?month=December&year=2025")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        assert "attachment" in response.headers.get("content-disposition", "")
        print("✓ Cashbook CSV export successful")
    
    def test_export_invoices_csv(self, api_client):
        """Test exporting invoices to CSV"""
        response = api_client.get(f"{BASE_URL}/api/export/invoices?month=December&year=2025")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        print("✓ Invoices CSV export successful")
    
    def test_export_invoices_zip(self, api_client):
        """Test exporting invoice PDFs as ZIP"""
        response = api_client.get(f"{BASE_URL}/api/export/invoices-zip?year=2025")
        # May return 404 if no PDFs exist, which is acceptable
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            assert "application/zip" in response.headers.get("content-type", "")
            print("✓ Invoice PDFs ZIP export successful")
        else:
            print("✓ No invoice PDFs to export (expected)")


# ==================== CLEANUP ====================
class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_data(self, api_client):
        """Clean up TEST_ prefixed entries"""
        # Get all cash in entries and delete TEST_ ones
        cash_in_response = api_client.get(f"{BASE_URL}/api/cashbook/cash-in")
        if cash_in_response.status_code == 200:
            for entry in cash_in_response.json():
                if entry.get("client_name", "").startswith("TEST_"):
                    api_client.delete(f"{BASE_URL}/api/cashbook/cash-in/{entry['id']}")
        
        # Get all cash out entries and delete TEST_ ones
        cash_out_response = api_client.get(f"{BASE_URL}/api/cashbook/cash-out")
        if cash_out_response.status_code == 200:
            for entry in cash_out_response.json():
                if entry.get("description", "").startswith("TEST_"):
                    api_client.delete(f"{BASE_URL}/api/cashbook/cash-out/{entry['id']}")
        
        # Get all categories and delete TEST_ ones
        cat_response = api_client.get(f"{BASE_URL}/api/cashbook/categories")
        if cat_response.status_code == 200:
            for cat in cat_response.json():
                if cat.get("name", "").startswith("TEST_") and not cat.get("is_predefined"):
                    api_client.delete(f"{BASE_URL}/api/cashbook/categories/{cat['id']}")
        
        print("✓ Cleaned up test data")
