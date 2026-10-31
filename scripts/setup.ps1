# One-time setup for Ardham on Windows PowerShell. Run from repo root: .\scripts\setup.ps1
$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "==> Backend: creating venv and installing requirements..." -ForegroundColor Cyan
if (-not (Test-Path "backend\.venv")) {
    python -m venv backend\.venv
}

& "backend\.venv\Scripts\pip.exe" install -q -r backend\requirements.txt

Write-Host "==> Frontend: installing npm dependencies..." -ForegroundColor Cyan
Push-Location frontend
npm install
Pop-Location

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "==> Created .env from .env.example — edit it if you want the AI Studio backend" -ForegroundColor Yellow
}

Write-Host "==> Checking for Ollama..." -ForegroundColor Cyan
if (Get-Command ollama -ErrorAction SilentlyContinue) {
    Write-Host "    Ollama found. Pulling gemma4:e4b (this can take a while the first time)..." -ForegroundColor Green
    ollama pull gemma4:e4b
} else {
    Write-Host "    Ollama not found. Install it from https://ollama.com before running the local backend," -ForegroundColor DarkYellow
    Write-Host "    or set ARDHAM_BACKEND=aistudio in .env to use the AI Studio backup instead." -ForegroundColor DarkYellow
    Write-Host "    (You can also use ARDHAM_BACKEND=stub for zero-dependency offline integration rehearsal)." -ForegroundColor DarkYellow
}

Write-Host "==> Setup complete! Run .\scripts\run_demo.ps1 to start the app." -ForegroundColor Green
