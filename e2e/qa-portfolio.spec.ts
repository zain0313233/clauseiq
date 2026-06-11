import { test, expect } from "@playwright/test"
import { PORTFOLIO_CASES } from "./qa-data"
import { isEngineHealthy } from "./helpers/engine"
import { waitForPortal } from "./helpers/auth"

test.describe("QA portfolio search", () => {
  test.beforeEach(async ({ request }) => {
    const ok = await isEngineHealthy(request)
    test.skip(!ok, "Python engine not running on localhost:8000")
  })

  for (const portfolioCase of PORTFOLIO_CASES) {
    test(`portfolio: ${portfolioCase.question}`, async ({ page }) => {
      await waitForPortal(page)

      const input = page.getByPlaceholder(
        'e.g. "Show contracts expiring in 60 days"'
      )
      await input.fill(portfolioCase.question)

      const responsePromise = page.waitForResponse(
        (res) =>
          res.url().includes("/api/query/portfolio") &&
          res.request().method() === "POST",
        { timeout: 90_000 }
      )

      await input.press("Enter")
      const response = await responsePromise
      expect(response.ok()).toBeTruthy()

      const data = (await response.json()) as { answer?: string }
      const answer = data.answer ?? ""

      for (const pattern of portfolioCase.patterns) {
        expect(answer).toMatch(pattern)
      }

      await expect(page.getByText(answer.slice(0, 50))).toBeVisible()
    })
  }
})
