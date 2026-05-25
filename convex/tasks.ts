import { mutation, query, internalMutation, MutationCtx } from "./_generated/server"
import { v } from "convex/values"
import { getAuthUserId } from "@convex-dev/auth/server"
import { hasElevatedAccess, getUserRole } from "./users"

const visibilityValidator = v.union(
  v.literal("everyone"),
  v.literal("team"),
  v.literal("private")
)

// ── Helper: admin check ────────────────────────────────────────────

async function assertAdmin(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx)
  if (!userId) throw new Error("Nejste přihlášeni.")

  const user = await ctx.db.get(userId)
  const adminEmail = process.env.ADMIN_EMAIL
  const isEnvAdmin = adminEmail && user?.email?.toLowerCase() === adminEmail.toLowerCase()
  if (!isEnvAdmin) {
    const allowed = user?.email
      ? await ctx.db
          .query("allowedUsers")
          .withIndex("by_email", (q) => q.eq("email", user.email!.toLowerCase()))
          .first()
      : null
    if (!allowed?.isAdmin) throw new Error("Nemáte oprávnění.")
  }
  return userId
}

// ── Internal: called from sync ────────────────────────────────────

export const upsertTask = internalMutation({
  args: {
    lectureId: v.string(),
    taskId: v.string(),
    title: v.string(),
    markdown: v.string(),
    shareSolution: v.boolean(),
    solutionFields: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        type: v.string(),
        required: v.boolean(),
      })
    ),
  },
  handler: async (ctx, { lectureId, taskId, title, markdown, shareSolution, solutionFields }) => {
    const now = Date.now()
    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", taskId))
      .filter((q) => q.eq(q.field("lectureId"), lectureId))
      .first()

    if (existing) {
      // Preserve isOpen state, update everything else
      await ctx.db.patch(existing._id, {
        title,
        markdown,
        shareSolution,
        solutionFields,
        syncedAt: now,
      })
    } else {
      await ctx.db.insert("tasks", {
        lectureId,
        taskId,
        title,
        markdown,
        isOpen: false,
        shareSolution,
        solutionFields,
        syncedAt: now,
      })
    }
    console.log(`Upserted task ${taskId} for lecture ${lectureId}`)
  },
})

// ── Student queries ───────────────────────────────────────────────

/** Returns tasks for a lecture with submission count.
 *  Students see only open tasks; admins and team members see all. */
export const getOpenTasksForLecture = query({
  args: { lectureId: v.string() },
  handler: async (ctx, { lectureId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const elevated = await hasElevatedAccess(ctx)
    const baseQuery = ctx.db
      .query("tasks")
      .withIndex("by_lectureId", (q) => q.eq("lectureId", lectureId))
    const tasks = elevated
      ? await baseQuery.collect()
      : await baseQuery.filter((q) => q.eq(q.field("isOpen"), true)).collect()

    const result = await Promise.all(
      tasks.map(async (t) => {
        const submissions = await ctx.db
          .query("taskSubmissions")
          .withIndex("by_taskId", (q) => q.eq("taskId", t.taskId))
          .collect()
        return {
          _id: t._id,
          taskId: t.taskId,
          title: t.title,
          isOpen: t.isOpen,
          submissionCount: submissions.length,
        }
      })
    )

    return result
  },
})

/** Returns one task + all submissions with heart counts + user's own submission + whether user has hearted each */
export const getTaskWithSubmissions = query({
  args: { taskId: v.string(), lectureId: v.string() },
  handler: async (ctx, { taskId, lectureId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    const role = await getUserRole(ctx)
    const elevated = role.isAdmin || role.isTeamMember

    const task = await ctx.db
      .query("tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", taskId))
      .filter((q) => q.eq(q.field("lectureId"), lectureId))
      .first()

    if (!task) return null

    const allSubmissions = await ctx.db
      .query("taskSubmissions")
      .withIndex("by_taskId", (q) => q.eq("taskId", taskId))
      .order("asc")
      .collect()

    const submissions = allSubmissions.filter((s) => {
      if (s.userId === userId) return true
      const vis = s.visibility ?? "everyone"
      if (vis === "private") return false
      if (vis === "team") return elevated
      return true
    })

    const enrichedSubmissions = await Promise.all(
      submissions.map(async (s) => {
        const hearts = await ctx.db
          .query("taskHearts")
          .withIndex("by_submissionId", (q) => q.eq("submissionId", s._id))
          .collect()

        const myHeart = hearts.find((h) => h.userId === userId)

        const comments = await ctx.db
          .query("taskComments")
          .withIndex("by_submissionId", (q) => q.eq("submissionId", s._id))
          .order("asc")
          .collect()

        return {
          _id: s._id,
          taskId: s.taskId,
          lectureId: s.lectureId,
          displayName: s.displayName,
          visibility: s.visibility ?? "everyone",
          fields: s.fields,
          submittedAt: s.submittedAt,
          heartCount: hearts.length,
          hasHearted: !!myHeart,
          isOwn: s.userId === userId,
          comments: comments.map((c) => ({
            _id: c._id,
            displayName: c.displayName,
            text: c.text,
            createdAt: c.createdAt,
            isOwn: c.userId === userId,
          })),
        }
      })
    )

    const mySubmission = enrichedSubmissions.find((s) => s.isOwn) ?? null

    return {
      _id: task._id,
      taskId: task.taskId,
      lectureId: task.lectureId,
      title: task.title,
      markdown: task.markdown,
      isOpen: task.isOpen,
      // Visibility is decided per-submission by the submitter; this flag stays true so the UI shows the "others' solutions" section whenever there is anything to show.
      shareSolution: true,
      solutionFields: task.solutionFields,
      mySubmission,
      submissions: enrichedSubmissions,
    }
  },
})

// ── Student mutations ─────────────────────────────────────────────

/** Create or update own submission (only if task is open) */
export const submitSolution = mutation({
  args: {
    taskId: v.string(),
    lectureId: v.string(),
    displayName: v.string(),
    fields: v.array(
      v.object({
        fieldId: v.string(),
        value: v.string(),
      })
    ),
    visibility: visibilityValidator,
  },
  handler: async (ctx, { taskId, lectureId, displayName, fields, visibility }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Nejste přihlášeni.")

    if (!displayName.trim()) throw new Error("Jméno nesmí být prázdné.")
    if (displayName.length > 100) throw new Error("Jméno je příliš dlouhé.")
    for (const f of fields) {
      if (f.value.length > 10000) throw new Error("Hodnota pole je příliš dlouhá.")
    }

    const task = await ctx.db
      .query("tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", taskId))
      .filter((q) => q.eq(q.field("lectureId"), lectureId))
      .first()

    if (!task) throw new Error("Úkol nenalezen.")
    if (!task.isOpen) throw new Error("Tento úkol již není otevřen.")

    const existing = await ctx.db
      .query("taskSubmissions")
      .withIndex("by_userId_taskId", (q) => q.eq("userId", userId).eq("taskId", taskId))
      .first()

    const payload = {
      taskId,
      lectureId,
      userId,
      displayName: displayName.trim(),
      fields,
      visibility,
      submittedAt: Date.now(),
    }

    if (existing) {
      await ctx.db.patch(existing._id, payload)
    } else {
      await ctx.db.insert("taskSubmissions", payload)
    }
  },
})

/** Add or remove heart on a submission (cannot heart own submission) */
export const toggleHeart = mutation({
  args: { submissionId: v.id("taskSubmissions") },
  handler: async (ctx, { submissionId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Nejste přihlášeni.")

    const submission = await ctx.db.get(submissionId)
    if (!submission) throw new Error("Příspěvek nenalezen.")
    if (submission.userId === userId) throw new Error("Nemůžete dát srdce vlastnímu řešení.")

    const task = await ctx.db
      .query("tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", submission.taskId))
      .first()
    if (!task?.isOpen) throw new Error("Úkol již není otevřen.")

    const existing = await ctx.db
      .query("taskHearts")
      .withIndex("by_userId_submissionId", (q) =>
        q.eq("userId", userId).eq("submissionId", submissionId)
      )
      .first()

    if (existing) {
      await ctx.db.delete(existing._id)
    } else {
      await ctx.db.insert("taskHearts", { submissionId, userId })
    }
  },
})

/** Add a comment to a submission */
export const addComment = mutation({
  args: {
    submissionId: v.id("taskSubmissions"),
    displayName: v.string(),
    text: v.string(),
  },
  handler: async (ctx, { submissionId, displayName, text }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Nejste přihlášeni.")

    if (!text.trim()) throw new Error("Komentář nesmí být prázdný.")
    if (text.length > 5000) throw new Error("Komentář je příliš dlouhý.")
    if (!displayName.trim()) throw new Error("Jméno nesmí být prázdné.")
    if (displayName.length > 100) throw new Error("Jméno je příliš dlouhé.")

    const submission = await ctx.db.get(submissionId)
    if (!submission) throw new Error("Příspěvek nenalezen.")

    const task = await ctx.db
      .query("tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", submission.taskId))
      .first()
    if (!task?.isOpen) throw new Error("Úkol již není otevřen pro komentáře.")

    await ctx.db.insert("taskComments", {
      submissionId,
      userId,
      displayName: displayName.trim(),
      text: text.trim(),
      createdAt: Date.now(),
    })
  },
})

// ── Admin queries ─────────────────────────────────────────────────

/** List all tasks with submission counts (admin/team only) */
export const listAllTasks = query({
  args: {},
  handler: async (ctx) => {
    const elevated = await hasElevatedAccess(ctx)
    if (!elevated) return null

    const tasks = await ctx.db.query("tasks").collect()

    const result = await Promise.all(
      tasks.map(async (t) => {
        const submissions = await ctx.db
          .query("taskSubmissions")
          .withIndex("by_taskId", (q) => q.eq("taskId", t.taskId))
          .collect()
        return {
          _id: t._id,
          lectureId: t.lectureId,
          taskId: t.taskId,
          title: t.title,
          isOpen: t.isOpen,
          shareSolution: t.shareSolution,
          syncedAt: t.syncedAt,
          submissionCount: submissions.length,
        }
      })
    )

    result.sort((a, b) => {
      if (a.lectureId < b.lectureId) return -1
      if (a.lectureId > b.lectureId) return 1
      if (a.taskId < b.taskId) return -1
      if (a.taskId > b.taskId) return 1
      return 0
    })

    return result
  },
})

// ── Admin mutations ───────────────────────────────────────────────

/** Toggle task open/closed (admin only) */
export const toggleTask = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, { id }) => {
    await assertAdmin(ctx)

    const task = await ctx.db.get(id)
    if (!task) throw new Error("Úkol nenalezen.")
    await ctx.db.patch(id, { isOpen: !task.isOpen })
  },
})
