import { NavLink, Outlet } from 'react-router-dom'
import { useCoach } from '../contexts/CoachContext'
import { supabase } from '../lib/supabase'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-2 text-sm transition-colors ${
    isActive ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:text-zinc-200'
  }`

export default function AppLayout() {
  const { coach, gym } = useCoach()

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('[AppLayout] sign-out failed', error)
  }

  return (
    <div className="flex h-screen bg-surface">
      <aside className="flex w-48 flex-shrink-0 flex-col bg-sidebar px-3 py-4">
        <div className="mb-1 text-sm font-extrabold text-white">ElevationRx</div>
        {gym && (
          <span className="mb-5 w-fit rounded bg-zinc-800 px-2 py-0.5 text-xs text-orange-400">
            <span aria-hidden="true">🏟</span> {gym.name}
          </span>
        )}
        <nav aria-label="Main navigation" className="flex flex-col gap-1">
          <NavLink to="/dashboard" className={navLinkClass}>
            <span aria-hidden="true">📊</span> Dashboard
          </NavLink>
          <NavLink to="/athletes" className={navLinkClass}>
            <span aria-hidden="true">🏃</span> Athletes
          </NavLink>
          {coach?.role === 'admin' && (
            <NavLink to="/settings" className={navLinkClass}>
              <span aria-hidden="true">⚙</span> Settings
            </NavLink>
          )}
        </nav>
        <div className="mt-auto border-t border-border pt-3">
          <p className="text-xs text-violet-200">{coach?.full_name}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-1 text-xs text-zinc-500 hover:text-zinc-300"
          >
            Sign out
          </button>
        </div>
      </aside>
      {/* overflow-hidden is intentional: each page manages its own scroll container */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
