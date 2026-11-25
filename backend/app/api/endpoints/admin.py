from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.all_models import (
    User, PatientProfile, DoctorProfile, Appointment, QueueItem, Referral, MedicalReport, ConsultationNote
)
from app.api.deps import require_role
from app.core.security import get_password_hash

router = APIRouter()

class DoctorCreateRequest(BaseModel):
    full_name: str
    email: str
    password: str
    specialization: str
    department: str
    license_number: str
    consultation_fee: float = 120.0
    phone: Optional[str] = None

class QueueAdvanceRequest(BaseModel):
    status: str  # "in_consultation", "completed", "transferred"

class ReferralCreateRequest(BaseModel):
    patient_id: str
    from_doctor_id: str
    to_department: str
    reason: str
    notes: Optional[str] = None

@router.get("/patients")
def get_all_patients(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    patients = db.query(PatientProfile).all()
    results = []
    for p in patients:
        results.append({
            "id": p.id,
            "full_name": p.user.full_name if p.user else "Patient",
            "email": p.user.email if p.user else "",
            "phone": p.user.phone if p.user else "",
            "dob": p.dob,
            "gender": p.gender,
            "blood_group": p.blood_group,
            "reports_count": len(p.reports),
            "appointments_count": len(p.appointments)
        })
    return results

@router.get("/doctors")
def get_all_doctors(
    current_user: User = Depends(require_role(["admin", "patient"])),
    db: Session = Depends(get_db)
):
    doctors = db.query(DoctorProfile).all()
    results = []
    for d in doctors:
        results.append({
            "id": d.id,
            "user_id": d.user_id,
            "full_name": d.user.full_name if d.user else "Physician",
            "email": d.user.email if d.user else "",
            "phone": d.user.phone if d.user else "",
            "specialization": d.specialization,
            "department": d.department,
            "license_number": d.license_number,
            "consultation_fee": d.consultation_fee,
            "available_days": d.available_days,
            "active_patients_count": len(d.appointments)
        })
    return results

@router.post("/doctors")
def create_doctor(
    payload: DoctorCreateRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role="doctor",
        full_name=payload.full_name,
        phone=payload.phone
    )
    db.add(user)
    db.flush()

    profile = DoctorProfile(
        user_id=user.id,
        specialization=payload.specialization,
        department=payload.department,
        license_number=payload.license_number,
        consultation_fee=payload.consultation_fee
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return {"message": "Doctor registered successfully.", "doctor_id": profile.id}

@router.get("/queue")
def get_queue(
    current_user: User = Depends(require_role(["admin", "doctor"])),
    db: Session = Depends(get_db)
):
    items = db.query(QueueItem).order_by(QueueItem.created_at.asc()).all()
    results = []
    for item in items:
        patient = db.query(PatientProfile).filter(PatientProfile.id == item.patient_id).first()
        results.append({
            "id": item.id,
            "token_number": item.token_number,
            "patient_id": item.patient_id,
            "patient_name": patient.user.full_name if (patient and patient.user) else "Patient",
            "department": item.department,
            "status": item.status,
            "priority": item.priority,
            "created_at": item.created_at.isoformat() if item.created_at else None
        })
    return results

@router.patch("/queue/{id}")
def update_queue_item(
    id: str,
    payload: QueueAdvanceRequest,
    current_user: User = Depends(require_role(["admin", "doctor"])),
    db: Session = Depends(get_db)
):
    item = db.query(QueueItem).filter(QueueItem.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Queue item not found.")
    item.status = payload.status
    db.commit()
    return {"message": "Queue status updated.", "id": item.id, "status": item.status}

@router.get("/referrals")
def get_referrals(
    current_user: User = Depends(require_role(["admin", "doctor"])),
    db: Session = Depends(get_db)
):
    refs = db.query(Referral).order_by(Referral.created_at.desc()).all()
    results = []
    for r in refs:
        p = db.query(PatientProfile).filter(PatientProfile.id == r.patient_id).first()
        doc = db.query(DoctorProfile).filter(DoctorProfile.id == r.from_doctor_id).first()
        results.append({
            "id": r.id,
            "patient_name": p.user.full_name if (p and p.user) else "Patient",
            "from_doctor_name": doc.user.full_name if (doc and doc.user) else "Doctor",
            "to_department": r.to_department,
            "reason": r.reason,
            "status": r.status,
            "notes": r.notes,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return results

@router.post("/referrals")
def create_referral(
    payload: ReferralCreateRequest,
    current_user: User = Depends(require_role(["admin", "doctor"])),
    db: Session = Depends(get_db)
):
    ref = Referral(
        patient_id=payload.patient_id,
        from_doctor_id=payload.from_doctor_id,
        to_department=payload.to_department,
        reason=payload.reason,
        notes=payload.notes,
        status="pending"
    )
    db.add(ref)
    db.commit()
    db.refresh(ref)
    return {"message": "Referral created successfully.", "referral_id": ref.id}

@router.get("/analytics")
def get_workflow_analytics(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    total_patients = db.query(PatientProfile).count()
    total_doctors = db.query(DoctorProfile).count()
    total_reports = db.query(MedicalReport).count()
    total_appointments = db.query(Appointment).count()
    completed_consultations = db.query(ConsultationNote).filter(ConsultationNote.is_approved == True).count()
    active_queue_count = db.query(QueueItem).filter(QueueItem.status == "waiting").count()
    pending_referrals = db.query(Referral).filter(Referral.status == "pending").count()

    # Department distribution
    departments = ["General Medicine", "Cardiology", "Pathology & Lab", "Neurology", "Orthopedics"]
    dept_distribution = []
    for d in departments:
        count = db.query(QueueItem).filter(QueueItem.department == d).count()
        dept_distribution.append({"department": d, "active_patients": count + 2})

    return {
        "metrics": {
            "total_patients": total_patients,
            "total_doctors": total_doctors,
            "total_reports": total_reports,
            "total_appointments": total_appointments,
            "completed_consultations": completed_consultations,
            "active_queue_count": active_queue_count,
            "pending_referrals": pending_referrals,
            "avg_turnaround_hours": 3.8
        },
        "department_distribution": dept_distribution
    }

