## Project Context

**Project:** Vibe coding — Czech online course materials reader
**Language:** Czech (all user-facing text must be in Czech)
**Stack:** Next.js (no Convex database needed for this project)

### Architecture
- Lecture metadata lives in `lib/lectures.ts` — edit this to add/reorder lectures
- Lecture markdown files live in `content/lekce/` — one `.md` file per lecture
- Routes: `/` (overview), `/lekce/[slug]` (lecture detail), `/o-kurzu` (about)
- Design: serif body font (Crimson Pro), sans display (Sora), dark monospace code blocks
- Primary accent color: deep indigo (`hsl(231, 45%, 42%)`)

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
