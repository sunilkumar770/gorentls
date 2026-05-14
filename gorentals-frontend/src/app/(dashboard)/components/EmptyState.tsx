// src/app/(dashboard)/components/EmptyState.tsx
import Link from 'next/link'

interface Props {
  icon: string
  title: string
  description: string
  cta?: { label: string; href: string }
}

export function EmptyState({ icon, title, description, cta }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center bg-white/50 dark:bg-slate-900/50">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">{description}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {cta.label}
        </Link>
      )}
    </div>
  )
}

