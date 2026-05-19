import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { authTables } from "@convex-dev/auth/server"

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    displayName: v.optional(v.string()),
  }).index("email", ["email"]),

  allowedUsers: defineTable({
    email: v.string(),
    isAdmin: v.boolean(),
  }).index("by_email", ["email"]),

  lectureContents: defineTable({
    lectureId: v.string(),
    markdown: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    syncedAt: v.number(),
  }).index("by_lectureId", ["lectureId"]),

  syncLog: defineTable({
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    status: v.union(v.literal("running"), v.literal("success"), v.literal("error")),
    message: v.optional(v.string()),
    lecturesSynced: v.optional(v.number()),
  }),

  reflectionQuestions: defineTable({
    lectureId: v.string(),
    questionId: v.string(),
    question: v.string(),
    isOpen: v.boolean(),
    syncedAt: v.number(),
  })
    .index("by_lectureId", ["lectureId"])
    .index("by_questionId", ["questionId"]),

  reflectionAnswers: defineTable({
    questionId: v.string(),
    lectureId: v.string(),
    userId: v.id("users"),
    answer: v.string(),
    isAnonymous: v.boolean(),
    displayName: v.optional(v.string()),
    submittedAt: v.number(),
  })
    .index("by_questionId", ["questionId"])
    .index("by_userId_questionId", ["userId", "questionId"]),

  tasks: defineTable({
    lectureId: v.string(),
    taskId: v.string(),
    title: v.string(),
    markdown: v.string(),
    isOpen: v.boolean(),
    shareSolution: v.boolean(),
    solutionFields: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        type: v.string(),
        required: v.boolean(),
      })
    ),
    syncedAt: v.number(),
  })
    .index("by_lectureId", ["lectureId"])
    .index("by_taskId", ["taskId"]),

  taskSubmissions: defineTable({
    taskId: v.string(),
    lectureId: v.string(),
    userId: v.id("users"),
    displayName: v.string(),
    fields: v.array(
      v.object({
        fieldId: v.string(),
        value: v.string(),
      })
    ),
    submittedAt: v.number(),
    visibility: v.optional(v.union(v.literal("public"), v.literal("anonymous"), v.literal("private"))),
  })
    .index("by_taskId", ["taskId"])
    .index("by_userId_taskId", ["userId", "taskId"]),

  taskHearts: defineTable({
    submissionId: v.id("taskSubmissions"),
    userId: v.id("users"),
  })
    .index("by_submissionId", ["submissionId"])
    .index("by_userId_submissionId", ["userId", "submissionId"]),

  taskComments: defineTable({
    submissionId: v.id("taskSubmissions"),
    userId: v.id("users"),
    displayName: v.string(),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_submissionId", ["submissionId"]),
})
