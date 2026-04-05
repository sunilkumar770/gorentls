'use client';

import { useState } from 'react';
import { ChevronDown, Search, MessageCircle, ShieldCheck, CreditCard, Package } from 'lucide-react';

const FAQ_SECTIONS = [
  {
    icon: Package,
    title: 'How It Works',
    color: '#f97316',
    faqs: [
      { q: 'What is GoRentals?', a: 'GoRentals is a curated peer-to-peer rental marketplace where you can rent professional-grade gear, equipment, and rare artifacts from verified owners near you.' },
      { q: 'How do I rent an item?', a: 'Browse the archive, select your item, choose your rental dates, and click "Request Artifact." The owner will confirm your booking within 24 hours.' },
      { q: 'How do I list my items?', a: 'Sign up or log in, upgrade to an Owner account, and use the "Add Artifact" button on your dashboard to list items for rent.' },
      { q: 'How long can I rent for?', a: 'Rental durations are flexible — from 1 day to several months, depending on what the owner allows.' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Payments & Pricing',
    color: '#3b82f6',
    faqs: [
      { q: 'How does payment work?', a: 'We use Razorpay for secure payments. You pay the rental cost + platform fee upfront, and the security deposit is held in escrow until you return the item.' },
      { q: 'What is the platform fee?', a: 'GoRentals charges a 10% platform fee on the total rental cost. This covers our escrow protection and 24/7 support.' },
      { q: 'When do I get the security deposit back?', a: 'Your security deposit is released within 48 hours after the owner confirms the item was returned in good condition.' },
      { q: 'Can I cancel a booking?', a: 'Yes — you can cancel a pending booking from your dashboard before the owner confirms it. Refund policies may vary for confirmed bookings.' },
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Safety & Trust',
    color: '#10b981',
    faqs: [
      { q: 'Are owners verified?', a: 'All owners complete a verification process including identity and business checks before they can list items.' },
      { q: 'What if an item is damaged?', a: 'All rentals are covered under the GoRentals Protection Standard. Security deposits are held in escrow to cover any damage claims.' },
      { q: 'What if I have a dispute?', a: 'Contact our support team through the Help Center and we will mediate the dispute within 3 business days.' },
    ],
  },
  {
    icon: MessageCircle,
    title: 'Account & Support',
    color: '#8b5cf6',
    faqs: [
      { q: 'How do I become an owner?', a: 'From your dashboard, click "Become an Owner" and complete the registration form with your business details.' },
      { q: 'How do I contact support?', a: 'Email us at support@gorentals.in or use the chat widget on any page. We respond within 4 hours during business hours.' },
      { q: 'Is my data secure?', a: 'Yes. We use industry-standard encryption and never store payment card details. Read our Privacy Policy for full details.' },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#251913]/5 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center py-5 text-left gap-6"
      >
        <span className="font-bold text-[#251913] text-base leading-snug">{q}</span>
        <ChevronDown className={`w-4 h-4 text-[#f97316] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="pb-5 text-[#584237] leading-relaxed font-medium">{a}</p>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [search, setSearch] = useState('');

  const filtered = FAQ_SECTIONS.map(s => ({
    ...s,
    faqs: s.faqs.filter(f =>
      !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(s => s.faqs.length > 0);

  return (
    <div className="min-h-screen bg-[#fff8f6] pt-12 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* Header */}
        <div className="mb-16 text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f97316] mb-3">Support</p>
          <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter text-[#251913] leading-[0.85] mb-6">
            Help<span className="text-[#f97316]"> Center.</span>
          </h1>
          <p className="text-xl text-[#8c7164] font-medium max-w-lg mx-auto mb-10">
            Everything you need to know about renting and listing on GoRentals.
          </p>
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7164]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search help articles..."
              className="w-full pl-12 pr-5 py-4 bg-white rounded-[1rem] ring-1 ring-[#f97316]/10 focus:ring-[#f97316] outline-none text-[#251913] font-bold placeholder-[#8c7164]/40 transition-all shadow-ambient"
            />
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {filtered.map(section => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="bg-white rounded-[2rem] p-8 shadow-ambient ring-1 ring-[#f97316]/5">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#251913]/5">
                  <div className="w-12 h-12 rounded-[0.875rem] flex items-center justify-center" style={{ backgroundColor: `${section.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: section.color }} />
                  </div>
                  <h2 className="text-xl font-display font-black text-[#251913]">{section.title}</h2>
                </div>
                <div>
                  {section.faqs.map(faq => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded-[2.5rem] p-12 text-white text-center">
          <h2 className="text-3xl font-display font-black mb-3">Still have questions?</h2>
          <p className="text-white/80 font-medium mb-8">Our team is here to help, 7 days a week.</p>
          <a href="mailto:support@gorentals.in" className="inline-block px-10 py-4 bg-white text-[#f97316] rounded-full font-display font-black text-lg hover:-translate-y-1 transition-transform shadow-lg">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
