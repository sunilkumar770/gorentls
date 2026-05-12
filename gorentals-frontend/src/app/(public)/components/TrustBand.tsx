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
    <section className="bg-slate-50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Built for peace of mind
          </h2>
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
            GoRentals is the most secure peer-to-peer rental marketplace in India.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {TRUST_FEATURES.map((f) => (
            <div
              key={f.title}
              className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm hover:shadow-md"
            >
              <div className="text-4xl group-hover:scale-110 transition-transform duration-300 inline-block">{f.icon}</div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                {f.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
