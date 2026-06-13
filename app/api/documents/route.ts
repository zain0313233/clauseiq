import { NextRequest, NextResponse } from 'next/server'
import { requireEmailVerified } from '@/lib/auth-session'
import type { PortfolioFilter } from '@/lib/document-filters'
import { parseLimit, parsePage } from '@/lib/pagination'
import { documentRepository } from '@/repositories/document.repository'
import { userRepository } from '@/repositories/user.repository'
import { hasPermission } from '@/lib/rbac'

const STATUS_FILTERS = new Set(['all', 'ready', 'processing', 'failed'])
const PORTFOLIO_FILTERS = new Set([
  'all',
  'expiring',
  'high_risk',
  'unlimited_liability',
])

export async function GET(req: NextRequest) {
  try {
    const user = await requireEmailVerified(req)
    const userId = user.id
    if (!hasPermission(user.role, 'document:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const pageParam = searchParams.get('page')

    if (searchParams.get('chat') === '1') {
      const documents = await documentRepository.findChatListByUserId(userId)
      return NextResponse.json({ documents }, { status: 200 })
    }

    if (pageParam !== null) {
      const page = parsePage(pageParam)
      const limit = parseLimit(searchParams.get('limit'), 10, 50)
      const search = searchParams.get('search') ?? ''
      const statusRaw = searchParams.get('status') ?? 'all'
      const portfolioRaw = searchParams.get('portfolio') ?? 'all'
      const status = STATUS_FILTERS.has(statusRaw)
        ? (statusRaw as 'all' | 'ready' | 'processing' | 'failed')
        : 'all'
      const portfolio = PORTFOLIO_FILTERS.has(portfolioRaw)
        ? (portfolioRaw as PortfolioFilter)
        : 'all'

      const [result, summary] = await Promise.all([
        documentRepository.findPaginatedForUser(userId, {
          page,
          limit,
          search,
          status,
          portfolio,
        }),
        documentRepository.getSummaryByUserId(userId),
      ])

      const { documents, ...pagination } = result

      return NextResponse.json(
        {
          documents,
          pagination,
          summary,
        },
        { status: 200 }
      )
    }

    const documents = await documentRepository.findByUserId(userId)
    return NextResponse.json({ documents }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}