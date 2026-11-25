
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

SECRET_KEY = os.getenv("SECRET_KEY")

if ENVIRONMENT == "production" and not SECRET_KEY:
    raise RuntimeError("SECRET_KEY must be set in production")

if not SECRET_KEY:
    SECRET_KEY = "medibridge-super-secret-key-development-only"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{BASE_DIR / 'medibridge.db'}"
)

UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
