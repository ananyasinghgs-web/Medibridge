from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.all_models import User, PatientProfile, DoctorProfile
from app.api.deps import get_current_user

router = APIRouter()

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "patient"  # "patient", "doctor", "admin"
    phone: Optional[str] = None
    # Patient fields
    dob: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    # Doctor fields
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    department: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        full_name=payload.full_name,
        phone=payload.phone
    )
    db.add(user)
    db.flush()

    if payload.role == "patient":
        profile = PatientProfile(
            user_id=user.id,
            dob=payload.dob,
            gender=payload.gender,
            blood_group=payload.blood_group
        )
        db.add(profile)
    elif payload.role == "doctor":
        profile = DoctorProfile(
            user_id=user.id,
            specialization=payload.specialization or "General Practice",
            license_number=payload.license_number or f"MED-{user.id[:8].upper()}",
            department=payload.department or "General Medicine"
        )
        db.add(profile)

    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    token = create_access_token({"sub": user.id, "role": user.role})
    
    patient_id = user.patient_profile.id if user.patient_profile else None
    doctor_id = user.doctor_profile.id if user.doctor_profile else None

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "patient_id": patient_id,
            "doctor_id": doctor_id
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    patient_data = None
    if current_user.patient_profile:
        p = current_user.patient_profile
        patient_data = {
            "id": p.id,
            "dob": p.dob,
            "gender": p.gender,
            "blood_group": p.blood_group,
            "emergency_contact": p.emergency_contact,
            "allergies": p.allergies,
            "chronic_conditions": p.chronic_conditions
        }

    doctor_data = None
    if current_user.doctor_profile:
        d = current_user.doctor_profile
        doctor_data = {
            "id": d.id,
            "specialization": d.specialization,
            "license_number": d.license_number,
            "department": d.department,
            "consultation_fee": d.consultation_fee,
            "available_days": d.available_days
        }

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "phone": current_user.phone,
        "patient_profile": patient_data,
        "doctor_profile": doctor_data
    }
