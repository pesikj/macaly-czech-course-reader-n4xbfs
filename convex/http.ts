import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { auth } from "./auth"

const REPO = "pesikj/vibecoding-macaly-course"
const BRANCH = "main"

const http = httpRouter()

auth.addHttpRoutes(http)

// Proxy GitHub images from the private repo using the stored token
http.route({
  path: "/image",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url)
    const imagePath = url.searchParams.get("path")
    if (!imagePath) {
      return new Response("Missing path parameter", { status: 400 })
    }

    const token = process.env.GITHUB_TOKEN
    if (!token) {
      return new Response("GitHub token not configured", { status: 503 })
    }

    // Use GitHub Contents API (works for private repos)
    const apiUrl = `https://api.github.com/repos/${REPO}/contents/${imagePath}?ref=${BRANCH}`
    const apiResponse = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.raw+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })

    if (!apiResponse.ok) {
      console.error(`GitHub API error for ${imagePath}: ${apiResponse.status}`)
      return new Response(`Image not found: ${imagePath} (${apiResponse.status})`, { status: 404 })
    }

    const imageData = await apiResponse.arrayBuffer()
    // Determine content type from file extension
    const ext = imagePath.split(".").pop()?.toLowerCase() ?? "png"
    const contentTypeMap: Record<string, string> = {
      png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
      gif: "image/gif", svg: "image/svg+xml", webp: "image/webp",
    }
    const contentType = contentTypeMap[ext] ?? "image/png"

    return new Response(imageData, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    })
  }),
})

export default http
