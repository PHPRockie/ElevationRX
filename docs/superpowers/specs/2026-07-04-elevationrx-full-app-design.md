# ElevationRx Full App Design

**Goal:** Build a working trampoline routine management app for gymnastics coaches — auth, athlete management, and routine building — deployed sequentially so each phase is usable before the next begins.

**Discipline scope:** Individual trampoline only.

**Build order:** Phase 1 (Auth + Shell) → Phase 2 (Athletes) → Phase 3 (Routine Builder) → Phase 4 (Dashboard). Each phase depends on the previous.

---

## Architecture

Single-page React app (Vite + TypeScript). Supabase handles auth and the database — both already exist with tables and skills data seeded. React Router v6 manages navigation. Tailwind CSS for styling.

Data is always scoped to the logged-in coach's `gym_id`. Coaches cannot see data from other gyms. Row-level filtering is enforced in every query by `gym_id` (not Supabase RLS — frontend query filtering for now).

---

## Auth & Identity Model

- **Individual logins per coach** — each coach has their own Supabase auth account.
- **Admin-managed invites** — no self-signup. Admin invites coach via Supabase dashboard → coach receives email → sets password → logs in.
- **Gym linking** — admin also adds a row to the `coaches` table with the coach's `auth.uid()` and their `gym_id`.
- **On login** — app calls `supabase.auth.getSession()`, then looks up `coaches` where `coaches.id = auth.uid()` (the coaches table uses the Supabase auth UID as its primary key) to retrieve `gym_id` and `full_name`. This is stored in `CoachContext`.
- **Error state** — if a coach logs in but has no matching record in `coaches`, show: "Your account isn't linked to a gym yet — contact your admin."

---

## Phase 1: Auth + App Shell

### Login page (`/login`)
- Email + password form.
- On submit: `supabase.auth.signInWithPassword({ email, password })`.
- On success: look up coach record → store in context → redirect to `/dashboard`.
- On failure: show error message inline ("Invalid email or password").
- No self-signup link — "Contact your admin to get access" note at the bottom.

### Protected routes
- `ProtectedRoute` component wraps all authenticated pages.
- If `loading` → show full-page spinner.
- If no `session` → redirect to `/login`.
- If `session` but no coach record → show error screen.

### App shell (post-login layout)
- Left sidebar (dark, `#1e293b`) always visible.
- Sidebar contents (top to bottom):
  - "ElevationRx" logo text
  - Gym name badge (e.g., "🏟 World Elite") in indigo
  - Nav links: 📊 Dashboard, 🏃 Athletes
  - Bottom: coach's full name + "Sign out" link
- `Sign out` calls `supabase.auth.signOut()` → redirect to `/login`.
- Main content area uses React Router `<Outlet />`.

### New files
- `src/contexts/CoachContext.tsx` — stores `{ coach, gymId, gym }`, provides to all children
- `src/components/ProtectedRoute.tsx` — auth guard
- `src/components/AppLayout.tsx` — sidebar + outlet wrapper
- `src/pages/Login.tsx` — replaced with real form

### Routes after Phase 1
```
/login          → Login (public)
/dashboard      → Dashboard (protected)
/athletes       → AthleteList (protected)
```

---

## Phase 2: Athlete Management

### Athlete list (`/athletes`)
- Fetches all athletes where `gym_id = coach.gymId`, ordered by `full_name`.
- Table columns: Name, Level, Country, Routines (count badge).
- "Add athlete" button (top right) opens a modal.
- Clicking a row navigates to `/athletes/:id`.

### Add athlete modal
- Fields:
  - **Full name** — text input, required
  - **Level** — free text input (federations use different naming: Elite, Junior, Age Group, etc.)
  - **Country** — dropdown of countries with flag + 3-letter code (e.g., 🇲🇽 Mexico (MEX))
- `gym_id` is set automatically from `CoachContext` — coach never picks it.
- On save: `supabase.from('athletes').insert(...)` → close modal → refresh list.

### Athlete detail (`/athletes/:id`)
- Breadcrumb: "← Athletes" link back to list.
- Header: athlete's full name, level, country, gym name.
- "New routine" button (top right) → navigates to `/athletes/:id/routines/new`.
- Lists existing routines for this athlete: Routine #N, skill count, DD total.
- Clicking a routine → navigates to `/athletes/:id/routines/:routineId`.
- Edit / Delete athlete accessible from this view (edit opens a modal, delete requires confirmation).

### Routes after Phase 2
```
/athletes               → AthleteList
/athletes/:id           → AthleteDetail (athlete info + routine list)
```

### New files
- `src/pages/AthleteDetail.tsx`
- `src/components/AddAthleteModal.tsx`
- `src/components/EditAthleteModal.tsx`
- `src/hooks/useAthletes.ts` — fetch + mutate athletes for current gym

---

## Phase 3: Routine Builder

### Route
```
/athletes/:id/routines/new          → new routine
/athletes/:id/routines/:routineId   → edit existing routine
```

### Layout
Two-panel layout inside the app shell:
- **Left panel** (~280px): skill catalog
- **Right panel** (flex): 10-skill routine slots + DD footer

### Skill catalog (left panel)

**Filter row 1 — Direction:**
- `Front` | `Back` (pill toggles, no "All", no label)
- **Front is active by default.** One must always be active; clicking the active one does nothing.

**Filter row 2 — Somersault count:**
- `All` | `Single` | `Double` | `Triple/Quad`

**Search bar** (above both filter rows):
- Free text search across all skills by name or FIG code.
- Search overrides filter — shows matching skills from all groups.

**Skill list:**
- Grouped by current filter combination (e.g., "Front · Single").
- Each skill row: name, FIG code, DD values (T: / P: / S: where applicable).
- `+` button adds skill to next empty slot in the routine.
- If routine is full (10 skills), `+` buttons are disabled.

### Routine slots (right panel)

**Header:**
- Athlete name, Routine #N, discipline, level, country.
- "Save routine" button.

**10 skill slots:**
- Numbered 1–10.
- Filled slot shows: skill name, form selector (Tuck / Pike / Str — only forms with a DD value shown), DD value for selected form, ✕ remove button.
- Empty slot shows dashed border with placeholder text.
- Skills can be reordered via drag-and-drop (up/down arrow fallback).

**Footer:**
- Skill count (e.g., "7 / 10 skills added").
- **Total DD** — sum of all selected skills' DD values, updates live.

### Saving
- On "Save routine": `supabase.from('routines').insert(...)` then `supabase.from('routine_skills').insert(...)` for each skill slot.
- `routine_number` is auto-assigned as count of existing routines for this athlete + 1.
- On edit: update `routines` row + delete/re-insert `routine_skills`.

### New files
- `src/pages/RoutineBuilder.tsx` — replaced with real builder
- `src/components/SkillCatalog.tsx` — left panel with filters + list
- `src/components/RoutineSlots.tsx` — right panel with slots + DD total
- `src/hooks/useSkills.ts` — fetch + filter skills
- `src/hooks/useRoutine.ts` — load/save routine

---

## Phase 4: Dashboard

### Route: `/dashboard`

**Contents:**
- Welcome message: "Welcome back, [coach first name] 👋"
- Subtitle: gym name + gym country (from the `gyms` table — no city field exists).
- **Athletes stat card**: count of athletes in the gym.
- **Recent athletes list**: last 5 athletes added, showing name, level, flag. Each row links to `/athletes/:id`. "View all athletes →" link at bottom.

### New files
- `src/pages/Dashboard.tsx` — replaced with real dashboard
- `src/hooks/useDashboard.ts` — fetch athlete count + recent athletes

---

## Navigation & URL Summary

```
/login                                → Login (public)
/dashboard                            → Dashboard
/athletes                             → Athlete list
/athletes/:id                         → Athlete detail + routine list
/athletes/:id/routines/new            → Routine Builder (new)
/athletes/:id/routines/:routineId     → Routine Builder (edit)
*                                     → redirect to /login
```

---

## Shared Components

- `src/components/AppLayout.tsx` — sidebar + outlet
- `src/components/ProtectedRoute.tsx` — auth guard
- `src/contexts/CoachContext.tsx` — coach identity + gym
- `src/components/Spinner.tsx` — loading state

---

## Out of Scope (for now)

- Competition requirements checking (requirements table exists but UI not planned)
- Admin interface for creating gyms / inviting coaches
- Synchronized / DMT / tumbling disciplines
- Athlete photo uploads
- Routine PDF export
- Multi-coach role management
