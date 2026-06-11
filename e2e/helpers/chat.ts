import { expect, type Page } from "@playwright/test"

export type ChatAssert = {
  question: string
  answerPatterns: RegExp[]
  mustNotMatch?: RegExp[]
}

export async function askDocumentChat(
  page: Page,
  { question, answerPatterns, mustNotMatch }: ChatAssert
): Promise<string> {
  const input = page.getByPlaceholder("Type a message…")
  await input.fill(question)

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/query") &&
      res.request().method() === "POST" &&
      res.status() === 200,
    { timeout: 90_000 }
  )

  await input.press("Enter")
  const response = await responsePromise
  const data = (await response.json()) as { answer?: string }
  const answer = data.answer ?? ""

  for (const pattern of answerPatterns) {
    expect(answer, `Answer for "${question}"`).toMatch(pattern)
  }

  for (const pattern of mustNotMatch ?? []) {
    expect(answer, `Answer for "${question}"`).not.toMatch(pattern)
  }

  const bubble = page
    .locator("div.whitespace-pre-wrap")
    .filter({ hasText: answer.slice(0, 40) })
    .last()
  await expect(bubble).toBeVisible()

  return answer
}
