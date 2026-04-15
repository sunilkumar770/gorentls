# GORENTALS Backend

## Local setup

### Prerequisites
- Java 17+
- PostgreSQL running locally
- PowerShell (Windows) or bash (Linux/macOS)

### Default local env
- DB: `gorentals`
- Username: `postgres`
- Password: `postgres`

### Start on Windows
```powershell
./START.ps1
```

### Start on Linux/macOS
```bash
chmod +x START.sh
./START.sh
```

### What startup does
- creates database `gorentals` if missing
- sets `DB_URL`, `JWT_SECRET`, and admin seed env vars
- starts Spring Boot

### Default admin
- Email: `admin@gorentals.com`
- Password: `Admin@GoRentals2025!`

Change these using env vars:
- `APP_ADMIN_EMAIL`
- `APP_ADMIN_PASSWORD`
- `APP_ADMIN_NAME`