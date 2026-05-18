import requests
import json
import hmac
import hashlib
import time

BASE_URL = "http://localhost:8080/api"
RAZORPAY_SECRET = "pjMGDypSnDKbdfoBbgPDnbvf"

def login(email, password):
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    return resp.json()["accessToken"]

print("Logging in...")
owner_token = login("owner_v7@example.com", "Password123!")
renter_token = login("renter_v7@example.com", "Password123!")

print("1. Creating Listing...")
listing_payload = {
    "title": "API Flow Test Bike",
    "description": "A bike for testing complete flow.",
    "pricePerDay": 200.0,
    "securityDeposit": 500.0,
    "location": "Test Area",
    "city": "Bangalore",
    "category": "BIKES",
    "condition": "EXCELLENT",
    "rules": "No stunts",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "type": "DAILY"
}
headers_owner = {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}
resp = requests.post(f"{BASE_URL}/listings", json=listing_payload, headers=headers_owner)
if resp.status_code != 200 and resp.status_code != 201:
    print(f"Listing creation failed: {resp.status_code} - {resp.text}")
listing_id = resp.json()["id"]
print(f"Listing created: {listing_id}")

print("2. Publishing Listing...")
requests.patch(f"{BASE_URL}/listings/{listing_id}/publish", headers=headers_owner)

print("3. Creating Booking (Renter)...")
booking_payload = {
    "listingId": listing_id,
    "startDate": "2026-06-01",
    "endDate": "2026-06-03",
    "idempotencyKey": f"test-key-{int(time.time())}"
}
headers_renter = {"Authorization": f"Bearer {renter_token}", "Content-Type": "application/json"}
resp = requests.post(f"{BASE_URL}/bookings", json=booking_payload, headers=headers_renter)
booking = resp.json()
booking_id = booking["id"]
print(f"Booking created: {booking_id}, Status: {booking['status']}, Escrow: {booking['escrowStatus']}")

print("4. Confirming Booking (Owner)...")
resp = requests.post(f"{BASE_URL}/bookings/{booking_id}/confirm", headers=headers_owner)
booking = resp.json()
print(f"Booking confirmed. Status: {booking['status']}")

print("5. Creating Razorpay Order (Renter)...")
order_payload = {
    "bookingId": booking_id,
    "paymentKind": "ADVANCE"
}
resp = requests.post(f"{BASE_URL}/payments/order", json=order_payload, headers=headers_renter)
order = resp.json()
razorpay_order_id = order["id"]
print(f"Order created: {razorpay_order_id}")

print("6. Simulating Razorpay Payment Confirmation...")
# Generate dummy payment ID
razorpay_payment_id = f"pay_{int(time.time())}"
# Generate HMAC SHA256 signature
payload = f"{razorpay_order_id}|{razorpay_payment_id}"
signature = hmac.new(bytes(RAZORPAY_SECRET, 'utf-8'), msg=bytes(payload, 'utf-8'), digestmod=hashlib.sha256).hexdigest()

confirm_payload = {
    "bookingId": booking_id,
    "paymentKind": "ADVANCE",
    "razorpayOrderId": razorpay_order_id,
    "razorpayPaymentId": razorpay_payment_id,
    "razorpaySignature": signature
}
resp = requests.post(f"{BASE_URL}/payments/confirm", json=confirm_payload, headers=headers_renter)
print(f"Payment Confirm Response: {resp.status_code} - {resp.text}")

print("7. Fetching Escrow Summary...")
resp = requests.get(f"{BASE_URL}/payments/escrow/{booking_id}", headers=headers_renter)
print(f"Escrow Summary: {resp.json()}")
