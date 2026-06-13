export type RiskSeverity = "high" | "medium" | "low"

export type ContractRisk = {
  severity: RiskSeverity
  title: string
  description: string
  clause?: string
}

export type MissingClause = {
  name: string
  importance: "critical" | "recommended"
  description: string
}

export type ContractObligation = {
  party: string
  description: string
  dueDate?: string | null
  type: "payment" | "delivery" | "notice" | "renewal" | "confidentiality" | "other"
  clause?: string | null
}

export type TimelineEvent = {
  date: string
  label: string
  type: "effective" | "expiration" | "payment" | "notice" | "renewal" | "deadline" | "other"
  description?: string
  party?: string | null
  documentId?: string
  documentTitle?: string
}

export type ContractSummary = {
  parties?: string[]
  effectiveDate?: string
  expirationDate?: string
  paymentTerms?: string
  renewalTerms?: string
  governingLaw?: string
  keyObligations?: string[]
  overview?: string
}

export type DocumentAnalysis = {
  id: string
  documentId: string
  status: string
  riskScore: number | null
  riskLevel: string | null
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
  summary: ContractSummary | null
  risks: ContractRisk[] | null
  missingClauses: MissingClause[] | null
  obligations: ContractObligation[] | null
  timeline: TimelineEvent[] | null
  createdAt: string
  updatedAt: string
}

export type QueryMode = "default" | "plain_english" | "conversational"
