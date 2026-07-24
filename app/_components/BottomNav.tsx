'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// 👉 The phone bottom bar (shown ≤768px). Four thumb-size primary tabs live on the
//    bar; everything else lives in the "More" sheet so the app still fits a thumb.
//    Adding a tab? If it's important put it in PRIMARY (keep it to ~4), otherwise
//    add it to MORE. Keep this in sync with Nav.tsx.
const PRIMARY = [
  { href: '/', label: 'Dashboard', ico: '🏠' },
  { href: '/cash-in', label: 'Cash In', ico: '💰' },
  { href: '/cash-out', label: 'Cash Out', ico: '🧾' },
  { href: '/approvals', label: 'Approvals', ico: '🙋' },
]

const MORE = [
  { href: '/leads', label: 'Leads' },
  { href: '/customers', label: 'Customers' },
  { href: '/content', label: 'Content' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/employees', label: 'AI Employees' },
  { href: '/vault', label: 'Vault' },
]

export default function BottomNav() {
  const path = usePathname()
  const moreActive = MORE.some(t => t.href === path)
  return (
    <nav className="bottomnav">
      {PRIMARY.map(t => (
        <Link key={t.href} href={t.href} className={path === t.href ? 'active' : ''}>
          <span className="ico" aria-hidden="true">{t.ico}</span>
          {t.label}
        </Link>
      ))}
      {/* Pure-CSS "More" sheet — a native <details>, opens with no JavaScript. */}
      <details className="moresheet" open={moreActive || undefined}>
        <summary className={moreActive ? 'active' : ''}>
          <span className="ico" aria-hidden="true">⋯</span>
          More
        </summary>
        <div className="morelinks">
          {MORE.map(t => (
            <Link key={t.href} href={t.href} className={path === t.href ? 'active' : ''}>
              {t.label}
            </Link>
          ))}
        </div>
      </details>
    </nav>
  )
}
