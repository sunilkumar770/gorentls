# GoRentals One-Click Dev Launcher
# Run from repo root: .\START.ps1
# Requires: Java 21, Maven, Node 18+

if (-not $env:JWT_SECRET) {
    Write-Host ''
    Write-Host '  JWT_SECRET is not set!' -ForegroundColor Red
    Write-Host '  Generate one with:' -ForegroundColor Yellow
    Write-Host '    $bytes = New-Object byte[] 48' -ForegroundColor Yellow
    Write-Host '    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)' -ForegroundColor Yellow
    Write-Host '    $env:JWT_SECRET = [System.Convert]::ToBase64String($bytes)' -ForegroundColor Yellow
    Write-Host '  Then re-run: .\START.ps1' -ForegroundColor Yellow
    exit 1
}

Write-Host 'Starting GoRentals...' -ForegroundColor Cyan

Write-Host 'Starting backend on :8080...' -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    $env:JWT_SECRET = $args[0]
    Set-Location $using:PSScriptRoot\GORENTALS
    mvn spring-boot:run -q
} -ArgumentList $env:JWT_SECRET

Start-Sleep -Seconds 3

Write-Host 'Starting frontend on :3000...' -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PSScriptRoot\gorentals-frontend
    npm run dev
}

Write-Host ''
Write-Host '  Backend:   http://localhost:8080' -ForegroundColor Cyan
Write-Host '  Frontend:  http://localhost:3000' -ForegroundColor Cyan
Write-Host '  Press Ctrl+C to stop.' -ForegroundColor DarkGray
Write-Host ''

try {
    while ($true) {
        Receive-Job -Job $backendJob  | ForEach-Object { Write-Host [backend] $_ -ForegroundColor DarkGray }
        Receive-Job -Job $frontendJob | ForEach-Object { Write-Host [frontend] $_ -ForegroundColor DarkCyan }
        if ($backendJob.State  -eq 'Failed') { Write-Host 'Backend crashed.' -ForegroundColor Red; break }
        if ($frontendJob.State -eq 'Failed') { Write-Host 'Frontend crashed.' -ForegroundColor Red; break }
        Start-Sleep -Milliseconds 500
    }
} finally {
    Stop-Job  -Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob, $frontendJob -Force -ErrorAction SilentlyContinue
    Write-Host 'Stopped. Goodbye!' -ForegroundColor Green
}
