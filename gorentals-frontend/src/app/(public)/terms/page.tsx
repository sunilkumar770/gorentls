import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — GoRentals',
  description: 'Read the GoRentals Terms of Service governing your use of our peer-to-peer rental marketplace.',
};

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using GoRentals, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.',
  },
  {
    title: '2. Description of Service',
    body: 'GoRentals is a peer-to-peer rental marketplace that connects owners of equipment and goods with renters. We are not a party to the rental transaction itself — we provide the platform and escrow services only.',
  },
  {
    title: '3. User Accounts',
    body: 'You must be at least 18 years old to create an account. You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account.',
  },
  {
    title: '4. Owner Obligations',
    body: 'Owners are responsible for ensuring their listings are accurate, items are in the described condition, and items are available for the agreed rental period. Owners must respond to booking requests within 24 hours.',
  },
  {
    title: '5. Renter Obligations',
    body: 'Renters must treat rented items with care, return items on time and in the same condition received, and pay all fees promptly. Damage beyond normal wear and tear will be deducted from the security deposit.',
  },
  {
    title: '6. Payments & Refunds',
    body: 'Payments are processed via Razorpay. Refunds for cancelled bookings are processed within 5–7 business days. Platform fees are non-refundable once a booking is confirmed by the owner.',
  },
  {
    title: '7. Prohibited Content',
    body: 'You may not list or rent illegal items, hazardous materials, or items you do not own or have the right to rent. Violations will result in immediate account termination.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'GoRentals is not liable for any indirect, incidental, or consequential damages arising from the use of our platform. Our liability is limited to the total fees paid by you in the 12 months preceding the claim.',
  },
  {
    title: '9. Governing Law',
    body: 'These terms are governed by the laws of India. Any disputes will be resolved in the courts of Hyderabad, Telangana.',
  },
  {
    title: '10. Contact',
    body: 'For questions about these Terms, contact legal@gorentals.in.',
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] pt-10 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* Header */}
        <div className="mb-12 pb-8 border-b border-[var(--border)]">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--primary)] mb-3">Legal</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-[var(--text)] leading-tight mb-3">
            Terms of <span className="text-[var(--primary)]">Service</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm font-medium">Last updated: April 5, 2026</p>
        </div>

        {/* Content card */}
        <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] border border-[var(--border)] shadow-card p-8 md:p-10 space-y-8">
          {SECTIONS.map(section => (
            <div key={section.title} className="pb-8 border-b border-[var(--border)] last:border-0 last:pb-0">
              <h2 className="text-base font-display font-bold text-[var(--text)] mb-2">{section.title}</h2>
              <p className="text-[var(--text-muted)] leading-relaxed text-sm">{section.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-between text-sm">
          <Link href="/privacy" className="text-[var(--primary)] font-semibold hover:underline">
            Read our Privacy Policy →
          </Link>
          <Link href="/help" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
            Need help? Visit Help Center
          </Link>
        </div>
      </div>
    </div>
  );
}
