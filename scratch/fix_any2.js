const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../gorentals-frontend/src');

const files = [
  'hooks/useBookings.ts',
  'contexts/AuthContext.tsx',
  'components/profile/KYCModal.tsx',
  'components/bookings/BookingActionBar.tsx',
  'app/(public)/item/[id]/page.tsx',
  'app/(protected)/profile/kyc/page.tsx',
  'app/(protected)/profile/page.tsx',
  'app/(protected)/owner/listings/[id]/edit/page.tsx',
  'app/(protected)/owner/dashboard/page.tsx',
  'app/(protected)/my-bookings/page.tsx',
  'app/(protected)/checkout/[id]/page.tsx',
  'app/(public)/search/page.tsx',
  'components/admin/KYCManagement.tsx',
  'components/listing/CalendarManager.tsx',
  'components/listing/ListingGrid.tsx',
  'components/payment/RazorpayCheckout.tsx',
  'lib/apiError.ts'
];

files.forEach(rel => {
  const file = path.join(srcDir, rel);
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/catch\s*\(\s*(err|error)\s*:\s*unknown\s*\)\s*\{\s*const\s+_err\s*=\s*(err|error)\s*as\s*any;/g, 'catch ($1: unknown) { const _err = $1 as { response?: { data?: { message?: string; error?: string } }; message?: string };');
  content = content.replace(/catch\s*\(\s*(err|error)\s*:\s*any\s*\)\s*\{/g, 'catch ($1: unknown) { const _err = $1 as { response?: { data?: { message?: string; error?: string } }; message?: string };');
  content = content.replace(/(err|error)\?\./g, '_err?.');
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});

// Fix specific files with stray any
const apiErrorFile = path.join(srcDir, 'lib/apiError.ts');
if (fs.existsSync(apiErrorFile)) {
  let content = fs.readFileSync(apiErrorFile, 'utf8');
  content = content.replace(/error:\s*any/g, 'error: unknown');
  content = content.replace(/error\./g, '(error as {message?:string;response?:any}).');
  fs.writeFileSync(apiErrorFile, content);
}
