# ElevationRx Full App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully working trampoline routine management app — auth, athlete management, routine builder, and dashboard — across 4 sequential phases.

**Architecture:** Single-page React app with a left-sidebar `AppLayout`. `CoachContext` loads the logged-in coach's profile and gym on every page and scopes all Supabase queries to `gym_id`. Protected routes guard all non-login pages. Phase 1 ships auth + shell → Phase 2 ships athlete management → Phase 3 ships routine builder → Phase 4 ships the dashboard.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Supabase JS v2, React Router v7, Tailwind CSS 3, Vitest + @testing-library/jest-dom (unit tests)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/contexts/CoachContext.tsx` | Create | Coach + gym identity after login |
| `src/components/Spinner.tsx` | Create | Full-page loading indicator |
| `src/components/ProtectedRoute.tsx` | Create | Redirect to /login if no session |
| `src/components/AppLayout.tsx` | Create | Dark sidebar + `<Outlet />` wrapper |
| `src/pages/Login.tsx` | Replace | Real email/password form |
| `src/App.tsx` | Modify | Wire up CoachProvider, ProtectedRoute, all routes |
| `src/lib/countries.ts` | Create | Static country list (code + name + flag) |
| `src/hooks/useAthletes.ts` | Create | Fetch + insert + update + delete athletes for gym |
| `src/components/AddAthleteModal.tsx` | Create | Modal: add athlete form |
| `src/components/EditAthleteModal.tsx` | Create | Modal: edit athlete name/level/country |
| `src/pages/AthleteList.tsx` | Replace | Athlete table + Add button |
| `src/pages/AthleteDetail.tsx` | Create | Athlete header + routine list |
| `src/lib/skillFilters.ts` | Create | Pure filter + count-inference functions (tested) |
| `src/lib/skillFilters.test.ts` | Create | Unit tests for filter utilities |
| `src/hooks/useSkills.ts` | Create | Fetch all skills from Supabase + re-filter in memory |
| `src/lib/ddCalc.ts` | Create | Slot types + pure DD calculation functions (tested) |
| `src/lib/ddCalc.test.ts` | Create | Unit tests for DD calculation |
| `src/hooks/useRoutine.ts` | Create | Load/save routine + routine_skills; manage 10-slot state |
| `src/components/SkillCatalog.tsx` | Create | Left panel: filter toggles + skill list |
| `src/components/RoutineSlots.tsx` | Create | Right panel: 10 slots + DD footer |
| `src/pages/RoutineBuilder.tsx` | Replace | Two-panel builder (SkillCatalog + RoutineSlots) |
| `src/hooks/useDashboard.ts` | Create | Athlete count + recent athletes |
| `src/pages/Dashboard.tsx` | Replace | Welcome card + stat card + recent list |
| `src/test-setup.ts` | Create | Vitest test setup file |
| `vite.config.ts` | Modify | Add Vitest config block |

---

## Phase 1: Auth + App Shell

### Task 1: Add Vitest

**Files:**
- Modify: `vite.config.ts`
- Create: `src/test-setup.ts`
- Modify: `package.json` (scripts only)

- [ ] **Step 1: Install Vitest and testing library**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Expected: packages installed, no errors.

- [ ] **Step 2: Replace `vite.config.ts`**

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

- [ ] **Step 3: Create `src/test-setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test script to `package.json`**

In the `"scripts"` section, add `"test"` and `"test:watch"`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 5: Verify Vitest runs**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npm test
```

Expected: "No test files found, exiting with code 0" — not an error.

- [ ] **Step 6: Commit**

```bash
git add vite.config.ts src/test-setup.ts package.json package-lock.json
git commit -m "chore: add Vitest + testing-library"
```

---

### Task 2: CoachContext

**Files:**
- Create: `src/contexts/CoachContext.tsx`

Holds `{ coach, gym, loading }`. Fetches from `coaches` table (joined with `gyms`) whenever `session` changes. If session is null, sets both to null immediately. If the coach row doesn't exist, `coach` stays null — `ProtectedRoute` handles that error state.

- [ ] **Step 1: Create `src/contexts/CoachContext.tsx`**

```typescript
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Coach, Gym } from '../types/database'

interface CoachContextValue {
  coach: Coach | null
  gym: Gym | null
  loading: boolean
}

const CoachContext = createContext<CoachContextValue>({
  coach: null,
  gym: null,
  loading: true,
})

export function CoachProvider({
  children,
  session,
}: {
  children: ReactNode
  session: Session | null
}) {
  const [coach, setCoach] = useState<Coach | null>(null)
  const [gym, setGym] = useState<Gym | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setCoach(null)
      setGym(null)
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('coaches')
      .select('*, gyms(*)')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const { gyms, ...coachData } = data as Coach & { gyms: Gym }
          setCoach(coachData)
          setGym(gyms)
        }
        setLoading(false)
      })
  }, [session])

  return (
    <CoachContext.Provider value={{ coach, gym, loading }}>
      {children}
    </CoachContext.Provider>
  )
}

export function useCoach() {
  return useContext(CoachContext)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/contexts/CoachContext.tsx
git commit -m "feat: add CoachContext for coach + gym identity"
```

---

### Task 3: Spinner + ProtectedRoute

**Files:**
- Create: `src/components/Spinner.tsx`
- Create: `src/components/ProtectedRoute.tsx`

`ProtectedRoute` checks `useAuth` for session and `useCoach` for the coach row. Three outcomes: loading → spinner, no session → redirect, session but no coach row → error screen with "contact your admin" message.

- [ ] **Step 1: Create `src/components/Spinner.tsx`**

```tsx
export default function Spinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/ProtectedRoute.tsx`**

```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCoach } from '../contexts/CoachContext'
import Spinner from './Spinner'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { coach, loading: coachLoading } = useCoach()

  if (authLoading || coachLoading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!coach) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-sm rounded-lg bg-white p-8 text-center shadow">
          <p className="mb-2 font-semibold text-slate-900">Account not linked</p>
          <p className="text-sm text-slate-500">
            Your account isn't linked to a gym yet — contact your admin.
          </p>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Spinner.tsx src/components/ProtectedRoute.tsx
git commit -m "feat: add Spinner and ProtectedRoute components"
```

---

### Task 4: AppLayout

**Files:**
- Create: `src/components/AppLayout.tsx`

Dark sidebar (`bg-slate-900`, `w-48`). Top: "ElevationRx" title + gym name badge in indigo. Nav: Dashboard + Athletes links using `NavLink` (active state gets `bg-slate-700`). Bottom: coach full name + Sign out button. Main area is `<Outlet />`.

- [ ] **Step 1: Create `src/components/AppLayout.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/AppLayout.tsx
git commit -m "feat: add AppLayout with dark sidebar"
```

---

### Task 5: Login page

**Files:**
- Modify: `src/pages/Login.tsx`

Email + password form. On success: navigate to `/dashboard`. On failure: show "Invalid email or password" inline. No self-signup link — shows "Contact your admin to get access" note.

- [ ] **Step 1: Replace `src/pages/Login.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow">
        <h1 className="mb-1 text-xl font-extrabold text-slate-900">ElevationRx</h1>
        <p className="mb-6 text-sm text-slate-400">Coach portal</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              placeholder="coach@gym.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">
          Contact your admin to get access
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Login.tsx
git commit -m "feat: implement Login page with email/password form"
```

---

### Task 6: Wire up App.tsx (Phase 1 routes)

**Files:**
- Modify: `src/App.tsx`
- Create: `src/pages/AthleteDetail.tsx` (stub — replaced in Task 10)

Wrap everything in `CoachProvider`. Add a layout route that renders `<ProtectedRoute><AppLayout /></ProtectedRoute>` as the element, with all protected pages as children. All routes including `/athletes/:athleteId`, `/athletes/:athleteId/routines/new`, and `/athletes/:athleteId/routines/:routineId` are wired here.

- [ ] **Step 1: Create temporary stub `src/pages/AthleteDetail.tsx`**

```tsx
export default function AthleteDetail() {
  return <div className="p-6 text-sm text-slate-500">Athlete detail — coming soon</div>
}
```

- [ ] **Step 2: Replace `src/App.tsx`**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { CoachProvider } from './contexts/CoachContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AthleteList from './pages/AthleteList'
import AthleteDetail from './pages/AthleteDetail'
import RoutineBuilder from './pages/RoutineBuilder'

export default function App() {
  const { session } = useAuth()

  return (
    <CoachProvider session={session}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/athletes" element={<AthleteList />} />
          <Route path="/athletes/:athleteId" element={<AthleteDetail />} />
          <Route path="/athletes/:athleteId/routines/new" element={<RoutineBuilder />} />
          <Route path="/athletes/:athleteId/routines/:routineId" element={<RoutineBuilder />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </CoachProvider>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run the dev server and verify login renders**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npm run dev
```

Open `http://localhost:5173`. Expected: redirects to `/login`, shows "ElevationRx" heading + email/password form + "Contact your admin" note.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/pages/AthleteDetail.tsx
git commit -m "feat: wire up App routes with CoachProvider and ProtectedRoute"
```

---

## Phase 2: Athlete Management

### Task 7: Countries utility + useAthletes hook

**Files:**
- Create: `src/lib/countries.ts`
- Create: `src/hooks/useAthletes.ts`

`useAthletes` fetches athletes filtered to the current gym ordered by `full_name`, and provides `addAthlete`, `updateAthlete`, `deleteAthlete`, and `refresh`.

- [ ] **Step 1: Create `src/lib/countries.ts`**

```typescript
export interface Country {
  code: string
  name: string
  flag: string
}

export const COUNTRIES: Country[] = [
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺' },
  { code: 'AUT', name: 'Austria', flag: '🇦🇹' },
  { code: 'BLR', name: 'Belarus', flag: '🇧🇾' },
  { code: 'BRA', name: 'Brazil', flag: '🇧🇷' },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦' },
  { code: 'CHN', name: 'China', flag: '🇨🇳' },
  { code: 'COL', name: 'Colombia', flag: '🇨🇴' },
  { code: 'CUB', name: 'Cuba', flag: '🇨🇺' },
  { code: 'ESP', name: 'Spain', flag: '🇪🇸' },
  { code: 'FRA', name: 'France', flag: '🇫🇷' },
  { code: 'GBR', name: 'Great Britain', flag: '🇬🇧' },
  { code: 'GER', name: 'Germany', flag: '🇩🇪' },
  { code: 'GRE', name: 'Greece', flag: '🇬🇷' },
  { code: 'JPN', name: 'Japan', flag: '🇯🇵' },
  { code: 'KOR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'MEX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'NED', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'POR', name: 'Portugal', flag: '🇵🇹' },
  { code: 'RUS', name: 'Russia', flag: '🇷🇺' },
  { code: 'SUI', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'UKR', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'USA', name: 'United States', flag: '🇺🇸' },
  { code: 'UZB', name: 'Uzbekistan', flag: '🇺🇿' },
]

export function countryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code)
}
```

- [ ] **Step 2: Create `src/hooks/useAthletes.ts`**

```typescript
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useCoach } from '../contexts/CoachContext'
import type { Athlete } from '../types/database'

interface AthleteInput {
  full_name: string
  level: string
  country: string
}

interface UseAthletesResult {
  athletes: Athlete[]
  loading: boolean
  addAthlete: (data: AthleteInput) => Promise<void>
  updateAthlete: (id: string, data: AthleteInput) => Promise<void>
  deleteAthlete: (id: string) => Promise<void>
  refresh: () => void
}

export function useAthletes(): UseAthletesResult {
  const { gym } = useCoach()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!gym) return
    setLoading(true)
    const { data } = await supabase
      .from('athletes')
      .select('*')
      .eq('gym_id', gym.id)
      .order('full_name')
    setAthletes(data ?? [])
    setLoading(false)
  }, [gym])

  useEffect(() => { fetch() }, [fetch])

  async function addAthlete(data: AthleteInput) {
    if (!gym) return
    await supabase.from('athletes').insert({ ...data, gym_id: gym.id })
    await fetch()
  }

  async function updateAthlete(id: string, data: AthleteInput) {
    await supabase.from('athletes').update(data).eq('id', id)
    await fetch()
  }

  async function deleteAthlete(id: string) {
    await supabase.from('athletes').delete().eq('id', id)
    await fetch()
  }

  return { athletes, loading, addAthlete, updateAthlete, deleteAthlete, refresh: fetch }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/countries.ts src/hooks/useAthletes.ts
git commit -m "feat: add countries utility and useAthletes hook"
```

---

### Task 8: AthleteList page

**Files:**
- Modify: `src/pages/AthleteList.tsx`

Table with Name, Level, Country columns. "Add athlete" button top-right opens `AddAthleteModal`. Clicking a row navigates to `/athletes/:id`.

- [ ] **Step 1: Replace `src/pages/AthleteList.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAthletes } from '../hooks/useAthletes'
import { countryByCode } from '../lib/countries'
import AddAthleteModal from '../components/AddAthleteModal'
import Spinner from '../components/Spinner'

export default function AthleteList() {
  const navigate = useNavigate()
  const { athletes, loading, addAthlete } = useAthletes()
  const [showAdd, setShowAdd] = useState(false)

  if (loading) return <Spinner />

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Athletes</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Add athlete
        </button>
      </div>

      {athletes.length === 0 ? (
        <p className="text-sm text-slate-400">No athletes yet. Add one to get started.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Level</th>
                <th className="px-4 py-3 text-left">Country</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {athletes.map(athlete => {
                const country = countryByCode(athlete.country)
                return (
                  <tr
                    key={athlete.id}
                    onClick={() => navigate(`/athletes/${athlete.id}`)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{athlete.full_name}</td>
                    <td className="px-4 py-3 text-slate-500">{athlete.level}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {country ? `${country.flag} ${country.name}` : athlete.country}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddAthleteModal
          onSave={async data => {
            await addAthlete(data)
            setShowAdd(false)
          }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit
```

Expected: error about missing `AddAthleteModal` — proceed to Task 9, then come back and verify.

---

### Task 9: AddAthleteModal

**Files:**
- Create: `src/components/AddAthleteModal.tsx`

Form with Full Name (text, required), Level (text, required), Country (select from COUNTRIES list). Calls `onSave` with the values, then the parent closes it.

- [ ] **Step 1: Create `src/components/AddAthleteModal.tsx`**

```tsx
import { useState } from 'react'
import { COUNTRIES } from '../lib/countries'

interface Props {
  onSave: (data: { full_name: string; level: string; country: string }) => Promise<void>
  onClose: () => void
}

export default function AddAthleteModal({ onSave, onClose }: Props) {
  const [fullName, setFullName] = useState('')
  const [level, setLevel] = useState('')
  const [country, setCountry] = useState(COUNTRIES[0].code)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ full_name: fullName.trim(), level: level.trim(), country })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-base font-bold text-slate-900">Add athlete</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              placeholder="Ana González"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Level</label>
            <input
              type="text"
              value={level}
              onChange={e => setLevel(e.target.value)}
              required
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              placeholder="Elite, Junior, Age Group…"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Country</label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/AthleteList.tsx src/components/AddAthleteModal.tsx
git commit -m "feat: athlete list with add athlete modal"
```

---

### Task 10: AthleteDetail page

**Files:**
- Modify: `src/pages/AthleteDetail.tsx` (replace the stub from Task 6)

Shows athlete header (name, level, country flag, gym name). Buttons: Edit (opens `EditAthleteModal`), Delete (confirm then `deleteAthlete` + navigate back), "New routine". Lists routines with skill count and DD total. Clicking a routine navigates to the builder.

The routine list query joins `routine_skills` and `skills` to compute `skill_count` and `total_dd` client-side.

- [ ] **Step 1: Replace `src/pages/AthleteDetail.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCoach } from '../contexts/CoachContext'
import { useAthletes } from '../hooks/useAthletes'
import { countryByCode } from '../lib/countries'
import EditAthleteModal from '../components/EditAthleteModal'
import Spinner from '../components/Spinner'
import type { Athlete, Routine } from '../types/database'

interface RoutineSummary extends Routine {
  skill_count: number
  total_dd: number
}

export default function AthleteDetail() {
  const { athleteId } = useParams<{ athleteId: string }>()
  const navigate = useNavigate()
  const { gym } = useCoach()
  const { updateAthlete, deleteAthlete } = useAthletes()

  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [routines, setRoutines] = useState<RoutineSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)

  async function loadData() {
    if (!athleteId) return
    const [{ data: ath }, { data: routs }] = await Promise.all([
      supabase.from('athletes').select('*').eq('id', athleteId).single(),
      supabase
        .from('routines')
        .select('*, routine_skills(selected_form, skills(dd_tuck, dd_pike, dd_straight))')
        .eq('athlete_id', athleteId)
        .order('routine_number'),
    ])
    setAthlete(ath)
    if (routs) {
      const summaries: RoutineSummary[] = routs.map((r: any) => {
        const skillRows = r.routine_skills ?? []
        const total_dd = skillRows.reduce((sum: number, rs: any) => {
          const s = rs.skills
          if (!s) return sum
          const dd =
            rs.selected_form === 'tuck' ? s.dd_tuck :
            rs.selected_form === 'pike' ? s.dd_pike :
            rs.selected_form === 'straight' ? s.dd_straight : null
          return sum + (dd ?? 0)
        }, 0)
        const { routine_skills: _, ...routine } = r
        return { ...routine, skill_count: skillRows.length, total_dd }
      })
      setRoutines(summaries)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [athleteId])

  async function handleDelete() {
    if (!athlete) return
    if (!window.confirm(`Delete ${athlete.full_name}? This cannot be undone.`)) return
    await deleteAthlete(athlete.id)
    navigate('/athletes')
  }

  if (loading) return <Spinner />
  if (!athlete) return <div className="p-6 text-sm text-slate-500">Athlete not found.</div>

  const country = countryByCode(athlete.country)

  return (
    <div className="h-full overflow-auto p-6">
      <Link to="/athletes" className="mb-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
        ← Athletes
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{athlete.full_name}</h1>
          <p className="text-sm text-slate-500">
            {athlete.level}
            {country && ` · ${country.flag} ${country.name}`}
            {gym && ` · ${gym.name}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEdit(true)}
            className="rounded border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
          <button
            onClick={() => navigate(`/athletes/${athlete.id}/routines/new`)}
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + New routine
          </button>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-bold text-slate-700">Routines</h2>
      {routines.length === 0 ? (
        <p className="text-sm text-slate-400">No routines yet. Create one above.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Routine</th>
                <th className="px-4 py-3 text-left">Skills</th>
                <th className="px-4 py-3 text-left">Total DD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {routines.map(r => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/athletes/${athlete.id}/routines/${r.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">Routine #{r.routine_number}</td>
                  <td className="px-4 py-3 text-slate-500">{r.skill_count} / 10</td>
                  <td className="px-4 py-3 font-semibold text-indigo-700">{r.total_dd.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEdit && (
        <EditAthleteModal
          athlete={athlete}
          onSave={async data => {
            await updateAthlete(athlete.id, data)
            setAthlete(prev => (prev ? { ...prev, ...data } : prev))
            setShowEdit(false)
          }}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit
```

Expected: error about missing `EditAthleteModal` — proceed to Task 11.

---

### Task 11: EditAthleteModal

**Files:**
- Create: `src/components/EditAthleteModal.tsx`

Same fields as `AddAthleteModal` but pre-filled with the current athlete values.

- [ ] **Step 1: Create `src/components/EditAthleteModal.tsx`**

```tsx
import { useState } from 'react'
import { COUNTRIES } from '../lib/countries'
import type { Athlete } from '../types/database'

interface Props {
  athlete: Athlete
  onSave: (data: { full_name: string; level: string; country: string }) => Promise<void>
  onClose: () => void
}

export default function EditAthleteModal({ athlete, onSave, onClose }: Props) {
  const [fullName, setFullName] = useState(athlete.full_name)
  const [level, setLevel] = useState(athlete.level)
  const [country, setCountry] = useState(athlete.country)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ full_name: fullName.trim(), level: level.trim(), country })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-base font-bold text-slate-900">Edit athlete</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Level</label>
            <input
              type="text"
              value={level}
              onChange={e => setLevel(e.target.value)}
              required
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Country</label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/AthleteDetail.tsx src/components/EditAthleteModal.tsx
git commit -m "feat: athlete detail with routine list, edit, and delete"
```

---

## Phase 3: Routine Builder

### Task 12: DB migration — add `selected_form` to `routine_skills`

**Files:**
- Modify: `src/types/database.ts`

The `routine_skills` table is missing the `selected_form` column needed to persist which form (tuck/pike/straight) was selected. Run this SQL in Supabase first, then update the TypeScript type.

- [ ] **Step 1: Run this SQL in the Supabase dashboard SQL editor**

Open the Supabase project → SQL Editor → New query → paste and run:

```sql
ALTER TABLE routine_skills
  ADD COLUMN IF NOT EXISTS selected_form text
    CHECK (selected_form IN ('tuck', 'pike', 'straight'));
```

- [ ] **Step 2: Verify the column was added**

In Supabase → Table Editor → `routine_skills` table. Confirm `selected_form` appears.

- [ ] **Step 3: Update the `RoutineSkill` interface in `src/types/database.ts`**

Find the `RoutineSkill` interface and add `selected_form`:

```typescript
export interface RoutineSkill {
  id: string
  routine_id: string
  skill_id: string
  position: number
  sequence_order: number
  selected_form: 'tuck' | 'pike' | 'straight' | null
  created_at: string
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/types/database.ts
git commit -m "feat: add selected_form to RoutineSkill type (DB column applied)"
```

---

### Task 13: Skill filter utilities + useSkills hook (with tests)

**Files:**
- Create: `src/lib/skillFilters.ts`
- Create: `src/lib/skillFilters.test.ts`
- Create: `src/hooks/useSkills.ts`

**Direction mapping:** UI "front" → DB `direction = 'forward'`, UI "back" → DB `direction = 'backward'`.

**Count inference:** Check the skill `name` for the words "double", "triple", "quad" (case-insensitive). If none → "single". Only applies when `skill_group = 'somersault'`; non-somersault skills pass through `count = 'all'` only.

**Search:** When the search string is non-empty it overrides direction/count — matches on name or FIG code across all skills.

- [ ] **Step 1: Write failing tests in `src/lib/skillFilters.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { inferSomersaultCount, filterSkills } from './skillFilters'
import type { Skill } from '../types/database'

describe('inferSomersaultCount', () => {
  it('returns single for a plain somersault name', () => {
    expect(inferSomersaultCount('Front somersault tuck')).toBe('single')
  })
  it('returns double for a name with "double"', () => {
    expect(inferSomersaultCount('Front double somersault')).toBe('double')
  })
  it('returns triple_quad for a name with "triple"', () => {
    expect(inferSomersaultCount('Back triple somersault')).toBe('triple_quad')
  })
  it('returns triple_quad for a name with "quad"', () => {
    expect(inferSomersaultCount('Back quad somersault')).toBe('triple_quad')
  })
  it('is case-insensitive', () => {
    expect(inferSomersaultCount('FRONT DOUBLE SOMERSAULT')).toBe('double')
  })
})

const makeSkill = (overrides: Partial<Skill>): Skill => ({
  id: '1',
  name: 'Front somersault',
  fig_code: '401',
  direction: 'forward',
  skill_group: 'somersault',
  dd_tuck: 0.5,
  dd_pike: 0.6,
  dd_straight: 0.7,
  discipline: 'individual',
  created_at: '',
  ...overrides,
})

describe('filterSkills', () => {
  const skills: Skill[] = [
    makeSkill({ id: '1', name: 'Front somersault', direction: 'forward', skill_group: 'somersault' }),
    makeSkill({ id: '2', name: 'Back somersault', direction: 'backward', skill_group: 'somersault' }),
    makeSkill({ id: '3', name: 'Front double somersault', direction: 'forward', skill_group: 'somersault' }),
    makeSkill({ id: '4', name: 'Front triple somersault', direction: 'forward', skill_group: 'somersault' }),
    makeSkill({ id: '5', name: 'Straight jump', direction: null, skill_group: 'straight_jump' }),
  ]

  it('filters by direction front', () => {
    const result = filterSkills(skills, 'front', 'all', '')
    expect(result.map(s => s.id)).toEqual(['1', '3', '4'])
  })

  it('filters by direction back', () => {
    const result = filterSkills(skills, 'back', 'all', '')
    expect(result.map(s => s.id)).toEqual(['2'])
  })

  it('count=single returns only single somersaults', () => {
    const result = filterSkills(skills, 'front', 'single', '')
    expect(result.map(s => s.id)).toEqual(['1'])
  })

  it('count=double returns only double somersaults', () => {
    const result = filterSkills(skills, 'front', 'double', '')
    expect(result.map(s => s.id)).toEqual(['3'])
  })

  it('count=triple_quad returns triple and quad somersaults', () => {
    const result = filterSkills(skills, 'front', 'triple_quad', '')
    expect(result.map(s => s.id)).toEqual(['4'])
  })

  it('search overrides direction filter — matches across all directions', () => {
    const result = filterSkills(skills, 'front', 'single', 'back')
    expect(result.map(s => s.id)).toEqual(['2'])
  })

  it('search matches by fig code', () => {
    const result = filterSkills(skills, 'front', 'all', '401')
    expect(result.map(s => s.id)).toEqual(['1'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npm test -- skillFilters
```

Expected: FAIL — `skillFilters` module not found.

- [ ] **Step 3: Create `src/lib/skillFilters.ts`**

```typescript
import type { Skill } from '../types/database'

export type DirectionFilter = 'front' | 'back'
export type CountFilter = 'all' | 'single' | 'double' | 'triple_quad'

export function inferSomersaultCount(name: string): 'single' | 'double' | 'triple_quad' {
  const lower = name.toLowerCase()
  if (lower.includes('triple') || lower.includes('quad')) return 'triple_quad'
  if (lower.includes('double')) return 'double'
  return 'single'
}

export function filterSkills(
  skills: Skill[],
  direction: DirectionFilter,
  count: CountFilter,
  search: string,
): Skill[] {
  const q = search.trim().toLowerCase()

  if (q) {
    return skills.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        (s.fig_code?.toLowerCase().includes(q) ?? false),
    )
  }

  const dbDirection = direction === 'front' ? 'forward' : 'backward'

  return skills.filter(s => {
    if (s.direction !== dbDirection) return false
    if (count === 'all') return true
    if (s.skill_group !== 'somersault') return false
    return inferSomersaultCount(s.name) === count
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npm test -- skillFilters
```

Expected: all 12 tests pass.

- [ ] **Step 5: Create `src/hooks/useSkills.ts`**

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Skill } from '../types/database'
import { filterSkills } from '../lib/skillFilters'
import type { DirectionFilter, CountFilter } from '../lib/skillFilters'

interface UseSkillsResult {
  filtered: Skill[]
  loading: boolean
}

export function useSkills(
  direction: DirectionFilter,
  count: CountFilter,
  search: string,
): UseSkillsResult {
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('skills')
      .select('*')
      .eq('discipline', 'individual')
      .then(({ data }) => {
        setAllSkills(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = filterSkills(allSkills, direction, count, search)

  return { filtered, loading }
}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/skillFilters.ts src/lib/skillFilters.test.ts src/hooks/useSkills.ts
git commit -m "feat: skill filter utilities (tested) + useSkills hook"
```

---

### Task 14: DD calculation utility + useRoutine hook (with tests)

**Files:**
- Create: `src/lib/ddCalc.ts`
- Create: `src/lib/ddCalc.test.ts`
- Create: `src/hooks/useRoutine.ts`

A `RoutineSlot` is `{ skill: Skill; form: SkillForm }`. The routine state is 10 slots (`(RoutineSlot | null)[]`). `useRoutine` manages that state and handles loading an existing routine from Supabase or saving a new/edited one.

- [ ] **Step 1: Create `src/lib/ddCalc.ts`**

```typescript
import type { Skill } from '../types/database'

export type SkillForm = 'tuck' | 'pike' | 'straight'

export interface RoutineSlot {
  skill: Skill
  form: SkillForm
}

export function availableForms(skill: Skill): SkillForm[] {
  const forms: SkillForm[] = []
  if (skill.dd_tuck != null) forms.push('tuck')
  if (skill.dd_pike != null) forms.push('pike')
  if (skill.dd_straight != null) forms.push('straight')
  return forms
}

export function defaultForm(skill: Skill): SkillForm {
  const forms = availableForms(skill)
  return forms[0] ?? 'tuck'
}

export function getSkillDD(slot: RoutineSlot): number {
  const { skill, form } = slot
  const dd =
    form === 'tuck' ? skill.dd_tuck :
    form === 'pike' ? skill.dd_pike :
    skill.dd_straight
  return dd ?? 0
}

export function calculateTotalDD(slots: (RoutineSlot | null)[]): number {
  return slots.reduce<number>((sum, slot) => sum + (slot ? getSkillDD(slot) : 0), 0)
}
```

- [ ] **Step 2: Write failing tests in `src/lib/ddCalc.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { calculateTotalDD, availableForms, defaultForm, getSkillDD } from './ddCalc'
import type { Skill } from '../types/database'
import type { RoutineSlot } from './ddCalc'

const makeSkill = (overrides: Partial<Skill> = {}): Skill => ({
  id: '1',
  name: 'Front somersault',
  fig_code: '401',
  direction: 'forward',
  skill_group: 'somersault',
  dd_tuck: 0.5,
  dd_pike: 0.6,
  dd_straight: 0.7,
  discipline: 'individual',
  created_at: '',
  ...overrides,
})

describe('getSkillDD', () => {
  it('returns tuck DD when form is tuck', () => {
    const slot: RoutineSlot = { skill: makeSkill(), form: 'tuck' }
    expect(getSkillDD(slot)).toBe(0.5)
  })
  it('returns pike DD when form is pike', () => {
    const slot: RoutineSlot = { skill: makeSkill(), form: 'pike' }
    expect(getSkillDD(slot)).toBe(0.6)
  })
  it('returns straight DD when form is straight', () => {
    const slot: RoutineSlot = { skill: makeSkill(), form: 'straight' }
    expect(getSkillDD(slot)).toBe(0.7)
  })
  it('returns 0 when DD for the selected form is null', () => {
    const slot: RoutineSlot = { skill: makeSkill({ dd_tuck: null }), form: 'tuck' }
    expect(getSkillDD(slot)).toBe(0)
  })
})

describe('calculateTotalDD', () => {
  it('sums DD across filled slots', () => {
    const skill = makeSkill()
    const slots: (RoutineSlot | null)[] = [
      { skill, form: 'tuck' },
      { skill, form: 'pike' },
      null,
    ]
    expect(calculateTotalDD(slots)).toBeCloseTo(1.1)
  })
  it('returns 0 for an all-empty routine', () => {
    expect(calculateTotalDD(Array(10).fill(null))).toBe(0)
  })
})

describe('availableForms', () => {
  it('returns only forms that have a DD value', () => {
    expect(availableForms(makeSkill({ dd_pike: null }))).toEqual(['tuck', 'straight'])
  })
  it('returns all three when all DD values are set', () => {
    expect(availableForms(makeSkill())).toEqual(['tuck', 'pike', 'straight'])
  })
  it('returns empty array when all DD values are null', () => {
    expect(availableForms(makeSkill({ dd_tuck: null, dd_pike: null, dd_straight: null }))).toEqual([])
  })
})

describe('defaultForm', () => {
  it('returns the first available form', () => {
    expect(defaultForm(makeSkill({ dd_tuck: null }))).toBe('pike')
  })
  it('falls back to tuck when no forms are available', () => {
    expect(defaultForm(makeSkill({ dd_tuck: null, dd_pike: null, dd_straight: null }))).toBe('tuck')
  })
})
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npm test -- ddCalc
```

Expected: all 10 tests pass.

- [ ] **Step 4: Create `src/hooks/useRoutine.ts`**

```typescript
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCoach } from '../contexts/CoachContext'
import type { Athlete, Routine } from '../types/database'
import type { RoutineSlot, SkillForm } from '../lib/ddCalc'
import { defaultForm, calculateTotalDD } from '../lib/ddCalc'

const SLOT_COUNT = 10

interface UseRoutineResult {
  athlete: Athlete | null
  routine: Routine | null
  slots: (RoutineSlot | null)[]
  totalDD: number
  loading: boolean
  saving: boolean
  addSkill: (skill: RoutineSlot['skill']) => void
  removeSlot: (index: number) => void
  setForm: (index: number, form: SkillForm) => void
  moveSlot: (from: number, to: number) => void
  save: () => Promise<void>
}

export function useRoutine(): UseRoutineResult {
  const { athleteId, routineId } = useParams<{ athleteId: string; routineId: string }>()
  const { gym } = useCoach()

  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [slots, setSlots] = useState<(RoutineSlot | null)[]>(Array(SLOT_COUNT).fill(null))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!athleteId) return
    setLoading(true)

    const { data: ath } = await supabase
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .single()
    setAthlete(ath)

    if (routineId) {
      const [{ data: rout }, { data: routSkills }] = await Promise.all([
        supabase.from('routines').select('*').eq('id', routineId).single(),
        supabase
          .from('routine_skills')
          .select('*, skills(*)')
          .eq('routine_id', routineId)
          .order('sequence_order'),
      ])
      setRoutine(rout)

      if (routSkills) {
        const newSlots: (RoutineSlot | null)[] = Array(SLOT_COUNT).fill(null)
        routSkills.forEach((rs: any) => {
          const idx = (rs.sequence_order ?? 1) - 1
          if (idx >= 0 && idx < SLOT_COUNT && rs.skills) {
            newSlots[idx] = {
              skill: rs.skills,
              form: (rs.selected_form as SkillForm) ?? defaultForm(rs.skills),
            }
          }
        })
        setSlots(newSlots)
      }
    }

    setLoading(false)
  }, [athleteId, routineId])

  useEffect(() => { load() }, [load])

  function addSkill(skill: RoutineSlot['skill']) {
    setSlots(prev => {
      const emptyIdx = prev.findIndex(s => s === null)
      if (emptyIdx === -1) return prev
      const next = [...prev]
      next[emptyIdx] = { skill, form: defaultForm(skill) }
      return next
    })
  }

  function removeSlot(index: number) {
    setSlots(prev => {
      const next = [...prev]
      next[index] = null
      return next
    })
  }

  function setForm(index: number, form: SkillForm) {
    setSlots(prev => {
      const slot = prev[index]
      if (!slot) return prev
      const next = [...prev]
      next[index] = { ...slot, form }
      return next
    })
  }

  function moveSlot(from: number, to: number) {
    if (to < 0 || to >= SLOT_COUNT) return
    setSlots(prev => {
      const next = [...prev]
      ;[next[from], next[to]] = [next[to], next[from]]
      return next
    })
  }

  async function save() {
    if (!athlete || !gym) return
    setSaving(true)

    let targetRoutine = routine

    if (!targetRoutine) {
      const { data: existing } = await supabase
        .from('routines')
        .select('id')
        .eq('athlete_id', athlete.id)
      const nextNumber = (existing?.length ?? 0) + 1

      const { data: newRoutine } = await supabase
        .from('routines')
        .insert({
          athlete_id: athlete.id,
          gym_id: gym.id,
          level: athlete.level,
          country: athlete.country,
          routine_number: nextNumber,
          discipline: 'individual',
        })
        .select()
        .single()
      targetRoutine = newRoutine
      setRoutine(newRoutine)
    } else {
      await supabase
        .from('routines')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', targetRoutine.id)
    }

    if (!targetRoutine) {
      setSaving(false)
      return
    }

    await supabase.from('routine_skills').delete().eq('routine_id', targetRoutine.id)

    const inserts = slots
      .map((slot, i) =>
        slot
          ? {
              routine_id: targetRoutine!.id,
              skill_id: slot.skill.id,
              position: i + 1,
              sequence_order: i + 1,
              selected_form: slot.form,
            }
          : null,
      )
      .filter((row): row is NonNullable<typeof row> => row !== null)

    if (inserts.length > 0) {
      await supabase.from('routine_skills').insert(inserts)
    }

    setSaving(false)
  }

  return {
    athlete,
    routine,
    slots,
    totalDD: calculateTotalDD(slots),
    loading,
    saving,
    addSkill,
    removeSlot,
    setForm,
    moveSlot,
    save,
  }
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ddCalc.ts src/lib/ddCalc.test.ts src/hooks/useRoutine.ts
git commit -m "feat: DD calc utilities (tested) + useRoutine hook"
```

---

### Task 15: SkillCatalog component

**Files:**
- Create: `src/components/SkillCatalog.tsx`

Left panel (~280px wide). Top section (sticky): search input, then Front/Back pills (sky blue for active), then All/Single/Double/Triple/Quad pills (indigo for active). Skill list below in a scrollable area. Each skill shows name, FIG code, available DD values. `+` button adds the skill; disabled and grayed when `full`.

- [ ] **Step 1: Create `src/components/SkillCatalog.tsx`**

```tsx
import { useState } from 'react'
import { useSkills } from '../hooks/useSkills'
import type { DirectionFilter, CountFilter } from '../lib/skillFilters'
import type { Skill } from '../types/database'

interface Props {
  onAdd: (skill: Skill) => void
  full: boolean
}

export default function SkillCatalog({ onAdd, full }: Props) {
  const [direction, setDirection] = useState<DirectionFilter>('front')
  const [count, setCount] = useState<CountFilter>('all')
  const [search, setSearch] = useState('')
  const { filtered, loading } = useSkills(direction, count, search)

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-slate-50" style={{ width: 280, minWidth: 280 }}>
      <div className="flex-shrink-0 border-b border-slate-200 bg-white p-3">
        <input
          type="text"
          placeholder="🔍 Search by name or FIG code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-3 w-full rounded border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
        />
        <div className="mb-2 flex gap-2">
          {(['front', 'back'] as DirectionFilter[]).map(d => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className={`rounded-full px-4 py-1 text-sm font-semibold transition-colors ${
                direction === d
                  ? 'bg-sky-500 text-white'
                  : 'border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d === 'front' ? 'Front' : 'Back'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['all', 'All'],
              ['single', 'Single'],
              ['double', 'Double'],
              ['triple_quad', 'Triple/Quad'],
            ] as [CountFilter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setCount(value)}
              className={`rounded-full px-3 py-0.5 text-xs font-semibold transition-colors ${
                count === value
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="p-3 text-xs text-slate-400">Loading skills…</p>
        ) : filtered.length === 0 ? (
          <p className="p-3 text-xs text-slate-400">No skills found.</p>
        ) : (
          filtered.map(skill => {
            const ddParts = [
              skill.dd_tuck != null && `T: ${skill.dd_tuck}`,
              skill.dd_pike != null && `P: ${skill.dd_pike}`,
              skill.dd_straight != null && `S: ${skill.dd_straight}`,
            ].filter(Boolean)

            return (
              <div
                key={skill.id}
                className="mb-1.5 flex items-center justify-between rounded-md border border-slate-100 bg-white p-2"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="truncate text-sm font-semibold text-slate-900">{skill.name}</div>
                  <div className="text-xs text-slate-400">
                    {skill.fig_code && <span className="mr-2 font-mono">{skill.fig_code}</span>}
                    {ddParts.join(' · ')}
                  </div>
                </div>
                <button
                  onClick={() => onAdd(skill)}
                  disabled={full}
                  className={`flex-shrink-0 rounded px-2 py-1 text-xs font-bold transition-colors ${
                    full
                      ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  +
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/SkillCatalog.tsx
git commit -m "feat: SkillCatalog component with direction + count filters"
```

---

### Task 16: RoutineSlots component

**Files:**
- Create: `src/components/RoutineSlots.tsx`

Right panel (flex-1). Header: athlete name + routine label + "Save routine" button. 10 numbered slots — filled slots show skill name, form selector buttons (only forms with DD values shown), DD value, ↑/↓ move buttons, ✕ remove button. Empty slots show dashed placeholder. Footer: skill count + total DD.

- [ ] **Step 1: Create `src/components/RoutineSlots.tsx`**

```tsx
import type { RoutineSlot, SkillForm } from '../lib/ddCalc'
import { availableForms, getSkillDD } from '../lib/ddCalc'
import type { Athlete, Routine } from '../types/database'

interface Props {
  athlete: Athlete | null
  routine: Routine | null
  slots: (RoutineSlot | null)[]
  totalDD: number
  saving: boolean
  onRemove: (index: number) => void
  onSetForm: (index: number, form: SkillForm) => void
  onMove: (from: number, to: number) => void
  onSave: () => void
}

const FORM_LABELS: Record<SkillForm, string> = {
  tuck: 'Tuck',
  pike: 'Pike',
  straight: 'Str',
}

export default function RoutineSlots({
  athlete,
  routine,
  slots,
  totalDD,
  saving,
  onRemove,
  onSetForm,
  onMove,
  onSave,
}: Props) {
  const filledCount = slots.filter(Boolean).length

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{athlete?.full_name ?? '—'}</p>
          <p className="text-xs text-slate-400">
            {routine ? `Routine #${routine.routine_number}` : 'New routine'} · Individual
          </p>
        </div>
        <button
          onClick={onSave}
          disabled={saving || filledCount === 0}
          className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save routine'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-2">
          {slots.map((slot, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                slot ? 'border-slate-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50'
              }`}
            >
              <span className="w-5 flex-shrink-0 text-xs font-bold text-slate-400">{i + 1}</span>

              {slot ? (
                <>
                  <span className="flex-1 truncate text-sm font-medium text-slate-900">
                    {slot.skill.name}
                  </span>

                  <div className="flex gap-1">
                    {availableForms(slot.skill).map(f => (
                      <button
                        key={f}
                        onClick={() => onSetForm(i, f)}
                        className={`rounded px-1.5 py-0.5 text-xs font-semibold transition-colors ${
                          slot.form === f
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {FORM_LABELS[f]}
                      </button>
                    ))}
                  </div>

                  <span className="w-10 flex-shrink-0 text-right text-sm font-bold text-indigo-700">
                    {getSkillDD(slot).toFixed(1)}
                  </span>

                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => onMove(i, i - 1)}
                      disabled={i === 0}
                      className="text-xs leading-none text-slate-300 hover:text-slate-600 disabled:opacity-30"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => onMove(i, i + 1)}
                      disabled={i === slots.length - 1}
                      className="text-xs leading-none text-slate-300 hover:text-slate-600 disabled:opacity-30"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>

                  <button
                    onClick={() => onRemove(i)}
                    className="flex-shrink-0 text-slate-300 hover:text-red-500"
                    title="Remove skill"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <span className="text-xs text-slate-300">Empty slot</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
        <span className="text-xs text-slate-500">{filledCount} / 10 skills added</span>
        <span className="text-sm font-bold text-indigo-700">DD {totalDD.toFixed(1)}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/RoutineSlots.tsx
git commit -m "feat: RoutineSlots component with form selector and DD total"
```

---

### Task 17: RoutineBuilder page

**Files:**
- Modify: `src/pages/RoutineBuilder.tsx`

Composes `SkillCatalog` (left, fixed width) and `RoutineSlots` (right, flex-1) in a `flex h-full` container. Wires `useRoutine` into both. After saving navigates back to the athlete detail page.

- [ ] **Step 1: Replace `src/pages/RoutineBuilder.tsx`**

```tsx
import { useNavigate } from 'react-router-dom'
import { useRoutine } from '../hooks/useRoutine'
import SkillCatalog from '../components/SkillCatalog'
import RoutineSlots from '../components/RoutineSlots'
import Spinner from '../components/Spinner'

export default function RoutineBuilder() {
  const navigate = useNavigate()
  const {
    athlete,
    routine,
    slots,
    totalDD,
    loading,
    saving,
    addSkill,
    removeSlot,
    setForm,
    moveSlot,
    save,
  } = useRoutine()

  if (loading) return <Spinner />

  const isFull = slots.every(s => s !== null)

  async function handleSave() {
    await save()
    if (athlete) navigate(`/athletes/${athlete.id}`)
  }

  return (
    <div className="flex h-full">
      <SkillCatalog onAdd={addSkill} full={isFull} />
      <RoutineSlots
        athlete={athlete}
        routine={routine}
        slots={slots}
        totalDD={totalDD}
        saving={saving}
        onRemove={removeSlot}
        onSetForm={setForm}
        onMove={moveSlot}
        onSave={handleSave}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles and build succeeds**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit && npm run build
```

Expected: no TypeScript errors, build outputs to `dist/`.

- [ ] **Step 3: Run all tests**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npm test
```

Expected: all tests pass (skillFilters and ddCalc suites).

- [ ] **Step 4: Commit**

```bash
git add src/pages/RoutineBuilder.tsx
git commit -m "feat: RoutineBuilder page — two-panel skill catalog + 10-slot routine editor"
```

---

## Phase 4: Dashboard

### Task 18: useDashboard hook + Dashboard page

**Files:**
- Create: `src/hooks/useDashboard.ts`
- Modify: `src/pages/Dashboard.tsx`

Dashboard shows welcome message (coach first name), gym name + country subtitle, athlete count stat card, and recent 5 athletes (by `created_at desc`) with links to their detail pages.

- [ ] **Step 1: Create `src/hooks/useDashboard.ts`**

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCoach } from '../contexts/CoachContext'
import type { Athlete } from '../types/database'

interface DashboardData {
  athleteCount: number
  recentAthletes: Athlete[]
  loading: boolean
}

export function useDashboard(): DashboardData {
  const { gym } = useCoach()
  const [athleteCount, setAthleteCount] = useState(0)
  const [recentAthletes, setRecentAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gym) return

    Promise.all([
      supabase
        .from('athletes')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gym.id),
      supabase
        .from('athletes')
        .select('*')
        .eq('gym_id', gym.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]).then(([countRes, recentRes]) => {
      setAthleteCount(countRes.count ?? 0)
      setRecentAthletes(recentRes.data ?? [])
      setLoading(false)
    })
  }, [gym])

  return { athleteCount, recentAthletes, loading }
}
```

- [ ] **Step 2: Replace `src/pages/Dashboard.tsx`**

```tsx
import { Link } from 'react-router-dom'
import { useCoach } from '../contexts/CoachContext'
import { useDashboard } from '../hooks/useDashboard'
import { countryByCode } from '../lib/countries'
import Spinner from '../components/Spinner'

export default function Dashboard() {
  const { coach, gym } = useCoach()
  const { athleteCount, recentAthletes, loading } = useDashboard()

  const firstName = coach?.full_name.split(' ')[0] ?? ''

  if (loading) return <Spinner />

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="mb-1 text-xl font-bold text-slate-900">
        Welcome back, {firstName} 👋
      </h1>
      <p className="mb-6 text-sm text-slate-400">
        {gym?.name}
        {gym?.country ? ` · ${gym.country}` : ''}
      </p>

      <div className="mb-6 w-40 rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Athletes
        </p>
        <p className="text-3xl font-extrabold leading-none text-slate-900">{athleteCount}</p>
        <p className="mt-1 text-xs text-slate-400">in your gym</p>
      </div>

      <h2 className="mb-2 text-sm font-bold text-slate-700">Recent athletes</h2>
      {recentAthletes.length === 0 ? (
        <p className="text-sm text-slate-400">No athletes yet.</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            {recentAthletes.map((athlete, i) => {
              const country = countryByCode(athlete.country)
              return (
                <Link
                  key={athlete.id}
                  to={`/athletes/${athlete.id}`}
                  className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 ${
                    i < recentAthletes.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <span className="font-medium text-slate-900">{athlete.full_name}</span>
                  <span className="text-slate-400">
                    {athlete.level}
                    {country && ` · ${country.flag}`}
                  </span>
                </Link>
              )
            })}
          </div>
          <Link
            to="/athletes"
            className="mt-2 block text-xs text-indigo-600 hover:underline"
          >
            View all athletes →
          </Link>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles and all tests pass**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit && npm test
```

Expected: no TypeScript errors, all tests pass.

- [ ] **Step 4: Run dev server — end-to-end walkthrough**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npm run dev
```

Walk through the full app at `http://localhost:5173`:
1. `/` redirects to `/login` ✓
2. Login with coach credentials → redirects to `/dashboard` ✓
3. Dashboard shows "Welcome back, [first name] 👋", gym name, athlete count, recent list ✓
4. Sidebar shows gym name badge in indigo ✓
5. Click Athletes → list scoped to your gym ✓
6. Add athlete → appears in list ✓
7. Click athlete → detail page with name, level, country, gym name ✓
8. Click "New routine" → two-panel builder opens ✓
9. Set direction Front/Back, count filter, search — skill list updates ✓
10. Click `+` on a skill → appears in slot 1 ✓
11. Change form selector → DD value updates live ✓
12. Use ↑/↓ buttons to reorder ✓
13. Click Save → navigates to athlete detail, routine appears in list ✓
14. Click routine → re-opens builder with saved skills ✓
15. Sign out → redirected to login ✓

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDashboard.ts src/pages/Dashboard.tsx
git commit -m "feat: dashboard with athlete count and recent athletes list"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Individual logins per coach | Task 5 (Login form) |
| No self-signup, "contact admin" note | Task 5 |
| CoachContext: coach + gym after login | Task 2 |
| ProtectedRoute: spinner / redirect / unlinked error | Task 3 |
| AppLayout: dark sidebar, gym name badge | Task 4 |
| Sign out → redirect to login | Task 4 |
| Athletes scoped to gym_id | Task 7 (useAthletes filters by gym.id) |
| Add athlete: name, level, country dropdown | Task 9 (AddAthleteModal) |
| Athlete detail: name, level, country, gym | Task 10 (AthleteDetail) |
| Edit athlete | Task 11 (EditAthleteModal) |
| Delete athlete with confirmation | Task 10 |
| Routine list on athlete detail page | Task 10 |
| "New routine" button → builder | Task 10 |
| Front/Back direction filter, Front default | Task 15 (SkillCatalog, state defaults to 'front') |
| One direction always active, clicking active does nothing | Task 15 (onClick only fires when switching) |
| All/Single/Double/Triple/Quad count filter | Task 15 |
| Search overrides filters, matches name + FIG code | Task 13 (filterSkills, tested) |
| Skill row shows name, FIG code, DD values | Task 15 |
| `+` button disabled when routine is full | Task 15 (full prop) |
| 10 numbered skill slots | Task 16 (RoutineSlots) |
| Form selector per slot (only forms with DD values) | Task 16 |
| Live DD total | Task 14 (calculateTotalDD, tested) |
| ↑/↓ to reorder skills | Task 16 (onMove) |
| ✕ to remove skill from slot | Task 16 |
| Save new routine (auto-numbered) | Task 14 (useRoutine.save) |
| Edit existing routine by routineId | Task 14 (useRoutine loads by routineId param) |
| After save → navigate to athlete detail | Task 17 (RoutineBuilder) |
| Route /athletes/:athleteId/routines/new | Task 6 (App.tsx) |
| Route /athletes/:athleteId/routines/:routineId | Task 6 (App.tsx) |
| Dashboard welcome message with first name | Task 18 |
| Dashboard subtitle: gym name + country | Task 18 |
| Dashboard athlete count card | Task 18 |
| Dashboard recent athletes list (last 5) | Task 18 |
| Each recent athlete links to detail page | Task 18 |
| "View all athletes →" link | Task 18 |

**Placeholder scan:** None found. All steps contain complete code.

**Type consistency:**
- `RoutineSlot` and `SkillForm` defined in `ddCalc.ts` (Task 14), used in `RoutineSlots.tsx` (Task 16), `useRoutine.ts` (Task 14) ✓
- `DirectionFilter` / `CountFilter` defined in `skillFilters.ts` (Task 13), used in `useSkills.ts` (Task 13) and `SkillCatalog.tsx` (Task 15) ✓
- `selected_form` DB column added in Task 12, type updated in `database.ts`, queried in `useRoutine.ts` and `AthleteDetail.tsx` ✓
- `useAthletes` `AthleteInput` interface used consistently across hook + both modals ✓
- `useRoutine` returns `addSkill(skill: RoutineSlot['skill'])` — `RoutineSlot['skill']` resolves to `Skill`, matching what `SkillCatalog` passes via `onAdd(skill: Skill)` ✓
