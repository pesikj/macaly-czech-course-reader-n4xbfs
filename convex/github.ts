"use node";

import { action } from "./_generated/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"

const REPO = "pesikj/vibecoding-macaly-course"

async function githubFetch(path: string, token: string, branch: string): Promise<Response> {
  return fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${branch}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  })
}

function decodeBase64(encoded: string): string {
  return Buffer.from(encoded.replace(/\n/g, ""), "base64").toString("utf-8")
}

const EXT_TO_MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", svg: "image/svg+xml", webp: "image/webp",
}

/** Fetch image from GitHub and return as base64 data URI, or null on failure */
async function fetchImageAsDataUri(imagePath: string, token: string, branch: string): Promise<string | null> {
  const res = await githubFetch(imagePath, token, branch)
  if (!res.ok) {
    console.error(`Failed to fetch image ${imagePath}: ${res.status}`)
    return null
  }
  const file = await res.json() as { content?: string; encoding?: string; sha?: string; size?: number }
  const ext = imagePath.split(".").pop()?.toLowerCase() ?? "png"
  const mime = EXT_TO_MIME[ext] ?? "image/png"

  // Files > 1 MB: content is empty, use Git Blobs API instead
  if (!file.content && file.sha) {
    const blobRes = await fetch(
      `https://api.github.com/repos/${REPO}/git/blobs/${file.sha}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" } }
    )
    if (!blobRes.ok) {
      console.error(`Failed to fetch blob for ${imagePath}: ${blobRes.status}`)
      return null
    }
    const blob = await blobRes.json() as { content?: string }
    if (!blob.content) return null
    return `data:${mime};base64,${blob.content.replace(/\n/g, "")}`
  }

  if (!file.content) return null
  return `data:${mime};base64,${file.content.replace(/\n/g, "")}`
}

/** Replace relative image references with inline base64 data URIs */
async function embedImages(markdown: string, directory: string, token: string, branch: string): Promise<string> {
  const imageRegex = /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g
  const matches: RegExpExecArray[] = []
  let m: RegExpExecArray | null
  while ((m = imageRegex.exec(markdown)) !== null) matches.push(m)

  let result = markdown
  for (const match of matches) {
    const [fullMatch, alt, src] = match
    const cleanSrc = src.startsWith("./") ? src.slice(2) : src
    const imagePath = `${directory}/${cleanSrc}`
    console.log(`Embedding image: ${imagePath} (branch: ${branch})`)
    const dataUri = await fetchImageAsDataUri(imagePath, token, branch)
    if (dataUri) {
      result = result.replace(fullMatch, `![${alt}](${dataUri})`)
    }
  }
  return result
}

export const syncFromGithub = action({
  args: { branch: v.optional(v.string()) },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    lecturesSynced: v.number(),
  }),
  handler: async (ctx, { branch: branchArg }) => {
    const branch = branchArg?.trim() || "main"
    const token = process.env.GITHUB_TOKEN
    if (!token) {
      return { success: false, message: "GITHUB_TOKEN není nastaven.", lecturesSynced: 0 }
    }

    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return { success: false, message: "Nejste přihlášeni.", lecturesSynced: 0 }
    }

    // Only admins may trigger sync
    const userIsAdmin = await ctx.runQuery(internal.users.isAdminById, { userId })
    if (!userIsAdmin) {
      return { success: false, message: "Nemáte oprávnění.", lecturesSynced: 0 }
    }

    const logId: Id<"syncLog"> = await ctx.runMutation(internal.syncLog.createSyncLog, {})

    try {
      // 1. Fetch lectures.json
      const lecturesRes = await githubFetch("lectures.json", token, branch)
      if (!lecturesRes.ok) {
        const msg = `Nelze načíst lectures.json z větve "${branch}": HTTP ${lecturesRes.status}`
        await ctx.runMutation(internal.syncLog.finishSyncLog, { logId, status: "error", message: msg, lecturesSynced: 0 })
        return { success: false, message: msg, lecturesSynced: 0 }
      }

      const lecturesFile = await lecturesRes.json() as { content: string }
      const lecturesList: Array<{ cislo: number; adresar: string; tema?: string; kompetence?: string }> = JSON.parse(decodeBase64(lecturesFile.content))
      console.log(`lectures.json (branch: ${branch}):`, lecturesList)

      // 2. Fetch each lecture + embed images
      let synced = 0
      const errors: string[] = []

      for (const { cislo, adresar } of lecturesList) {
        const mdPath = `${adresar}/lekce-${cislo}.md`
        console.log(`Fetching: ${mdPath}`)

        const mdRes = await githubFetch(mdPath, token, branch)
        if (!mdRes.ok) {
          console.error(`Failed ${mdPath}: ${mdRes.status}`)
          errors.push(`${adresar} (HTTP ${mdRes.status})`)
          continue
        }

        const mdFile = await mdRes.json() as { content: string }
        let markdown = decodeBase64(mdFile.content)

        // Embed images as base64 data URIs so they work without any proxy
        markdown = await embedImages(markdown, adresar, token, branch)

        await ctx.runAction(internal.lectures.upsertLectureContent, { lectureId: adresar, markdown })
        synced++

        // Try to sync activities.json (reflection questions + tasks) — optional, no error on missing
        const activitiesPath = `${adresar}/activities.json`
        const activitiesRes = await githubFetch(activitiesPath, token, branch)
        if (activitiesRes.ok) {
          try {
            const activitiesFile = await activitiesRes.json() as { content: string }
            const activitiesData = JSON.parse(decodeBase64(activitiesFile.content)) as {
              reflection_board?: { questions?: Array<{ id: string; question: string }> }
              tasks?: Array<{
                id: string
                title: string
                file: string
                share_solution: boolean
                solution_fields: Array<{ id: string; label: string; type: string; required: boolean }>
              }>
            }

            // Sync reflection questions
            const questions = activitiesData?.reflection_board?.questions ?? []
            if (questions.length > 0) {
              await ctx.runMutation(internal.reflections.upsertReflectionQuestions, {
                lectureId: adresar,
                questions,
              })
              console.log(`Synced ${questions.length} reflection questions for ${adresar}`)
            }

            // Sync tasks
            const tasks = activitiesData?.tasks ?? []
            for (const task of tasks) {
              // Fetch the task markdown file
              const taskMarkdownPath = `${adresar}/${task.file}`
              console.log(`Fetching task markdown: ${taskMarkdownPath}`)
              const taskMdRes = await githubFetch(taskMarkdownPath, token, branch)
              let taskMarkdown = ""
              if (taskMdRes.ok) {
                const taskMdFile = await taskMdRes.json() as { content: string }
                taskMarkdown = decodeBase64(taskMdFile.content)
              } else {
                console.warn(`Failed to fetch task markdown ${taskMarkdownPath}: ${taskMdRes.status}`)
              }

              await ctx.runMutation(internal.tasks.upsertTask, {
                lectureId: adresar,
                taskId: task.id,
                title: task.title,
                markdown: taskMarkdown,
                shareSolution: task.share_solution ?? false,
                solutionFields: (task.solution_fields ?? []).map((f) => ({
                  id: f.id,
                  label: f.label,
                  type: f.type,
                  required: f.required ?? false,
                })),
              })
            }
            if (tasks.length > 0) {
              console.log(`Synced ${tasks.length} tasks for ${adresar}`)
            }
          } catch (e) {
            console.warn(`Failed to parse activities.json for ${adresar}:`, e)
          }
        }
      }

      const status = errors.length === 0 ? "success" : "error"
      const message = errors.length > 0
        ? `Synchronizováno ${synced} lekcí, chyby: ${errors.join(", ")}`
        : `Úspěšně synchronizováno ${synced} lekcí.`

      await ctx.runMutation(internal.syncLog.finishSyncLog, { logId, status, message, lecturesSynced: synced })
      return { success: errors.length === 0, message, lecturesSynced: synced }

    } catch (err) {
      const message = `Chyba: ${err instanceof Error ? err.message : String(err)}`
      await ctx.runMutation(internal.syncLog.finishSyncLog, { logId, status: "error", message, lecturesSynced: 0 })
      return { success: false, message, lecturesSynced: 0 }
    }
  },
})
