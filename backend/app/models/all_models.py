import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # "patient", "doctor", "admin"
    full_name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    dob = Column(String(20), nullable=True)  # YYYY-MM-DD
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    allergies = Column(Text, nullable=True)  # Comma separated or JSON string
    chronic_conditions = Column(Text, nullable=True)

    user = relationship("User", back_populates="patient_profile")
    reports = relationship("MedicalReport", back_populates="patient", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    consultations = relationship("ConsultationNote", back_populates="patient")

class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    specialization = Column(String(100), nullable=False)
    license_number = Column(String(50), nullable=False, unique=True)
    department = Column(String(100), nullable=False)
    consultation_fee = Column(Float, default=100.0)
    available_days = Column(String(100), default="Mon, Tue, Wed, Thu, Fri")

    user = relationship("User", back_populates="doctor_profile")
    appointments = relationship("Appointment", back_populates="doctor")
    consultations = relationship("ConsultationNote", back_populates="doctor")

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patient_profiles.id"), nullable=False)
    title = Column(String(255), nullable=False)
    report_type = Column(String(100), nullable=False)  # e.g., "Complete Blood Count", "Lipid Panel", "Metabolic Panel"
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    report_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    raw_text = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_disclaimer = Column(Text, nullable=True)

    patient = relationship("PatientProfile", back_populates="reports")
    metrics = relationship("ReportMetric", back_populates="report", cascade="all, delete-orphan")

class ReportMetric(Base):
    __tablename__ = "report_metrics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_id = Column(String(36), ForeignKey("medical_reports.id"), nullable=False)
    test_name = Column(String(150), nullable=False, index=True)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    reference_min = Column(Float, nullable=True)
    reference_max = Column(Float, nullable=True)
    status = Column(String(30), default="normal")  # "normal", "slightly_elevated", "low", "high"
    notes = Column(Text, nullable=True)

    report = relationship("MedicalReport", back_populates="metrics")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patient_profiles.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("doctor_profiles.id"), nullable=False)
    scheduled_at = Column(String(30), nullable=False)  # ISO string YYYY-MM-DD HH:MM
    status = Column(String(30), default="scheduled")  # "scheduled", "in_progress", "completed", "cancelled"
    reason = Column(Text, nullable=True)
    visit_prep_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("PatientProfile", back_populates="appointments")
    doctor = relationship("DoctorProfile", back_populates="appointments")
    consultation = relationship("ConsultationNote", back_populates="appointment", uselist=False)

class ConsultationNote(Base):
    __tablename__ = "consultation_notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    appointment_id = Column(String(36), ForeignKey("appointments.id"), unique=True, nullable=True)
    doctor_id = Column(String(36), ForeignKey("doctor_profiles.id"), nullable=False)
    patient_id = Column(String(36), ForeignKey("patient_profiles.id"), nullable=False)
    chief_complaint = Column(Text, nullable=False)
    clinical_observations = Column(Text, nullable=True)
    ai_draft = Column(Text, nullable=True)
    final_notes = Column(Text, nullable=True)
    is_approved = Column(Boolean, default=False)
    approved_at = Column(DateTime, nullable=True)
    follow_up_date = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment", back_populates="consultation")
    doctor = relationship("DoctorProfile", back_populates="consultations")
    patient = relationship("PatientProfile", back_populates="consultations")
    prescription = relationship("Prescription", back_populates="consultation", uselist=False)

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    consultation_id = Column(String(36), ForeignKey("consultation_notes.id"), unique=True, nullable=True)
    patient_id = Column(String(36), ForeignKey("patient_profiles.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("doctor_profiles.id"), nullable=False)
    medications = Column(Text, nullable=False)  # JSON string of list: [{ name, dosage, frequency, timing, duration }]
    instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    consultation = relationship("ConsultationNote", back_populates="prescription")
    doctor = relationship("DoctorProfile")
    patient = relationship("PatientProfile")

class QueueItem(Base):
    __tablename__ = "queue_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patient_profiles.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("doctor_profiles.id"), nullable=True)
    department = Column(String(100), nullable=False)
    token_number = Column(String(20), nullable=False)
    status = Column(String(30), default="waiting")  # "waiting", "in_consultation", "completed", "transferred"
    priority = Column(String(20), default="normal")  # "normal", "urgent", "priority"
    created_at = Column(DateTime, default=datetime.utcnow)

class Referral(Base):
    __tablename__ = "referrals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patient_profiles.id"), nullable=False)
    from_doctor_id = Column(String(36), ForeignKey("doctor_profiles.id"), nullable=False)
    to_department = Column(String(100), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(30), default="pending")  # "pending", "accepted", "completed", "declined"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class FamilyAccess(Base):
    __tablename__ = "family_access"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    grantor_patient_id = Column(String(36), ForeignKey("patient_profiles.id"), nullable=False)
    grantee_email = Column(String(255), nullable=False)
    relationship_type = Column(String(50), nullable=False)  # e.g. "Spouse", "Parent", "Child"
    access_level = Column(String(30), default="view_only")  # "view_only", "full_access"
    status = Column(String(30), default="active")  # "pending", "active", "revoked"
    created_at = Column(DateTime, default=datetime.utcnow)

