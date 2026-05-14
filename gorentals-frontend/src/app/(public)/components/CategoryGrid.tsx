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
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Explore categories
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/search?category=${cat.slug}`}
            className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group text-center shadow-sm hover:shadow-md"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

