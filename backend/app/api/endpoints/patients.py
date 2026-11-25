from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.all_models import User, PatientProfile, FamilyAccess
from app.api.deps import get_current_user, require_role
from app.services.timeline_service import build_patient_timeline

router = APIRouter()

class ProfileUpdateRequest(BaseModel):
    dob: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None

class FamilyShareRequest(BaseModel):
    grantee_email: str
    relationship_type: str
    access_level: str = "view_only"

@router.get("/profile")
def get_patient_profile(
    current_user: User = Depends(require_role(["patient", "doctor", "admin"])),
    patient_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if current_user.role == "patient":
        profile = current_user.patient_profile
    elif patient_id:
        profile = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    else:
        raise HTTPException(status_code=400, detail="Patient ID required for providers.")

    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found.")

    return {
        "id": profile.id,
        "full_name": profile.user.full_name if profile.user else "Unknown Patient",
        "email": profile.user.email if profile.user else "",
        "phone": profile.user.phone if profile.user else "",
        "dob": profile.dob,
        "gender": profile.gender,
        "blood_group": profile.blood_group,
        "emergency_contact": profile.emergency_contact,
        "allergies": profile.allergies,
        "chronic_conditions": profile.chronic_conditions
    }

@router.put("/profile")
def update_patient_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db)
):
    profile = current_user.patient_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found.")

    if payload.dob is not None: profile.dob = payload.dob
    if payload.gender is not None: profile.gender = payload.gender
    if payload.blood_group is not None: profile.blood_group = payload.blood_group
    if payload.emergency_contact is not None: profile.emergency_contact = payload.emergency_contact
    if payload.allergies is not None: profile.allergies = payload.allergies
    if payload.chronic_conditions is not None: profile.chronic_conditions = payload.chronic_conditions

    db.commit()
    db.refresh(profile)
    return {"message": "Profile updated successfully.", "profile_id": profile.id}

@router.get("/timeline")
def get_timeline(
    current_user: User = Depends(require_role(["patient", "doctor", "admin"])),
    patient_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    target_patient_id = None
    if current_user.role == "patient":
        if current_user.patient_profile:
            target_patient_id = current_user.patient_profile.id
    elif patient_id:
        target_patient_id = patient_id

    if not target_patient_id:
        raise HTTPException(status_code=400, detail="Patient ID not specified.")

    timeline = build_patient_timeline(target_patient_id, db)
    return {
        "patient_id": target_patient_id,
        "total_events": len(timeline),
        "events": timeline
    }

@router.get("/family")
def get_family_shares(
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db)
):
    if not current_user.patient_profile:
        return []
    records = db.query(FamilyAccess).filter(
        FamilyAccess.grantor_patient_id == current_user.patient_profile.id
    ).all()
    return records

@router.post("/family")
def share_family_record(
    payload: FamilyShareRequest,
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db)
):
    if not current_user.patient_profile:
        raise HTTPException(status_code=400, detail="Patient profile missing.")

    new_share = FamilyAccess(
        grantor_patient_id=current_user.patient_profile.id,
        grantee_email=payload.grantee_email,
        relationship_type=payload.relationship_type,
        access_level=payload.access_level,
        status="active"
    )
    db.add(new_share)
    db.commit()
    db.refresh(new_share)
    return new_share

@router.delete("/family/{id}")
def revoke_family_share(
    id: str,
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db)
):
    share = db.query(FamilyAccess).filter(
        FamilyAccess.id == id,
        FamilyAccess.grantor_patient_id == current_user.patient_profile.id
    ).first()
    if not share:
        raise HTTPException(status_code=404, detail="Permission record not found.")
    db.delete(share)
    db.commit()
    return {"message": "Family access revoked successfully."}

