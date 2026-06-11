import { prisma } from '@/lib/prisma'
import { buildPagination } from '@/lib/pagination'
import type { TimelineEvent } from '@/types/analysis'

function parseTimeline(value: unknown): TimelineEvent[] {
  if (!Array.isArray(value)) return []
  return value as TimelineEvent[]
}

export const analysisRepository = {
  findByDocumentId: async (documentId: string) => {
    return prisma.documentAnalysis.findUnique({
      where: { documentId },
    })
  },

  getUserStats: async (userId: string) => {
    const [documents, analyses, queryCount] = await Promise.all([
      prisma.document.findMany({
        where: { userId },
        select: { id: true, status: true },
      }),
      prisma.documentAnalysis.findMany({
        where: { document: { userId } },
        select: {
          highRiskCount: true,
          mediumRiskCount: true,
          riskLevel: true,
          status: true,
        },
      }),
      prisma.message.count({
        where: {
          role: 'user',
          conversation: { userId },
        },
      }),
    ])

    const ready = documents.filter((d) => d.status === 'ready').length
    const risky = analyses.filter(
      (a) =>
        a.status === 'ready' &&
        (a.riskLevel === 'high' || a.highRiskCount > 0)
    ).length

    return {
      total: documents.length,
      ready,
      queries: queryCount,
      risky,
      analysesComplete: analyses.filter((a) => a.status === 'ready').length,
    }
  },

  getUpcomingDeadlines: async (userId: string) => {
    return collectUpcomingDeadlines(userId)
  },

  getUpcomingDeadlinesPaginated: async (
    userId: string,
    page: number,
    limit: number
  ) => {
    const events = await collectUpcomingDeadlines(userId)
    const pagination = buildPagination(events.length, page, limit)
    const start = (pagination.page - 1) * limit
    const deadlines = events.slice(start, start + limit)

    return { deadlines, ...pagination }
  },
}

async function collectUpcomingDeadlines(userId: string): Promise<TimelineEvent[]> {
  const rows = await prisma.documentAnalysis.findMany({
    where: {
      status: 'ready',
      document: { userId },
    },
    select: {
      timeline: true,
      document: {
        select: { id: true, title: true },
      },
    },
  })

  const events: TimelineEvent[] = []

  for (const row of rows) {
    const timeline = parseTimeline(row.timeline)
    for (const event of timeline) {
      if (!event?.date || !event?.label) continue
      events.push({
        ...event,
        documentId: row.document.id,
        documentTitle: row.document.title,
      })
    }
  }

  const typePriority: Record<string, number> = {
    expiration: 0,
    deadline: 1,
    renewal: 2,
    notice: 3,
    payment: 4,
    effective: 5,
    other: 6,
  }

  events.sort((a, b) => {
    const pa = typePriority[a.type] ?? 99
    const pb = typePriority[b.type] ?? 99
    if (pa !== pb) return pa - pb
    return a.date.localeCompare(b.date)
  })

  return events
}
