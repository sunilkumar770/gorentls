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

# 1. Unique Credentials
uid = str(uuid.uuid4())[:8]
phone_r = str(uuid.uuid4().int)[:10]
phone_o = str(uuid.uuid4().int)[:10]
phone_a = str(uuid.uuid4().int)[:10]

r_email, o_email, a_email = f"r{uid}@t.co", f"o{uid}@t.co", f"a{uid}@t.co"

print(f"--- RUNNING VERIFICATION [ID: {uid}] ---")

# 2. Renter Registration
print("\n[1/7] Registering Renter...")
r_reg = post("/api/auth/register", {"fullName":"Renter","email":r_email,"password":"pass","phone":phone_r,"userType":"RENTER"})
r_login = post("/api/auth/login", {"email":r_email,"password":"pass"})
r_token = r_login.get("accessToken")
print("Renter Login:", "PASS" if r_token else f"FAIL ({r_login.get('body')})")

# 3. Owner Registration
print("\n[2/7] Registering Owner...")
o_reg = post("/api/auth/register-owner", {
    "fullName":"Owner","email":o_email,"password":"pass","phone":phone_o,
    "businessName":"Biz","businessType":"T","businessAddress":"A","businessCity":"C","businessState":"S",
    "businessPincode":"1","businessPhone":phone_o,"businessEmail":o_email
})
o_login = post("/api/auth/login", {"email":o_email,"password":"pass"})
o_token = o_login.get("accessToken")
print("Owner Login:", "PASS" if o_token else f"FAIL ({o_login.get('body')})")

# 4. Admin Registration
print("\n[3/7] Registering Admin...")
a_reg = post("/api/auth/register", {"fullName":"Admin","email":a_email,"password":"pass","phone":phone_a,"userType":"ADMIN"})
a_login = post("/api/auth/login", {"email":a_email,"password":"pass"})
a_token = a_login.get("accessToken")
print("Admin Login:", "PASS" if a_token else f"FAIL ({a_login.get('body')})")

if not (r_token and o_token and a_token):
    print("\nAborting: Missing tokens.")
    sys.exit(1)

# 5. Create Listing
print("\n[4/7] Creating Listing as Owner...")
listing = post("/api/listings", {
    "title":"Cam","description":"D","pricePerDay":10,"securityDeposit":10,"category":"ELECTRONICS","condition":"NEW","images":["h"],"location":"L"
}, o_token)
l_id = listing.get("id")
print(f"Listing ID: {l_id}")

# 6. Create Booking
print("\n[5/7] Creating Booking as Renter...")
booking = post("/api/bookings", {
    "listingId":l_id,"startDate":"2026-01-01","endDate":"2026-01-02","totalDays":1,"rentalAmount":10,"securityDeposit":10,"totalAmount":20
}, r_token)
b_id = booking.get("id")
print(f"Booking ID: {b_id}")

# 7. Verify Status (Test 1 & 2)
print("\n[6/7] Verifying Exact Status Value...")
my_b = get("/api/bookings/my-bookings", r_token)
content = my_b.get("content", [])
if content:
    status = content[0].get("status")
    print(f"STATUS FROM API: '{status}'")
    if status == "PENDING":
        print("✅ TEST 2 PASSED: Status is uppercase 'PENDING'")
    else:
        print(f"❌ TEST 2 FAILED: Got '{status}'")
else:
    print("❌ FAIL: Could not find created booking.")

# 8. Verify Admin Stats (Test 3)
print("\n[7/7] Verifying Admin Stats...")
stats = get("/api/admin/dashboard/stats", a_token)
print(f"KEYS: {list(stats.keys())}")
if "totalUsers" in stats or "totalListings" in stats:
    print("✅ TEST 3 PASSED: Admin stats functional")
else:
    print(f"❌ TEST 3 FAILED: {stats}")

print("\n--- VERIFICATION COMPLETE ---")
