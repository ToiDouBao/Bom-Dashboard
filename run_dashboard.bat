@echo off
echo Starting BOM Sync Dashboard...

:: Start Backend in a new window
start "BOM Backend Server" cmd /k "cd server && node index.js"

:: Start Frontend in a new window
start "BOM Frontend Dashboard" cmd /k "cd client && npm run dev"

echo.
echo ---------------------------------------------------
echo System is starting! 
echo 1. Backend: http://localhost:5000
echo 2. Frontend: http://localhost:5173
echo ---------------------------------------------------
echo Keep these windows open while using the dashboard.
pause
