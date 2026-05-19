import { mutation, query, internalMutation } from "./_generated/server"
import { v } from "convex/values"
import { getAuthUserId } from "@convex-dev/auth/server"

// ── Internal: called from sync ────────────────────────────────────

export const upsertReflectionQuestions = internalMutation({
  args: {
    lectureId: v.string(),
    questions: v.array(v.object({ id: v.string(), question: v.string() })),
  },
  handler: async (ctx, { lectureId, questions }) => {
    const now = Date.now()
    for (const q of questions) {
      const existing = await ctx.db
        .query("reflectionQuestions")
        .withIndex("by_questionId", (qb) => qb.eq("questionId", q.id))
        .filter((qb) => qb.eq(qb.field("lectureId"), lectureId))
        .first()

      if (existing) {
        // Update question text & syncedAt but preserve isOpen state
        await ctx.db.patch(existing._id, { question: q.question, syncedAt: now })
      } else {
        await ctx.db.insert("reflectionQuestions", {
          lectureId,
          questionId: q.id,
          question: q.question,
          isOpen: false,
          syncedAt: now,
        })
      }
    }
    console.log(`Upserted ${questions.length} reflection questions for lecture ${lectureId}`)
  },
})

// ── Student queries ───────────────────────────────────────────────

/** Returns open reflection questions for a lecture (for students) */
export const getOpenQuestionsForLecture = query({
  args: { lectureId: v.string() },
  handler: async (ctx, { lectureId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const questions = await ctx.db
      .query("reflectionQuestions")
      .withIndex("by_lectureId", (q) => q.eq("lectureId", lectureId))
      .filter((q) => q.eq(q.field("isOpen"), true))
      .collect()

    // For each open question, fetch the user's existing answer if any
    const result = await Promise.all(
      questions.map(async (q) => {
        const myAnswer = await ctx.db
          .query("reflectionAnswers")
          .withIndex("by_userId_questionId", (qb) =>
            qb.eq("userId", userId).eq("questionId", q.questionId)
          )
          .first()

        const allAnswers = await ctx.db
          .query("reflectionAnswers")
          .withIndex("by_questionId", (qb) => qb.eq("questionId", q.questionId))
          .order("asc")
          .collect()

        return {
          _id: q._id,
          questionId: q.questionId,
          question: q.question,
          myAnswer: myAnswer
            ? {
                answer: myAnswer.answer,
                isAnonymous: myAnswer.isAnonymous,
                displayName: myAnswer.displayName,
              }
            : null,
          answers: allAnswers.map((a) => ({
            _id: a._id,
            answer: a.answer,
            isAnonymous: a.isAnonymous,
            displayName: a.displayName,
            isOwn: a.userId === userId,
          })),
        }
      })
    )

    return result
  },
})

// ── Student mutations ─────────────────────────────────────────────

/** Submit or update a reflection answer */
export const submitAnswer = mutation({
  args: {
    questionId: v.string(),
    lectureId: v.string(),
    answer: v.string(),
    isAnonymous: v.boolean(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, { questionId, lectureId, answer, isAnonymous, displayName }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Nejste přihlášeni.")

    if (!answer.trim()) throw new Error("Odpověď nesmí být prázdná.")

    // Check the question is actually open
    const question = await ctx.db
      .query("reflectionQuestions")
      .withIndex("by_questionId", (q) => q.eq("questionId", questionId))
      .filter((q) => q.eq(q.field("lectureId"), lectureId))
      .first()

    if (!question) throw new Error("Otázka nenalezena.")
    if (!question.isOpen) throw new Error("Tato otázka již není otevřena.")

    const existing = await ctx.db
      .query("reflectionAnswers")
      .withIndex("by_userId_questionId", (q) =>
        q.eq("userId", userId).eq("questionId", questionId)
      )
      .first()

    const payload = {
      questionId,
      lectureId,
      userId,
      answer: answer.trim(),
      isAnonymous,
      displayName: isAnonymous ? undefined : displayName?.trim() || undefined,
      submittedAt: Date.now(),
    }

    if (existing) {
      await ctx.db.patch(existing._id, payload)
    } else {
      await ctx.db.insert("reflectionAnswers", payload)
    }
  },
})

// ── Admin queries ─────────────────────────────────────────────────

/** List all reflection questions with answer counts (admin only) */
export const listAllQuestions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    // Admin check via env
    const user = await ctx.db.get(userId)
    const adminEmail = process.env.ADMIN_EMAIL
    const isEnvAdmin = adminEmail && user?.email === adminEmail
    if (!isEnvAdmin) {
      const allowed = user?.email
        ? await ctx.db
            .query("allowedUsers")
            .withIndex("by_email", (q) => q.eq("email", user.email!))
            .first()
        : null
      if (!allowed?.isAdmin) return null
    }

    const questions = await ctx.db.query("reflectionQuestions").collect()

    const result = await Promise.all(
      questions.map(async (q) => {
        const answers = await ctx.db
          .query("reflectionAnswers")
          .withIndex("by_questionId", (qb) => qb.eq("questionId", q.questionId))
          .collect()
        return {
          _id: q._id,
          lectureId: q.lectureId,
          questionId: q.questionId,
          question: q.question,
          isOpen: q.isOpen,
          syncedAt: q.syncedAt,
          answerCount: answers.length,
        }
      })
    )

    // Sort by lectureId then questionId
    result.sort((a, b) => {
      if (a.lectureId < b.lectureId) return -1
      if (a.lectureId > b.lectureId) return 1
      if (a.questionId < b.questionId) return -1
      if (a.questionId > b.questionId) return 1
      return 0
    })

    return result
  },
})

/** Get all answers for a specific question (for discussion view, admin only) */
export const getAnswersForQuestion = query({
  args: { questionDocId: v.id("reflectionQuestions") },
  handler: async (ctx, { questionDocId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    const user = await ctx.db.get(userId)
    const adminEmail = process.env.ADMIN_EMAIL
    const isEnvAdmin = adminEmail && user?.email === adminEmail
    if (!isEnvAdmin) {
      const allowed = user?.email
        ? await ctx.db
            .query("allowedUsers")
            .withIndex("by_email", (q) => q.eq("email", user.email!))
            .first()
        : null
      if (!allowed?.isAdmin) return null
    }

    const question = await ctx.db.get(questionDocId)
    if (!question) return null

    const answers = await ctx.db
      .query("reflectionAnswers")
      .withIndex("by_questionId", (q) => q.eq("questionId", question.questionId))
      .order("asc")
      .collect()

    return {
      question,
      answers: answers.map((a) => ({
        _id: a._id,
        answer: a.answer,
        isAnonymous: a.isAnonymous,
        displayName: a.displayName,
        submittedAt: a.submittedAt,
      })),
    }
  },
})

// ── Admin mutations ───────────────────────────────────────────────

/** Toggle question open/closed (admin only) */
export const toggleQuestion = mutation({
  args: { id: v.id("reflectionQuestions") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Nejste přihlášeni.")

    const user = await ctx.db.get(userId)
    const adminEmail = process.env.ADMIN_EMAIL
    const isEnvAdmin = adminEmail && user?.email === adminEmail
    if (!isEnvAdmin) {
      const allowed = user?.email
        ? await ctx.db
            .query("allowedUsers")
            .withIndex("by_email", (q) => q.eq("email", user.email!))
            .first()
        : null
      if (!allowed?.isAdmin) throw new Error("Nemáte oprávnění.")
    }

    const question = await ctx.db.get(id)
    if (!question) throw new Error("Otázka nenalezena.")
    await ctx.db.patch(id, { isOpen: !question.isOpen })
  },
})
