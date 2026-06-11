import { expect, type Locator, type Page } from "@playwright/test"
import { waitForPortal } from "./auth"

/** Documents page search (not the global header search). */
export function documentsListSearch(page: Page): Locator {
  return page.getByRole("main").getByPlaceholder("Search documents...")
}

async function waitForDocumentsLoaded(page: Page): Promise<void> {
  await page.waitForResponse(
    (res) => res.url().includes("/api/documents") && res.ok(),
    { timeout: 60_000 }
  )
}

export async function openDocumentReport(
  page: Page,
  docMatch: RegExp,
  searchTerm?: string
): Promise<void> {
  await waitForPortal(page)

  const documentsPromise = page.waitForResponse(
    (res) => res.url().includes("/api/documents") && res.ok()
  )
  await page.goto("/dashboard/documents")
  await documentsPromise

  await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible({
    timeout: 60_000,
  })

  if (searchTerm) {
    const searchPromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/documents") &&
        res.url().includes("page=") &&
        res.ok()
    )
    await documentsListSearch(page).fill(searchTerm)
    await searchPromise
  }

  const row = page.locator("div.group").filter({ hasText: docMatch }).first()
  await expect(row, `No document matching ${docMatch}`).toBeVisible({
    timeout: 30_000,
  })

  await row.getByRole("link", { name: "Report" }).click()
  await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible({
    timeout: 30_000,
  })
}

export async function openDocumentChatTab(
  page: Page,
  docMatch: RegExp,
  searchTerm?: string
): Promise<void> {
  await openDocumentReport(page, docMatch, searchTerm)
  await page.getByRole("tab", { name: "Chat" }).click()
  await expect(page.getByPlaceholder("Type a message…")).toBeVisible()
}
