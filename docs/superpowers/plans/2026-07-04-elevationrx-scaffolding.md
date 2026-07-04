# ElevationRx Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a React + TypeScript + Vite project called ElevationRx — a trampoline routine management app for gymnastics coaches — with Supabase, React Router, and Tailwind CSS configured and ready for feature development.

**Architecture:** Single-page app bootstrapped with Vite's React-TS template. Supabase handles auth and database. React Router v6 manages navigation between stub pages. Tailwind CSS provides utility-first styling. No business logic yet — only folder structure, types, config, and minimal page stubs.

**Tech Stack:** Vite 5, React 18, TypeScript 5, @supabase/supabase-js 2, React Router v6, Tailwind CSS 3, PostCSS

---

## File Map

| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies and scripts |
| `vite.config.ts` | Vite build config |
| `tsconfig.json` | TypeScript project config |
| `index.html` | App entry HTML |
| `.env` | Placeholder env vars (not committed) |
| `.env.example` | Committed env var template |
| `tailwind.config.js` | Tailwind config with content paths |
| `postcss.config.js` | PostCSS with Tailwind + autoprefixer |
| `src/main.tsx` | React root mount with BrowserRouter |
| `src/App.tsx` | Route definitions |
| `src/index.css` | Tailwind directives |
| `src/lib/supabase.ts` | Supabase client init from env vars |
| `src/types/database.ts` | TypeScript row types for all 7 tables |
| `src/hooks/useAuth.ts` | Auth state listener hook |
| `src/pages/Login.tsx` | Login page stub |
| `src/pages/Dashboard.tsx` | Dashboard page stub |
| `src/pages/RoutineBuilder.tsx` | Routine builder page stub |
| `src/pages/AthleteList.tsx` | Athlete list page stub |
| `src/components/.gitkeep` | Keeps components/ folder tracked |

---

### Task 1: Initialize Vite + React + TypeScript Project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`

- [ ] **Step 1: Scaffold the Vite project**

Run from `/Users/josecarlosgarciasaenz/Projects/`:
```bash
npm create vite@latest ElevationRX -- --template react-ts
```
Expected output: `✔ Done. Now run: cd ElevationRX && npm install`

- [ ] **Step 2: Install base dependencies**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npm install
```
Expected: `added N packages` with no errors.

- [ ] **Step 3: Verify dev server starts**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npm run dev -- --port 5173 &
sleep 3
curl -s http://localhost:5173 | head -5
kill %1
```
Expected: HTML output containing `<div id="root">`.

- [ ] **Step 4: Commit baseline**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && git init && git add . && git commit -m "chore: initialize Vite React-TS project"
```

---

### Task 2: Install and Configure Tailwind CSS

**Files:**
- Create: `tailwind.config.js`, `postcss.config.js`
- Modify: `src/index.css`

- [ ] **Step 1: Install Tailwind and its peer dependencies**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
```
Expected: Creates `tailwind.config.js` and `postcss.config.js`.

- [ ] **Step 2: Configure content paths in tailwind.config.js**

Replace `tailwind.config.js` with:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 3: Replace src/index.css with Tailwind directives**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Verify Tailwind is working**

In `src/App.tsx`, temporarily add a class: change the outer `<div>` to `<div className="bg-blue-500 p-4">`.

Run:
```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npm run build 2>&1 | tail -5
```
Expected: `✓ built in` — no errors.

Revert `src/App.tsx` to default scaffold after confirming build succeeds.

- [ ] **Step 5: Commit**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && git add tailwind.config.js postcss.config.js src/index.css && git commit -m "chore: add and configure Tailwind CSS"
```

---

### Task 3: Install Supabase and React Router

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install packages**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npm install @supabase/supabase-js react-router-dom
```
Expected: both packages added with no peer dependency warnings.

- [ ] **Step 2: Verify TypeScript types are available**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && node -e "const {createClient} = require('@supabase/supabase-js'); console.log(typeof createClient)"
```
Expected: `function`

- [ ] **Step 3: Commit**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && git add package.json package-lock.json && git commit -m "chore: install supabase-js and react-router-dom"
```

---

### Task 4: Create .env Files and Supabase Client

**Files:**
- Create: `.env`, `.env.example`, `src/lib/supabase.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Create .env with placeholder values**

Create `.env`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 2: Create .env.example**

Create `.env.example`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 3: Ensure .env is in .gitignore**

Open `.gitignore` and confirm `.env` is listed. If not, append:
```
.env
```
(`.env.example` should NOT be in `.gitignore` — it's safe to commit.)

- [ ] **Step 4: Create src/lib/supabase.ts**

```bash
mkdir -p /Users/josecarlosgarciasaenz/Projects/ElevationRX/src/lib
```

Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 5: Verify it compiles**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npm run build 2>&1 | tail -5
```
Expected: `✓ built in` — no errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && git add .env.example src/lib/supabase.ts .gitignore && git commit -m "feat: add supabase client with env var config"
```

---

### Task 5: Define Database TypeScript Types

**Files:**
- Create: `src/types/database.ts`

- [ ] **Step 1: Create src/types/ directory**

```bash
mkdir -p /Users/josecarlosgarciasaenz/Projects/ElevationRX/src/types
```

- [ ] **Step 2: Create src/types/database.ts**

```typescript
export interface Gym {
  id: string
  name: string
  country: string
  created_at: string
}

export interface Coach {
  id: string
  gym_id: string
  full_name: string
  created_at: string
}

export interface Athlete {
  id: string
  gym_id: string
  full_name: string
  level: string
  country: string
  created_at: string
}

export type SkillDirection = 'forward' | 'backward' | 'lateral'
export type SkillGroup = 'straight_jump' | 'tuck_jump' | 'pike_jump' | 'straddle_jump' | 'twist' | 'somersault'
export type Discipline = 'individual' | 'synchronized' | 'dmt' | 'tumbling'

export interface Skill {
  id: string
  name: string
  fig_code: string | null
  direction: SkillDirection | null
  skill_group: SkillGroup | null
  dd_tuck: number | null
  dd_pike: number | null
  dd_straight: number | null
  discipline: Discipline
  created_at: string
}

export interface Routine {
  id: string
  athlete_id: string
  gym_id: string
  level: string
  country: string
  routine_number: number
  discipline: Discipline
  created_at: string
  updated_at: string
}

export interface RoutineSkill {
  id: string
  routine_id: string
  skill_id: string
  position: number
  sequence_order: number
  created_at: string
}

export interface Requirement {
  id: string
  country: string
  level: string
  num_routines: number
  is_fixed: boolean
  notes: string | null
  created_at: string
}
```

- [ ] **Step 3: Verify types compile**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npm run build 2>&1 | tail -5
```
Expected: `✓ built in` — no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && git add src/types/database.ts && git commit -m "feat: add TypeScript types for all database tables"
```

---

### Task 6: Set Up Auth Hook

**Files:**
- Create: `src/hooks/useAuth.ts`

- [ ] **Step 1: Create src/hooks/ directory**

```bash
mkdir -p /Users/josecarlosgarciasaenz/Projects/ElevationRX/src/hooks
```

- [ ] **Step 2: Create src/hooks/useAuth.ts**

```typescript
import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, session, loading }
}
```

- [ ] **Step 3: Verify it compiles**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npm run build 2>&1 | tail -5
```
Expected: `✓ built in` — no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && git add src/hooks/useAuth.ts && git commit -m "feat: add useAuth hook for Supabase auth state"
```

---

### Task 7: Create Page Stubs

**Files:**
- Create: `src/pages/Login.tsx`, `src/pages/Dashboard.tsx`, `src/pages/RoutineBuilder.tsx`, `src/pages/AthleteList.tsx`

- [ ] **Step 1: Create src/pages/ directory**

```bash
mkdir -p /Users/josecarlosgarciasaenz/Projects/ElevationRX/src/pages
```

- [ ] **Step 2: Create src/pages/Login.tsx**

```tsx
export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">ElevationRx</h1>
        <p className="text-gray-500">Coach login — coming soon</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create src/pages/Dashboard.tsx**

```tsx
export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="text-gray-500 mt-2">Coming soon</p>
    </div>
  )
}
```

- [ ] **Step 4: Create src/pages/RoutineBuilder.tsx**

```tsx
export default function RoutineBuilder() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Routine Builder</h1>
      <p className="text-gray-500 mt-2">Coming soon</p>
    </div>
  )
}
```

- [ ] **Step 5: Create src/pages/AthleteList.tsx**

```tsx
export default function AthleteList() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Athletes</h1>
      <p className="text-gray-500 mt-2">Coming soon</p>
    </div>
  )
}
```

- [ ] **Step 6: Commit stubs**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && git add src/pages/ && git commit -m "feat: add page stubs for Login, Dashboard, RoutineBuilder, AthleteList"
```

---

### Task 8: Wire Up React Router in App.tsx

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: Replace src/App.tsx with route definitions**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RoutineBuilder from './pages/RoutineBuilder'
import AthleteList from './pages/AthleteList'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/routines" element={<RoutineBuilder />} />
      <Route path="/athletes" element={<AthleteList />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
```

- [ ] **Step 2: Wrap app with BrowserRouter in src/main.tsx**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 3: Verify full build succeeds**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npm run build 2>&1
```
Expected: `✓ built in` with no TypeScript or module errors.

- [ ] **Step 4: Create components placeholder**

```bash
mkdir -p /Users/josecarlosgarciasaenz/Projects/ElevationRX/src/components && touch /Users/josecarlosgarciasaenz/Projects/ElevationRX/src/components/.gitkeep
```

- [ ] **Step 5: Commit**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && git add src/App.tsx src/main.tsx src/components/.gitkeep && git commit -m "feat: wire up React Router with all page routes"
```

---

### Task 9: Final Verification

- [ ] **Step 1: Run type check**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npx tsc --noEmit 2>&1
```
Expected: no output (zero errors).

- [ ] **Step 2: Run dev server and spot-check routes**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && npm run dev -- --port 5173 &
sleep 3
curl -s http://localhost:5173 | grep -o '<div id="root">'
curl -s http://localhost:5173/login | head -3
kill %1
```
Expected: `<div id="root">` in first response; second response returns same HTML shell (SPA routing).

- [ ] **Step 3: Verify folder structure**

```bash
find /Users/josecarlosgarciasaenz/Projects/ElevationRX/src -type f | sort
```
Expected output includes:
```
src/App.tsx
src/components/.gitkeep
src/hooks/useAuth.ts
src/index.css
src/lib/supabase.ts
src/main.tsx
src/pages/AthleteList.tsx
src/pages/Dashboard.tsx
src/pages/Login.tsx
src/pages/RoutineBuilder.tsx
src/types/database.ts
src/vite-env.d.ts
```

- [ ] **Step 4: Final commit with summary tag**

```bash
cd /Users/josecarlosgarciasaenz/Projects/ElevationRX && git log --oneline
```
Expected: 7 commits visible from bottom up:
1. `chore: initialize Vite React-TS project`
2. `chore: add and configure Tailwind CSS`
3. `chore: install supabase-js and react-router-dom`
4. `feat: add supabase client with env var config`
5. `feat: add TypeScript types for all database tables`
6. `feat: add useAuth hook for Supabase auth state`
7. `feat: add page stubs for Login, Dashboard, RoutineBuilder, AthleteList`
8. `feat: wire up React Router with all page routes`
