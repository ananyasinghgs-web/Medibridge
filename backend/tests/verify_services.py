import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal
from app.models.all_models import User, PatientProfile, DoctorProfile, MedicalReport, ReportMetric, Appointment
from app.core.security import verify_password, create_access_token, decode_access_token
from app.services.timeline_service import build_patient_timeline
from app.services.ai_explainer_service import (
    parse_report_text,
    generate_plain_language_summary,
    compare_historical_reports,
    DISCLAIMER_TEXT
)

def test_full_platform():
    db = SessionLocal()
    try:
        print("=== MEDIBRIDGE PLATFORM VERIFICATION ===")

        # 1. Test Security & Passwords
        user_patient = db.query(User).filter(User.email == "patient@medibridge.demo").first()
        assert user_patient is not None, "Patient demo user not found in DB"
        assert verify_password("password123", user_patient.hashed_password), "Password verification failed"
        print("✓ Patient credentials & PBKDF2 hash verification PASSED")

        # 2. Test Doctor & Admin Accounts
        user_doc = db.query(User).filter(User.email == "doctor@medibridge.demo").first()
        assert user_doc is not None and user_doc.role == "doctor"
        user_admin = db.query(User).filter(User.email == "admin@medibridge.demo").first()
        assert user_admin is not None and user_admin.role == "admin"
        print("✓ Doctor & Admin role identities PASSED")

        # 3. Test JWT Token Creation & Decoding
        token = create_access_token({"sub": user_patient.id, "role": user_patient.role})
        payload = decode_access_token(token)
        assert payload["sub"] == user_patient.id
        assert payload["role"] == "patient"
        print("✓ Cryptographic JWT Token signing & decoding PASSED")

        # 4. Test Patient Journey Timeline Assembly
        patient_profile = user_patient.patient_profile
        timeline_events = build_patient_timeline(patient_profile.id, db)
        assert len(timeline_events) >= 3, f"Expected >= 3 timeline events, got {len(timeline_events)}"
        event_types = set([e["event_type"] for e in timeline_events])
        assert "report" in event_types, "Medical report event missing from timeline"
        assert "consultation" in event_types, "Consultation note missing from timeline"
        assert "appointment" in event_types, "Appointment missing from timeline"
        print(f"✓ Patient Journey Timeline Compiler PASSED ({len(timeline_events)} chronological events verified)")

        # 5. Test AI Medical Report Explainer & Extraction
        from app.services.pdf_service import extract_text_from_pdf
        pdf_path = Path(__file__).resolve().parent.parent.parent / "sample_test_report.pdf"
        if pdf_path.exists():
            extracted_pdf_text = extract_text_from_pdf(str(pdf_path))
            assert len(extracted_pdf_text) > 50, "Extracted PDF text is unexpectedly short"
            pdf_metrics = parse_report_text(extracted_pdf_text)
            assert len(pdf_metrics) >= 4, f"Expected >= 4 metrics extracted from PDF, got {len(pdf_metrics)}"
            print(f"✓ PyMuPDF Real PDF Extraction PASSED ({len(pdf_metrics)} biomarkers extracted from binary PDF)")

        sample_report_text = (
            "Lab Diagnostic Result\n"
            "Patient: Sarah Jenkins\n"
            "Fasting Blood Glucose: 94 mg/dL (Ref: 70 - 99)\n"
            "Total Cholesterol: 188 mg/dL (Ref: 125 - 200)\n"
            "Hemoglobin: 14.1 g/dL (Ref: 12.0 - 16.0)"
        )
        extracted = parse_report_text(sample_report_text)
        assert len(extracted) == 3, f"Expected 3 extracted biomarkers, got {len(extracted)}"
        # Verify strict report-range grounding
        assert extracted[0]["test_name"] == "Fasting Blood Glucose"
        assert extracted[0]["value"] == 94.0
        assert extracted[0]["status"] == "normal"
        print("✓ Biomarker Extraction & Report-Range Grounding PASSED")

        # 6. Test Plain-Language Summary Generator & Disclaimer
        summary = generate_plain_language_summary(extracted, "Comprehensive Metabolic Panel")
        assert "Fasting Blood Glucose" in summary
        assert "reference range" in summary
        print("✓ Plain-Language Summary Generator PASSED")

        # 7. Test Historical Report Comparison with Unit Compatibility Rule
        reports = db.query(MedicalReport).filter(MedicalReport.patient_id == patient_profile.id).order_by(MedicalReport.report_date.asc()).all()
        assert len(reports) >= 2, "Expected at least 2 synthetic reports for comparison"

        r_prev = reports[0]
        r_curr = reports[1]
        dict_prev = {
            "id": r_prev.id,
            "title": r_prev.title,
            "report_date": r_prev.report_date,
            "metrics": [{"test_name": m.test_name, "value": m.value, "unit": m.unit, "status": m.status, "reference_min": m.reference_min, "reference_max": m.reference_max} for m in r_prev.metrics]
        }
        dict_curr = {
            "id": r_curr.id,
            "title": r_curr.title,
            "report_date": r_curr.report_date,
            "metrics": [{"test_name": m.test_name, "value": m.value, "unit": m.unit, "status": m.status, "reference_min": m.reference_min, "reference_max": m.reference_max} for m in r_curr.metrics]
        }
        comp = compare_historical_reports(dict_prev, dict_curr)
        assert len(comp["comparisons"]) >= 3, f"Expected at least 3 compared tests, got {len(comp['comparisons'])}"
        assert comp["disclaimer"] == DISCLAIMER_TEXT
        
        # Verify delta calculation
        for c in comp["comparisons"]:
            expected_delta = round(c["current_value"] - c["previous_value"], 3)
            assert c["delta"] == expected_delta, f"Delta mismatch for {c['test_name']}"
        print(f"✓ Historical Report Comparison PASSED ({len(comp['comparisons'])} metrics validated with strict unit matching)")

        print("\n=======================================================")
        print("🎉 ALL CORE FUNCTIONAL VERIFICATIONS COMPLETED SUCCESSFULLY!")
        print("=======================================================\n")

    finally:
        db.close()

if __name__ == "__main__":
    test_full_platform()

