import { internalMutation } from "./_generated/server"
import { v } from "convex/values"

export const createSyncLog = internalMutation({
  args: {},
  returns: v.id("syncLog"),
  handler: async (ctx) => {
    return await ctx.db.insert("syncLog", {
      startedAt: Date.now(),
      status: "running",
    })
  },
})

export const finishSyncLog = internalMutation({
  args: {
    logId: v.id("syncLog"),
    status: v.union(v.literal("success"), v.literal("error")),
    message: v.string(),
    lecturesSynced: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, { logId, status, message, lecturesSynced }) => {
    await ctx.db.patch(logId, {
      finishedAt: Date.now(),
      status,
      message,
      lecturesSynced,
    })
    return null
  },
})
