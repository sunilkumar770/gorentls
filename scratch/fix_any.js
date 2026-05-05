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
  'app/(protected)/my-bookings/page.tsx'
];

files.forEach(rel => {
  const file = path.join(srcDir, rel);
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/catch\s*\(\s*(err|error)\s*:\s*any\s*\)\s*\{/g, 'catch ($1: unknown) { const _err = $1 as any;');
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});

// For Razorpay
const rzFile = path.join(srcDir, 'components/payment/RazorpayCheckout.tsx');
if (fs.existsSync(rzFile)) {
  let rzContent = fs.readFileSync(rzFile, 'utf8');
  rzContent = rzContent.replace(/handler:\s*async\s*function\s*\(\s*response\s*:\s*any\s*\)/g, 'handler: async function (response: unknown)');
  rzContent = rzContent.replace(/catch\s*\(\s*confirmError\s*:\s*any\s*\)/g, 'catch (confirmError: unknown)');
  rzContent = rzContent.replace(/on\('payment\.failed',\s*function\s*\(\s*response\s*:\s*any\s*\)/g, 'on(\'payment.failed\', function (response: unknown)');
  rzContent = rzContent.replace(/catch\s*\(\s*err\s*:\s*any\s*\)/g, 'catch (err: unknown)');
  fs.writeFileSync(rzFile, rzContent);
  console.log('Fixed', rzFile);
}

// For Analytics
const anFile = path.join(srcDir, 'components/analytics/AnalyticsDashboard.tsx');
if (fs.existsSync(anFile)) {
  let anContent = fs.readFileSync(anFile, 'utf8');
  anContent = anContent.replace(/recentBookings\s*:\s*any\[\];/g, 'recentBookings: Record<string, unknown>[];');
  anContent = anContent.replace(/revenueChart\s*:\s*any\[\];/g, 'revenueChart: Record<string, unknown>[];');
  fs.writeFileSync(anFile, anContent);
}

const rcFile = path.join(srcDir, 'components/analytics/RevenueChart.tsx');
if (fs.existsSync(rcFile)) {
  let rcContent = fs.readFileSync(rcFile, 'utf8');
  rcContent = rcContent.replace(/formatter=\{\(value:\s*any\)/g, 'formatter={(value: unknown)');
  fs.writeFileSync(rcFile, rcContent);
}

const storesFile = path.join(srcDir, 'app/(public)/stores/page.tsx');
if (fs.existsSync(storesFile)) {
  let stContent = fs.readFileSync(storesFile, 'utf8');
  stContent = stContent.replace(/\(data:\s*any\)/g, '(data: Record<string, unknown> | Record<string, unknown>[])');
  fs.writeFileSync(storesFile, stContent);
}

const supabaseFile = path.join(srcDir, 'lib/supabase.ts');
if (fs.existsSync(supabaseFile)) {
  let suContent = fs.readFileSync(supabaseFile, 'utf8');
  suContent = suContent.replace(/message:\s*any/g, 'message: Record<string, unknown>');
  fs.writeFileSync(supabaseFile, suContent);
}

// For my-bookings page icon: any
const mbFile = path.join(srcDir, 'app/(protected)/my-bookings/page.tsx');
if (fs.existsSync(mbFile)) {
  let mbContent = fs.readFileSync(mbFile, 'utf8');
  mbContent = mbContent.replace(/icon:\s*any;/g, 'icon: React.ElementType;');
  fs.writeFileSync(mbFile, mbContent);
}
