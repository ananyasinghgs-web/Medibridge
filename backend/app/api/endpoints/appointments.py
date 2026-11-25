from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.all_models import User, PatientProfile, DoctorProfile, Appointment, QueueItem
from app.api.deps import get_current_user, require_role

router = APIRouter()

class AppointmentCreate(BaseModel):
    doctor_id: str
    scheduled_at: str  # YYYY-MM-DD HH:MM
    reason: str
    patient_id: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str

@router.get("/")
def list_appointments(
    current_user: User = Depends(require_role(["patient", "doctor", "admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(Appointment)
    if current_user.role == "patient":
        if not current_user.patient_profile:
            return []
        query = query.filter(Appointment.patient_id == current_user.patient_profile.id)
    elif current_user.role == "doctor":
        if not current_user.doctor_profile:
            return []
        query = query.filter(Appointment.doctor_id == current_user.doctor_profile.id)

    appts = query.order_by(Appointment.scheduled_at.desc()).all()
    results = []
    for a in appts:
        results.append({
            "id": a.id,
            "patient_id": a.patient_id,
            "patient_name": a.patient.user.full_name if (a.patient and a.patient.user) else "Unknown",
            "patient_blood_group": a.patient.blood_group if a.patient else None,
            "doctor_id": a.doctor_id,
            "doctor_name": a.doctor.user.full_name if (a.doctor and a.doctor.user) else "Physician",
            "doctor_specialization": a.doctor.specialization if a.doctor else "General",
            "doctor_department": a.doctor.department if a.doctor else "Clinic",
            "scheduled_at": a.scheduled_at,
            "status": a.status,
            "reason": a.reason,
            "visit_prep_notes": a.visit_prep_notes,
            "has_consultation_note": bool(a.consultation)
        })
    return results

@router.post("/")
def create_appointment(
    payload: AppointmentCreate,
    current_user: User = Depends(require_role(["patient", "doctor", "admin"])),
    db: Session = Depends(get_db)
):
    if current_user.role == "patient":
        patient_id = current_user.patient_profile.id
    else:
        patient_id = payload.patient_id

    if not patient_id:
        raise HTTPException(status_code=400, detail="Patient profile ID is required.")

    doctor = db.query(DoctorProfile).filter(DoctorProfile.id == payload.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    # Generate initial Doctor Visit Preparation Notes
    prep_notes = (
        f"Preparation Checklist for your appointment regarding '{payload.reason}':\n"
        f"1. Note when symptoms first started and what makes them better or worse.\n"
        f"2. Bring a list of current over-the-counter and prescription medications.\n"
        f"3. Key questions to ask Dr. {doctor.user.full_name if doctor.user else 'your physician'}:\n"
        f"   • What are the most likely causes of these symptoms?\n"
        f"   • Are there any lifestyle, dietary, or activity modifications recommended?\n"
        f"   • What symptoms should prompt me to follow up sooner?"
    )

    appt = Appointment(
        patient_id=patient_id,
        doctor_id=payload.doctor_id,
        scheduled_at=payload.scheduled_at,
        reason=payload.reason,
        visit_prep_notes=prep_notes,
        status="scheduled"
    )
    db.add(appt)
    db.flush()

    # Automatically add to Hospital Queue for outpatient tracking
    token_num = f"{doctor.department[:3].upper()}-{appt.id[:4].upper()}"
    queue_item = QueueItem(
        patient_id=patient_id,
        doctor_id=payload.doctor_id,
        department=doctor.department,
        token_number=token_num,
        status="waiting",
        priority="normal"
    )
    db.add(queue_item)

    db.commit()
    db.refresh(appt)
    return {
        "id": appt.id,
        "status": appt.status,
        "token_number": token_num,
        "visit_prep_notes": appt.visit_prep_notes,
        "message": "Appointment booked and added to outpatient queue."
    }

@router.patch("/{id}/status")
def update_appointment_status(
    id: str,
    payload: StatusUpdate,
    current_user: User = Depends(require_role(["doctor", "admin"])),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    appt.status = payload.status
    db.commit()
    return {"message": "Status updated successfully.", "id": appt.id, "status": appt.status}

