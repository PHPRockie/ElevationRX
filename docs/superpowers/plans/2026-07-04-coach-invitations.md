# Coach Invitation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin coach invite new coaches from within the app — admin generates a link, invitee visits it and creates their account.

**Architecture:** Token table in Supabase. Admin inserts a row via the app, copies the generated URL, sends it manually. Invitee visits `/accept-invite?token=…`, sets a password, and the app creates their `coaches` row automatically. Admin can view and revoke pending invitations from a Settings page.

**Tech Stack:** React 19 + TypeScript + Supabase JS v2 + Tailwind CSS v3 + React Router v7 + Vitest

---

## Prerequisites (do before Task 1)

**Disable email confirmation in Supabase:**

Supabase dashboard → Authentication → Email → toggle **"Confirm email"** OFF.

Without this, `signUp` sends a confirmation email and does NOT return an active session. The `AcceptInvite` page inserts the `coaches` row immediately after `signUp` — this only works when the session is live right away. An invite-only app doesn't need a separate email confirmation step.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `src/types/database.ts` | Add `CoachRole`, `InvitationStatus`, `Invitation`; update `Coach` |
| Create | `src/hooks/useInvitations.ts` | Fetch / create / revoke invitations |
| Create | `src/components/InviteCoachModal.tsx` | Create invite form + link display |
| Create | `src/pages/Settings.tsx` | Admin settings: team list + invitations list |
| Create | `src/pages/AcceptInvite.tsx` | Public page: token lookup + signup form |
| Modify | `src/App.tsx` | Add `/settings` and `/accept-invite` routes |
| Modify | `src/components/AppLayout.tsx` | Settings nav link visible to admins only |

---

## Task 1: Database migration + TypeScript types

**Context:** Two SQL changes (run in the Supabase dashboard SQL editor), then update types. No unit tests — the build check is the test.

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1: Run this SQL in the Supabase dashboard SQL editor**

Go to your Supabase project → SQL Editor → New query. Paste and run:

```sql
-- Add role column to coaches (existing rows get 'coach' by default)
ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'coach'
  CHECK (role IN ('admin', 'coach'));

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id      uuid NOT NULL REFERENCES gyms(id),
  email       text NOT NULL,
  full_name   text NOT NULL,
  token       uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '7 days',
  invited_by  uuid NOT NULL REFERENCES coaches(id),
  status      text NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Admins can read/insert/update invitations for their gym
CREATE POLICY "admins manage their gym invitations"
  ON invitations
  FOR ALL
  TO authenticated
  USING (
    gym_id = (SELECT gym_id FROM coaches WHERE id = auth.uid())
    AND (SELECT role FROM coaches WHERE id = auth.uid()) = 'admin'
  );

-- Unauthenticated visitors can read invitations by token (needed for accept page)
CREATE POLICY "public read invitation by token"
  ON invitations
  FOR SELECT
  TO anon
  USING (true);
```

- [ ] **Step 2: Set your own account as admin**

In the same SQL editor, run (replace `<your-auth-uid>` with your actual Supabase auth user ID — find it in Authentication → Users):

```sql
UPDATE coaches SET role = 'admin' WHERE id = '<your-auth-uid>';
```

- [ ] **Step 3: Update `src/types/database.ts`**

Replace the existing `Coach` interface and add new types. The full updated file:

```typescript
export interface Gym {
  id: string
  name: string
  country: string
  created_at: string
}

export type CoachRole = 'admin' | 'coach'

export interface Coach {
  id: string
  gym_id: string
  full_name: string
  role: CoachRole
  created_at: string
}

export type InvitationStatus = 'pending' | 'accepted' | 'revoked'

export interface Invitation {
  id: string
  gym_id: string
  email: string
  full_name: string
  token: string
  expires_at: string
  invited_by: string
  status: InvitationStatus
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
  selected_form: 'tuck' | 'pike' | 'straight' | null
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

- [ ] **Step 4: Verify the build passes**

```bash
npm run build
```

Expected: no TypeScript errors. If you see errors referencing `Coach.role`, check that the `Coach` interface now includes `role: CoachRole`.

- [ ] **Step 5: Commit**

```bash
git add src/types/database.ts
git commit -m "feat: add CoachRole + Invitation types, DB migration for invitations"
```

---

## Task 2: useInvitations hook

**Context:** Follows the same pattern as `useAthletes.ts` — `useCallback` fetch triggered by `useEffect`, mutations throw on error, caller handles display. `Settings.tsx` (Task 4) will own this hook and pass `createInvitation` down to `InviteCoachModal` as a prop.

**Files:**
- Create: `src/hooks/useInvitations.ts`

- [ ] **Step 1: Create `src/hooks/useInvitations.ts`**

```typescript
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useCoach } from '../contexts/CoachContext'
import type { Invitation } from '../types/database'

interface UseInvitationsResult {
  invitations: Invitation[]
  loading: boolean
  error: string | null
  createInvitation: (email: string, fullName: string) => Promise<Invitation>
  revokeInvitation: (id: string) => Promise<void>
}

export function useInvitations(): UseInvitationsResult {
  const { coach, gym } = useCoach()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvitations = useCallback(async () => {
    if (!gym) { setLoading(false); return }
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('gym_id', gym.id)
      .order('created_at', { ascending: false })
    if (fetchError) {
      setError('Failed to load invitations.')
    } else {
      setInvitations(data ?? [])
    }
    setLoading(false)
  }, [gym])

  useEffect(() => { fetchInvitations() }, [fetchInvitations])

  async function createInvitation(email: string, fullName: string): Promise<Invitation> {
    if (!gym || !coach) throw new Error('Not authenticated')
    const { data, error: insertError } = await supabase
      .from('invitations')
      .insert({ gym_id: gym.id, email, full_name: fullName, invited_by: coach.id })
      .select()
      .single()
    if (insertError) throw insertError
    await fetchInvitations()
    return data
  }

  async function revokeInvitation(id: string): Promise<void> {
    if (!gym) return
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ status: 'revoked' })
      .eq('id', id)
      .eq('gym_id', gym.id)
    if (updateError) throw updateError
    await fetchInvitations()
  }

  return { invitations, loading, error, createInvitation, revokeInvitation }
}
```

- [ ] **Step 2: Verify the build passes**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useInvitations.ts
git commit -m "feat: useInvitations hook — fetch, create, revoke"
```

---

## Task 3: InviteCoachModal component

**Context:** Two-step modal. Step 1: form (email + full name). Step 2: displays the generated invite URL with a copy button. Receives `onCreate` as a prop from `Settings` — no internal hook call. Follows the same modal pattern as `AddAthleteModal.tsx` (role=dialog, aria-modal, Escape key, try/finally).

**Files:**
- Create: `src/components/InviteCoachModal.tsx`

- [ ] **Step 1: Create `src/components/InviteCoachModal.tsx`**

```tsx
import { useState } from 'react'
import type { Invitation } from '../types/database'

interface Props {
  onCreate: (email: string, fullName: string) => Promise<Invitation>
  onClose: () => void
}

export default function InviteCoachModal({ onCreate, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdInvite, setCreatedInvite] = useState<Invitation | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const invite = await onCreate(email.trim(), fullName.trim())
      setCreatedInvite(invite)
    } catch {
      setError('Failed to create invite. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inviteUrl = createdInvite
    ? `${window.location.origin}/accept-invite?token=${createdInvite.token}`
    : ''

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-coach-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onKeyDown={e => e.key === 'Escape' && onClose()}
    >
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        {!createdInvite ? (
          <>
            <h2 id="invite-coach-title" className="mb-4 text-base font-bold text-slate-900">
              Invite coach
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="invite-email" className="mb-1 block text-xs font-semibold text-slate-600">
                  Email
                </label>
                <input
                  id="invite-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  placeholder="coach@example.com"
                />
              </div>
              <div>
                <label htmlFor="invite-name" className="mb-1 block text-xs font-semibold text-slate-600">
                  Full name
                </label>
                <input
                  id="invite-name"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  placeholder="Jane Smith"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 rounded border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Creating…' : 'Create invite'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 id="invite-coach-title" className="mb-2 text-base font-bold text-slate-900">
              Invite created
            </h2>
            <p className="mb-3 text-sm text-slate-500">
              Share this link with {createdInvite.full_name}:
            </p>
            <div className="mb-4 rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="break-all font-mono text-xs text-slate-700">{inviteUrl}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 rounded border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                {copied ? '✓ Copied!' : 'Copy link'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the build passes**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/InviteCoachModal.tsx
git commit -m "feat: InviteCoachModal — create invite form + link display"
```

---

## Task 4: Settings page

**Context:** Admin-only page. On mount, redirects non-admins to `/dashboard`. Fetches team (all coaches in the gym) and invitations via `useInvitations`. Passes `createInvitation` down to `InviteCoachModal` as the `onCreate` prop so there's one shared hook instance.

**Files:**
- Create: `src/pages/Settings.tsx`

- [ ] **Step 1: Create `src/pages/Settings.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCoach } from '../contexts/CoachContext'
import { useInvitations } from '../hooks/useInvitations'
import InviteCoachModal from '../components/InviteCoachModal'
import Spinner from '../components/Spinner'
import type { Coach } from '../types/database'

export default function Settings() {
  const navigate = useNavigate()
  const { coach, gym } = useCoach()
  const { invitations, loading: invLoading, error: invError, createInvitation, revokeInvitation } = useInvitations()

  const [coaches, setCoaches] = useState<Coach[]>([])
  const [coachesLoading, setCoachesLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [revokeError, setRevokeError] = useState<string | null>(null)

  useEffect(() => {
    if (coach && coach.role !== 'admin') navigate('/dashboard', { replace: true })
  }, [coach, navigate])

  useEffect(() => {
    if (!gym) return
    supabase
      .from('coaches')
      .select('*')
      .eq('gym_id', gym.id)
      .order('full_name')
      .then(({ data }) => {
        setCoaches(data ?? [])
        setCoachesLoading(false)
      })
  }, [gym])

  async function handleRevoke(id: string) {
    setRevokeError(null)
    try {
      await revokeInvitation(id)
    } catch {
      setRevokeError('Failed to revoke invitation. Please try again.')
    }
  }

  if (coachesLoading) return <Spinner />

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="mb-6 text-xl font-bold text-slate-900">Settings</h1>

      {/* Team */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold text-slate-700">Team</h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coaches.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{c.full_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      c.role === 'admin'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.role === 'admin' ? 'Admin' : 'Coach'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invitations */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">Invitations</h2>
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Invite coach
          </button>
        </div>

        {revokeError && <p className="mb-2 text-xs text-red-500">{revokeError}</p>}
        {invError && <p className="mb-2 text-xs text-red-500">{invError}</p>}

        {invLoading ? (
          <Spinner />
        ) : invitations.length === 0 ? (
          <p className="text-sm text-slate-400">No invitations yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Expires</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invitations.map(inv => (
                  <tr key={inv.id} className={inv.status !== 'pending' ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 text-slate-700">{inv.email}</td>
                    <td className="px-4 py-3 text-slate-700">{inv.full_name}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        inv.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : inv.status === 'accepted'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inv.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(inv.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showInviteModal && (
        <InviteCoachModal
          onCreate={createInvitation}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify the build passes**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: Settings page — team list and invitations management"
```

---

## Task 5: AcceptInvite page

**Context:** Public route — no `ProtectedRoute` wrapper. On mount it reads the `token` query param and looks up the invitation using the anonymous Supabase client (allowed by the RLS policy set up in Task 1). After successful `signUp`, inserts the `coaches` row immediately (email confirmation must be OFF in Supabase — see spec). Matches the visual style of `Login.tsx`.

**Files:**
- Create: `src/pages/AcceptInvite.tsx`

- [ ] **Step 1: Create `src/pages/AcceptInvite.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Spinner from '../components/Spinner'
import type { Invitation } from '../types/database'

export default function AcceptInvite() {
  const navigate = useNavigate()

  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [lookupLoading, setLookupLoading] = useState(true)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) {
      setLookupError('Invalid invite link.')
      setLookupLoading(false)
      return
    }

    supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single()
      .then(({ data, error }) => {
        setLookupLoading(false)
        if (error || !data) { setLookupError('Invalid invite link.'); return }
        if (data.status === 'accepted') { setLookupError('This invite has already been used — try signing in.'); return }
        if (data.status === 'revoked') { setLookupError('This invite link is no longer valid.'); return }
        if (new Date(data.expires_at) < new Date()) { setLookupError('This invite has expired — ask your admin for a new one.'); return }
        setInvitation(data)
        setFullName(data.full_name)
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invitation) return
    setSubmitError(null)
    setSaving(true)
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: { data: { full_name: fullName.trim() } },
      })
      if (signUpError) {
        setSubmitError(
          signUpError.message.toLowerCase().includes('already')
            ? 'An account with this email already exists — try signing in.'
            : signUpError.message,
        )
        return
      }
      if (!authData.user) {
        setSubmitError('Account creation failed. Please try again.')
        return
      }

      const { error: coachError } = await supabase.from('coaches').insert({
        id: authData.user.id,
        gym_id: invitation.gym_id,
        full_name: fullName.trim(),
        role: 'coach',
      })
      if (coachError) {
        setSubmitError('Account created but profile setup failed. Contact your admin.')
        return
      }

      await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id)

      navigate('/dashboard', { replace: true })
    } finally {
      setSaving(false)
    }
  }

  if (lookupLoading) return <Spinner />

  if (lookupError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm rounded-lg bg-white p-8 text-center shadow">
          <h1 className="mb-1 text-xl font-extrabold text-slate-900">ElevationRx</h1>
          <p className="mb-2 mt-4 font-semibold text-slate-900">Invite unavailable</p>
          <p className="text-sm text-slate-500">{lookupError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow">
        <h1 className="mb-1 text-xl font-extrabold text-slate-900">ElevationRx</h1>
        <p className="mb-6 text-sm text-slate-400">Create your coach account</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="accept-email" className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
            <input
              id="accept-email"
              type="email"
              value={invitation?.email ?? ''}
              readOnly
              className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
          <div>
            <label htmlFor="accept-name" className="mb-1 block text-xs font-semibold text-slate-600">Full name</label>
            <input
              id="accept-name"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="accept-password" className="mb-1 block text-xs font-semibold text-slate-600">Password</label>
            <input
              id="accept-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          {submitError && <p className="text-xs text-red-500">{submitError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the build passes**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/AcceptInvite.tsx
git commit -m "feat: AcceptInvite page — token lookup + coach signup form"
```

---

## Task 6: Wire up routes and sidebar

**Context:** Two files to update. `App.tsx` gets two new routes. `AppLayout.tsx` gets a Settings nav link visible only when `coach?.role === 'admin'`. Both follow patterns already established in those files.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/AppLayout.tsx`

- [ ] **Step 1: Update `src/App.tsx`**

Full updated file:

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { CoachProvider } from './contexts/CoachContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import AcceptInvite from './pages/AcceptInvite'
import Dashboard from './pages/Dashboard'
import AthleteList from './pages/AthleteList'
import AthleteDetail from './pages/AthleteDetail'
import RoutineBuilder from './pages/RoutineBuilder'
import Settings from './pages/Settings'

export default function App() {
  const { session } = useAuth()

  return (
    <CoachProvider session={session}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
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
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </CoachProvider>
  )
}
```

- [ ] **Step 2: Update `src/components/AppLayout.tsx`**

Full updated file:

```tsx
import { NavLink, Outlet } from 'react-router-dom'
import { useCoach } from '../contexts/CoachContext'
import { supabase } from '../lib/supabase'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-2 text-sm transition-colors ${
    isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
  }`

export default function AppLayout() {
  const { coach, gym } = useCoach()

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('[AppLayout] sign-out failed', error)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="flex w-48 flex-shrink-0 flex-col bg-slate-900 px-3 py-4">
        <div className="mb-1 text-sm font-extrabold text-white">ElevationRx</div>
        {gym && (
          <span className="mb-5 w-fit rounded bg-indigo-950 px-2 py-0.5 text-xs text-indigo-400">
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
        <div className="mt-auto border-t border-slate-700 pt-3">
          <p className="text-xs text-slate-300">{coach?.full_name}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-1 text-xs text-slate-500 hover:text-slate-300"
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
```

- [ ] **Step 3: Verify the full build and tests pass**

```bash
npm run build && npm test
```

Expected: build succeeds, 23 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/AppLayout.tsx
git commit -m "feat: wire up /settings and /accept-invite routes, admin sidebar link"
```

---

## Manual Verification Checklist

After all tasks are complete, verify the golden paths in the browser:

**Admin flow:**
- [ ] Sign in as admin → sidebar shows "⚙ Settings" link
- [ ] Navigate to `/settings` → Team section shows your account with "Admin" badge
- [ ] Click "+ Invite coach" → modal opens, fill in email + name → "Create invite" → link appears
- [ ] Copy the link

**Invitee flow:**
- [ ] Open the invite link in a private/incognito window
- [ ] Email is pre-filled and read-only, name is pre-filled and editable
- [ ] Enter a password (min 6 chars) → "Create account"
- [ ] Should redirect to `/dashboard` and be logged in
- [ ] Back in the Settings page, the invitation should show "accepted" status

**Edge cases:**
- [ ] Visit the same invite link again → "This invite has already been used"
- [ ] As a regular coach (non-admin), try navigating to `/settings` → redirected to `/dashboard`
- [ ] Revoke a pending invite → status changes to "revoked", link stops working
