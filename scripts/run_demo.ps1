# Starts backend + frontend together for the demo on Windows. Run: .\scripts\run_demo.ps1
$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")

if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $name = $parts[0].Trim()
            $value = $parts[1].Trim()
            [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$backendType = [System.Environment]::GetEnvironmentVariable("ARDHAM_BACKEND")
if (-not $backendType) { $backendType = "local" }

Write-Host "==> Starting Ardham Backend (ARDHAM_BACKEND=$backendType) on http://localhost:8000..." -ForegroundColor Cyan
$backendProcess = Start-Process -FilePath "backend\.venv\Scripts\uvicorn.exe" -ArgumentList "main:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "backend" -PassThru

Write-Host "==> Starting Ardham Frontend on http://localhost:5173..." -ForegroundColor Cyan
$frontendProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory "frontend" -PassThru

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Ardham (అర్థం) is running!" -ForegroundColor Green
Write-Host "  Backend API:  http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "  Frontend App: http://localhost:5173" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Press Ctrl+C or Enter to stop both servers..." -ForegroundColor DarkGray

try {
    [Console]::ReadLine()
} finally {
    Write-Host "Stopping servers..." -ForegroundColor Red
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
}
