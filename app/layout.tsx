import './globals.css'
import type { Metadata, Viewport } from 'next'
import Nav from './_components/Nav'
import BottomNav from './_components/BottomNav'
import ConnStatus from './_components/ConnStatus'

export const metadata: Metadata = {
  title: 'CashFlowOS 🤖',
  description: 'Your Money Robot — one AI HQ for the whole business.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'CashFlowOS', statusBarStyle: 'black-translucent' },
}

// theme-color drives the phone status-bar tint when installed to the home screen.
export const viewport: Viewport = {
  themeColor: '#0a0a0b',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app">
          {/* Desktop sidebar — hidden on phones (BottomNav takes over ≤768px). */}
          <aside className="side">
            <div className="brand"><span className="logo" aria-hidden="true">🤖</span> CashFlowOS</div>
            <Nav />
            <p className="hint">One <code>records</code> table behind every tab. Your robots live in <code>agents/</code>.</p>
          </aside>
          <main className="main"><ConnStatus />{children}</main>
        </div>
        {/* Phone bottom bar — hidden on desktop. */}
        <BottomNav />
      </body>
    </html>
  )
}
