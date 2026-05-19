import { query, mutation, internalMutation } from "./_generated/server"
import { v } from "convex/values"
import { getAuthUserId } from "@convex-dev/auth/server"

// ── Helpers ────────────────────────────────────────────────────────

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx)
  if (!userId) throw new Error("Nejste přihlášeni.")
  const user = await ctx.db.get(userId)
  if (!user?.email) throw new Error("Uživatel nemá e-mail.")
  const entry = await ctx.db
    .query("allowedUsers")
    .withIndex("by_email", (q: any) => q.eq("email", user.email!.toLowerCase()))
    .unique()
  const adminEmail = process.env.ADMIN_EMAIL
  const isAdmin =
    (adminEmail && user.email.toLowerCase() === adminEmail.toLowerCase()) ||
    entry?.isAdmin === true
  if (!isAdmin) throw new Error("Nemáte oprávnění správce.")
}

// ── Admin: list all allowed users ─────────────────────────────────

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("allowedUsers"),
      _creationTime: v.number(),
      email: v.string(),
      isAdmin: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return await ctx.db.query("allowedUsers").order("asc").collect()
  },
})

// ── Admin: add a single user ──────────────────────────────────────

export const add = mutation({
  args: { email: v.string(), isAdmin: v.optional(v.boolean()) },
  returns: v.union(v.id("allowedUsers"), v.null()),
  handler: async (ctx, { email, isAdmin }) => {
    await requireAdmin(ctx)
    const normalized = email.trim().toLowerCase()
    const existing = await ctx.db
      .query("allowedUsers")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .unique()
    if (existing) return null // already exists
    return await ctx.db.insert("allowedUsers", { email: normalized, isAdmin: isAdmin ?? false })
  },
})

// ── Admin: bulk add users from array of email strings ─────────────

export const addBulk = mutation({
  args: {
    emails: v.array(v.string()),
    isAdmin: v.optional(v.boolean()),
  },
  returns: v.object({ added: v.number(), skipped: v.number() }),
  handler: async (ctx, { emails, isAdmin }) => {
    await requireAdmin(ctx)
    let added = 0
    let skipped = 0
    for (const raw of emails) {
      const normalized = raw.trim().toLowerCase()
      if (!normalized) continue
      const existing = await ctx.db
        .query("allowedUsers")
        .withIndex("by_email", (q) => q.eq("email", normalized))
        .unique()
      if (existing) {
        skipped++
      } else {
        await ctx.db.insert("allowedUsers", { email: normalized, isAdmin: isAdmin ?? false })
        added++
      }
    }
    return { added, skipped }
  },
})

// ── Admin: remove a user ──────────────────────────────────────────

export const remove = mutation({
  args: { id: v.id("allowedUsers") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx)
    await ctx.db.delete(id)
    return null
  },
})

// ── Internal: auto-create admin from ADMIN_EMAIL env var ──────────
// Called by cron

export const ensureAdminExists = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) {
      console.log("ensureAdminExists: ADMIN_EMAIL not set, skipping")
      return null
    }
    const normalized = adminEmail.trim().toLowerCase()
    const existing = await ctx.db
      .query("allowedUsers")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .unique()
    if (!existing) {
      console.log("ensureAdminExists: creating admin entry for", normalized)
      await ctx.db.insert("allowedUsers", { email: normalized, isAdmin: true })
    }
    return null
  },
})
