@echo off
REM Stops the FarmLink.AI backend (port 4000) and frontend (port 3000).

echo Stopping servers on ports 3000 and 4000 ...

for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :4000 ^| findstr LISTENING') do taskkill /F /PID %%p >nul 2>&1

echo Done.
pause
