# Coach Invitation System Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let an admin coach invite new coaches to their gym from within the app — no Supabase dashboard access or email service required.

**Architecture:** Token-based invite table. Admin generates an invite link in-app and sends it manually. Invitee visits the link, sets their password, and the app auto-creates their `coaches` row. Admin can view and revoke pending invitations.

**Tech Stack:** React 19 + TypeScript + Supabase JS v2 + Tailwind CSS (same as existing app)

---

## Data Model

### 1. Add `role` to `coaches`

```sql
ALTER TABLE coaches
  ADD COLUMN role text NOT NULL DEFAULT 'coach'
  CHECK (role IN ('admin', 'coach'));
```

Update your own account to admin after running the migration:

```sql
UPDATE coaches SET role = 'admin' WHERE id = '<your-auth-uid>';
```

### 2. New `invitations` table

```sql
CREATE TABLE invitations (
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
```

### 3. Row-Level Security on `invitations`

```sql
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Admins can manage invitations for their own gym
CREATE POLICY "admins manage their gym invitations"
  ON invitations
  FOR ALL
  TO authenticated
  USING (
    gym_id = (SELECT gym_id FROM coaches WHERE id = auth.uid())
    AND (SELECT role FROM coaches WHERE id = auth.uid()) = 'admin'
  );

-- Anyone (unauthenticated) can read a single invitation by token
-- Needed so the accept page can look up the invite before signup
CREATE POLICY "public read invitation by token"
  ON invitations
  FOR SELECT
  TO anon
  USING (true);
```

---

## TypeScript Types

Add to `src/types/database.ts`:

```typescript
export type CoachRole = 'admin' | 'coach'

// Update existing Coach interface:
export interface Coach {
  id: string
  gym_id: string
  full_name: string
  role: CoachRole        // new field
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
```

---

## CoachContext

Add `role` to the context value — no new hook needed:

```typescript
interface CoachContextValue {
  coach: Coach | null
  gym: Gym | null
  loading: boolean
  // role is coach?.role — consumers read it directly from coach
}
```

Consumers check `coach?.role === 'admin'` to conditionally render admin features. The existing `CoachContext` implementation needs no changes beyond the updated `Coach` type.

---

## New Files

| File | Purpose |
|---|---|
| `src/pages/Settings.tsx` | Admin-only settings page with team list + invitations |
| `src/components/InviteCoachModal.tsx` | Modal to create an invite and display the generated link |
| `src/pages/AcceptInvite.tsx` | Public page where invitee sets their password |
| `src/hooks/useInvitations.ts` | Fetch, create, and revoke invitations |

---

## Routes

```
/settings            → Settings (protected, admin only)
/accept-invite       → AcceptInvite (public — no auth required)
```

Add to `App.tsx`:
- `/settings` inside the `ProtectedRoute` wrapper (Settings itself handles the admin check)
- `/accept-invite` as a public route alongside `/login`

---

## Page & Component Design

### Settings page (`/settings`)

- If `coach.role !== 'admin'`: redirect to `/dashboard` immediately.
- Two sections, separated by a heading:

**Team section:**
- Table: Name | Role | Joined
- Rows for all coaches in the gym (fetched via `supabase.from('coaches').select('*').eq('gym_id', gym.id).order('full_name')`)
- Role shown as a pill badge: indigo for "Admin", slate for "Coach"

**Invitations section:**
- "Invite coach" button (top-right of section)
- Table: Email | Name | Expires | Status | Actions
- "Revoke" button on each pending row — sets `status = 'revoked'`
- Accepted/revoked rows shown greyed out, no action button
- Empty state: "No pending invitations."

### InviteCoachModal

Props: `onClose: () => void`

Fields:
- **Email** — text input, type="email", required
- **Full name** — text input, required

On submit:
1. Insert to `invitations`: `{ gym_id, email, full_name, invited_by: coach.id }`
2. Read back the generated `token` from the insert response
3. Switch modal to a "success" view showing:
   - "Invite created — share this link:" label
   - The full URL: `${window.location.origin}/accept-invite?token=<token>`
   - "Copy link" button (uses `navigator.clipboard.writeText`)
   - "Done" button to close

Error handling: show inline error if insert fails.

### AcceptInvite page (`/accept-invite?token=…`)

This is a **public route** — no auth guard.

On mount:
1. Read `token` from `URLSearchParams`
2. Query `invitations` where `token = <token>` (anon read, allowed by RLS)
3. Validate:
   - Not found → "Invalid invite link"
   - `status !== 'pending'` → "This invite has already been used — try signing in" (if accepted) or "This invite link is no longer valid" (if revoked)
   - `expires_at < now()` → "This invite has expired — ask your admin for a new one"
4. If valid: show form

Form fields:
- **Email** — pre-filled from invitation, read-only
- **Full name** — pre-filled from invitation, editable
- **Password** — required, `type="password"`, `autoComplete="new-password"`

On submit:
1. `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
2. If error code is `user_already_exists` (or similar 400): show "An account with this email already exists — try signing in"
3. On success: insert `coaches` row: `{ id: newUser.id, gym_id: invitation.gym_id, full_name, role: 'coach' }`
4. Update invitation: `{ status: 'accepted' }`
5. Redirect to `/dashboard`

### useInvitations hook

```typescript
interface UseInvitationsResult {
  invitations: Invitation[]
  loading: boolean
  error: string | null
  createInvitation: (email: string, fullName: string) => Promise<Invitation>
  revokeInvitation: (id: string) => Promise<void>
}
```

- Fetches all invitations for `gym.id`, ordered by `created_at desc`
- `createInvitation` inserts and returns the new row (including generated token)
- `revokeInvitation` updates `status = 'revoked'` then refreshes

### Sidebar change (`AppLayout.tsx`)

Add a "Settings" nav link visible only when `coach?.role === 'admin'`:

```tsx
{coach?.role === 'admin' && (
  <NavLink to="/settings">⚙ Settings</NavLink>
)}
```

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Token expired | "This invite has expired — ask your admin for a new one" |
| Token already accepted | "This invite has already been used — try signing in" |
| Token revoked | "This invite link is no longer valid" |
| Email already has a Supabase account | Show "An account with this email already exists — try signing in" |
| Non-admin visits `/settings` | Redirect to `/dashboard` |
| Admin revokes pending invite | Status → `revoked`; link stops working immediately |

---

## Supabase Configuration Required

Before this feature works, disable email confirmation in the Supabase dashboard:

**Auth → Email → Confirm email → OFF**

With email confirmation enabled, `signUp` does not return an active session — the user must click a second confirmation email before their account activates. This breaks the accept-invite flow (the `coaches` row insert happens immediately after `signUp`, before confirmation). Turning it off lets `signUp` return a live session immediately, which is correct for an invite-only app where the admin has already verified the invitee's identity.

---

## Out of Scope

- Changing a coach's role after creation
- Removing/deactivating coaches
- Multi-gym support
- Automatic email delivery
