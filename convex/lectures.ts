import { query, internalMutation } from "./_generated/server"
import { v } from "convex/values"

export const getLectureContent = query({
  args: { lectureId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("lectureContents"),
      _creationTime: v.number(),
      lectureId: v.string(),
      markdown: v.string(),
      syncedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, { lectureId }) => {
    return await ctx.db
      .query("lectureContents")
      .withIndex("by_lectureId", (q) => q.eq("lectureId", lectureId))
      .unique()
  },
})

export const getAllSyncedLectureIds = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const rows = await ctx.db.query("lectureContents").collect()
    return rows.map((r) => r.lectureId)
  },
})

export const upsertLectureContent = internalMutation({
  args: {
    lectureId: v.string(),
    markdown: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { lectureId, markdown }) => {
    const existing = await ctx.db
      .query("lectureContents")
      .withIndex("by_lectureId", (q) => q.eq("lectureId", lectureId))
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, { markdown, syncedAt: Date.now() })
    } else {
      await ctx.db.insert("lectureContents", { lectureId, markdown, syncedAt: Date.now() })
    }
    return null
  },
})

export const getLatestSyncLog = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("syncLog"),
      _creationTime: v.number(),
      startedAt: v.number(),
      finishedAt: v.optional(v.number()),
      status: v.union(v.literal("running"), v.literal("success"), v.literal("error")),
      message: v.optional(v.string()),
      lecturesSynced: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    return await ctx.db
      .query("syncLog")
      .order("desc")
      .first()
  },
})
