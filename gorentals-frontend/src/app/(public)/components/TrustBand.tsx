const TRUST_FEATURES = [
  {
    icon: '🔐',
    title: 'KYC-Verified Owners',
    desc: 'Every owner completes identity verification before their listings go live on our platform.',
  },
  {
    icon: '🔒',
    title: 'Escrow Protection',
    desc: 'Your payments are held securely in escrow and only released when the rental is confirmed.',
  },
  {
    icon: '⭐',
    title: 'Verified Reviews',
    desc: 'Real feedback from real transactions ensures a high-quality community experience.',
  },
  {
    icon: '💬',
    title: 'Direct Messaging',
    desc: 'Coordinate pickup, delivery, and questions directly with the owner before you book.',
  },
]

export function TrustBand() {
  return (
    <section className="bg-surface-subtle border-y border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-text-primary">
            Built for peace of mind
          </h2>
          <p className="mt-4 text-text-secondary font-medium max-w-2xl mx-auto">
            GoRentals is the most secure peer-to-peer rental marketplace in India.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {TRUST_FEATURES.map((f) => (
            <div
              key={f.title}
              className="group bg-surface-base rounded-[2rem] border border-border-subtle p-8 space-y-4 hover:border-brand-300 transition-all shadow-sm hover:shadow-md"
            >
              <div className="text-4xl group-hover:scale-110 transition-transform duration-300 inline-block">{f.icon}</div>
              <h3 className="font-bold text-text-primary text-lg">
                {f.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
