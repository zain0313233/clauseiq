import { prisma } from '@/lib/prisma'

const TYPE_COLORS: Record<string, string> = {
  nda: '#14b8a6',
  vendor: '#3b82f6',
  employment: '#a855f7',
  service: '#f59e0b',
  saas: '#6366f1',
  other: '#64748b',
}

const TYPE_LABELS: Record<string, string> = {
  nda: 'NDAs',
  vendor: 'Vendor',
  employment: 'Employment',
  service: 'Service',
  saas: 'SaaS',
  other: 'Other',
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const dashboardRepository = {
  getWeeklyActivity: async (userId: string) => {
    const start = new Date()
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)

    const [documents, messages] = await Promise.all([
      prisma.document.findMany({
        where: { userId, createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      prisma.message.findMany({
        where: {
          role: 'user',
          createdAt: { gte: start },
          conversation: { userId },
        },
        select: { createdAt: true },
      }),
    ])

    const days: { day: string; uploads: number; queries: number; date: Date }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push({
        day: DAY_LABELS[d.getDay()],
        uploads: 0,
        queries: 0,
        date: new Date(d),
      })
    }

    for (const doc of documents) {
      const idx = days.findIndex(
        (d) => d.date.toDateString() === new Date(doc.createdAt).toDateString()
      )
      if (idx >= 0) days[idx].uploads++
    }

    for (const msg of messages) {
      const idx = days.findIndex(
        (d) => d.date.toDateString() === new Date(msg.createdAt).toDateString()
      )
      if (idx >= 0) days[idx].queries++
    }

    return days.map(({ day, uploads, queries }) => ({ day, uploads, queries }))
  },

  getTypeDistribution: async (userId: string) => {
    const docs = await prisma.document.findMany({
      where: { userId, status: 'ready' },
      select: { contractType: true },
    })

    const counts: Record<string, number> = {}
    for (const doc of docs) {
      const key = doc.contractType || 'other'
      counts[key] = (counts[key] || 0) + 1
    }

    const total = docs.length || 1
    return Object.entries(counts)
      .map(([type, count]) => ({
        name: TYPE_LABELS[type] ?? type,
        value: Math.round((count / total) * 100),
        count,
        color: TYPE_COLORS[type] ?? TYPE_COLORS.other,
      }))
      .sort((a, b) => b.count - a.count)
  },
}
