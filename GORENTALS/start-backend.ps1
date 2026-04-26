# start-backend.ps1
# Reads GORENTALS/.env and starts the Spring Boot backend with all env vars loaded.
# Usage: .\start-backend.ps1
# Run from the GORENTALS/ directory.

$envFile = Join-Path $PSScriptRoot ".env"

if (-Not (Test-Path $envFile)) {
    Write-Host "ERROR: .env file not found at $envFile" -ForegroundColor Red
    Write-Host "Copy .env.example to .env and fill in your values." -ForegroundColor Yellow
    exit 1
}

# Parse .env file — skip comments and empty lines
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#')) {
        $parts = $line -split '=', 2
        if ($parts.Length -eq 2) {
            $key   = $parts[0].Trim()
            $value = $parts[1].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
            Write-Host "  SET $key" -ForegroundColor DarkGray
        }
    }
}

Write-Host ""
Write-Host "Starting GoRentals Backend..." -ForegroundColor Green
Write-Host "Razorpay Key: $($env:RAZORPAY_KEY)" -ForegroundColor Cyan
Write-Host "API URL: http://localhost:$($env:PORT ?? '8080')/api" -ForegroundColor Cyan
Write-Host ""

& .\mvnw.cmd spring-boot:run
