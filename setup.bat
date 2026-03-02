@echo off
echo ==========================================
echo AI Shield Platform Setup
echo ==========================================

echo.
echo [1/4] Installing Backend Dependencies...
cd backend
call npm install
call npm install pdf-parse mammoth
call npm install --save-dev @types/pdf-parse @types/mammoth
cd ..

echo.
echo [2/4] Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo [3/4] Checking Python Environment...
pip install -r model_service/requirements.txt

echo.
echo [4/4] Setup Complete! 
echo.
echo To run backend: cd backend && npm run dev
echo To run frontend: cd frontend && npm run dev
timeout /t 10