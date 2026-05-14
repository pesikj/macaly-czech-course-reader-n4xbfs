import { query, internalQuery, internalMutation, internalAction } from "./_generated/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"

export const getLectureContent = query({
  args: { lectureId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("lectureContents"),
      _creationTime: v.number(),
      lectureId: v.string(),
      url: v.union(v.string(), v.null()),
      markdown: v.union(v.string(), v.null()),
      syncedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, { lectureId }) => {
    const doc = await ctx.db
      .query("lectureContents")
      .withIndex("by_lectureId", (q) => q.eq("lectureId", lectureId))
      .unique()
    if (!doc) return null
    const url = doc.storageId ? await ctx.storage.getUrl(doc.storageId) : null
    return { ...doc, url, markdown: doc.markdown ?? null }
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

export const saveLectureStorageId = internalMutation({
  args: {
    lectureId: v.string(),
    storageId: v.id("_storage"),
    oldStorageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, { lectureId, storageId, oldStorageId }) => {
    if (oldStorageId) {
      await ctx.storage.delete(oldStorageId)
    }
    const existing = await ctx.db
      .query("lectureContents")
      .withIndex("by_lectureId", (q) => q.eq("lectureId", lectureId))
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, { storageId, syncedAt: Date.now() })
    } else {
      await ctx.db.insert("lectureContents", { lectureId, storageId, syncedAt: Date.now() })
    }
    return null
  },
})

export const getExistingStorageId = internalQuery({
  args: { lectureId: v.string() },
  returns: v.union(v.id("_storage"), v.null()),
  handler: async (ctx, { lectureId }) => {
    const doc = await ctx.db
      .query("lectureContents")
      .withIndex("by_lectureId", (q) => q.eq("lectureId", lectureId))
      .unique()
    return doc?.storageId ?? null
  },
})

export const upsertLectureContent = internalAction({
  args: {
    lectureId: v.string(),
    markdown: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { lectureId, markdown }) => {
    const oldStorageId = await ctx.runQuery(internal.lectures.getExistingStorageId, { lectureId })
    const blob = new Blob([markdown], { type: "text/markdown" })
    const storageId = await ctx.storage.store(blob)
    await ctx.runMutation(internal.lectures.saveLectureStorageId, {
      lectureId,
      storageId,
      ...(oldStorageId ? { oldStorageId } : {}),
    })
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
