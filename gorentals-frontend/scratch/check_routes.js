const urls = [
  'http://localhost:3000/dashboard',
  'http://localhost:3000/dashboard/bookings',
  'http://localhost:3000/dashboard/messages',
  'http://localhost:3000/owner',
  'http://localhost:3000/owner/bookings',
  'http://localhost:3000/owner/listings'
];

async function checkUrls() {
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(`${url}: ${res.status}`);
    } catch (e) {
      console.log(`${url}: FAILED (${e.message})`);
    }
  }
}

checkUrls();
