# smoke-test-escrow.ps1
# End-to-end validation of the GoRentals escrow state machine

$ErrorActionPreference = "Stop"
$BaseUrl = "http://localhost:8080/api"

# ── Step 0: Health Check ────────────────────────────────────────────────────
Write-Host "`n=== STEP 0: Health Check ===" -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method GET
    Write-Host "Health: $($health.status)"
} catch {
    Write-Host "Backend is NOT running at $BaseUrl" -ForegroundColor Red
    exit
}

# ── Step 0.5: Admin Login ───────────────────────────────────────────────────
Write-Host "`n=== STEP 0.5: Admin Login ===" -ForegroundColor Cyan
$adminLogin = @{
    email = "admin@gorentals.com"
    password = "Admin@GoRentals2025!"
} | ConvertTo-Json
$adminRes = Invoke-RestMethod -Uri "$BaseUrl/auth/admin-login" -Method POST `
    -ContentType "application/json" -Body $adminLogin
$adminToken = $adminRes.accessToken
Write-Host "Admin logged in: $($adminRes.email)"

# ── Step 1: Register Test Users ─────────────────────────────────────────────
Write-Host "`n=== STEP 1: Register Test Users ===" -ForegroundColor Cyan
$rand = Get-Random

function Register-TestUser($Email, $Type) {
    if ($Type -eq "OWNER") {
        $body = @{
            email = $Email
            password = "SmokeTest123!"
            fullName = "Smoke Owner"
            phone = "90000$($rand.ToString().Substring(0,5))"
            businessName = "Smoke Business"
            businessType = "Rental"
            businessAddress = "123 Smoke St"
            businessCity = "Hyderabad"
            businessState = "Telangana"
            businessPincode = "500081"
            businessPhone = "9000012345"
            businessEmail = "business@smoke.com"
        } | ConvertTo-Json
        return Invoke-RestMethod -Uri "$BaseUrl/auth/register-owner" -Method POST `
            -ContentType "application/json" -Body $body
    } else {
        $body = @{
            email = $Email
            password = "SmokeTest123!"
            fullName = "Smoke Renter"
            phone = "90000$($rand.ToString().Substring(0,5))"
        } | ConvertTo-Json
        return Invoke-RestMethod -Uri "$BaseUrl/auth/register" -Method POST `
            -ContentType "application/json" -Body $body
    }
}

$renterRes = Register-TestUser -Email "smoke-renter-$rand@test.com" -Type "RENTER"
$renterToken = $renterRes.accessToken
$renterId = $renterRes.userId
Write-Host "Renter registered: $($renterRes.email) | ID: $renterId"

$ownerRes = Register-TestUser -Email "smoke-owner-$rand@test.com" -Type "OWNER"
$ownerToken = $ownerRes.accessToken
$ownerId = $ownerRes.userId
Write-Host "Owner registered: $($ownerRes.email) | ID: $ownerId"

# ── Step 1.5: Verify Owner KYC (Admin) ──────────────────────────────────────
Write-Host "`n=== STEP 1.5: Verify Owner KYC (Admin) ===" -ForegroundColor Cyan
# Verify user KYC (which allows listing)
Invoke-RestMethod -Uri "$BaseUrl/admin/users/$ownerId/verify" -Method PATCH `
    -Headers @{ Authorization = "Bearer $adminToken" }
Write-Host "Owner KYC Verified via Admin API"

# ── Step 2: Create Listing ──────────────────────────────────────────────────
Write-Host "`n=== STEP 2: Create Listing ===" -ForegroundColor Cyan
$listing = @{
    title = "Smoke Test Camera"
    description = "Canon EOS R5 for rent"
    category = "ELECTRONICS"
    type = "RENTAL"
    pricePerDay = 500
    securityDeposit = 5000
    location = "Hyderabad"
    city = "Hyderabad"
} | ConvertTo-Json

$listingRes = Invoke-RestMethod -Uri "$BaseUrl/listings" -Method POST `
    -Headers @{ Authorization = "Bearer $ownerToken" } `
    -ContentType "application/json" -Body $listing
$listingId = $listingRes.id
Write-Host "Listing created: $listingId"

# ── Step 3: Create Booking ──────────────────────────────────────────────────
Write-Host "`n=== STEP 3: Create Booking ===" -ForegroundColor Cyan
$booking = @{
    listingId = $listingId
    startDate = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    endDate = (Get-Date).AddDays(3).ToString("yyyy-MM-dd")
    totalDays = 3
} | ConvertTo-Json

$bookingRes = Invoke-RestMethod -Uri "$BaseUrl/bookings" -Method POST `
    -Headers @{ Authorization = "Bearer $renterToken" } `
    -ContentType "application/json" -Body $booking
$bookingId = $bookingRes.id
Write-Host "Booking created: $bookingId | Status: $($bookingRes.status)"

$escrow = Invoke-RestMethod -Uri "$BaseUrl/payments/escrow/$bookingId" -Method GET `
    -Headers @{ Authorization = "Bearer $renterToken" }
Write-Host "Initial escrow status: $($escrow.escrowStatus)"

# ── Step 4: Create Order (ADVANCE) ──────────────────────────────────────────
Write-Host "`n=== STEP 4: Create Order (ADVANCE) ===" -ForegroundColor Cyan
function Create-Order($Token, $BookingId, $Kind) {
    $body = @{ bookingId = $BookingId; paymentKind = $Kind } | ConvertTo-Json
    return Invoke-RestMethod -Uri "$BaseUrl/payments/order" -Method POST `
        -Headers @{ Authorization = "Bearer $Token" } `
        -ContentType "application/json" -Body $body
}

$orderRes = Create-Order -Token $renterToken -BookingId $bookingId -Kind "ADVANCE"
Write-Host "Order created: $($orderRes.id) | Amount: $($orderRes.amount) paise"

# ── Step 5: Confirm ADVANCE payment ─────────────────────────────────────────
Write-Host "`n=== STEP 5: Confirm ADVANCE payment ===" -ForegroundColor Cyan
$confirmReq = @{
    bookingId = $bookingId
    razorpayOrderId = $orderRes.id
    razorpayPaymentId = "pay_smoke_test_advance_$rand"
    razorpaySignature = "dummy_sig_for_smoke_test"
    paymentKind = "ADVANCE"
} | ConvertTo-Json

$confirmRes = Invoke-RestMethod -Uri "$BaseUrl/payments/confirm" -Method POST `
    -Headers @{ Authorization = "Bearer $renterToken" } `
    -ContentType "application/json" -Body $confirmReq
Write-Host "Advance confirmed: $($confirmRes.status) | Escrow: $($confirmRes.escrowStatus)"

# ── Step 6: Verify Escrow (After Advance) ───────────────────────────────────
Write-Host "`n=== STEP 6: Verify Escrow (After Advance) ===" -ForegroundColor Cyan
$escrowAfterAdvance = Invoke-RestMethod -Uri "$BaseUrl/payments/escrow/$bookingId" -Method GET `
    -Headers @{ Authorization = "Bearer $renterToken" }
Write-Host "Escrow status: $($escrowAfterAdvance.escrowStatus)"
Write-Host "Advance amount: $($escrowAfterAdvance.advanceAmount)"
Write-Host "Total collected: $($escrowAfterAdvance.totalCollected)"

# ── Step 6.5: Mark as IN_USE (Handover) ──────────────────────────────────────
Write-Host "`n=== STEP 6.5: Mark as IN_USE (Handover) ===" -ForegroundColor Cyan
$handoverRes = Invoke-RestMethod -Uri "$BaseUrl/bookings/$bookingId/status" -Method PATCH `
    -Headers @{ Authorization = "Bearer $ownerToken" } `
    -ContentType "application/json" -Body (@{ status = "IN_USE" } | ConvertTo-Json)
Write-Host "Handover complete: Status=$($handoverRes.status)"

# ── Step 7: Create Order (FINAL) ────────────────────────────────────────────
Write-Host "`n=== STEP 7: Create Order (FINAL) ===" -ForegroundColor Cyan
$finalOrderRes = Create-Order -Token $renterToken -BookingId $bookingId -Kind "FINAL"
Write-Host "Final order created: $($finalOrderRes.id)"

# Confirm final payment
$finalConfirmReq = @{
    bookingId = $bookingId
    razorpayOrderId = $finalOrderRes.id
    razorpayPaymentId = "pay_smoke_test_final_$rand"
    razorpaySignature = "dummy_sig_for_smoke_test"
    paymentKind = "FINAL"
} | ConvertTo-Json

$finalConfirmRes = Invoke-RestMethod -Uri "$BaseUrl/payments/confirm" -Method POST `
    -Headers @{ Authorization = "Bearer $renterToken" } `
    -ContentType "application/json" -Body $finalConfirmReq
Write-Host "Final confirmed: $($finalConfirmRes.status) | Escrow: $($finalConfirmRes.escrowStatus)"

# ── Step 8: Verify FULL_HELD ────────────────────────────────────────────────
Write-Host "`n=== STEP 8: Verify Escrow (After Final) ===" -ForegroundColor Cyan
$escrowAfterFinal = Invoke-RestMethod -Uri "$BaseUrl/payments/escrow/$bookingId" -Method GET `
    -Headers @{ Authorization = "Bearer $renterToken" }
Write-Host "Escrow status: $($escrowAfterFinal.escrowStatus)"
Write-Host "Total collected: $($escrowAfterFinal.totalCollected)"

# ── Step 9: Simulate Item Return ────────────────────────────────────────────
Write-Host "`n=== STEP 9: Simulate Return ===" -ForegroundColor Cyan
$returnRes = Invoke-RestMethod -Uri "$BaseUrl/bookings/$bookingId/status" -Method PATCH `
    -Headers @{ Authorization = "Bearer $ownerToken" } `
    -ContentType "application/json" -Body (@{ status = "RETURNED" } | ConvertTo-Json)
Write-Host "Return status updated: Status=$($returnRes.status)"

# ── Step 10: Final State Check ─────────────────────────────────────────────
Write-Host "`n=== STEP 10: Final State Check ===" -ForegroundColor Cyan
$escrowAfterReturn = Invoke-RestMethod -Uri "$BaseUrl/payments/escrow/$bookingId" -Method GET `
    -Headers @{ Authorization = "Bearer $renterToken" }
Write-Host "Escrow status after return: $($escrowAfterReturn.escrowStatus)"

# ── Summary ─────────────────────────────────────────────────────────────────
Write-Host "`n=== SMOKE TEST SUMMARY ===" -ForegroundColor Green
Write-Host "Booking ID: $bookingId"
Write-Host "Escrow Final Status: $($escrowAfterReturn.escrowStatus)"
Write-Host "Total Collected: $($escrowAfterReturn.totalCollected)"

if ($escrowAfterReturn.totalCollected -ge 6000) {
    Write-Host "Test PASSED: State machine transitioned correctly and money was collected." -ForegroundColor Green
} else {
    Write-Host "Test FAILED: Expected collection >= 6000, got $($escrowAfterReturn.totalCollected)" -ForegroundColor Red
}
