import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.all_models import (
    User, DoctorProfile, PatientProfile, MedicalReport, Appointment, ConsultationNote, Prescription
)
from app.api.deps import get_current_user, require_role

router = APIRouter()

class ConsultationCreateRequest(BaseModel):
    appointment_id: Optional[str] = None
    patient_id: str
    chief_complaint: str
    clinical_observations: Optional[str] = ""
    follow_up_date: Optional[str] = None
    # Optional prescription drafted during consultation
    medications: Optional[List[dict]] = None
    prescription_instructions: Optional[str] = None

class ConsultationApproveRequest(BaseModel):
    final_notes: str
    follow_up_date: Optional[str] = None

@router.get("/patients")
def get_doctor_patients(
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    doc = current_user.doctor_profile
    if not doc:
        raise HTTPException(status_code=400, detail="Doctor profile missing.")

    # Find patients who have appointments or consultations with this doctor
    appts = db.query(Appointment).filter(Appointment.doctor_id == doc.id).all()
    patient_ids = set([a.patient_id for a in appts])

    patients = db.query(PatientProfile).filter(PatientProfile.id.in_(patient_ids)).all()
    results = []
    for p in patients:
        recent_report = db.query(MedicalReport).filter(MedicalReport.patient_id == p.id).order_by(MedicalReport.report_date.desc()).first()
        results.append({
            "id": p.id,
            "full_name": p.user.full_name if p.user else "Patient",
            "email": p.user.email if p.user else "",
            "phone": p.user.phone if p.user else "",
            "dob": p.dob,
            "gender": p.gender,
            "blood_group": p.blood_group,
            "allergies": p.allergies,
            "chronic_conditions": p.chronic_conditions,
            "recent_report_title": recent_report.title if recent_report else "None",
            "recent_report_date": recent_report.report_date if recent_report else None,
            "reports_count": len(p.reports)
        })
    return results

@router.get("/patients/{patient_id}/records")
def get_patient_clinical_records(
    patient_id: str,
    current_user: User = Depends(require_role(["doctor", "admin"])),
    db: Session = Depends(get_db)
):
    patient = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    reports = db.query(MedicalReport).filter(MedicalReport.patient_id == patient_id).order_by(MedicalReport.report_date.desc()).all()
    consultations = db.query(ConsultationNote).filter(ConsultationNote.patient_id == patient_id).order_by(ConsultationNote.created_at.desc()).all()

    return {
        "patient": {
            "id": patient.id,
            "full_name": patient.user.full_name if patient.user else "Patient",
            "dob": patient.dob,
            "blood_group": patient.blood_group,
            "allergies": patient.allergies,
            "chronic_conditions": patient.chronic_conditions
        },
        "reports": [{
            "id": r.id,
            "title": r.title,
            "report_type": r.report_type,
            "report_date": r.report_date,
            "metrics": [{"test_name": m.test_name, "value": m.value, "unit": m.unit, "status": m.status, "reference_min": m.reference_min, "reference_max": m.reference_max} for m in r.metrics]
        } for r in reports],
        "consultations": [{
            "id": c.id,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "chief_complaint": c.chief_complaint,
            "clinical_observations": c.clinical_observations,
            "final_notes": c.final_notes,
            "is_approved": c.is_approved,
            "follow_up_date": c.follow_up_date
        } for c in consultations]
    }

@router.post("/consultations")
def create_consultation(
    payload: ConsultationCreateRequest,
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    doc = current_user.doctor_profile
    if not doc:
        raise HTTPException(status_code=400, detail="Doctor profile missing.")

    # Generate AI-assisted clinical documentation draft
    ai_draft = (
        f"SUBJECTIVE:\n"
        f"Patient presents with chief complaint of: {payload.chief_complaint}.\n\n"
        f"OBJECTIVE:\n"
        f"Clinical observations: {payload.clinical_observations or 'Non-contributory physical findings recorded.'}\n\n"
        f"ASSESSMENT & PLAN DRAFT:\n"
        f"Clinical impression pending review. Recommended follow-up on {payload.follow_up_date or 'as needed'}.\n"
        f"[Notice: AI draft for clinician review and manual sign-off.]"
    )

    consult = ConsultationNote(
        appointment_id=payload.appointment_id,
        doctor_id=doc.id,
        patient_id=payload.patient_id,
        chief_complaint=payload.chief_complaint,
        clinical_observations=payload.clinical_observations,
        ai_draft=ai_draft,
        final_notes=ai_draft,
        is_approved=False,
        follow_up_date=payload.follow_up_date
    )
    db.add(consult)
    db.flush()

    # If medications provided, attach prescription
    if payload.medications:
        rx = Prescription(
            consultation_id=consult.id,
            patient_id=payload.patient_id,
            doctor_id=doc.id,
            medications=json.dumps(payload.medications),
            instructions=payload.prescription_instructions or "Take medications as indicated with food and water."
        )
        db.add(rx)

    # Mark appointment as completed if linked
    if payload.appointment_id:
        appt = db.query(Appointment).filter(Appointment.id == payload.appointment_id).first()
        if appt:
            appt.status = "completed"

    db.commit()
    db.refresh(consult)
    return {
        "id": consult.id,
        "is_approved": consult.is_approved,
        "ai_draft": consult.ai_draft,
        "message": "Consultation note created in draft state. Doctor sign-off required."
    }

@router.post("/consultations/{id}/approve")
def approve_consultation_note(
    id: str,
    payload: ConsultationApproveRequest,
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    """STRICT CLINICAL RULE: Only authorized doctors can approve consultation notes."""
    doc = current_user.doctor_profile
    if not doc:
        raise HTTPException(status_code=403, detail="Only licensed physicians can sign clinical notes.")

    consult = db.query(ConsultationNote).filter(
        ConsultationNote.id == id,
        ConsultationNote.doctor_id == doc.id
    ).first()

    if not consult:
        raise HTTPException(status_code=404, detail="Consultation note not found or not assigned to you.")

    consult.final_notes = payload.final_notes
    consult.is_approved = True
    consult.approved_at = datetime.utcnow()
    if payload.follow_up_date:
        consult.follow_up_date = payload.follow_up_date

    db.commit()
    db.refresh(consult)

    return {
        "id": consult.id,
        "is_approved": True,
        "approved_at": consult.approved_at.isoformat(),
        "doctor_name": current_user.full_name,
        "message": "Consultation note approved and officially signed into patient permanent record."
    }

@router.get("/follow-ups")
def get_doctor_follow_ups(
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    doc = current_user.doctor_profile
    if not doc:
        return []

    consults = db.query(ConsultationNote).filter(
        ConsultationNote.doctor_id == doc.id,
        ConsultationNote.follow_up_date.isnot(None)
    ).all()

    results = []
    for c in consults:
        results.append({
            "consultation_id": c.id,
            "patient_name": c.patient.user.full_name if (c.patient and c.patient.user) else "Patient",
            "patient_phone": c.patient.user.phone if (c.patient and c.patient.user) else "",
            "chief_complaint": c.chief_complaint,
            "follow_up_date": c.follow_up_date,
            "is_approved": c.is_approved
        })
    return results

