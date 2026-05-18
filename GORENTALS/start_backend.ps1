# start_backend.ps1
$env:SPRING_PROFILES_ACTIVE = "dev"
$env:JWT_SECRET = "super_secret_jwt_key_for_local_development_needs_to_be_long_enough"

if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match "^([^#=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item "Env:$name" $value
        }
    }
}

.\mvnw.cmd spring-boot:run
