export type AgentVerdict = "ok" | "concern" | "critical"

export type AgentConfidence = "high" | "medium" | "low"

export type AgentOpinion = {
  id: string
  name: string
  role: string
  icon: string
  verdict: AgentVerdict
  summary: string
  findings: string[]
  confidence: AgentConfidence
}

export type AgentReport = {
  id: string
  documentId: string
  status: string
  agents: AgentOpinion[] | null
  createdAt: string
  updatedAt: string
}
