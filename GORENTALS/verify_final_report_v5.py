import requests, json, uuid, sys

BASE = "http://localhost:8080"

def post(url, body, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        response = requests.post(f"{BASE}{url}", json=body, headers=headers)
        if response.status_code >= 400:
            print(f"FAILED {url}: {response.status_code} - {response.text}")
            return {"error": response.status_code, "body": response.text}
        return response.json()
    except Exception as e:
        print(f"EXCEPTION {url}: {str(e)}")
        return {"error": "EXCEPTION", "body": str(e)}

def get(url, token):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{BASE}{url}", headers=headers)
        if response.status_code >= 400:
            print(f"FAILED {url}: {response.status_code} - {response.text}")
            return {"error": response.status_code, "body": response.text}
        return response.json()
    except Exception as e:
        print(f"EXCEPTION {url}: {str(e)}")
        return {"error": "EXCEPTION", "body": str(e)}

uid = str(uuid.uuid4())[:8]
phone = str(uuid.uuid4().int)[:10]

print(f"--- VERIFICATION REPORT [ID: {uid}] ---")

# Step 1: Register Renter
print("\n[1/3] Verifying Renter Lifecycle...")
r_email = f"r{uid}@test.com"
r_reg = post("/api/auth/register", {
    "fullName": "Test Renter",
    "email": r_email,
    "password": "password123",
    "phone": phone,
    "userType": "RENTER"
})
r_token = r_reg.get("accessToken")
if r_token:
    print("✅ Renter registration and login successful.")
else:
    print("❌ Renter verification failed.")
    sys.exit(1)

# Step 2: Register Owner and Create Booking
print("\n[2/3] Verifying Booking Status Alignment...")
o_email = f"o{uid}@test.com"
o_phone = str(int(phone) + 1)
o_reg = post("/api/auth/register-owner", {
    "fullName": "Test Owner",
    "email": o_email,
    "password": "password123",
    "phone": o_phone,
    "businessName": "Test Shop",
    "businessType": "RENTALS",
    "businessAddress": "123 Main St",
    "businessCity": "New York",
    "businessState": "NY",
    "businessPincode": "10001",
    "businessPhone": o_phone,
    "businessEmail": o_email
})
o_token = o_reg.get("accessToken")
if not o_token:
    print("❌ Owner registration failed.")
    sys.exit(1)

# Create Listing
listing = post("/api/listings", {
    "title": "Camera",
    "description": "DSLR",
    "pricePerDay": 100,
    "securityDeposit": 500,
    "category": "ELECTRONICS",
    "type": "RENT",
    "condition": "NEW",
    "images": ["http://example.com/img.jpg"],
    "location": "New York"
}, o_token)
l_id = listing.get("id")

# Create Booking as Renter
booking = post("/api/bookings", {
    "listingId": l_id,
    "startDate": "2026-12-01",
    "endDate": "2026-12-05",
    "totalDays": 4,
    "rentalAmount": 400,
    "securityDeposit": 500,
    "totalAmount": 900
}, r_token)

# Fetch Booking and Verify Status
bookings_resp = get("/api/bookings/my-bookings", r_token)
content = bookings_resp.get("content", [])
if content:
    status = content[0].get("status")
    print(f"Backend Status String: '{status}'")
    if status == "PENDING":
        print("✅ TEST 2 PASSED: Status is strictly uppercase 'PENDING'.")
    else:
        print(f"❌ TEST 2 FAILED: Got '{status}' instead of 'PENDING'.")
else:
    print("❌ Trace: Created booking not found in /my-bookings list.")

# Step 3: Verify Admin Dashboard Stats
print("\n[3/3] Verifying Admin Dashboard Stats...")
a_email = f"a{uid}@test.com"
a_phone = str(int(phone) + 2)
a_reg = post("/api/auth/register", {
    "fullName": "Test Admin",
    "email": a_email,
    "password": "password123",
    "phone": a_phone,
    "userType": "ADMIN"
})
a_token = a_reg.get("accessToken")
if a_token:
    stats = get("/api/admin/dashboard/stats", a_token)
    if "totalUsers" in stats:
        print(f"Admin Stats Response: {json.dumps(stats, indent=2)}")
        print("✅ TEST 3 PASSED: Admin stats endpoint returned real data.")
    else:
        print(f"❌ TEST 3 FAILED: Unexpected response format: {stats}")
else:
    print("❌ Admin registration failed.")

print("\n--- VERIFICATION COMPLETE ---")
