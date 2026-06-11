export type DeviationFlag = "aligned" | "deviation" | "missing" | "extra"

export type DeviationSeverity = "high" | "medium" | "low" | "none"

export type ClauseDeviation = {
  clause: string
  standardText: string | null
  contractText: string | null
  flag: DeviationFlag
  severity: DeviationSeverity
  notes: string
}

export type ComparisonSummary = {
  overview?: string
  recommendation?: string
}

export type StandardTemplate = {
  id: string
  name: string
  type: string
  fileName: string
  fileType: string
  fileSize: number
  createdAt: string
  updatedAt: string
}

export type DocumentComparison = {
  id: string
  documentId: string
  templateId: string
  status: string
  deviationScore: number | null
  alignedCount: number
  deviationCount: number
  missingCount: number
  deviations: ClauseDeviation[] | null
  summary: ComparisonSummary | null
  createdAt: string
  updatedAt: string
  template?: StandardTemplate
}

export const TEMPLATE_TYPES = [
  { value: "nda", label: "NDA" },
  { value: "vendor", label: "Vendor Agreement" },
  { value: "employment", label: "Employment" },
  { value: "service", label: "Service Agreement" },
  { value: "saas", label: "SaaS / Software" },
  { value: "other", label: "Other" },
] as const
