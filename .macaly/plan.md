# GitHub Content Sync + Admin Section

## Overview

Add a feature that pulls lecture content from the private GitHub repository and stores it in a database. A protected admin page lets you trigger the sync with a button. The rest of the course reader then serves content from the database instead of local files.

---

## How it will work

1. **Admin signs in** at `/admin` using their email + a one-time code
2. The system checks whether the signed-in email matches `ADMIN_EMAIL`
3. Admin clicks **"Synchronizovat z GitHubu"** — the app fetches `lectures.json` from the repo, then fetches each lecture's `.md` file and stores it
4. Image URLs in the markdown are automatically rewritten to point to GitHub's raw CDN so they load correctly
5. Lecture detail pages read content from the database (falling back to local files if not yet synced)

---

## Implementation steps

### 1. Provision Convex database
- Run the `setup-convex-db` skill to create the database and wrap the app layout

### 2. Database schema (`convex/schema.ts`)
Add two tables:
- `users` — for OTP authentication (email index)
- `lectureContents` — stores `{ lectureId, markdown, syncedAt }` with an index on `lectureId`

### 3. GitHub sync action (`convex/github.ts`)
A Convex action callable from the admin panel:
- Reads `lectures.json` from the repo root via GitHub API (using `GITHUB_TOKEN`)
- For each entry `lecture_id → directory`, fetches `{directory}/lekce-{lecture_id}.md`
- Rewrites relative image URLs to `https://raw.githubusercontent.com/pesikj/vibecoding-macaly-course/main/{directory}/{image}`
- Upserts each lecture into the `lectureContents` table

### 4. Convex queries/mutations (`convex/lectures.ts`, `convex/users.ts`)
- `getLectureContent(lectureId)` — fetch stored markdown by lecture ID
- `currentUser` — get signed-in user's email
- `isAdmin` — check if current user email matches `ADMIN_EMAIL` env var (set in Convex)

### 5. Admin page (`/app/admin/page.tsx` + `/components/admin-content.tsx`)
- OTP sign-in form (email → 6-digit code)
- After sign-in: check admin email — if mismatch, show "Přístup odepřen"
- If admin: show sync button, last sync timestamp, per-lecture sync status

### 6. Update lecture detail page
- Try to load markdown from Convex first (by `lecture.order` matching `lecture_id`)
- Fall back to local `.md` file if not yet synced

---

## Environment variables needed
- `GITHUB_TOKEN` — already added to secrets ✓
- `ADMIN_EMAIL` — needs to be set in **Convex** environment variables (separate from Next.js secrets)

---

## No-gos
- Will **not** change the lecture list structure in `lib/lectures.ts` — titles/order stay managed there
- Will **not** implement any CMS or content editor
- Will **not** auto-sync on a schedule — sync is always manual via the admin button
- Will **not** expose `ADMIN_EMAIL` or `GITHUB_TOKEN` to the browser
- Will **not** add login to the public course reader — only the `/admin` route is protected

---

## Todos
- [ ] Provision Convex database and wrap layout
- [ ] Update schema with `users` + `lectureContents` tables
- [ ] Create GitHub sync action in Convex
- [ ] Create lecture content queries and admin check
- [ ] Build admin page with OTP sign-in
- [ ] Update lecture detail page to read from Convex
- [ ] Set ADMIN_EMAIL in Convex environment variables
