import { test as setup } from "@playwright/test"
import fs from "fs"
import path from "path"

const authFile = path.join(__dirname, ".auth/user.json")

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

setup("authenticate", async ({ request, page }) => {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD

  if (!email || !password) {
    throw new Error(
      "Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD in clauseiq/.env"
    )
  }

  fs.mkdirSync(path.dirname(authFile), { recursive: true })

  let token = ""
  let user: unknown
  let lastError = "unknown"

  for (let attempt = 1; attempt <= 24; attempt++) {
    const res = await request.post("/api/login", {
      data: { email, password },
      headers: { "Content-Type": "application/json" },
    })
    const text = await res.text()

    if (res.ok()) {
      const data = JSON.parse(text) as { token: string; user: unknown }
      token = data.token
      user = data.user
      break
    }

    lastError = `Login failed (${res.status()}): ${text.slice(0, 400)}`

    // Bad credentials — don't retry
    if (res.status() === 400 || res.status() === 401) {
      throw new Error(lastError)
    }

    // Rate limited — wait for the auth window to reset
    if (res.status() === 429) {
      await sleep(65_000)
      continue
    }

    // 404 / 5xx — dev server or route still compiling
    await sleep(3_000)
  }

  if (!token) {
    throw new Error(lastError)
  }

  await page.goto("/login")
  await page.evaluate(
    ([t, u]) => {
      localStorage.setItem("clauseiq_token", t as string)
      localStorage.setItem("clauseiq_user", JSON.stringify(u))
    },
    [token, user]
  )

  await page.goto("/dashboard")
  await page.getByRole("heading", { name: "Welcome to ClauseIQ" }).waitFor({
    timeout: 60_000,
  })

  await page.context().storageState({ path: authFile })
})
