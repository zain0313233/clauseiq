import { test } from "@playwright/test"
import { CRITICAL_CHAT_CASES } from "./qa-data"
import { isEngineHealthy } from "./helpers/engine"
import { openDocumentChatTab } from "./helpers/documents"
import { askDocumentChat } from "./helpers/chat"

test.describe("QA chat (critical docs)", () => {
  test.beforeEach(async ({ request }) => {
    const ok = await isEngineHealthy(request)
    test.skip(!ok, "Python engine not running on localhost:8000")
  })

  for (const chatCase of CRITICAL_CHAT_CASES) {
    test(`chat: ${chatCase.docMatch} — ${chatCase.question}`, async ({
      page,
    }) => {
      await openDocumentChatTab(
        page,
        chatCase.docMatch,
        chatCase.searchTerm
      )
      await askDocumentChat(page, chatCase)
    })
  }
})
