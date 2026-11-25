import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.session import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.all_models import (
    User, PatientProfile, DoctorProfile, MedicalReport, ReportMetric,
    Appointment, ConsultationNote, Prescription, QueueItem, Referral, FamilyAccess
)
from app.services.ai_explainer_service import generate_plain_language_summary, DISCLAIMER_TEXT

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "patient@medibridge.demo").first():
            print("Database already contains demo synthetic accounts.")
            return

        print("Seeding synthetic healthcare demo data...")

        # 1. Demo Patient User
        patient_user = User(
            email="patient@medibridge.demo",
            hashed_password=get_password_hash("password123"),
            role="patient",
            full_name="Sarah Jenkins",
            phone="+1 (555) 234-5678"
        )
        db.add(patient_user)
        db.flush()

        patient_profile = PatientProfile(
            user_id=patient_user.id,
            dob="1988-06-14",
            gender="Female",
            blood_group="O+",
            emergency_contact="Mark Jenkins (Spouse) - +1 (555) 987-6543",
            allergies="Penicillin, Sulfa drugs",
            chronic_conditions="Mild Hypertension (Stage 1)"
        )
        db.add(patient_profile)
        db.flush()

        # 2. Demo Doctor User
        doctor_user = User(
            email="doctor@medibridge.demo",
            hashed_password=get_password_hash("password123"),
            role="doctor",
            full_name="Dr. Robert Vance, MD",
            phone="+1 (555) 876-5432"
        )
        db.add(doctor_user)
        db.flush()

        doctor_profile = DoctorProfile(
            user_id=doctor_user.id,
            specialization="Internal Medicine & Cardiology",
            license_number="MD-98421-US",
            department="Cardiology",
            consultation_fee=150.0,
            available_days="Mon, Tue, Wed, Thu, Fri"
        )
        db.add(doctor_profile)

        # Additional Doctor 2 (General Practitioner)
        gp_user = User(
            email="gp@medibridge.demo",
            hashed_password=get_password_hash("password123"),
            role="doctor",
            full_name="Dr. Emily Thorne, DO",
            phone="+1 (555) 345-6789"
        )
        db.add(gp_user)
        db.flush()

        gp_profile = DoctorProfile(
            user_id=gp_user.id,
            specialization="Family Medicine",
            license_number="DO-44312-US",
            department="General Medicine",
            consultation_fee=110.0,
            available_days="Mon, Wed, Fri"
        )
        db.add(gp_profile)

        # 3. Demo Admin User
        admin_user = User(
            email="admin@medibridge.demo",
            hashed_password=get_password_hash("password123"),
            role="admin",
            full_name="Elena Rostova",
            phone="+1 (555) 555-0199"
        )
        db.add(admin_user)
        db.flush()

        # Additional Synthetic Patient 2
        p2_user = User(
            email="marcus.chen@demo.local",
            hashed_password=get_password_hash("password123"),
            role="patient",
            full_name="Marcus Chen",
            phone="+1 (555) 432-1098"
        )
        db.add(p2_user)
        db.flush()

        p2_profile = PatientProfile(
            user_id=p2_user.id,
            dob="1975-11-22",
            gender="Male",
            blood_group="A+",
            emergency_contact="Lisa Chen - +1 (555) 432-9988",
            allergies="Aspirin",
            chronic_conditions="Type 2 Diabetes"
        )
        db.add(p2_profile)
        db.flush()

        # 4. Two Synthetic Reports for Sarah Jenkins (Historical Comparison Data!)
        # Report 1 (Previous: 6 months ago)
        report1_metrics_data = [
            {"test_name": "Fasting Blood Glucose", "value": 108.0, "unit": "mg/dL", "reference_min": 70.0, "reference_max": 99.0, "status": "high", "notes": "Measures sugar in blood stream."},
            {"test_name": "Hemoglobin A1c (HbA1c)", "value": 5.9, "unit": "%", "reference_min": 4.0, "reference_max": 5.6, "status": "high", "notes": "3-month average glucose."},
            {"test_name": "Total Cholesterol", "value": 218.0, "unit": "mg/dL", "reference_min": 125.0, "reference_max": 200.0, "status": "high", "notes": "Total blood lipids."},
            {"test_name": "Hemoglobin (Hb)", "value": 13.8, "unit": "g/dL", "reference_min": 12.0, "reference_max": 16.0, "status": "normal", "notes": "Oxygen carrying protein."},
            {"test_name": "Platelet Count", "value": 240.0, "unit": "10^3/uL", "reference_min": 150.0, "reference_max": 450.0, "status": "normal", "notes": "Clotting cells."}
        ]
        r1_summary = generate_plain_language_summary(report1_metrics_data, "Comprehensive Metabolic & Lipid Panel")
        r1 = MedicalReport(
            patient_id=patient_profile.id,
            title="Comprehensive Metabolic & Lipid Panel (Baseline)",
            report_type="Metabolic Panel",
            file_name="LabCorp_Metabolic_Baseline_202405.pdf",
            file_path="uploads/demo_report_1.pdf",
            report_date="2024-05-15",
            raw_text="LabCorp Clinical Diagnostic Report\nPatient: Sarah Jenkins\nFasting Blood Glucose: 108 mg/dL (Ref: 70-99)\nHbA1c: 5.9 % (Ref: 4.0-5.6)\nTotal Cholesterol: 218 mg/dL (Ref: 125-200)\nHemoglobin: 13.8 g/dL (Ref: 12.0-16.0)\nPlatelets: 240 10^3/uL (Ref: 150-450)",
            ai_summary=r1_summary,
            ai_disclaimer=DISCLAIMER_TEXT
        )
        db.add(r1)
        db.flush()

        for m in report1_metrics_data:
            db.add(ReportMetric(
                report_id=r1.id,
                test_name=m["test_name"],
                value=m["value"],
                unit=m["unit"],
                reference_min=m["reference_min"],
                reference_max=m["reference_max"],
                status=m["status"],
                notes=m["notes"]
            ))

        # Report 2 (Current: Recent follow-up showing improvement after lifestyle changes)
        report2_metrics_data = [
            {"test_name": "Fasting Blood Glucose", "value": 94.0, "unit": "mg/dL", "reference_min": 70.0, "reference_max": 99.0, "status": "normal", "notes": "Measures sugar in blood stream."},
            {"test_name": "Hemoglobin A1c (HbA1c)", "value": 5.4, "unit": "%", "reference_min": 4.0, "reference_max": 5.6, "status": "normal", "notes": "3-month average glucose."},
            {"test_name": "Total Cholesterol", "value": 188.0, "unit": "mg/dL", "reference_min": 125.0, "reference_max": 200.0, "status": "normal", "notes": "Total blood lipids."},
            {"test_name": "Hemoglobin (Hb)", "value": 14.1, "unit": "g/dL", "reference_min": 12.0, "reference_max": 16.0, "status": "normal", "notes": "Oxygen carrying protein."},
            {"test_name": "Platelet Count", "value": 255.0, "unit": "10^3/uL", "reference_min": 150.0, "reference_max": 450.0, "status": "normal", "notes": "Clotting cells."}
        ]
        r2_summary = generate_plain_language_summary(report2_metrics_data, "Follow-up Metabolic & Lipid Panel")
        r2 = MedicalReport(
            patient_id=patient_profile.id,
            title="Follow-up Metabolic & Lipid Panel",
            report_type="Metabolic Panel",
            file_name="LabCorp_Followup_202411.pdf",
            file_path="uploads/demo_report_2.pdf",
            report_date="2024-11-10",
            raw_text="LabCorp Clinical Diagnostic Report\nPatient: Sarah Jenkins\nFasting Blood Glucose: 94 mg/dL (Ref: 70-99)\nHbA1c: 5.4 % (Ref: 4.0-5.6)\nTotal Cholesterol: 188 mg/dL (Ref: 125-200)\nHemoglobin: 14.1 g/dL (Ref: 12.0-16.0)\nPlatelets: 255 10^3/uL (Ref: 150-450)",
            ai_summary=r2_summary,
            ai_disclaimer=DISCLAIMER_TEXT
        )
        db.add(r2)
        db.flush()

        for m in report2_metrics_data:
            db.add(ReportMetric(
                report_id=r2.id,
                test_name=m["test_name"],
                value=m["value"],
                unit=m["unit"],
                reference_min=m["reference_min"],
                reference_max=m["reference_max"],
                status=m["status"],
                notes=m["notes"]
            ))

        # 5. Appointments & Consultation Notes
        # Use relative dates so demo data always looks realistic
        today = datetime.now()
        past_appt_date = today - timedelta(days=7)
        upcoming_appt_date = today + timedelta(days=10)
        follow_up = today + timedelta(days=25)

        past_appt = Appointment(
            patient_id=patient_profile.id,
            doctor_id=doctor_profile.id,
            scheduled_at=past_appt_date.strftime("%Y-%m-%d 10:30"),
            status="completed",
            reason="Review baseline metabolic lab results and cardiovascular checkup.",
            visit_prep_notes="Questions to discuss: Diet management, aerobic exercise options, repeat testing interval."
        )
        db.add(past_appt)
        db.flush()

        consult_note = ConsultationNote(
            appointment_id=past_appt.id,
            doctor_id=doctor_profile.id,
            patient_id=patient_profile.id,
            chief_complaint="Review of elevated fasting glucose and lipid profile on baseline labs.",
            clinical_observations="BP 128/82 mmHg, HR 72 bpm regular. Cardiovascular exam normal. No peripheral edema.",
            ai_draft="Patient advised on dietary carbohydrates moderation and 150 min/week moderate aerobic exercise. Follow-up lab panel in 6 months.",
            final_notes="Patient educated on balanced Mediterranean dietary principles and cardiovascular risk reduction. Re-check lipid and metabolic profile at follow-up.",
            is_approved=True,
            approved_at=past_appt_date.replace(hour=11, minute=15, second=0, microsecond=0),
            follow_up_date=follow_up.strftime("%Y-%m-%d")
        )
        db.add(consult_note)
        db.flush()

        # Active Prescription for Sarah
        medications_list = [
            {"name": "Atorvastatin", "dosage": "10 mg", "frequency": "Once daily", "timing": "Bedtime", "duration": "Ongoing"},
            {"name": "Omega-3 Fatty Acids", "dosage": "1000 mg", "frequency": "Once daily", "timing": "Morning with meal", "duration": "Ongoing"}
        ]
        rx = Prescription(
            consultation_id=consult_note.id,
            patient_id=patient_profile.id,
            doctor_id=doctor_profile.id,
            medications=json.dumps(medications_list),
            instructions="Take statin at bedtime as directed. Report any unusual muscle aches to clinic."
        )
        db.add(rx)

        # Upcoming Appointment
        upcoming_appt = Appointment(
            patient_id=patient_profile.id,
            doctor_id=doctor_profile.id,
            scheduled_at=upcoming_appt_date.strftime("%Y-%m-%d 14:00"),
            status="scheduled",
            reason="6-Month cardiovascular follow-up to review normalized lipid panel.",
            visit_prep_notes="Preparation Checklist:\n1. Bring updated list of supplements.\n2. Confirm any changes in physical exercise tolerance."
        )
        db.add(upcoming_appt)
        db.flush()

        # 6. Hospital Queue Items for Admin & Doctor Portals
        db.add(QueueItem(
            patient_id=patient_profile.id,
            doctor_id=doctor_profile.id,
            department="Cardiology",
            token_number="CAR-101",
            status="waiting",
            priority="normal"
        ))
        db.add(QueueItem(
            patient_id=p2_profile.id,
            doctor_id=gp_profile.id,
            department="General Medicine",
            token_number="GEN-102",
            status="in_consultation",
            priority="normal"
        ))

        # 7. Department Referrals
        db.add(Referral(
            patient_id=patient_profile.id,
            from_doctor_id=gp_profile.id,
            to_department="Cardiology",
            reason="Specialist cardiology evaluation for mild blood pressure elevation.",
            status="accepted",
            notes="Initial assessment completed; patient responding well to lifestyle intervention."
        ))

        # 8. Family Sharing Access
        db.add(FamilyAccess(
            grantor_patient_id=patient_profile.id,
            grantee_email="mark.jenkins@family.demo",
            relationship_type="Spouse",
            access_level="view_only",
            status="active"
        ))

        db.commit()
        print("Synthetic demo data successfully seeded!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

