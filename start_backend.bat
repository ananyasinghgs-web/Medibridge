@echo off
echo ========================================================
echo   Starting MediBridge FastAPI Backend (Port 8000)
echo ========================================================
cd backend
venv\Scripts\uvicorn.exe main:app --reload --host 127.0.0.1 --port 8000
pause

