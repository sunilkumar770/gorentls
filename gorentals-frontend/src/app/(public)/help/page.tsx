'use client';

import { useState } from 'react';
import { ChevronDown, Search, MessageCircle, ShieldCheck, CreditCard, Package, ThumbsUp, ThumbsDown, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const FAQ_SECTIONS = [
  {
    icon: Package,
    title: 'How It Works',
    color: 'var(--primary)',
    bg: 'rgba(1, 105, 111, 0.1)',
    faqs: [
      { q: 'What is GoRentals?', a: 'GoRentals is a peer-to-peer rental marketplace where you can rent professional-grade gear, equipment, and electronics from KYC-verified owners near you in Hyderabad and other major cities.' },
      { q: 'How do I rent an item?', a: 'Browse the directory, select your item, choose your rental dates, and click "Reserve." The owner will confirm your booking within 24 hours.' },
      { q: 'How do I list my items?', a: 'Create an account and select "List Equipment" during signup — or upgrade from your dashboard. Use the "Deploy Asset" button to list items for rent.' },
      { q: 'How long can I rent for?', a: 'Rental durations are flexible — from 1 day to several months, depending on availability set by the owner.' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Payments & Pricing',
    color: 'var(--primary)',
    bg: 'rgba(1, 105, 111, 0.08)',
    faqs: [
      { q: 'How does payment work?', a: 'We use Razorpay for secure payments. You pay the rental cost upfront, and the security deposit is held in escrow until you return the item in good condition.' },
      { q: 'What is the platform fee?', a: 'GoRentals charges a 10% platform fee on the total rental cost. This covers our escrow protection and support services.' },
      { q: 'When do I get the security deposit back?', a: 'Your security deposit is released within 48 hours after the owner confirms the item was returned undamaged.' },
      { q: 'Can I cancel a booking?', a: 'Yes — pending bookings can be cancelled from your dashboard before owner confirmation. Policies may vary for already-confirmed bookings.' },
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Safety & Trust',
    color: 'var(--primary)',
    bg: 'rgba(1, 105, 111, 0.12)',
    faqs: [
      { q: 'Are owners verified?', a: 'Yes. All owners complete KYC (Know Your Customer) identity verification before they can publish any listings.' },
      { q: 'What if an item is damaged?', a: 'All rentals include deposit protection. Security deposits are held in escrow to cover any damage claims assessed by the owner.' },
      { q: 'What if I have a dispute?', a: 'Contact our support team through the Help Center and we will mediate the dispute within 3 business days of receiving all evidence.' },
    ],
  },
  {
    icon: MessageCircle,
    title: 'Account & Support',
    color: 'var(--primary)',
    bg: 'rgba(1, 105, 111, 0.06)',
    faqs: [
      { q: 'How do I become an owner?', a: 'Choose "List Equipment" when signing up, or switch roles from your dashboard settings after completing KYC verification.' },
      { q: 'How do I contact support?', a: 'Email us at support@gorentals.in. We respond within 4 hours during business hours (9am–6pm IST, Monday–Saturday).' },
      { q: 'Is my data secure?', a: 'Yes. We use industry-standard encryption and never store payment card details. See our Privacy Policy for full details.' },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const [helpful, setHelpful] = useState<boolean | null>(null);

  return (
    <div className="border-b border-[var(--border)] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center py-5 text-left gap-6"
      >
        <span className="font-semibold text-[var(--text)] text-sm leading-snug">{q}</span>
        <ChevronDown className={`w-4 h-4 text-[var(--primary)] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pb-5 space-y-4">
          <p className="text-[var(--text-muted)] leading-relaxed text-sm">{a}</p>
          <div className="flex items-center gap-3 text-xs text-[var(--text-faint)]">
            <span>Was this helpful?</span>
            <Button
              variant={helpful === true ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setHelpful(true)}
              className={`h-8 px-3 rounded-full ${helpful === true ? 'bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]' : ''}`}
            >
              <ThumbsUp className="w-3 h-3 mr-1.5" /> Yes
            </Button>
            <Button
              variant={helpful === false ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setHelpful(false)}
              className={`h-8 px-3 rounded-full ${helpful === false ? 'bg-red-50 text-red-600 border-red-100' : ''}`}
            >
              <ThumbsDown className="w-3 h-3 mr-1.5" /> No
            </Button>
          </div>
        </div>
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
    <div className="min-h-screen bg-[var(--bg)] pt-10 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* Header */}
        <div className="mb-14 pb-10 border-b border-[var(--border)] text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--primary)] mb-3">Support</p>
          <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight text-[var(--text)] leading-[0.9] mb-4">
            Help <span className="text-[var(--primary)]">Center</span>
          </h1>
          <p className="text-lg text-[var(--text-muted)] font-medium max-w-lg mx-auto mb-10">
            Everything you need to know about renting and listing on GoRentals.
          </p>
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search help articles..."
              icon={<Search className="w-4 h-4" />}
              className="bg-[var(--bg-card)] shadow-sm"
            />
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-6">
          {filtered.length === 0 ? (
            <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] p-12 text-center border border-[var(--border)]">
              <p className="text-[var(--text-muted)] font-medium">No articles match &ldquo;{search}&rdquo;. Try a different term.</p>
            </div>
          ) : filtered.map(section => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="bg-[var(--bg-card)] rounded-[var(--r-xl)] p-7 shadow-card border border-[var(--border)]">
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-[var(--border)]">
                  <div className="w-11 h-11 rounded-[var(--r-md)] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: section.bg }}>
                    <Icon className="w-5 h-5" style={{ color: section.color }} />
                  </div>
                  <h2 className="text-lg font-display font-bold text-[var(--text)]">{section.title}</h2>
                </div>
                <div>
                  {section.faqs.map(faq => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact Form CTA */}
        <div className="mt-12 bg-[var(--primary)] rounded-[var(--r-xl)] p-10 text-white text-center">
          <h2 className="text-2xl font-display font-bold mb-2">Still have questions?</h2>
          <p className="text-white/80 text-sm mb-7">Our team is here to help, Monday to Saturday, 9am–6pm IST.</p>
          <form className="max-w-md mx-auto space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Support request dispatched!'); }}>
            <Input 
              type="email" 
              placeholder="Your email address" 
              required 
              className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-white"
            />
            <textarea 
              placeholder="How can we help you?" 
              required 
              rows={3}
              className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-[var(--r-md)] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white transition-all text-sm resize-none"
            />
            <Button 
              type="submit" 
              variant="secondary"
              size="md"
              className="w-full bg-white text-[var(--primary)] hover:bg-white/90"
            >
              <Mail className="w-4 h-4 mr-2" /> Send Message
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
