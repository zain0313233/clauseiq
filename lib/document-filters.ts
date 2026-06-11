import type { ContractSummary, TimelineEvent } from '@/types/analysis'

export type PortfolioDocument = {
  id: string
  title: string
  status: string
  contractType?: string | null
  parties?: string[] | null
  effectiveDate?: string | null
  expirationDate?: string | null
  unlimitedLiability?: boolean
  analysis?: {
    status: string
    riskLevel?: string | null
    riskScore?: number | null
    highRiskCount?: number
    summary?: ContractSummary | null
    timeline?: TimelineEvent[] | null
    risks?: { title?: string; description?: string }[] | null
  } | null
}

export type PortfolioFilter =
  | 'all'
  | 'expiring'
  | 'high_risk'
  | 'unlimited_liability'

const TYPE_LABELS: Record<string, string> = {
  nda: 'NDA',
  vendor: 'Vendor',
  employment: 'Employment',
  service: 'Service',
  saas: 'SaaS',
  other: 'Other',
}

export function contractTypeLabel(type?: string | null) {
  if (!type) return null
  return TYPE_LABELS[type] ?? type
}

function parseFlexibleDate(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const iso = Date.parse(trimmed)
  if (!Number.isNaN(iso)) return new Date(iso)

  const match = trimmed.match(
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/
  )
  if (match) {
    const [, a, b, c] = match
    const year = c.length === 2 ? `20${c}` : c
    const d1 = new Date(`${year}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`)
    const d2 = new Date(`${year}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`)
    if (!Number.isNaN(d1.getTime())) return d1
    if (!Number.isNaN(d2.getTime())) return d2
  }

  return null
}

export function getExpirationDate(doc: PortfolioDocument): string | null {
  if (doc.expirationDate) return doc.expirationDate

  const summary = doc.analysis?.summary as ContractSummary | undefined
  if (summary?.expirationDate) return summary.expirationDate

  const timeline = doc.analysis?.timeline as TimelineEvent[] | undefined
  const expEvent = timeline?.find((e) => e.type === 'expiration')
  return expEvent?.date ?? null
}

export function isExpiringWithinDays(
  doc: PortfolioDocument,
  days = 60
): boolean {
  const exp = getExpirationDate(doc)
  if (!exp) return false

  const parsed = parseFlexibleDate(exp)
  if (!parsed) return false

  const now = new Date()
  const limit = new Date()
  limit.setDate(limit.getDate() + days)

  return parsed >= now && parsed <= limit
}

export function isHighRisk(doc: PortfolioDocument): boolean {
  const a = doc.analysis
  if (!a || a.status !== 'ready') return false
  return (
    a.riskLevel === 'high' ||
    (a.highRiskCount ?? 0) > 0 ||
    (a.riskScore ?? 0) >= 70
  )
}

export function hasUnlimitedLiability(doc: PortfolioDocument): boolean {
  if (doc.unlimitedLiability) return true

  const risks = doc.analysis?.risks
  if (!Array.isArray(risks)) return false

  return risks.some((r) => {
    const blob = `${r.title ?? ''} ${r.description ?? ''}`.toLowerCase()
    return (
      blob.includes('unlimited liability') ||
      blob.includes('uncapped liability') ||
      blob.includes('no cap on liability')
    )
  })
}

export function matchesPortfolioFilter(
  doc: PortfolioDocument,
  filter: PortfolioFilter
): boolean {
  if (filter === 'all') return true
  if (filter === 'expiring') return isExpiringWithinDays(doc)
  if (filter === 'high_risk') return isHighRisk(doc)
  if (filter === 'unlimited_liability') return hasUnlimitedLiability(doc)
  return true
}
