"use node";

import { action } from "./_generated/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"

const REPO = "pesikj/vibecoding-macaly-course"
const BRANCH = "main"

async function githubFetch(path: string, token: string): Promise<Response> {
  return fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
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
async function fetchImageAsDataUri(imagePath: string, token: string): Promise<string | null> {
  const res = await githubFetch(imagePath, token)
  if (!res.ok) {
    console.error(`Failed to fetch image ${imagePath}: ${res.status}`)
    return null
  }
  const file = await res.json() as { content?: string; encoding?: string }
  if (!file.content) return null
  const ext = imagePath.split(".").pop()?.toLowerCase() ?? "png"
  const mime = EXT_TO_MIME[ext] ?? "image/png"
  const b64 = file.content.replace(/\n/g, "")
  return `data:${mime};base64,${b64}`
}

/** Replace relative image references with inline base64 data URIs */
async function embedImages(markdown: string, directory: string, token: string): Promise<string> {
  const imageRegex = /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g
  const matches: RegExpExecArray[] = []
  let m: RegExpExecArray | null
  while ((m = imageRegex.exec(markdown)) !== null) matches.push(m)

  let result = markdown
  for (const match of matches) {
    const [fullMatch, alt, src] = match
    const cleanSrc = src.startsWith("./") ? src.slice(2) : src
    const imagePath = `${directory}/${cleanSrc}`
    console.log(`Embedding image: ${imagePath}`)
    const dataUri = await fetchImageAsDataUri(imagePath, token)
    if (dataUri) {
      result = result.replace(fullMatch, `![${alt}](${dataUri})`)
    }
  }
  return result
}

export const syncFromGithub = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    lecturesSynced: v.number(),
  }),
  handler: async (ctx) => {
    const token = process.env.GITHUB_TOKEN
    if (!token) {
      return { success: false, message: "GITHUB_TOKEN není nastaven.", lecturesSynced: 0 }
    }

    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return { success: false, message: "Nejste přihlášeni.", lecturesSynced: 0 }
    }

    const logId: Id<"syncLog"> = await ctx.runMutation(internal.syncLog.createSyncLog, {})

    try {
      // 1. Fetch lectures.json
      const lecturesRes = await githubFetch("lectures.json", token)
      if (!lecturesRes.ok) {
        const msg = `Nelze načíst lectures.json: HTTP ${lecturesRes.status}`
        await ctx.runMutation(internal.syncLog.finishSyncLog, { logId, status: "error", message: msg, lecturesSynced: 0 })
        return { success: false, message: msg, lecturesSynced: 0 }
      }

      const lecturesFile = await lecturesRes.json() as { content: string }
      const lecturesMap: Record<string, string> = JSON.parse(decodeBase64(lecturesFile.content))
      console.log("lectures.json:", lecturesMap)

      // 2. Fetch each lecture + embed images
      let synced = 0
      const errors: string[] = []

      for (const [lectureId, directory] of Object.entries(lecturesMap)) {
        const mdPath = `${directory}/lekce-${lectureId}.md`
        console.log(`Fetching: ${mdPath}`)

        const mdRes = await githubFetch(mdPath, token)
        if (!mdRes.ok) {
          console.error(`Failed ${mdPath}: ${mdRes.status}`)
          errors.push(`lekce-${lectureId} (HTTP ${mdRes.status})`)
          continue
        }

        const mdFile = await mdRes.json() as { content: string }
        let markdown = decodeBase64(mdFile.content)

        // Embed images as base64 data URIs so they work without any proxy
        markdown = await embedImages(markdown, directory, token)

        const normalizedId = lectureId.startsWith("lekce-") ? lectureId : `lekce-${lectureId}`
        await ctx.runMutation(internal.lectures.upsertLectureContent, { lectureId: normalizedId, markdown })
        synced++
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
