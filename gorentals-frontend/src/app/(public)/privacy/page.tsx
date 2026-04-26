import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — GoRentals',
  description: 'Learn how GoRentals collects, uses, and protects your personal information.',
};

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'We collect information you provide directly to us, including name, email address, phone number, and payment information when you register for an account, create a listing, or make a booking. We also collect usage data such as pages visited, features used, and device information automatically.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'We use the information we collect to operate and improve our services, process transactions, send transactional and promotional emails, respond to your comments and questions, and comply with legal obligations. We do not sell your personal data to third parties.',
  },
  {
    title: '3. Data Sharing',
    body: 'We share your information with service providers who perform services on our behalf (such as payment processing via Razorpay and image hosting via Cloudinary), other users as necessary to complete a rental transaction, and law enforcement when required by applicable law.',
  },
  {
    title: '4. Cookies',
    body: 'We use cookies and similar tracking technologies to maintain your session and improve your experience. You can disable cookies in your browser settings, but this may affect some features of the platform.',
  },
  {
    title: '5. Data Security',
    body: 'We implement industry-standard security measures including TLS encryption in transit, hashed passwords, and JWT-based authentication. However, no method of transmission over the internet is 100% secure.',
  },
  {
    title: '6. Your Rights',
    body: 'You may access, update, or delete your personal information at any time by contacting us at privacy@gorentals.in. You may also request a copy of the data we hold about you.',
  },
  {
    title: '7. Contact Us',
    body: 'If you have any questions about this Privacy Policy, please contact us at privacy@gorentals.in or write to GoRentals, Hyderabad, Telangana, India.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] pt-10 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* Header */}
        <div className="mb-12 pb-8 border-b border-[var(--border)]">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--primary)] mb-3">Legal</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-[var(--text)] leading-tight mb-3">
            Privacy <span className="text-[var(--primary)]">Policy</span>
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
          <Link href="/terms" className="text-[var(--primary)] font-semibold hover:underline">
            Read our Terms of Service →
          </Link>
          <Link href="/help" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
            Need help? Visit Help Center
          </Link>
        </div>
      </div>
    </div>
  );
}
