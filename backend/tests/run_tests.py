import asyncio
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx
from main import app

async def run_all_checks():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("✓ Health check endpoint PASSED")

        # 2. Patient Login
        res = await client.post("/api/auth/login", json={
            "email": "patient@medibridge.demo",
            "password": "password123"
        })
        assert res.status_code == 200, f"Patient login failed: {res.text}"
        patient_token = res.json()["access_token"]
        assert res.json()["user"]["role"] == "patient"
        print("✓ Patient login & JWT generation PASSED")

        # 3. Doctor Login
        res = await client.post("/api/auth/login", json={
            "email": "doctor@medibridge.demo",
            "password": "password123"
        })
        assert res.status_code == 200, f"Doctor login failed: {res.text}"
        doc_token = res.json()["access_token"]
        assert res.json()["user"]["role"] == "doctor"
        print("✓ Doctor login & role verification PASSED")

        # 4. Admin Login
        res = await client.post("/api/auth/login", json={
            "email": "admin@medibridge.demo",
            "password": "password123"
        })
        assert res.status_code == 200, f"Admin login failed: {res.text}"
        admin_token = res.json()["access_token"]
        assert res.json()["user"]["role"] == "admin"
        print("✓ Hospital Admin login & role verification PASSED")

        # 5. Patient Journey Timeline
        p_headers = {"Authorization": f"Bearer {patient_token}"}
        res = await client.get("/api/patients/timeline", headers=p_headers)
        assert res.status_code == 200, f"Timeline failed: {res.text}"
        events = res.json()["events"]
        assert len(events) >= 2, f"Expected at least 2 timeline events, got {len(events)}"
        print(f"✓ Patient Journey Timeline verified ({len(events)} events aggregated)")

        # 6. Report List & Historical Comparison
        res = await client.get("/api/reports/", headers=p_headers)
        assert res.status_code == 200, f"Reports list failed: {res.text}"
        reports = res.json()
        assert len(reports) >= 2, f"Expected at least 2 reports, got {len(reports)}"
        r1_id = reports[0]["id"]
        r2_id = reports[1]["id"]

        comp_res = await client.get(f"/api/reports/compare/{r1_id}/{r2_id}", headers=p_headers)
        assert comp_res.status_code == 200, f"Report comparison failed: {comp_res.text}"
        comp_data = comp_res.json()
        assert len(comp_data["comparisons"]) >= 3, "Expected at least 3 test comparisons"
        assert "disclaimer" in comp_data
        print(f"✓ AI Report Explainer & Historical Comparison verified ({len(comp_data['comparisons'])} metrics compared)")

        # 7. Admin Workflow Analytics & Queue
        a_headers = {"Authorization": f"Bearer {admin_token}"}
        analytics_res = await client.get("/api/admin/analytics", headers=a_headers)
        assert analytics_res.status_code == 200, f"Analytics failed: {analytics_res.text}"
        queue_res = await client.get("/api/admin/queue", headers=a_headers)
        assert queue_res.status_code == 200, f"Queue failed: {queue_res.text}"
        print(f"✓ Hospital Admin Queue & Workflow Analytics verified")

        print("\nALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY! (7/7)")

if __name__ == "__main__":
    asyncio.run(run_all_checks())
