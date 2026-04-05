export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fff8f6] pt-12 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="mb-12">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f97316] mb-3">Legal</p>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-[#251913] leading-[0.85] mb-4">
            Privacy<br /><span className="text-[#f97316]">Policy.</span>
          </h1>
          <p className="text-[#8c7164] font-medium">Last updated: April 5, 2026</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-ambient ring-1 ring-[#f97316]/5 space-y-10 prose prose-stone max-w-none">
          {[
            {
              title: '1. Information We Collect',
              body: `We collect information you provide directly to us, including name, email address, phone number, and payment information when you register for an account, create a listing, or make a booking. We also collect usage data such as pages visited, features used, and device information automatically.`,
            },
            {
              title: '2. How We Use Your Information',
              body: `We use the information we collect to operate and improve our services, process transactions, send transactional and promotional emails, respond to your comments and questions, and comply with legal obligations. We do not sell your personal data to third parties.`,
            },
            {
              title: '3. Data Sharing',
              body: `We share your information with service providers who perform services on our behalf (such as payment processing via Razorpay and image hosting via Cloudinary), other users as necessary to complete a rental transaction, and law enforcement when required by applicable law.`,
            },
            {
              title: '4. Cookies',
              body: `We use cookies and similar tracking technologies to maintain your session and improve your experience. You can disable cookies in your browser settings, but this may affect some features of the platform.`,
            },
            {
              title: '5. Data Security',
              body: `We implement industry-standard security measures including TLS encryption in transit, hashed passwords, and JWT-based authentication. However, no method of transmission over the internet is 100% secure.`,
            },
            {
              title: '6. Your Rights',
              body: `You may access, update, or delete your personal information at any time by contacting us at privacy@gorentals.in. You may also request a copy of the data we hold about you.`,
            },
            {
              title: '7. Contact Us',
              body: `If you have any questions about this Privacy Policy, please contact us at privacy@gorentals.in or write to GoRentals, 123 Archive Street, Mumbai, Maharashtra 400001.`,
            },
          ].map(section => (
            <div key={section.title}>
              <h2 className="text-xl font-display font-black text-[#251913] mb-3">{section.title}</h2>
              <p className="text-[#584237] leading-relaxed font-medium">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
