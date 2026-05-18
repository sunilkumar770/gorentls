import Link from 'next/link'

const CATEGORIES = [
  { slug: 'cameras',   label: 'Cameras',     icon: '📷' },
  { slug: 'laptops',   label: 'Laptops',      icon: '💻' },
  { slug: 'drones',    label: 'Drones',       icon: '🚁' },
  { slug: 'audio',     label: 'Audio',        icon: '🎙️' },
  { slug: 'tools',     label: 'Tools',        icon: '🔧' },
  { slug: 'gaming',    label: 'Gaming',       icon: '🎮' },
  { slug: 'camping',   label: 'Camping',      icon: '⛺' },
  { slug: 'vehicles',  label: 'Vehicles',     icon: '🚗' },
]

export function CategoryGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-text-primary">
          Explore categories
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/search?category=${cat.slug}`}
            className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-surface-base border border-border-subtle hover:border-brand-300 hover:bg-brand-selected/30 hover:text-brand-600 transition-all group text-center shadow-sm hover:shadow-md"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
            <span className="text-xs font-semibold text-text-secondary group-hover:text-brand-600 transition-colors leading-tight">
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
