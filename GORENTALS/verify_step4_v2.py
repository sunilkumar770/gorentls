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
        return {"error": e.code, "body": e.read().decode()}

def get(url, token):
    req = urllib.request.Request(f"{BASE}{url}",
                                  headers={"Authorization": f"Bearer {token}"})
    try:
        res = urllib.request.urlopen(req)
        return json.loads(res.read())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "body": e.read().decode()}

unique = int(time.time())
renter_email = f"renter_{unique}@test.com"
owner_email = f"owner_{unique}@test.com"
admin_email = f"admin_{unique}@test.com"

print("=== SETUP: Registering Users ===")
# Renter
post("/api/auth/register", {
    "fullName": "Step4 Renter", "email": renter_email,
    "password": "pass123", "phone": "9876543210", "userType": "RENTER"
})
login_renter = post("/api/auth/login", {"email": renter_email, "password": "pass123"})
renter_token = login_renter.get("accessToken")

# Owner
post("/api/auth/register-owner", {
    "fullName": "Step4 Owner", "email": owner_email,
    "password": "pass123", "phone": "9876543211", "userType": "OWNER"
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

print(f"Renter Token: {'YES' if renter_token else 'NO'}")
print(f"Owner Token: {'YES' if owner_token else 'NO'}")
print(f"Admin Token: {'YES' if admin_token else 'NO'}")

if not (renter_token and owner_token):
    print("Failed to setup tokens.")
    sys.exit(1)

print("\n=== SETUP: Creating Listing & Booking ===")
listing = post("/api/listings", {
    "title": "Test Camera",
    "description": "DSLR for rent",
    "pricePerDay": 100,
    "securityDeposit": 500,
    "category": "ELECTRONICS",
    "condition": "GOOD",
    "images": ["http://example.com/img.jpg"],
    "location": "New York"
}, owner_token)

listing_id = listing.get("id")
print(f"Listing created: {listing_id}")

booking = post("/api/bookings", {
    "listingId": listing_id,
    "startDate": "2026-10-01",
    "endDate": "2026-10-05",
    "totalDays": 4,
    "rentalAmount": 400,
    "securityDeposit": 500,
    "totalAmount": 900
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
        print(f"Booking {b.get('id')} Status: {b.get('status')}")
    status_vals = set(b.get('status') for b in content)
    print(f"Unique statuses: {status_vals}")
    if "PENDING" in status_vals:
        print("✅ TEST 2 PASSED — status is 'PENDING'")
    else:
        print(f"❌ TEST 2 FAILED — expected 'PENDING', got {status_vals}")
else:
    print("❌ No bookings found!")

print("\n=== TEST 3: Admin stats endpoint ===")
if admin_token:
    stats = get("/api/admin/dashboard/stats", admin_token)
    print("Admin Stats:", json.dumps(stats, indent=2))
    if "totalUsers" in stats or "totalListings" in stats:
        print("✅ TEST 3 PASSED")
    else:
        print("❌ TEST 3 FAILED")
else:
    print("❌ Admin token missing")
