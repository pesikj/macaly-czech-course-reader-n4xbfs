import { convexAuth } from "@convex-dev/auth/server"
import { ResendOTP } from "./ResendOTP"

function normalizeEmail(email: string | undefined): string | null {
  const normalized = email?.trim().toLowerCase()
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null
  return normalized
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [ResendOTP],
  signIn: {
    // Limit brute-force OTP guessing: 10 failed verifications per hour
    maxFailedAttempsPerHour: 10,
  },
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      const email = normalizeEmail(args.profile.email)
      if (!email) throw new Error("Přístup zamítnut. Chybí platný e-mail.")

      // Enforce allowlist before issuing a session
      const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL)
      if (!adminEmail || email !== adminEmail) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = await (ctx.db as any)
          .query("allowedUsers")
          .withIndex("by_email", (q: any) => q.eq("email", email))
          .unique()
        if (!entry) throw new Error("Přístup zamítnut. Váš e-mail není registrován v kurzu.")
      }

      // Replicate the default create-or-update behaviour
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profileData = { ...(args.profile as any), email }
      if (args.existingUserId !== null) {
        await ctx.db.patch(args.existingUserId, profileData)
        return args.existingUserId
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (ctx.db as any).insert("users", profileData)
    },
  },
})
