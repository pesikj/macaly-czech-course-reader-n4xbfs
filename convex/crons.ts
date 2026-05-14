import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

// Ensure the ADMIN_EMAIL user exists in allowedUsers — runs hourly
crons.hourly(
  "ensure-admin-exists",
  { minuteUTC: 0 },
  internal.allowedUsers.ensureAdminExists,
  {}
)

export default crons
