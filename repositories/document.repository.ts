import { prisma } from '@/lib/prisma'
import { buildPagination } from '@/lib/pagination'
import {
  hasUnlimitedLiability,
  isExpiringWithinDays,
  isHighRisk,
  matchesPortfolioFilter,
  type PortfolioDocument,
  type PortfolioFilter,
} from '@/lib/document-filters'
import type { Prisma } from '@prisma/client'

type DocumentListStatus = 'all' | 'ready' | 'processing' | 'failed'

const documentListInclude = {
  analysis: true,
} satisfies Prisma.DocumentInclude

function buildStatusWhere(
  status: DocumentListStatus
): Prisma.DocumentWhereInput | undefined {
  if (status === 'ready') return { status: 'ready' }
  if (status === 'failed') return { status: 'failed' }
  if (status === 'processing') return { status: { in: ['processing', 'pending'] } }
  return undefined
}

function buildPortfolioSqlWhere(
  portfolio: PortfolioFilter
): Prisma.DocumentWhereInput | undefined {
  if (portfolio === 'high_risk') {
    return {
      analysis: {
        is: {
          status: 'ready',
          OR: [
            { riskLevel: 'high' },
            { highRiskCount: { gt: 0 } },
            { riskScore: { gte: 70 } },
          ],
        },
      },
    }
  }
  return undefined
}

function needsMemoryPortfolioFilter(portfolio: PortfolioFilter): boolean {
  return portfolio === 'expiring' || portfolio === 'unlimited_liability'
}

function buildBaseWhere(
  userId: string,
  search: string,
  status: DocumentListStatus,
  portfolio: PortfolioFilter
): Prisma.DocumentWhereInput {
  const where: Prisma.DocumentWhereInput = { userId }

  const statusWhere = buildStatusWhere(status)
  if (statusWhere) Object.assign(where, statusWhere)

  const portfolioWhere = buildPortfolioSqlWhere(portfolio)
  if (portfolioWhere) Object.assign(where, portfolioWhere)

  const q = search.trim()
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { fileName: { contains: q, mode: 'insensitive' } },
    ]
  }

  return where
}

export const documentRepository = {
  create: async (data: {
    title: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number
    userId: string
  }) => {
    return prisma.document.create({ data })
  },

  findByUserId: async (userId: string) => {
    return prisma.document.findMany({
      where: { userId },
      include: { analysis: true, agentReport: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  getSummaryByUserId: async (userId: string) => {
    const [total, ready, processing, failed, portfolioRows] = await Promise.all([
      prisma.document.count({ where: { userId } }),
      prisma.document.count({ where: { userId, status: 'ready' } }),
      prisma.document.count({
        where: { userId, status: { in: ['processing', 'pending'] } },
      }),
      prisma.document.count({ where: { userId, status: 'failed' } }),
      prisma.document.findMany({
        where: { userId },
        select: {
          expirationDate: true,
          unlimitedLiability: true,
          analysis: {
            select: {
              status: true,
              riskLevel: true,
              riskScore: true,
              highRiskCount: true,
              summary: true,
              timeline: true,
              risks: true,
            },
          },
        },
      }),
    ])

    const portfolioDocs = portfolioRows as PortfolioDocument[]

    return {
      total,
      ready,
      processing,
      failed,
      portfolio: {
        expiring: portfolioDocs.filter((d) => isExpiringWithinDays(d)).length,
        highRisk: portfolioDocs.filter((d) => isHighRisk(d)).length,
        unlimited: portfolioDocs.filter((d) => hasUnlimitedLiability(d)).length,
      },
    }
  },

  findPaginatedForUser: async (
    userId: string,
    options: {
      page: number
      limit: number
      search?: string
      status?: DocumentListStatus
      portfolio?: PortfolioFilter
    }
  ) => {
    const { page, limit, search = '', status = 'all', portfolio = 'all' } =
      options

    const where = buildBaseWhere(userId, search, status, portfolio)

    if (needsMemoryPortfolioFilter(portfolio)) {
      const rows = await prisma.document.findMany({
        where: buildBaseWhere(userId, search, status, 'all'),
        include: documentListInclude,
        orderBy: { createdAt: 'desc' },
      })

      const portfolioDocs = rows as PortfolioDocument[]
      const filtered = portfolioDocs.filter((doc) =>
        matchesPortfolioFilter(doc, portfolio)
      )

      const pagination = buildPagination(filtered.length, page, limit)
      const start = (pagination.page - 1) * limit
      const documents = filtered.slice(start, start + limit)

      return { documents, ...pagination }
    }

    const total = await prisma.document.count({ where })
    const pagination = buildPagination(total, page, limit)
    const skip = (pagination.page - 1) * limit

    const documents = await prisma.document.findMany({
      where,
      include: documentListInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    return { documents, ...pagination }
  },

  findReadyByUserId: async (userId: string) => {
    return prisma.document.findMany({
      where: { userId, status: 'ready' },
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  findChatListByUserId: async (userId: string) => {
    return prisma.document.findMany({
      where: { userId },
      select: { id: true, title: true, status: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  findById: async (id: string) => {
    return prisma.document.findUnique({
      where: { id },
      include: { analysis: true, agentReport: true },
    })
  },

  updateStatus: async (id: string, status: string) => {
    return prisma.document.update({
      where: { id },
      data: { status },
    })
  },

  delete: async (id: string) => {
    return prisma.document.delete({ where: { id } })
  },
}
