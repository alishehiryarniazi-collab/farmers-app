@echo off
REM Starts the FarmLink.AI backend and frontend, each in its own window.
REM Just double-click this file whenever you want to run the app.
REM Closing a window stops that server. Closing this window is fine, the other two stay open.

echo Starting backend (http://localhost:4000) ...
start "FarmLink.AI - Backend" cmd /k "cd /d %~dp0backend && npm run dev"

echo Starting frontend (http://localhost:3000) ...
start "FarmLink.AI - Web" cmd /k "cd /d %~dp0web && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo Give them a few seconds, then open http://localhost:3000
echo.
pause
