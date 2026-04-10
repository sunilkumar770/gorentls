import urllib.request, json, sys, uuid

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
        # If email exists, just return empty so we can try login
        if "Email already exists" in err_body:
            return {"status": "exists"}
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

# Use dedicated test prefix
prefix = str(uuid.uuid4())[:8]
renter_email = f"renter_{prefix}@test.com"
owner_email = f"owner_{prefix}@test.com"
admin_email = f"admin_{prefix}@test.com"

print(f"Using Prefix: {prefix}")
print("=== SETUP: Registering Users ===")
# Renter
post("/api/auth/register", {
    "fullName": f"Renter {prefix}", "email": renter_email,
    "password": "password123", "phone": "1234567890", "userType": "RENTER"
})
login_renter = post("/api/auth/login", {"email": renter_email, "password": "password123"})
renter_token = login_renter.get("accessToken")

# Owner
post("/api/auth/register-owner", {
    "fullName": f"Owner {prefix}", "email": owner_email,
    "password": "password123", "phone": "1234567891",
    "businessName": f"Shop {prefix}", "businessType": "RETAIL",
    "businessAddress": "123 Road", "businessCity": "NY", "businessState": "NY",
    "businessPincode": "10001", "businessPhone": "1234567891", "businessEmail": owner_email
})
login_owner = post("/api/auth/login", {"email": owner_email, "password": "password123"})
owner_token = login_owner.get("accessToken")

# Admin
post("/api/auth/register", {
    "fullName": f"Admin {prefix}", "email": admin_email,
    "password": "password123", "phone": "9876543212", "userType": "ADMIN"
})
login_admin = post("/api/auth/login", {"email": admin_email, "password": "password123"})
admin_token = login_admin.get("accessToken")

print(f"Renter Token: {'YES' if renter_token else 'NO'}")
print(f"Owner Token: {'YES' if owner_token else 'NO'}")
print(f"Admin Token: {'YES' if admin_token else 'NO'}")

if not (renter_token and owner_token):
    sys.exit(1)

print("\n=== SETUP: Creating Listing & Booking ===")
listing = post("/api/listings", {
    "title": "Camera", "description": "DSLR", "pricePerDay": 100.0, "securityDeposit": 500.0,
    "category": "ELECTRONICS", "condition": "NEW", "images": ["http://x.com/i.jpg"], "location": "NY"
}, owner_token)

listing_id = listing.get("id")
booking = post("/api/bookings", {
    "listingId": listing_id, "startDate": "2026-12-01", "endDate": "2026-12-05",
    "totalDays": 4, "rentalAmount": 400.0, "securityDeposit": 500.0, "totalAmount": 900.0
}, renter_token)

booking_id = booking.get("id")

print("\n=== TEST 1: Login ===")
print("Renter Login:", "SUCCESS" if renter_token else "FAIL")

print("\n=== TEST 2: Status Check ===")
bookings_resp = get("/api/bookings/my-bookings", renter_token)
content = bookings_resp.get("content", [])
if content:
    status = content[0].get('status')
    print(f"Exact status value: {status}")
    if status == 'PENDING':
        print("✅ TEST 2 PASSED")
    else:
        print(f"❌ TEST 2 FAILED: Got {status}")
else:
    print("❌ No bookings returned")

print("\n=== TEST 3: Admin Stats ===")
stats = get("/api/admin/dashboard/stats", admin_token)
print(f"Admin Stats keys: {list(stats.keys())}")
if any(k in stats for k in ['totalUsers', 'totalListings', 'activeListings']):
     print("✅ TEST 3 PASSED")
else:
     print("❌ TEST 3 FAILED")
