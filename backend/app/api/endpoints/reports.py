import os
import uuid
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.db.session import get_db
from app.models.all_models import User, PatientProfile, MedicalReport, ReportMetric
from app.api.deps import get_current_user, require_role
from app.core.config import UPLOAD_DIR
from app.services.pdf_service import extract_text_from_pdf
from app.services.ai_explainer_service import (
    parse_report_text,
    generate_plain_language_summary,
    compare_historical_reports,
    DISCLAIMER_TEXT
)

router = APIRouter()

@router.post("/upload")
async def upload_medical_report(
    title: str = Form(...),
    report_type: str = Form(...),
    report_date: str = Form(...),
    file: UploadFile = File(...),
    patient_id: Optional[str] = Form(None),
    current_user: User = Depends(require_role(["patient", "doctor", "admin"])),
    db: Session = Depends(get_db)
):
    # Resolve target patient
    if current_user.role == "patient":
        if not current_user.patient_profile:
            raise HTTPException(status_code=400, detail="Patient profile not found.")
        target_patient_id = current_user.patient_profile.id
    else:
        if not patient_id:
            raise HTTPException(status_code=400, detail="patient_id is required for clinical staff upload.")
        target_patient_id = patient_id

    # Verify patient exists
    patient = db.query(PatientProfile).filter(PatientProfile.id == target_patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Target patient not found.")

    # Validate file format
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF medical report documents are supported.")

    # Secure file save with UUID
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_disk_path = UPLOAD_DIR / unique_filename

    with open(file_disk_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text using PyMuPDF / fallback
    raw_text = extract_text_from_pdf(str(file_disk_path))

    # Parse biomarkers & reference ranges strictly from text
    extracted_metrics = parse_report_text(raw_text)

    # Generate patient-friendly explanation without diagnosing
    ai_summary = generate_plain_language_summary(extracted_metrics, report_type)

    # Create report record
    report = MedicalReport(
        patient_id=target_patient_id,
        title=title,
        report_type=report_type,
        file_name=file.filename,
        file_path=str(file_disk_path),
        report_date=report_date,
        raw_text=raw_text,
        ai_summary=ai_summary,
        ai_disclaimer=DISCLAIMER_TEXT
    )
    db.add(report)
    db.flush()

    # Save metrics to DB
    for m in extracted_metrics:
        metric_record = ReportMetric(
            report_id=report.id,
            test_name=m["test_name"],
            value=m["value"],
            unit=m["unit"],
            reference_min=m["reference_min"],
            reference_max=m["reference_max"],
            status=m["status"],
            notes=m["notes"]
        )
        db.add(metric_record)

    db.commit()
    db.refresh(report)

    return {
        "id": report.id,
        "title": report.title,
        "report_type": report.report_type,
        "report_date": report.report_date,
        "file_name": report.file_name,
        "metrics_extracted": len(extracted_metrics),
        "ai_summary": report.ai_summary,
        "ai_disclaimer": report.ai_disclaimer,
        "metrics": extracted_metrics
    }

@router.get("/")
def list_reports(
    patient_id: Optional[str] = None,
    current_user: User = Depends(require_role(["patient", "doctor", "admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(MedicalReport)
    if current_user.role == "patient":
        if not current_user.patient_profile:
            return []
        query = query.filter(MedicalReport.patient_id == current_user.patient_profile.id)
    elif patient_id:
        query = query.filter(MedicalReport.patient_id == patient_id)

    reports = query.order_by(MedicalReport.report_date.desc()).all()
    results = []
    for r in reports:
        results.append({
            "id": r.id,
            "patient_id": r.patient_id,
            "title": r.title,
            "report_type": r.report_type,
            "file_name": r.file_name,
            "report_date": r.report_date,
            "uploaded_at": r.uploaded_at.isoformat() if r.uploaded_at else None,
            "metrics_count": len(r.metrics),
            "has_ai_summary": bool(r.ai_summary)
        })
    return results

@router.get("/{id}")
def get_report_details(
    id: str,
    current_user: User = Depends(require_role(["patient", "doctor", "admin"])),
    db: Session = Depends(get_db)
):
    report = db.query(MedicalReport).filter(MedicalReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Medical report not found.")

    if current_user.role == "patient" and report.patient_id != current_user.patient_profile.id:
        raise HTTPException(status_code=403, detail="Access denied to this report.")

    metrics_list = []
    for m in report.metrics:
        metrics_list.append({
            "id": m.id,
            "test_name": m.test_name,
            "value": m.value,
            "unit": m.unit,
            "reference_min": m.reference_min,
            "reference_max": m.reference_max,
            "status": m.status,
            "notes": m.notes
        })

    return {
        "id": report.id,
        "patient_id": report.patient_id,
        "title": report.title,
        "report_type": report.report_type,
        "file_name": report.file_name,
        "report_date": report.report_date,
        "uploaded_at": report.uploaded_at.isoformat() if report.uploaded_at else None,
        "raw_text": report.raw_text,
        "ai_summary": report.ai_summary,
        "ai_disclaimer": report.ai_disclaimer or DISCLAIMER_TEXT,
        "metrics": metrics_list
    }

@router.get("/compare/{report1_id}/{report2_id}")
def compare_reports_endpoint(
    report1_id: str,
    report2_id: str,
    current_user: User = Depends(require_role(["patient", "doctor", "admin"])),
    db: Session = Depends(get_db)
):
    r1 = db.query(MedicalReport).filter(MedicalReport.id == report1_id).first()
    r2 = db.query(MedicalReport).filter(MedicalReport.id == report2_id).first()

    if not r1 or not r2:
        raise HTTPException(status_code=404, detail="One or both reports could not be found.")

    # Order chronologically (earlier is previous, later is current)
    if str(r1.report_date) > str(r2.report_date):
        r_prev, r_curr = r2, r1
    else:
        r_prev, r_curr = r1, r2

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

    comparison_result = compare_historical_reports(dict_prev, dict_curr)
    return comparison_result

