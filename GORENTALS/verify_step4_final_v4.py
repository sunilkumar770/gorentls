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
        body = e.read().decode()
        return {"error": e.code, "body": body}
    except Exception as e:
        return {"error": "EXCEPTION", "body": str(e)}

def get(url, token):
    req = urllib.request.Request(f"{BASE}{url}",
                                  headers={"Authorization": f"Bearer {token}"})
    try:
        res = urllib.request.urlopen(req)
        return json.loads(res.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return {"error": e.code, "body": body}
    except Exception as e:
        return {"error": "EXCEPTION", "body": str(e)}

uid = str(uuid.uuid4())[:8]
phone_r = str(uuid.uuid4().int)[:10]
phone_o = str(uuid.uuid4().int)[:10]
phone_a = str(uuid.uuid4().int)[:10]

r_email, o_email, a_email = f"r{uid}@t.co", f"o{uid}@t.co", f"a{uid}@t.co"

print(f"--- VERIFICATION [ID: {uid}] ---")

# Step 1: Register Renter
print("Registering Renter...")
r_reg = post("/api/auth/register", {"fullName":"Renter","email":r_email,"password":"password123","phone":phone_r,"userType":"RENTER"})
r_token = r_reg.get("accessToken")
if not r_token:
    print(f"Renter Reg Fail: {r_reg}")
    sys.exit(1)

# Step 2: Register Owner
print("Registering Owner...")
o_reg = post("/api/auth/register-owner", {
    "fullName":"Owner","email":o_email,"password":"password123","phone":phone_o,
    "businessName":"Biz","businessType":"T","businessAddress":"A","businessCity":"C","businessState":"S",
    "businessPincode":"1","businessPhone":phone_o,"businessEmail":o_email
})
o_token = o_reg.get("accessToken")
if not o_token:
    print(f"Owner Reg Fail: {o_reg}")
    sys.exit(1)

# Step 3: Register Admin
print("Registering Admin...")
a_reg = post("/api/auth/register", {"fullName":"Admin","email":a_email,"password":"password123","phone":phone_a,"userType":"ADMIN"})
a_token = a_reg.get("accessToken")
if not a_token:
    print(f"Admin Reg Fail: {a_reg}")
    # Note: If admin login fails because ADMIN is not in admin_users, we might handle it.
    # But for now, standard register should return a token.
    sys.exit(1)

# Step 4: Create Listing & Booking
print("Creating Listing...")
listing = post("/api/listings", {
    "title":"Cam","description":"D","pricePerDay":10.0,"securityDeposit":10.0,"category":"ELECTRONICS","condition":"NEW","images":["h"],"location":"L"
}, o_token)
l_id = listing.get("id")

print("Creating Booking...")
booking = post("/api/bookings", {
    "listingId":l_id,"startDate":"2026-01-01","endDate":"2026-01-02","totalDays":1,"rentalAmount":10.0,"securityDeposit":10.0,"totalAmount":20.0
}, r_token)

# Step 5: Verify Status
print("\n[TEST 2] Verifying Status...")
my_b = get("/api/bookings/my-bookings", r_token)
content = my_b.get("content", [])
if content:
    status = content[0].get("status")
    print(f"BACKEND STATUS: '{status}'")
    if status == "PENDING":
        print("✅ TEST 2 PASSED")
else:
    print("❌ No bookings found!")

# Step 6: Verify Admin Stats
print("\n[TEST 3] Verifying Admin Stats...")
stats = get("/api/admin/dashboard/stats", a_token)
if "totalUsers" in stats or "totalListings" in stats:
    print("Admin Stats Data:", json.dumps(stats, indent=2))
    print("✅ TEST 3 PASSED")
else:
    print(f"❌ TEST 3 FAILED: {stats}")

print("\n--- DONE ---")
