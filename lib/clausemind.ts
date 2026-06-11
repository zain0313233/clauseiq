export const CLAUSEMIND_NAME = "ClauseMind"
export const CLAUSEMIND_TAGLINE = "Contract intelligence by ClauseIQ"

export const CLAUSEMIND_WELCOME = (documentTitle: string) =>
  `Hi! I'm ${CLAUSEMIND_NAME}, your contract intelligence assistant. Ask me anything about "${documentTitle}" — I'll answer using only the actual document text and cite the relevant clauses.`

export type QueryConfidence = "high" | "medium" | "low"

export type QuerySource = {
  content: string
  chunkIndex: number
  score: number
}

export type QueryMode = "default" | "plain_english"

export type ClauseMindQueryResponse = {
  answer: string
  sources: QuerySource[]
  confidence: QueryConfidence
}

export type PortfolioSource = {
  content: string
  chunkIndex: number
  documentId: string
  documentTitle: string
  score: number
}

export type ClauseMindPortfolioResponse = {
  answer: string
  sources: PortfolioSource[]
  confidence: QueryConfidence
  documentsSearched: number
}
