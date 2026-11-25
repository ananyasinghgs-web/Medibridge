import sys
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "MediBridge Platform API"

def test_login_demo_patient():
    response = client.post("/api/auth/login", json={
        "email": "patient@medibridge.demo",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "patient"
    assert data["user"]["full_name"] == "Sarah Jenkins"

def test_login_demo_doctor():
    response = client.post("/api/auth/login", json={
        "email": "doctor@medibridge.demo",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "doctor"

def test_login_demo_admin():
    response = client.post("/api/auth/login", json={
        "email": "admin@medibridge.demo",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "admin"

def test_patient_timeline():
    # Login as patient
    login_res = client.post("/api/auth/login", json={
        "email": "patient@medibridge.demo",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch timeline
    res = client.get("/api/patients/timeline", headers=headers)
    assert res.status_code == 200
    events = res.json()["events"]
    assert len(events) >= 2
    # Verify event types are populated
    event_types = [e["event_type"] for e in events]
    assert "report" in event_types

def test_report_comparison():
    # Login as patient
    login_res = client.post("/api/auth/login", json={
        "email": "patient@medibridge.demo",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # List reports
    reports_res = client.get("/api/reports/", headers=headers)
    assert reports_res.status_code == 200
    reports = reports_res.json()
    assert len(reports) >= 2

    # Compare first 2 reports
    r1_id = reports[0]["id"]
    r2_id = reports[1]["id"]
    comp_res = client.get(f"/api/reports/compare/{r1_id}/{r2_id}", headers=headers)
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert "comparisons" in comp_data
    assert len(comp_data["comparisons"]) > 0
    # Check that disclaimer is present
    assert "disclaimer" in comp_data

if __name__ == "__main__":
    print("Executing MediBridge Backend Verification Tests...")
    test_health_check()
    print("✓ Health Check Passed")
    test_login_demo_patient()
    print("✓ Demo Patient Login Passed")
    test_login_demo_doctor()
    print("✓ Demo Doctor Login Passed")
    test_login_demo_admin()
    print("✓ Demo Admin Login Passed")
    test_patient_timeline()
    print("✓ Patient Journey Timeline Passed")
    test_report_comparison()
    print("✓ AI Report Comparison & Grounded Explainer Passed")
    print("\nALL 6 TEST SUITES EXECUTED AND PASSED SUCCESSFULLY!")


