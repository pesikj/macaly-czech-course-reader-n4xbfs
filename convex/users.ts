import { query, mutation, internalQuery } from "./_generated/server"
import { v } from "convex/values"
import { getAuthUserId } from "@convex-dev/auth/server"

export const currentLoggedInUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      phone: v.optional(v.string()),
      phoneVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      displayName: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    return await ctx.db.get(userId)
  },
})

/** Returns the user's display name, falling back to the email prefix. */
export const getMyDisplayName = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    const user = await ctx.db.get(userId)
    if (!user) return null
    if (user.displayName?.trim()) return user.displayName.trim()
    return user.email?.split("@")[0] ?? null
  },
})

export const setDisplayName = mutation({
  args: { displayName: v.string() },
  returns: v.null(),
  handler: async (ctx, { displayName }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Nejste přihlášeni.")
    const trimmed = displayName.trim()
    if (!trimmed) throw new Error("Jméno nesmí být prázdné.")
    if (trimmed.length > 100) throw new Error("Jméno je příliš dlouhé.")
    await ctx.db.patch(userId, { displayName: trimmed })
    return null
  },
})

export const isAdminById = internalQuery({
  args: { userId: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId)
    if (!user?.email) return false
    const email = user.email.toLowerCase()
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail && email === adminEmail.toLowerCase()) return true
    const entry = await ctx.db
      .query("allowedUsers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique()
    return entry?.isAdmin === true
  },
})

export const isAdmin = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return false
    const user = await ctx.db.get(userId)
    if (!user?.email) return false
    const email = user.email.toLowerCase()

    // Always grant admin if matches ADMIN_EMAIL env var
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail && email === adminEmail.toLowerCase()) return true

    // Otherwise check allowedUsers table
    const entry = await ctx.db
      .query("allowedUsers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique()
    return entry?.isAdmin === true
  },
})
