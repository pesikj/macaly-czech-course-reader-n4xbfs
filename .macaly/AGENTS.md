## Project Context

**Project:** Vibe coding — Czech online course materials reader
**Language:** Czech (all user-facing text must be in Czech)
**Stack:** Next.js + Convex (spotted-perch-720)

### Architecture
- Lecture metadata lives in `lib/lectures.ts` — edit this to add/reorder lectures
- Lecture markdown files live in `content/lekce/` — one `.md` file per lecture
- Routes: `/` (overview, auth-protected), `/lekce/[slug]` (lecture detail, auth-protected), `/prihlaseni` (login for regular users), `/admin` (admin only)
- Design: Czechitas branding — pink `#E6007E` (var --czechitas-pink), dark blue `#2D2E83` (var --czechitas-blue), Open Sans font
- GitHub sync: fetches from `pesikj/vibecoding-macaly-course`, images embedded as base64

### Auth & Access Control
- Auth: OTP via `@convex-dev/auth` with Resend
- `allowedUsers` table in Convex: `{ email: string, isAdmin: boolean }` — whitelist of who can log in
- Admin email always allowed via `ADMIN_EMAIL` env var (even if not in allowedUsers)
- Admin auto-created in allowedUsers via hourly cron (`convex/crons.ts`)
- `isAdmin` check: first checks ADMIN_EMAIL env var, then `allowedUsers.isAdmin` field
- Regular users (non-admin) CAN log in but CANNOT access `/admin`
- `AuthGuard` component (`components/auth-guard.tsx`) wraps protected pages, redirects to `/prihlaseni` if not logged in
- Sign-in forms check email against `allowedUsers.checkEmailAllowed` before sending OTP

### Convex files
- `convex/schema.ts` — tables: users, allowedUsers, lectureContents, syncLog
- `convex/allowedUsers.ts` — CRUD for user whitelist (checkEmailAllowed, list, add, addBulk, remove, ensureAdminExists)
- `convex/users.ts` — currentLoggedInUser, isAdmin queries
- `convex/crons.ts` — hourly cron to ensure ADMIN_EMAIL exists in allowedUsers
- `convex/github.ts` — syncFromGithub action

### Adding a new lecture
1. Add entry to `LECTURES` array in `lib/lectures.ts`
2. Create `content/lekce/<slug>.md` with the markdown content
3. Set `status: 'available'` when ready to publish

### Interactive items
- Use `<InteractiveItem>` component from `components/interactive-item.tsx`
- Types: `reflection`, `quiz`, `checklist`, `exercise`, `hint`
- Currently placeholders only — content to be filled in per lecture

## Testing Preferences
Not yet set — ask the user on the next relevant task.
