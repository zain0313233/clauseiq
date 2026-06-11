import { test, expect } from "@playwright/test"
import { waitForPortal } from "./helpers/auth"
import { documentsListSearch } from "./helpers/documents"

test.describe("QA document filters", () => {
  test("unlimited liability filter shows doc 04", async ({ page }) => {
    await waitForPortal(page)
    await page.goto("/dashboard/documents")

    const unlimitedBtn = page.getByRole("button", {
      name: /Unlimited liability/i,
    })
    await expect(unlimitedBtn).toBeVisible()
    const filterPromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/documents") &&
        res.url().includes("portfolio=unlimited_liability") &&
        res.ok()
    )
    await unlimitedBtn.click()
    await filterPromise

    const vendorDoc = page
      .locator("div.group")
      .filter({ hasText: /04-vendor|unlimited.?liability/i })
      .first()

    await expect(vendorDoc).toBeVisible({ timeout: 15_000 })
    await expect(vendorDoc.getByText(/Unlimited liability/i)).toBeVisible()
  })

  test("doc 04 overview shows high risk score", async ({ page }) => {
    await waitForPortal(page)
    await page.goto("/dashboard/documents")

    const searchPromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/documents") &&
        res.url().includes("page=") &&
        res.ok()
    )
    await documentsListSearch(page).fill("04-vendor")
    await searchPromise

    const row = page.locator("div.group").filter({ hasText: /04-vendor/i }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole("link", { name: "Report" }).click()

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /04-vendor/i,
      { timeout: 30_000 }
    )

    const riskCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: "Risk score" })
      .first()
    await expect(riskCard).toBeVisible()
    // Doc 04 QA baseline: ~80/100 high — allow minor score drift
    await expect(riskCard.getByText(/\b(7\d|8\d|9\d)\/100\b/)).toBeVisible()
    await expect(riskCard.getByText(/high overall/i)).toBeVisible()
  })
})
