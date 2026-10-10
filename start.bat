@echo off
echo ====================================================
echo Starting MindVault AI - Production Intelligence Engine
echo ====================================================

REM Check if Python virtual environment exists
if not exist "backend_venv\Scripts\python.exe" (
    echo [ERROR] backend_venv\Scripts\python.exe not found!
    echo Please create the virtual environment using Python 3.12:
    echo   py -3.12 -m venv backend_venv
    echo   backend_venv\Scripts\pip install -r backend\requirements.txt
    pause
    exit /b 1
)

echo [1/2] Starting Backend Server (FastAPI on http://127.0.0.1:8000)...
start "MindVault Backend" cmd /k "backend_venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Frontend Server (Vite on http://localhost:5173)...
start "MindVault Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo MindVault AI is launching!
echo Backend API Docs: http://127.0.0.1:8000/docs
echo Web Interface:    http://localhost:5173
echo.
