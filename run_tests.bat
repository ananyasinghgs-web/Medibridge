@echo off
echo ========================================================
echo   Running MediBridge Automated Verification Test Suite
echo ========================================================
backend\venv\Scripts\python.exe backend\tests\verify_services.py
pause

