@echo off
title Ardham (అర్థం) Demo Runner
cd /d "%~dp0\.."

echo ==> Starting Ardham Backend and Frontend...
powershell -ExecutionPolicy Bypass -File "%~dp0run_demo.ps1"
pause
