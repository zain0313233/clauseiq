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

type DocumentListStatus = 'all' | 'ready' | 'processing' | 'failed'

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
    const documents = await prisma.document.findMany({
      where: { userId },
      include: { analysis: true },
    })

    const portfolioDocs = documents as PortfolioDocument[]

    return {
      total: documents.length,
      ready: documents.filter((d) => d.status === 'ready').length,
      processing: documents.filter(
        (d) => d.status === 'processing' || d.status === 'pending'
      ).length,
      failed: documents.filter((d) => d.status === 'failed').length,
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

    const where: {
      userId: string
      status?: string | { in: string[] }
      OR?: Array<
        | { title: { contains: string; mode: 'insensitive' } }
        | { fileName: { contains: string; mode: 'insensitive' } }
      >
    } = { userId }

    if (status === 'ready') where.status = 'ready'
    else if (status === 'failed') where.status = 'failed'
    else if (status === 'processing') {
      where.status = { in: ['processing', 'pending'] }
    }

    const q = search.trim()
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { fileName: { contains: q, mode: 'insensitive' } },
      ]
    }

    const rows = await prisma.document.findMany({
      where,
      include: { analysis: true, agentReport: true },
      orderBy: { createdAt: 'desc' },
    })

    const portfolioDocs = rows as PortfolioDocument[]
    const filtered =
      portfolio === 'all'
        ? portfolioDocs
        : portfolioDocs.filter((doc) => matchesPortfolioFilter(doc, portfolio))

    const pagination = buildPagination(filtered.length, page, limit)
    const start = (pagination.page - 1) * limit
    const documents = filtered.slice(start, start + limit)

    return { documents, ...pagination }
  },

  findReadyByUserId: async (userId: string) => {
    return prisma.document.findMany({
      where: { userId, status: 'ready' },
      select: { id: true, title: true },
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