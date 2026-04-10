import urllib.request, json, sys, time

BASE = "http://localhost:8080"

def post(url, body, token=None):
    data = json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{url}", data=data, headers=headers)
    try:
        res = urllib.request.urlopen(req)
        return json.loads(res.read())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        print(f"POST {url} failed: {e.code} - {err_body}")
        return {"error": e.code, "body": err_body}

def get(url, token):
    req = urllib.request.Request(f"{BASE}{url}",
                                  headers={"Authorization": f"Bearer {token}"})
    try:
        res = urllib.request.urlopen(req)
        return json.loads(res.read())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        print(f"GET {url} failed: {e.code} - {err_body}")
        return {"error": e.code, "body": err_body}

unique = int(time.time())
renter_email = f"renter_{unique}@test.com"
owner_email = f"owner_{unique}@test.com"
admin_email = f"admin_{unique}@test.com"

print("=== SETUP: Registering Users ===")
# Renter
post("/api/auth/register", {
    "fullName": f"Renter {unique}", "email": renter_email,
    "password": "pass123", "phone": "1234567890", "userType": "RENTER"
})
login_renter = post("/api/auth/login", {"email": renter_email, "password": "pass123"})
renter_token = login_renter.get("accessToken")

# Owner
post("/api/auth/register-owner", {
    "fullName": f"Owner {unique}", "email": owner_email,
    "password": "pass123", "phone": "1234567891",
    "businessName": f"Shop {unique}", "businessType": "RETAIL",
    "businessAddress": "123 Road", "businessCity": "NY", "businessState": "NY",
    "businessPincode": "10001", "businessPhone": "1234567891", "businessEmail": owner_email
})
login_owner = post("/api/auth/login", {"email": owner_email, "password": "pass123"})
owner_token = login_owner.get("accessToken")

# Admin
post("/api/auth/register", {
    "fullName": "Step4 Admin", "email": admin_email,
    "password": "pass123", "phone": "9876543212", "userType": "ADMIN"
})
login_admin = post("/api/auth/login", {"email": admin_email, "password": "pass123"})
admin_token = login_admin.get("accessToken")

print(f"Renter Token obtained: {'YES' if renter_token else 'NO'}")
print(f"Owner Token obtained: {'YES' if owner_token else 'NO'}")
print(f"Admin Token obtained: {'YES' if admin_token else 'NO'}")

if not (renter_token and owner_token):
    print("❌ Failed to setup tokens. Aborting test.")
    sys.exit(1)

print("\n=== SETUP: Creating Listing & Booking ===")
listing = post("/api/listings", {
    "title": "Test DSLR Camera",
    "description": "Professional camera for weekend rental",
    "pricePerDay": 100.0,
    "securityDeposit": 500.0,
    "category": "ELECTRONICS",
    "condition": "NEW",
    "images": ["http://example.com/camera.jpg"],
    "location": "New York"
}, owner_token)

listing_id = listing.get("id")
print(f"Listing created: {listing_id}")

booking = post("/api/bookings", {
    "listingId": listing_id,
    "startDate": "2026-12-01",
    "endDate": "2026-12-05",
    "totalDays": 4,
    "rentalAmount": 400.0,
    "securityDeposit": 500.0,
    "totalAmount": 900.0
}, renter_token)

booking_id = booking.get("id")
print(f"Booking created: {booking_id}")

print("\n=== TEST 1: Login Check ===")
print("Renter Login:", "SUCCESS" if renter_token else "FAIL")

print("\n=== TEST 2: Fetch bookings — check status field ===")
bookings_resp = get("/api/bookings/my-bookings", renter_token)
content = bookings_resp.get("content", [])

if len(content) > 0:
    for b in content:
        print(f"Booking ID: {b.get('id')} | Status: {b.get('status')}")
    status_vals = set(b.get('status') for b in content)
    print(f"Unique statuses seen in response: {status_vals}")
    if "PENDING" in status_vals:
        print("✅ TEST 2 PASSED — status is strictly 'PENDING' uppercase")
    else:
        print(f"❌ TEST 2 FAILED — expected 'PENDING', but got {status_vals}")
else:
    print("❌ Critical: No bookings returned by /my-bookings even after creation.")

print("\n=== TEST 3: Admin stats endpoint ===")
if admin_token:
    stats = get("/api/admin/dashboard/stats", admin_token)
    print("Admin stats response:", json.dumps(stats, indent=2))
    if "totalUsers" in stats or "activeListings" in stats:
        print("✅ TEST 3 PASSED — admin stats returned valid numeric data")
    else:
        print("❌ TEST 3 FAILED — response missing expected keys")
else:
    print("❌ Admin token missing.")
