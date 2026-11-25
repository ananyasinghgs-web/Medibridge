# MediBridge — Intelligent Healthcare Management & Patient Companion Platform

**Tagline:** *Connecting Care. Simplifying Health.*

MediBridge is a full-stack healthcare platform connecting patients, clinical providers, and hospital administrators through three specialized portals. Built with **React + Vite** (frontend) and **Python FastAPI** (backend), it features AI-powered medical report analysis, patient journey tracking, and clinical workflow management.

> **Academic Project** — B.Tech AI/ML  
> Uses exclusively synthetic demonstration data. Not intended for real clinical use.

---

## Key Features

### Patient Portal
- **Patient Journey Timeline** — Chronological health history linking reports, consultations, prescriptions, and appointments
- **AI Medical Report Explainer** — Upload a lab PDF → biomarkers extracted via PyMuPDF → plain-language explanation grounded strictly in printed reference intervals
- **Historical Report Comparison** — Side-by-side test value tracking with mathematical deltas (only when same test + compatible units exist)
- **Appointments & Visit Prep** — Book consultations with auto-generated preparation checklists
- **Medication Reminders** — Doctor-prescribed medication schedule
- **Family Record Sharing** — Grant view-only access to family members

### Doctor Portal
- Patient directory with side-by-side lab comparison
- AI-assisted consultation drafts with physician sign-off gate
- Follow-up tracking and prescription management

### Hospital Admin Portal
- Workflow analytics dashboard
- Real-time outpatient queue board
- Patient & doctor roster management
- Departmental referral system

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 7, Lucide Icons |
| Backend | Python, FastAPI, SQLAlchemy, PyMuPDF, PyJWT |
| Database | SQLite (development) |
| Auth | JWT tokens with PBKDF2-HMAC-SHA256 password hashing, Role-Based Access Control |

---

## Quick Start

### Prerequisites
- Python 3.10+ with `pip`
- Node.js 18+ with `npm`

### 1. Clone & Set Up Backend
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Set Up Frontend
```bash
cd frontend
npm install
```

### 3. Start the Backend API
```bash
# From project root:
.\start_backend.bat

# Or manually:
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
- API: `http://127.0.0.1:8000`
- Interactive Docs: `http://127.0.0.1:8000/docs`

### 4. Start the Frontend App
```bash
# From project root:
.\start_frontend.bat

# Or manually:
cd frontend
npm run dev
```
- Web App: `http://localhost:3000`

### 5. Run Tests
```bash
.\run_tests.bat
# Or:
cd backend && python -m pytest tests/
```

---

## Demo Accounts

Use the **1-Click Instant Demo Testing** buttons on the login page, or sign in manually:

| Portal | Name | Email | Password |
|--------|------|-------|----------|
| Patient | Sarah Jenkins | `patient@medibridge.demo` | `password123` |
| Doctor | Dr. Robert Vance, MD | `doctor@medibridge.demo` | `password123` |
| Admin | Elena Rostova | `admin@medibridge.demo` | `password123` |

> All accounts use synthetic data only. The database is auto-seeded on first startup.

---

## Project Structure

```
MediBridge/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/        # auth, patients, reports, appointments, doctors, admin
│   │   │   ├── deps.py           # Auth dependencies & RBAC
│   │   │   └── router.py         # API route aggregator
│   │   ├── core/
│   │   │   ├── config.py         # App configuration (env-based)
│   │   │   └── security.py       # JWT + PBKDF2 password hashing
│   │   ├── db/
│   │   │   ├── session.py        # SQLAlchemy engine & session
│   │   │   └── seed_data.py      # Synthetic demo data seeder
│   │   ├── models/
│   │   │   └── all_models.py     # SQLAlchemy ORM models
│   │   └── services/
│   │       ├── ai_explainer_service.py   # Biomarker parser & report summarizer
│   │       ├── pdf_service.py            # PyMuPDF text extraction
│   │       └── timeline_service.py       # Patient journey builder
│   ├── tests/
│   ├── main.py                   # FastAPI application entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/common/    # Navbar, Footer, Logo
│   │   ├── context/              # AuthContext (JWT state management)
│   │   ├── pages/
│   │   │   ├── auth/             # LoginPage, RegisterPage
│   │   │   ├── patient/          # PatientDashboard (6-tab portal)
│   │   │   ├── doctor/           # DoctorDashboard
│   │   │   └── admin/            # AdminDashboard
│   │   └── services/api.js       # Centralized API client
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── start_backend.bat
├── start_frontend.bat
├── run_tests.bat
└── README.md
```

---

## Security & Safety Guardrails

- **JWT Authentication** with role-based access control (Patient / Doctor / Admin)
- **PBKDF2-HMAC-SHA256** password hashing with random salts
- **Environment-based configuration** — `SECRET_KEY` and `DATABASE_URL` read from env vars with development fallbacks
- **Physician Sign-Off Gate** — AI-drafted consultation notes remain in draft until explicitly approved by a licensed doctor
- **Non-Diagnostic Guardrail** — The report explainer summarizes printed values and educates; it never diagnoses or prescribes
- **No real patient data** — All records are synthetic

---

## Environment Variables (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | Development fallback | JWT signing key — set a strong random value in production |
| `DATABASE_URL` | `sqlite:///medibridge.db` | Database connection string |

---

## License

This project was developed as an academic B.Tech AI/ML project.
