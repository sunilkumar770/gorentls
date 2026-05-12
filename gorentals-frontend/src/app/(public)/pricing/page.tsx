'use client'

import Link from 'next/link'
import { useState } from 'react'

const TIERS = [
  {
    name: 'Free to List',
    price: '₹0',
    period: 'to start',
    description: 'No upfront cost. List as many items as you want.',
    features: [
      'Unlimited listings',
      'KYC-verified profile badge',
      'Direct messaging with renters',
      'GoRentals booking protection',
      'Basic listing analytics',
    ],
    cta: 'Start listing free',
    href: '/signup?role=OWNER',
    highlight: false,
  },
  {
    name: 'Per Transaction',
    price: '5%',
    period: 'platform fee per booking',
    description: 'We earn only when you earn. No monthly subscription.',
    features: [
      'Everything in Free',
      'Escrow-protected payments',
      'Automated payout after return',
      'Dispute resolution support',
      'Priority listing placement',
    ],
    cta: 'See payout calculator',
    href: '#calculator',
    highlight: true,
  },
]

const TIMELINE = [
  { step: '1', label: 'Renter books', desc: 'Renter pays full amount + deposit. We hold it securely.' },
  { step: '2', label: 'You confirm', desc: 'Accept the booking request within 24 hours.' },
  { step: '3', label: 'Rental happens', desc: 'Renter picks up item. Rental period begins.' },
  { step: '4', label: 'Return confirmed', desc: 'Both parties confirm the return in the app.' },
  { step: '5', label: 'You get paid', desc: 'Payout hits your bank account within 2–3 business days.' },
]

const FAQS = [
  {
    q: 'When do I get paid?',
    a: 'Payouts are initiated within 24 hours of return confirmation and reach your bank in 2–3 business days via NEFT/IMPS.',
  },
  {
    q: 'What if the renter damages my item?',
    a: 'The security deposit is held until both parties confirm the return. If damage is reported, our dispute team reviews photo evidence and determines deposit release.',
  },
  {
    q: 'What is the platform fee?',
    a: 'We charge 5% of the rental amount per booking. There are no listing fees, subscription fees, or hidden charges.',
  },
  {
    q: 'Can I set my own prices?',
    a: 'Yes. You set the daily rate, security deposit amount, and minimum rental duration. GoRentals does not override your pricing.',
  },
  {
    q: 'What if a renter cancels?',
    a: 'Cancellation policies are set per listing. If a renter cancels before your defined cutoff, they receive a full refund. After the cutoff, you receive a partial payout as compensation.',
  },
  {
    q: 'Is KYC required?',
    a: 'Yes. All owners complete KYC verification before their listings go live. This protects renters and increases your booking rate — renters actively filter for verified owners.',
  },
]

function PayoutCalculator() {
  const [dailyRate, setDailyRate] = useState(500)
  const [daysPerMonth, setDaysPerMonth] = useState(10)

  const grossEarnings = dailyRate * daysPerMonth
  const platformFee = Math.round(grossEarnings * 0.05)
  const netEarnings = grossEarnings - platformFee

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-xl mx-auto shadow-xl">
      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Your daily rate
            </label>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-display">
              ₹{dailyRate.toLocaleString('en-IN')}
            </span>
          </div>
          <input
            type="range" min={100} max={10000} step={100}
            value={dailyRate}
            onChange={e => setDailyRate(Number(e.target.value))}
            className="w-full accent-indigo-600 h-1.5 rounded-full cursor-pointer appearance-none bg-slate-200 dark:bg-slate-700"
          />
          <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-slate-400 mt-2">
            <span>₹100</span><span>₹10,000</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Rental days per month
            </label>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-display">
              {daysPerMonth} days
            </span>
          </div>
          <input
            type="range" min={1} max={30} step={1}
            value={daysPerMonth}
            onChange={e => setDaysPerMonth(Number(e.target.value))}
            className="w-full accent-indigo-600 h-1.5 rounded-full cursor-pointer appearance-none bg-slate-200 dark:bg-slate-700"
          />
          <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-slate-400 mt-2">
            <span>1 day</span><span>30 days</span>
          </div>
        </div>

        {/* Earnings breakdown */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>Gross rental income</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              ₹{grossEarnings.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>Platform fee (5%)</span>
            <span className="font-semibold text-red-500">−₹{platformFee.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-white border-t border-slate-100 dark:border-slate-800 pt-4 mt-2 font-display">
            <span>You receive</span>
            <span className="text-emerald-600 dark:text-emerald-400">₹{netEarnings.toLocaleString('en-IN')}/mo</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center italic">
          * Security deposits are returned to renters and not included in your earnings.
        </p>
      </div>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-800">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-bold text-slate-900 dark:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors font-display"
      >
        <span>{question}</span>
        <span className={`text-indigo-500 transition-transform duration-300 shrink-0 ml-4 text-xl ${open ? 'rotate-45' : 'rotate-0'}`}>
          +
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
          {answer}
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-indigo-500/10 selection:text-indigo-500">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full mb-8 border border-indigo-100 dark:border-indigo-900/50">
          Simple, honest pricing
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 dark:text-white tracking-tight mb-6 font-display leading-[1.1]">
          Earn from your gear.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
            We only earn when you do.
          </span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          No monthly fees. No listing costs. A simple 5% platform fee — only on completed bookings.
        </p>
      </section>

      {/* Pricing tiers */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-3xl border p-8 sm:p-10 relative transition-all duration-300 hover:scale-[1.01] flex flex-col ${
                tier.highlight
                  ? 'border-transparent bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 text-white shadow-2xl shadow-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur-md shadow-lg'
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-[10px] uppercase tracking-wider font-black px-4 py-1.5 rounded-full shadow-lg">
                  How we earn
                </span>
              )}
              <div className="mb-8">
                <p className={`text-xs uppercase tracking-widest font-bold mb-2 ${tier.highlight ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
                  {tier.name}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-5xl font-bold font-display ${tier.highlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {tier.price}
                  </span>
                  <span className={`text-sm font-medium ${tier.highlight ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
                    {tier.period}
                  </span>
                </div>
              </div>
              <p className={`text-sm mb-10 leading-relaxed ${tier.highlight ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                {tier.description}
              </p>
              <ul className="space-y-4 mb-10 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className={`flex items-start gap-3 text-sm ${tier.highlight ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    <span className={`mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-indigo-300' : 'text-indigo-500'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={tier.href}
                className={`block text-center font-bold py-4 rounded-2xl transition-all duration-200 text-sm active:scale-[0.98] ${
                  tier.highlight
                    ? 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Payout calculator */}
      <section id="calculator" className="bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 font-display">
              Estimate your earnings
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
              See what you'd earn based on your daily rate and rental frequency.
            </p>
          </div>
          <PayoutCalculator />
        </div>
      </section>

      {/* Payout timeline */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 font-display">
            Simple payout flow
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Your money is protected and trackable at every step.
          </p>
        </div>
        <div className="relative max-w-2xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-[23px] top-0 bottom-0 w-[2px] bg-indigo-100 dark:bg-indigo-900/30 hidden sm:block" />
          <div className="space-y-12">
            {TIMELINE.map((item) => (
              <div key={item.step} className="flex items-start gap-8 group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg shrink-0 relative z-10 border border-indigo-100 dark:border-indigo-900/50 transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 font-display">
                  {item.step}
                </div>
                <div className="pt-2">
                  <p className="font-bold text-slate-900 dark:text-white text-lg font-display mb-1">{item.label}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust band */}
        <div className="mt-20 rounded-[2rem] bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/50 p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8 shadow-xl shadow-emerald-500/5">
          <div className="text-5xl shrink-0 drop-shadow-lg">🛡️</div>
          <div className="text-center sm:text-left">
            <p className="font-bold text-emerald-900 dark:text-emerald-400 text-xl font-display mb-2">
              End-to-end payment protection
            </p>
            <p className="text-sm text-emerald-800/70 dark:text-emerald-400/70 leading-relaxed max-w-xl">
              Rental payments are held securely by GoRentals until the return is confirmed by both parties. 
              Your gear is never rented without verified payment, and our 5% fee is only deducted from your net payout.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 text-center font-display">
            Common questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="bg-indigo-600 dark:bg-indigo-600 rounded-[3rem] p-12 sm:p-20 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/40">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-700 rounded-full blur-3xl opacity-50" />
          
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 font-display">
              Ready to start earning?
            </h2>
            <p className="text-indigo-100 mb-10 max-w-md mx-auto text-lg">
              Join thousands of owners on GoRentals and turn your unused gear into regular income.
            </p>
            <Link
              href="/signup?role=OWNER"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-10 py-5 rounded-2xl transition-all duration-200 active:scale-95 shadow-xl shadow-black/10"
            >
              Start listing free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
