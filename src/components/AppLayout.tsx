import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCoach } from '../contexts/CoachContext'
import { supabase } from '../lib/supabase'
import { LANGUAGES, type LangCode } from '../i18n'
import i18n from '../i18n'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-2 text-sm transition-colors ${
    isActive ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:text-zinc-200'
  }`

const bottomNavClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-semibold transition-colors ${
    isActive ? 'text-orange-400' : 'text-zinc-500'
  }`

export default function AppLayout() {
  const { coach, gym } = useCoach()
  const { t } = useTranslation()

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('[AppLayout] sign-out failed', error)
  }

  function handleLangChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const lang = e.target.value as LangCode
    i18n.changeLanguage(lang)
    localStorage.setItem('lang', lang)
  }

  return (
    <div className="flex h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="hidden w-48 flex-shrink-0 flex-col bg-sidebar px-3 py-4 md:flex">
        <div className="mb-1 text-sm font-extrabold text-white">ElevationRx</div>
        {gym && (
          <span className="mb-5 w-fit rounded bg-zinc-800 px-2 py-0.5 text-xs text-orange-400">
            <span aria-hidden="true">🏟</span> {gym.name}
          </span>
        )}
        <nav aria-label="Main navigation" className="flex flex-col gap-1">
          <NavLink to="/dashboard" className={navLinkClass}>
            <span aria-hidden="true">📊</span> {t('nav.dashboard')}
          </NavLink>
          <NavLink to="/athletes" className={navLinkClass}>
            <span aria-hidden="true">🏃</span> {t('nav.athletes')}
          </NavLink>
          {coach?.role === 'admin' && (
            <NavLink to="/settings" className={navLinkClass}>
              <span aria-hidden="true">⚙</span> {t('nav.settings')}
            </NavLink>
          )}
        </nav>
        <div className="mt-auto border-t border-border pt-3">
          <select
            value={i18n.language}
            onChange={handleLangChange}
            aria-label={t('settings.language')}
            className="mb-2 w-full rounded border border-border bg-transparent px-1 py-1 text-xs text-zinc-400 outline-none focus:border-orange-500"
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <p className="text-xs text-violet-200">{coach?.full_name}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-1 text-xs text-zinc-500 hover:text-zinc-300"
          >
            {t('nav.signOut')}
          </button>
        </div>
      </aside>

      {/* Main content — pb-16 leaves room for mobile bottom nav */}
      <main className="flex-1 overflow-hidden pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-sidebar md:hidden"
      >
        <NavLink to="/dashboard" className={bottomNavClass}>
          <span className="text-lg" aria-hidden="true">📊</span>
          <span>{t('nav.dashboard')}</span>
        </NavLink>
        <NavLink to="/athletes" className={bottomNavClass}>
          <span className="text-lg" aria-hidden="true">🏃</span>
          <span>{t('nav.athletes')}</span>
        </NavLink>
        {coach?.role === 'admin' && (
          <NavLink to="/settings" className={bottomNavClass}>
            <span className="text-lg" aria-hidden="true">⚙</span>
            <span>{t('nav.settings')}</span>
          </NavLink>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-semibold text-zinc-500"
        >
          <span className="text-lg" aria-hidden="true">🚪</span>
          <span>{t('nav.signOut')}</span>
        </button>
      </nav>
    </div>
  )
}
