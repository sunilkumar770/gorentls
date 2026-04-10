import urllib.request, json, uuid, sys

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
        rb = e.read().decode()
        print(f"FAILED {url}: {e.code} - {rb}")
        return {"error": e.code, "body": rb}

def get(url, token):
    req = urllib.request.Request(f"{BASE}{url}", headers={"Authorization": f"Bearer {token}"})
    try:
        res = urllib.request.urlopen(req)
        return json.loads(res.read())
    except urllib.error.HTTPError as e:
        rb = e.read().decode()
        print(f"FAILED {url}: {e.code} - {rb}")
        return {"error": e.code, "body": rb}

uid = str(uuid.uuid4())[:8]
phone = str(uuid.uuid4().int)[:10]

print(f"--- E2E VERIFICATION [ID: {uid}] ---")

# 1. Register Renter
print("Registering Renter...")
r_reg = post("/api/auth/register", {
    "fullName": f"Renter {uid}", "email": f"r{uid}@test.com", "password": "password123", "phone": phone, "userType": "RENTER"
})
r_token = r_reg.get("accessToken")

# 2. Register Owner
print("Registering Owner...")
o_reg = post("/api/auth/register-owner", {
    "fullName": f"Owner {uid}", "email": f"o{uid}@test.com", "password": "password123", "phone": str(int(phone)+1),
    "businessName": f"Biz {uid}", "businessType": "RENTALS", "businessAddress": "123 St", "businessCity": "NY", "businessState": "NY",
    "businessPincode": "10001", "businessPhone": str(int(phone)+1), "businessEmail": f"o{uid}@test.com"
})
o_token = o_reg.get("accessToken")

# 3. Register Admin
print("Registering Admin...")
a_reg = post("/api/auth/register", {
    "fullName": f"Admin {uid}", "email": f"a{uid}@test.com", "password": "password123", "phone": str(int(phone)+2), "userType": "ADMIN"
})
a_token = a_reg.get("accessToken")

if not (r_token and o_token and a_token):
    print("❌ Critical tokens missing. Check registration failures.")
    sys.exit(1)

# 4. Create Listing & Booking
print("Creating Listing...")
listing = post("/api/listings", {
    "title": "Camera", "description": "DSLR", "pricePerDay": 100, "securityDeposit": 500, "category": "ELECTRONICS",
    "condition": "NEW", "images": ["http://x.com/i.jpg"], "location": "NY"
}, o_token)
l_id = listing.get("id")

print("Creating Booking...")
booking = post("/api/bookings", {
    "listingId": l_id, "startDate": "2026-12-01", "endDate": "2026-12-05", "totalDays": 4,
    "rentalAmount": 400, "securityDeposit": 500, "totalAmount": 900
}, r_token)

# 5. Final Tests
print("\n--- TEST RESULTS ---")

# Test 1: Tokens
print(f"Test 1 (Renter Token): {('YES' if r_token else 'NO')}")

# Test 2: Status Check
my_b = get("/api/bookings/my-bookings", r_token)
content = my_b.get("content", [])
if content:
    status = content[0].get("status")
    print(f"Test 2 (Booking Status String): '{status}'")
    if status == "PENDING":
        print("✅ Status is strictly uppercase PENDING")
else:
    print("❌ Booking list empty")

# Test 3: Admin Stats
stats = get("/api/admin/dashboard/stats", a_token)
print(f"Test 3 (Admin Stats Functional): {'YES' if 'totalUsers' in stats else 'NO'}")
if 'totalUsers' in stats:
    print(f"Admin Stats Summary: {json.dumps(stats, indent=2)}")

print("\n--- E2E VERIFICATION COMPLETE ---")
