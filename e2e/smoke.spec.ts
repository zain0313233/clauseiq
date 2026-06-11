import { test, expect } from "@playwright/test"
import { waitForPortal } from "./helpers/auth"

test.describe("Smoke", () => {
  test("dashboard loads when authenticated", async ({ page }) => {
    await waitForPortal(page)
  })

  test("documents page lists uploads", async ({ page }) => {
    await waitForPortal(page)
    await page.goto("/dashboard/documents")
    await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible({
      timeout: 60_000,
    })

    const empty = page.getByText("No documents yet")
    const row = page.locator("div.group").first()
    await expect(empty.or(row)).toBeVisible()
  })

  test("login page reachable without auth", async ({ browser }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    })
    const page = await context.newPage()
    await page.goto("/login")
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible()
    await context.close()
  })
})
