/** Maps testing/QA-TEST-SUITE.md to Playwright checks (keyword patterns, not exact LLM text). */

export type ChatCase = {
  /** Filename slug filter in the documents list search box */
  searchTerm: string
  docMatch: RegExp
  question: string
  answerPatterns: RegExp[]
  mustNotMatch?: RegExp[]
}

export const CRITICAL_CHAT_CASES: ChatCase[] = [
  {
    searchTerm: "04-vendor",
    docMatch: /04-vendor/i,
    question: "Is there a limitation of liability?",
    answerPatterns: [/no.*limit|unlimited|not.*limited/i],
    mustNotMatch: [/capped at \$/i, /\{\s*"answer"/],
  },
  {
    searchTerm: "07-incomplete",
    docMatch: /07-incomplete/i,
    question: "Is there a force majeure clause?",
    answerPatterns: [/no|does not include|not include/i],
    mustNotMatch: [/could not find/i, /\{\s*"answer"/],
  },
  {
    searchTerm: "07-incomplete",
    docMatch: /07-incomplete/i,
    question: "What are the termination notice periods?",
    answerPatterns: [/thirty|30.*day/i, /twenty|20.*day/i],
    mustNotMatch: [/\{\s*"answer"/, /Confidence:\s*high/i],
  },
  {
    searchTerm: "02-saas",
    docMatch: /02-saas|cloudhost/i,
    question: "What is the monthly fee?",
    answerPatterns: [/2,?400|\$2,?400/i],
  },
  {
    searchTerm: "06-office",
    docMatch: /06-office|office.?lease/i,
    question: "When does the lease expire?",
    answerPatterns: [/march\s+15,\s*2026|2026-03-15/i],
  },
  {
    searchTerm: "10-msa-amendment",
    docMatch: /10-msa-amendment|amendment/i,
    question: "What is the new termination notice period for convenience?",
    answerPatterns: [/ninety|90.*day/i],
  },
]

export const PORTFOLIO_CASES = [
  {
    question: "Which contracts have unlimited liability?",
    patterns: [/04|globalparts|fastship|unlimited/i],
  },
  {
    question: "Which contract expires on March 15, 2026?",
    patterns: [/06|office|lease|pixel|parkview|march\s+15/i],
  },
]
