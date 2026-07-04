import { NavLink, Outlet } from 'react-router-dom'
import { useCoach } from '../contexts/CoachContext'
import { supabase } from '../lib/supabase'

export default function AppLayout() {
  const { coach, gym } = useCoach()

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded px-3 py-2 text-sm transition-colors ${
      isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
    }`

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="flex w-48 flex-shrink-0 flex-col bg-slate-900 px-3 py-4">
        <div className="mb-1 text-sm font-extrabold text-white">ElevationRx</div>
        {gym && (
          <span className="mb-5 w-fit rounded bg-indigo-950 px-2 py-0.5 text-xs text-indigo-400">
            🏟 {gym.name}
          </span>
        )}
        <nav className="flex flex-col gap-1">
          <NavLink to="/dashboard" className={navLinkClass}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/athletes" className={navLinkClass}>
            🏃 Athletes
          </NavLink>
        </nav>
        <div className="mt-auto border-t border-slate-700 pt-3">
          <p className="text-xs text-slate-300">{coach?.full_name}</p>
          <button
            onClick={handleSignOut}
            className="mt-1 text-xs text-slate-500 hover:text-slate-300"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
