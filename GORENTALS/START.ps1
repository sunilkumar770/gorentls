$ErrorActionPreference = "Stop"

$env:DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$env:DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$env:DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "gorentals" }
$env:DB_USERNAME = if ($env:DB_USERNAME) { $env:DB_USERNAME } else { "postgres" }
$env:DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "postgres" }

if (-not $env:JWT_SECRET) {
  $bytes = New-Object byte[] 48
  (New-Object System.Random).NextBytes($bytes)
  $env:JWT_SECRET = [System.Convert]::ToBase64String($bytes)
}

$env:DB_URL = "jdbc:postgresql://$($env:DB_HOST):$($env:DB_PORT)/$($env:DB_NAME)"
$env:APP_ADMIN_EMAIL = if ($env:APP_ADMIN_EMAIL) { $env:APP_ADMIN_EMAIL } else { "admin@gorentals.com" }
$env:APP_ADMIN_PASSWORD = if ($env:APP_ADMIN_PASSWORD) { $env:APP_ADMIN_PASSWORD } else { "Admin@GoRentals2025!" }
$env:APP_ADMIN_NAME = if ($env:APP_ADMIN_NAME) { $env:APP_ADMIN_NAME } else { "GoRentals Admin" }
$env:FRONTEND_URL = if ($env:FRONTEND_URL) { $env:FRONTEND_URL } else { "http://localhost:3000" }

Write-Host "Checking PostgreSQL database $($env:DB_NAME)..."

$PSQL_PATH = "psql"
if (-not (Get-Command "psql" -ErrorAction SilentlyContinue)) {
  $CommonPaths = @(
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe"
  )
  foreach ($Path in $CommonPaths) {
    if (Test-Path $Path) {
      $PSQL_PATH = $Path
      break
    }
  }
}

if ($PSQL_PATH -eq "psql" -and -not (Get-Command "psql" -ErrorAction SilentlyContinue)) {
  Write-Warning "psql.exe not found. Skipping database check. Please ensure database '$($env:DB_NAME)' exists."
} else {
  $env:PGPASSWORD = $env:DB_PASSWORD
$exists = & $PSQL_PATH -h $env:DB_HOST -p $env:DB_PORT -U $env:DB_USERNAME -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$($env:DB_NAME)'" 2>$null
  if ($exists -ne "1") {
    Write-Host "Database $($env:DB_NAME) does not exist. Creating it..."
    & $PSQL_PATH -h $env:DB_HOST -p $env:DB_PORT -U $env:DB_USERNAME -d postgres -c "CREATE DATABASE $($env:DB_NAME);"
  } else {
    Write-Host "Database $($env:DB_NAME) already exists."
  }
}

Write-Host "Starting Spring Boot with DB_URL=$($env:DB_URL)"
./mvnw spring-boot:run
