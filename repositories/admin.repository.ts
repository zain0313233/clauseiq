import { prisma } from '@/lib/prisma'
import { buildPagination } from '@/lib/pagination'
import { platformSettingsRepository } from '@/repositories/platform-settings.repository'

export const adminRepository = {
  getPlatformStats: async () => {
    const [
      totalUsers,
      verifiedUsers,
      adminUsers,
      totalDocuments,
      readyDocuments,
      processingDocuments,
      failedDocuments,
      totalAnalyses,
      highRiskAnalyses,
      totalMessages,
      totalConversations,
      recentUsers,
      recentDocuments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.document.count(),
      prisma.document.count({ where: { status: 'ready' } }),
      prisma.document.count({ where: { status: 'processing' } }),
      prisma.document.count({ where: { status: 'failed' } }),
      prisma.documentAnalysis.count({ where: { status: 'ready' } }),
      prisma.documentAnalysis.count({
        where: { status: 'ready', riskLevel: 'high' },
      }),
      prisma.message.count({ where: { role: 'user' } }),
      prisma.conversation.count(),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
        },
      }),
      prisma.document.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          status: true,
          contractType: true,
          createdAt: true,
          user: { select: { email: true, name: true } },
          analysis: { select: { riskLevel: true, status: true } },
        },
      }),
    ])

    return {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        unverified: totalUsers - verifiedUsers,
        admins: adminUsers,
      },
      documents: {
        total: totalDocuments,
        ready: readyDocuments,
        processing: processingDocuments,
        failed: failedDocuments,
      },
      analyses: {
        total: totalAnalyses,
        highRisk: highRiskAnalyses,
      },
      chat: {
        conversations: totalConversations,
        userMessages: totalMessages,
      },
      recentUsers: recentUsers.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
      recentDocuments: recentDocuments.map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        contractType: d.contractType,
        createdAt: d.createdAt.toISOString(),
        ownerEmail: d.user.email,
        ownerName: d.user.name,
        riskLevel: d.analysis?.riskLevel ?? null,
        analysisStatus: d.analysis?.status ?? null,
      })),
    }
  },

  getAccessAlerts: async () => {
    const settings = await platformSettingsRepository.get()
    const slaMs = settings.appealSlaBusinessDays * 86_400_000

    const [pendingUnblockCount, restrictedCount, pendingUsers, securityBlocked] =
      await Promise.all([
      prisma.user.count({
        where: { unblockRequestPending: true, role: { not: 'admin' } },
      }),
      prisma.user.count({
        where: { accessRestricted: true, role: { not: 'admin' } },
      }),
      prisma.user.findMany({
        where: { unblockRequestPending: true, role: { not: 'admin' } },
        orderBy: { unblockRequestedAt: 'desc' },
        take: 6,
        select: {
          id: true,
          name: true,
          email: true,
          accessRestricted: true,
          unblockRequestedAt: true,
        },
      }),
      prisma.document.count({
        where: { contentReviewStatus: 'rejected', queriesEnabled: false },
      }),
    ])

    const slaOverdueCount = pendingUsers.filter((u) => {
      if (!u.unblockRequestedAt) return false
      return Date.now() - u.unblockRequestedAt.getTime() > slaMs
    }).length

    return {
      pendingUnblockCount,
      restrictedCount,
      needsActionCount: pendingUnblockCount,
      slaOverdueCount,
      securityBlockedDocuments: securityBlocked,
      appealSlaBusinessDays: settings.appealSlaBusinessDays,
      pendingUsers: pendingUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        accessRestricted: u.accessRestricted,
        unblockRequestedAt: u.unblockRequestedAt?.toISOString() ?? null,
      })),
    }
  },

  listUsers: async (params: {
    page: number
    limit: number
    search?: string
    role?: string
    verified?: string
    needsAction?: string
  }) => {
    const where: {
      OR?: Array<
        | { email?: { contains: string; mode: 'insensitive' }; name?: { contains: string; mode: 'insensitive' } }
        | { accessRestricted?: boolean }
        | { unblockRequestPending?: boolean }
      >
      role?: string
      emailVerified?: boolean
      AND?: Array<{ OR: Array<{ accessRestricted: boolean } | { unblockRequestPending: boolean }> }>
    } = {}

    if (params.search?.trim()) {
      const q = params.search.trim()
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (params.role === 'admin' || params.role === 'user') {
      where.role = params.role
    }

    if (params.verified === 'true') where.emailVerified = true
    if (params.verified === 'false') where.emailVerified = false

    if (params.needsAction === 'true') {
      where.AND = [
        {
          OR: [{ accessRestricted: true }, { unblockRequestPending: true }],
        },
      ]
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: [
          { unblockRequestPending: 'desc' },
          { accessRestricted: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          accessRestricted: true,
          unblockRequestPending: true,
          unblockRequestedAt: true,
          consecutiveIrrelevantCount: true,
          createdAt: true,
          _count: { select: { documents: true, conversations: true } },
        },
      }),
    ])

    return {
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        emailVerified: u.emailVerified,
        accessRestricted: u.accessRestricted,
        unblockRequestPending: u.unblockRequestPending,
        unblockRequestedAt: u.unblockRequestedAt?.toISOString() ?? null,
        irrelevantCount: u.consecutiveIrrelevantCount,
        documentCount: u._count.documents,
        conversationCount: u._count.conversations,
        createdAt: u.createdAt.toISOString(),
      })),
      pagination: buildPagination(total, params.page, params.limit),
    }
  },

  getUserDetail: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            documents: true,
            conversations: true,
            notifications: true,
            standardTemplates: true,
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            title: true,
            status: true,
            contractType: true,
            createdAt: true,
            analysis: { select: { riskLevel: true, status: true } },
          },
        },
        conversations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            createdAt: true,
            document: { select: { id: true, title: true } },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { content: true, role: true, createdAt: true },
            },
          },
        },
      },
    })

    if (!user) return null

    const [
      userMessages,
      assistantMessages,
      readyDocuments,
      processingDocuments,
      failedDocuments,
      analysesComplete,
      highRiskAnalyses,
      comparisons,
      vectorChunks,
    ] = await Promise.all([
      prisma.message.count({
        where: { conversation: { userId }, role: 'user' },
      }),
      prisma.message.count({
        where: { conversation: { userId }, role: 'assistant' },
      }),
      prisma.document.count({ where: { userId, status: 'ready' } }),
      prisma.document.count({
        where: { userId, status: { in: ['processing', 'pending'] } },
      }),
      prisma.document.count({ where: { userId, status: 'failed' } }),
      prisma.documentAnalysis.count({
        where: { document: { userId }, status: 'ready' },
      }),
      prisma.documentAnalysis.count({
        where: {
          document: { userId },
          status: 'ready',
          riskLevel: 'high',
        },
      }),
      prisma.documentComparison.count({
        where: { document: { userId } },
      }),
      prisma.chunk.count({ where: { document: { userId } } }),
    ])

    const totalMessages = userMessages + assistantMessages

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      analytics: {
        documents: {
          total: user._count.documents,
          ready: readyDocuments,
          processing: processingDocuments,
          failed: failedDocuments,
        },
        chat: {
          conversations: user._count.conversations,
          totalMessages,
          userMessages,
          assistantMessages,
        },
        analyses: {
          complete: analysesComplete,
          highRisk: highRiskAnalyses,
        },
        comparisons,
        vectorChunks,
        notifications: user._count.notifications,
        templates: user._count.standardTemplates,
      },
      counts: {
        documents: user._count.documents,
        conversations: user._count.conversations,
        messages: totalMessages,
        notifications: user._count.notifications,
        templates: user._count.standardTemplates,
      },
      documents: user.documents.map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        contractType: d.contractType,
        createdAt: d.createdAt.toISOString(),
        riskLevel: d.analysis?.riskLevel ?? null,
        analysisStatus: d.analysis?.status ?? null,
      })),
      conversations: user.conversations.map((c) => ({
        id: c.id,
        documentId: c.document.id,
        documentTitle: c.document.title,
        createdAt: c.createdAt.toISOString(),
        lastMessage: c.messages[0]
          ? {
              role: c.messages[0].role,
              content: c.messages[0].content.slice(0, 200),
              createdAt: c.messages[0].createdAt.toISOString(),
            }
          : null,
      })),
    }
  },

  listDocuments: async (params: {
    page: number
    limit: number
    search?: string
    status?: string
  }) => {
    const where: {
      OR?: Array<
        | { title?: { contains: string; mode: 'insensitive' } }
        | { user?: { email?: { contains: string; mode: 'insensitive' } } }
      >
      status?: string
    } = {}

    if (params.search?.trim()) {
      const q = params.search.trim()
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ]
    }

    if (
      params.status &&
      params.status !== 'all' &&
      ['ready', 'processing', 'failed', 'pending'].includes(params.status)
    ) {
      where.status = params.status
    }

    const [total, documents] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        select: {
          id: true,
          title: true,
          status: true,
          contractType: true,
          fileType: true,
          contentReviewStatus: true,
          queriesEnabled: true,
          contentReviewedAt: true,
          createdAt: true,
          user: { select: { id: true, email: true, name: true } },
          analysis: { select: { riskLevel: true, status: true } },
        },
      }),
    ])

    return {
      documents: documents.map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        contractType: d.contractType,
        fileType: d.fileType,
        contentReviewStatus: d.contentReviewStatus,
        queriesEnabled: d.queriesEnabled,
        contentReviewedAt: d.contentReviewedAt?.toISOString() ?? null,
        createdAt: d.createdAt.toISOString(),
        owner: {
          id: d.user.id,
          email: d.user.email,
          name: d.user.name,
        },
        riskLevel: d.analysis?.riskLevel ?? null,
        analysisStatus: d.analysis?.status ?? null,
      })),
      pagination: buildPagination(total, params.page, params.limit),
    }
  },

  countAdmins: async () => {
    return prisma.user.count({ where: { role: 'admin' } })
  },

  getPlatformCharts: async () => {
    const start = new Date()
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)

    const [users, documents, messages] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      prisma.document.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      prisma.message.findMany({
        where: { role: 'user', createdAt: { gte: start } },
        select: { createdAt: true },
      }),
    ])

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const days: {
      day: string
      signups: number
      uploads: number
      queries: number
      date: Date
    }[] = []

    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push({
        day: dayLabels[d.getDay()],
        signups: 0,
        uploads: 0,
        queries: 0,
        date: new Date(d),
      })
    }

    const bump = (createdAt: Date, key: 'signups' | 'uploads' | 'queries') => {
      const idx = days.findIndex(
        (d) => d.date.toDateString() === new Date(createdAt).toDateString()
      )
      if (idx >= 0) days[idx][key]++
    }

    for (const u of users) bump(u.createdAt, 'signups')
    for (const doc of documents) bump(doc.createdAt, 'uploads')
    for (const msg of messages) bump(msg.createdAt, 'queries')

    const weeklyActivity = days.map(({ day, signups, uploads, queries }) => ({
      day,
      signups,
      uploads,
      queries,
    }))

    const [ready, processing, failed] = await Promise.all([
      prisma.document.count({ where: { status: 'ready' } }),
      prisma.document.count({
        where: { status: { in: ['processing', 'pending'] } },
      }),
      prisma.document.count({ where: { status: 'failed' } }),
    ])

    const documentStatus = [
      { name: 'Ready', value: ready, color: '#14b8a6' },
      { name: 'Processing', value: processing, color: '#3b82f6' },
      { name: 'Failed', value: failed, color: '#ef4444' },
    ].filter((d) => d.value > 0)

    const riskRows = await prisma.documentAnalysis.groupBy({
      by: ['riskLevel'],
      where: { status: 'ready', riskLevel: { not: null } },
      _count: { riskLevel: true },
    })

    const riskColors: Record<string, string> = {
      low: '#14b8a6',
      medium: '#f59e0b',
      high: '#ef4444',
    }

    const riskDistribution = riskRows.map((r) => ({
      name: r.riskLevel ? `${r.riskLevel.charAt(0).toUpperCase()}${r.riskLevel.slice(1)} risk` : 'Unknown',
      value: r._count.riskLevel,
      color: riskColors[r.riskLevel ?? 'low'] ?? '#64748b',
    }))

    return { weeklyActivity, documentStatus, riskDistribution }
  },

  getDocumentDetail: async (documentId: string) => {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        status: true,
        contractType: true,
        contentReviewStatus: true,
        contentReviewNotes: true,
        contentReviewedAt: true,
        contentReviewedBy: true,
        queriesEnabled: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, email: true, name: true } },
        analysis: {
          select: {
            riskLevel: true,
            status: true,
            summary: true,
          },
        },
        chunks: {
          orderBy: { chunkIndex: 'asc' },
          take: 12,
          select: { content: true, chunkIndex: true },
        },
        _count: { select: { chunks: true, conversations: true } },
      },
    })

    if (!document) return null

    return {
      id: document.id,
      title: document.title,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      status: document.status,
      contractType: document.contractType,
      contentReviewStatus: document.contentReviewStatus,
      contentReviewNotes: document.contentReviewNotes,
      contentReviewedAt: document.contentReviewedAt?.toISOString() ?? null,
      contentReviewedBy: document.contentReviewedBy,
      queriesEnabled: document.queriesEnabled,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
      owner: document.user,
      riskLevel: document.analysis?.riskLevel ?? null,
      analysisStatus: document.analysis?.status ?? null,
      analysisSummary: document.analysis?.summary ?? null,
      preview: document.chunks.map((c) => ({
        chunkIndex: c.chunkIndex,
        content: c.content,
      })),
      previewText: document.chunks.map((c) => c.content).join('\n\n'),
      chunkCount: document._count.chunks,
      conversationCount: document._count.conversations,
    }
  },
}
