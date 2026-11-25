from fastapi import APIRouter
from app.api.endpoints import auth, patients, reports, appointments, doctors, admin

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(patients.router, prefix="/patients", tags=["Patients"])
api_router.include_router(reports.router, prefix="/reports", tags=["Medical Reports & AI Explainer"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments & Visit Prep"])
api_router.include_router(doctors.router, prefix="/doctors", tags=["Doctor Workspace & Clinical Notes"])
api_router.include_router(admin.router, prefix="/admin", tags=["Hospital Administration & Analytics"])

