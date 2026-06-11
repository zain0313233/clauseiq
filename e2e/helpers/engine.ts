import type { APIRequestContext } from "@playwright/test"

const ENGINE_URL = process.env.PLAYWRIGHT_ENGINE_URL ?? "http://localhost:8000"

export async function isEngineHealthy(
  request: APIRequestContext
): Promise<boolean> {
  try {
    const res = await request.get(`${ENGINE_URL}/health`, { timeout: 5_000 })
    return res.ok()
  } catch {
    try {
      const res = await request.get(`${ENGINE_URL}/`, { timeout: 5_000 })
      return res.ok()
    } catch {
      return false
    }
  }
}
