import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.router import api_router
from app.core.config import UPLOAD_DIR
from app.db.seed_data import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed synthetic demo data
    print("MediBridge API starting up... verifying database and synthetic records.")
    seed_database()
    yield
    print("MediBridge API shutting down.")

app = FastAPI(
    title="MediBridge API",
    description="Intelligent Healthcare Management & Patient Companion Platform API",
    version="1.0.0",
    lifespan=lifespan
)
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in cors_origins.split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for report file reference
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include all API routes
app.include_router(api_router, prefix="/api")

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "MediBridge Platform API",
        "tagline": "Connecting Care. Simplifying Health.",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

