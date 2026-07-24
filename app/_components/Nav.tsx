'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// 👉 The desktop sidebar tabs. Adding a tab? Add ONE line here, add the SAME tab
//    to BottomNav.tsx (so it shows on phones too), and create app/<name>/page.tsx.
//    See docs/add-a-tab-prompt.md for the copy-paste prompt that does all three.
export const TABS = [
  { href: '/', label: 'Dashboard' },
  { href: '/cash-in', label: 'Cash In' },
  { href: '/cash-out', label: 'Cash Out' },
  { href: '/leads', label: 'Leads' },
  { href: '/customers', label: 'Customers' },
  { href: '/content', label: 'Content' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/approvals', label: 'Approvals' },
  { href: '/employees', label: 'AI Employees' },
  { href: '/vault', label: 'Vault' },
]

export default function Nav() {
  const path = usePathname()
  return (
    <nav className="nav">
      {TABS.map(t => (
        <Link key={t.href} href={t.href} className={path === t.href ? 'active' : ''}>
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
