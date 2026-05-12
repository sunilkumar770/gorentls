-- GoRentals Permanent Purge Script
-- Order: payments -> bookings -> blocked_dates -> listings

-- 1. Delete Payments associated with bookings for smoke test listings
DELETE FROM payments 
WHERE booking_id IN (
    SELECT b.id 
    FROM bookings b
    JOIN listings l ON b.listing_id = l.id
    WHERE l.name ILIKE '%smoke%' 
       OR l.name ILIKE '%test%'
);

-- 2. Delete Bookings associated with smoke test listings
DELETE FROM bookings 
WHERE listing_id IN (
    SELECT id 
    FROM listings 
    WHERE name ILIKE '%smoke%' 
       OR name ILIKE '%test%'
);

-- 3. Delete Blocked Dates associated with smoke test listings
DELETE FROM blocked_dates 
WHERE listing_id IN (
    SELECT id 
    FROM listings 
    WHERE name ILIKE '%smoke%' 
       OR name ILIKE '%test%'
);

-- 4. Delete Notifications (if any)
-- Assuming notifications table exists and might link to listings or bookings
-- DELETE FROM notifications WHERE listing_id IN (...)

-- 5. Delete the Listings themselves
DELETE FROM listings 
WHERE name ILIKE '%smoke%' 
   OR name ILIKE '%test%';

-- 6. Clean up Owners who only had smoke/test names
-- (Be careful not to delete real users who might have test listings)
-- DELETE FROM users WHERE name ILIKE '%smoke%' OR name ILIKE '%test owner%';

-- Verification
SELECT COUNT(*) FROM listings;
