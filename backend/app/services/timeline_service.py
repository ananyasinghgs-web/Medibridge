from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.all_models import (
    PatientProfile, MedicalReport, Appointment, ConsultationNote, Prescription
)

def build_patient_timeline(patient_id: str, db: Session) -> List[Dict[str, Any]]:
    """
    Compile chronological health events:
    - Medical Report Uploads
    - Doctor Consultations (with Approved Notes)
    - Active & Past Prescriptions
    - Scheduled & Completed Appointments
    """
    timeline_events = []

    # 1. Reports
    reports = db.query(MedicalReport).filter(MedicalReport.patient_id == patient_id).all()
    for r in reports:
        metrics_summary = [f"{m.test_name}: {m.value} {m.unit}" for m in r.metrics[:3]]
        preview_text = ", ".join(metrics_summary) if metrics_summary else "Diagnostic document recorded."

        timeline_events.append({
            "id": f"report-{r.id}",
            "reference_id": r.id,
            "event_type": "report",
            "date": r.report_date,
            "title": f"Medical Report: {r.title}",
            "category": r.report_type,
            "description": preview_text,
            "badge_color": "teal",
            "meta": {
                "file_name": r.file_name,
                "metrics_count": len(r.metrics),
                "has_ai_summary": bool(r.ai_summary)
            }
        })

    # 2. Appointments
    appts = db.query(Appointment).filter(Appointment.patient_id == patient_id).all()
    for a in appts:
        doc_name = a.doctor.user.full_name if (a.doctor and a.doctor.user) else "Specialist"
        dept = a.doctor.department if a.doctor else "General Clinic"
        date_str = a.scheduled_at.split("T")[0] if "T" in a.scheduled_at else a.scheduled_at.split(" ")[0]

        timeline_events.append({
            "id": f"appt-{a.id}",
            "reference_id": a.id,
            "event_type": "appointment",
            "date": date_str,
            "title": f"Appointment with Dr. {doc_name}",
            "category": dept,
            "description": a.reason or "Routine clinical consultation",
            "badge_color": "blue",
            "meta": {
                "status": a.status,
                "has_visit_prep": bool(a.visit_prep_notes)
            }
        })

    # 3. Consultations & Clinical Notes
    consultations = db.query(ConsultationNote).filter(ConsultationNote.patient_id == patient_id).all()
    for c in consultations:
        doc_name = c.doctor.user.full_name if (c.doctor and c.doctor.user) else "Physician"
        c_date = c.created_at.strftime("%Y-%m-%d") if c.created_at else "Recent"

        timeline_events.append({
            "id": f"consult-{c.id}",
            "reference_id": c.id,
            "event_type": "consultation",
            "date": c_date,
            "title": f"Clinical Consultation Note — Dr. {doc_name}",
            "category": "Doctor Note",
            "description": f"Chief complaint: {c.chief_complaint}",
            "badge_color": "navy",
            "meta": {
                "is_approved": c.is_approved,
                "follow_up_date": c.follow_up_date,
                "has_prescription": bool(c.prescription)
            }
        })

    # 4. Prescriptions
    prescriptions = db.query(Prescription).filter(Prescription.patient_id == patient_id).all()
    for p in prescriptions:
        p_date = p.created_at.strftime("%Y-%m-%d") if p.created_at else "Recent"
        doc_name = p.doctor.user.full_name if (p.doctor and p.doctor.user) else "Physician"

        timeline_events.append({
            "id": f"rx-{p.id}",
            "reference_id": p.id,
            "event_type": "prescription",
            "date": p_date,
            "title": f"Prescription Issued by Dr. {doc_name}",
            "category": "Medication",
            "description": p.instructions or "Prescribed medications and usage schedule.",
            "badge_color": "emerald",
            "meta": {
                "medications_raw": p.medications
            }
        })

    # Sort descending by event date
    timeline_events.sort(key=lambda x: str(x.get("date", "")), reverse=True)
    return timeline_events

