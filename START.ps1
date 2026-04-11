Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   GoRentals — Starting Platform" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1 — PostgreSQL
$pg = Get-Service -Name "postgresql*" -EA SilentlyContinue | Select-Object -First 1
if (-not $pg) {
    Write-Host "[ERROR] PostgreSQL service not found. Is it installed?" -ForegroundColor Red
    exit 1
}
if ($pg.Status -ne 'Running') {
    Write-Host "[1/4] Starting PostgreSQL..." -ForegroundColor Yellow
    Start-Service $pg.Name
    Start-Sleep 4
}
Write-Host "[1/4] PostgreSQL: Running" -ForegroundColor Green

# 2 — Kill stale port 8080
$p = (Get-NetTCPConnection -LocalPort 8080 -EA SilentlyContinue).OwningProcess
if ($p) {
    Stop-Process -Id $p -Force
    Write-Host "[2/4] Cleared stale process on port 8080 (PID $p)" -ForegroundColor Yellow
    Start-Sleep 2
} else {
    Write-Host "[2/4] Port 8080: Free" -ForegroundColor Green
}

# 3 — Backend
Write-Host "[3/4] Launching Backend (Spring Boot)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Write-Host 'GoRentals Backend' -ForegroundColor Cyan; cd 'C:\Users\sunil\Downloads\gorentls\GORENTALS'; .\mvnw spring-boot:run"
Write-Host "[3/4] Backend starting — waiting 35 seconds..." -ForegroundColor Yellow
Start-Sleep 35

# 4 — Frontend
Write-Host "[4/4] Launching Frontend (Next.js)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Write-Host 'GoRentals Frontend' -ForegroundColor Cyan; cd 'C:\Users\sunil\Downloads\gorentls\gorentals-frontend'; npm run dev"
Start-Sleep 6

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   GoRentals is READY" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  App:      http://localhost:3000" -ForegroundColor White
Write-Host "  Admin:    http://localhost:3000/admin" -ForegroundColor White
Write-Host "  API:      http://localhost:8080/api" -ForegroundColor White
Write-Host ""
Write-Host "  Admin login:" -ForegroundColor Gray
Write-Host "    Email:    admin@gorentals.com" -ForegroundColor Gray
Write-Host "    Password: Admin@GoRentals2025!" -ForegroundColor Gray
Write-Host ""
