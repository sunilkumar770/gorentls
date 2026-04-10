import urllib.request, json, sys

BASE = "http://localhost:8080"

def post(url, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(f"{BASE}{url}", data=data,
                                  headers={"Content-Type": "application/json"})
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

print("=== TEST 1: Register + Login ===")
reg = post("/api/auth/register", {
    "fullName": "Step4 Renter", "email": "step4renter@test.com",
    "password": "pass123", "phone": "9876543210", "userType": "RENTER"
})
print("Register:", json.dumps(reg, indent=2))

login = post("/api/auth/login", {
    "email": "step4renter@test.com", "password": "pass123"
})
token = login.get("accessToken")
print(f"\nToken obtained: {'YES — ' + token[:30] + '...' if token else 'NO — FAIL'}")

if not token:
    print("\n❌ Cannot continue — login failed. Check backend logs.")
    sys.exit(1)

print("\n=== TEST 2: Fetch bookings — check status field ===")
bookings = get("/api/bookings/my-bookings", token)
print("Response:", json.dumps(bookings, indent=2))

if isinstance(bookings, list):
    if len(bookings) == 0:
        print("\n⚠️  Empty list — new user has no bookings. Status field cannot be verified yet.")
        print("    Create a booking first, then re-run this script.")
    else:
        for b in bookings:
            print(f"\nBooking ID: {b.get('id')} | Status: {b.get('status')}")
        status_vals = set(b.get('status') for b in bookings)
        print(f"\nUnique status values seen: {status_vals}")
        if all(s in ['PENDING','CONFIRMED','ACTIVE','CANCELLED','COMPLETED'] for s in status_vals):
            print("✅ TEST 2 PASSED — status strings are uppercase enum values")
        else:
            print("❌ TEST 2 FAILED — unexpected status values, update STATUS_CONFIG")
elif isinstance(bookings, dict) and "content" in bookings:
    bookings_list = bookings["content"]
    if len(bookings_list) == 0:
        print("\n⚠️  Empty list — new user has no bookings. Status field cannot be verified yet.")
        print("    Create a booking first, then re-run this script.")
    else:
        for b in bookings_list:
            print(f"\nBooking ID: {b.get('id')} | Status: {b.get('status')}")
        status_vals = set(b.get('status') for b in bookings_list)
        print(f"\nUnique status values seen: {status_vals}")
        if all(s in ['PENDING','CONFIRMED','ACTIVE','CANCELLED','COMPLETED'] for s in status_vals):
            print("✅ TEST 2 PASSED — status strings are uppercase enum values")
        else:
            print("❌ TEST 2 FAILED — unexpected status values, update STATUS_CONFIG")
else:
    print("❌ Unexpected response shape:", bookings)

print("\n=== TEST 3: Admin stats endpoint ===")
admin_login = post("/api/auth/admin/login", {
    "email": "admin@gorentals.com", "password": "admin123"
})
admin_token = admin_login.get("accessToken")
print(f"Admin token: {'YES' if admin_token else 'NO — ' + str(admin_login)}")

if admin_token:
    stats = get("/api/admin/dashboard/stats", admin_token)
    print("Admin stats response:", json.dumps(stats, indent=2))
    if "error" in stats:
        print(f"❌ TEST 3 FAILED — endpoint returned {stats['error']}")
    else:
        print("✅ TEST 3 PASSED — admin stats endpoint returned data")
else:
    print("⚠️  No admin account — admin stats cannot be tested yet")
    print("   Create an admin account or check if one exists in the DB")
