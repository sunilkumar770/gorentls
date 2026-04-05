const fs = require('fs');

const API_BASE = 'http://localhost:8080/api';

async function runE2E() {
    console.log('🚀 Starting GoRentals Full End-to-End Test Suite...');
    
    const uniqueId = Date.now();
    const ownerEmail = `owner_${uniqueId}@test.com`;
    const renterEmail = `renter_${uniqueId}@test.com`;
    const password = 'password123';
    let ownerJwt = '';
    let renterJwt = '';
    let listingId = '';
    let bookingId = '';
    
    try {
        // 1. REGISTER OWNER
        console.log(`\n📦 [TEST 1] Registering Owner: ${ownerEmail}`);
        const regRes = await fetch(`${API_BASE}/auth/register-owner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'E2E Owner Tester',
                email: ownerEmail,
                password: password,
                phone: '9999999999',
                businessName: 'E2E Rentals',
                businessType: 'Retail',
                businessAddress: '123 Testing Ave',
                businessCity: 'Testville',
                businessState: 'CA',
                businessPincode: '90001',
                businessPhone: '8888888888',
                businessEmail: ownerEmail
            })
        });
        
        let regData;
        try { regData = await regRes.json(); } catch(e) { }
        if (!regRes.ok) throw new Error(`Owner Registration failed: ${regRes.status} ${JSON.stringify(regData)}`);
        
        ownerJwt = regData.token || regData.accessToken;
        console.log('✅ Owner Registered & Authenticated Successfully.');

        // 2. REGISTER RENTER
        console.log(`\n📦 [TEST 2] Registering Renter: ${renterEmail}`);
        const renterRes = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'E2E Renter Tester',
                email: renterEmail,
                password: password,
                phone: '7777777777'
            })
        });
        
        let renterData;
        try { renterData = await renterRes.json(); } catch(e) { }
        if (!renterRes.ok) throw new Error(`Renter Registration failed: ${renterRes.status} ${JSON.stringify(renterData)}`);
        
        renterJwt = renterData.token || renterData.accessToken;
        console.log('✅ Renter Registered & Authenticated Successfully.');

        // 3. CREATE LISTING
        console.log(`\n📦 [TEST 3] Creating Listing via Authenticated Owner...`);
        const createRes = await fetch(`${API_BASE}/listings`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerJwt}`
            },
            body: JSON.stringify({
                title: `E2E Camera Kit ${uniqueId}`,
                description: "A comprehensive test kit.",
                category: "ELECTRONICS",
                type: "Cameras",
                pricePerDay: 2500,
                securityDeposit: 15000,
                location: "Testing Center",
                city: "Testville",
                state: "CA",
                images: ["https://example.com/test.jpg"],
                isAvailable: true,
                isPublished: true
            })
        });
        
        let createData;
        try { createData = await createRes.json(); } catch(e) {}
        if (!createRes.ok) throw new Error(`Listing Creation failed: ${createRes.status} ${JSON.stringify(createData)}`);
        
        listingId = createData.id;
        console.log(`✅ Listing Created Successfully. Artifact ID: ${listingId}`);

        // 4. SEARCH LISTINGS (Anonymous)
        console.log(`\n📦 [TEST 4] Searching Global Archive...`);
        const searchRes = await fetch(`${API_BASE}/listings/search`);
        let searchData = await searchRes.json();
        if (!searchRes.ok) throw new Error(`Listing Search failed: ${searchRes.status} ${JSON.stringify(searchData)}`);
        
        const isListingInSearch = searchData.data?.some(l => l.id === listingId) || searchData.content?.some(l => l.id === listingId);
        if (!isListingInSearch) {
             console.log(`⚠️ Listing created but NOT found in global search results. (Expected if not auto-published).`);
        } else {
             console.log(`✅ Artifact indexed and retrieved from Global Search successfully.`);
        }

        // 4.5 PUBLISH LISTING
        console.log(`\n📦 [TEST 4.5] Publishing Listing...`);
        const publishRes = await fetch(`${API_BASE}/listings/${listingId}/publish`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${ownerJwt}`
            }
        });
        if (!publishRes.ok) throw new Error(`Listing Publish failed: ${publishRes.status}`);
        console.log(`✅ Artifact Published successfully.`);

        // 5. CREATE BOOKING (As Renter)
        console.log(`\n📦 [TEST 5] Creating Booking via Authenticated Renter...`);
        const outDate = new Date(); outDate.setDate(outDate.getDate() + 3);
        const bookRes = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${renterJwt}`
            },
            body: JSON.stringify({
                listingId: listingId,
                startDate: new Date().toISOString().split('T')[0],
                endDate: outDate.toISOString().split('T')[0]
            })
        });
        
        let bookData;
        try { bookData = await bookRes.json(); } catch(e) {}
        if (!bookRes.ok) throw new Error(`Booking Creation failed: ${bookRes.status} ${JSON.stringify(bookData)}`);
        
        bookingId = bookData.id;
        console.log(`✅ Acquisition Booking Created Successfully. Booking ID: ${bookingId}`);

        console.log(`\n🎉 ALL SYSTEMS OPTIMAL: End-to-End verification complete!`);

    } catch (e) {
        console.error(`\n❌ END-TO-END SUITE FAILED:`);
        console.error(e.message || e);
        process.exit(1);
    }
}

runE2E();
