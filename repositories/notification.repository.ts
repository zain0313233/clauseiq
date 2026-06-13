import { prisma } from '@/lib/prisma'

export type NotificationType =
  | 'document_ready'
  | 'document_failed'
  | 'analysis_complete'
  | 'analysis_failed'
  | 'risk_alert'

export const notificationRepository = {
  listForUser: async (
    userId: string,
    options?: { limit?: number; unreadOnly?: boolean }
  ) => {
    const limit = options?.limit ?? 20

    return prisma.notification.findMany({
      where: {
        userId,
        ...(options?.unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  },

  countUnread: async (userId: string) => {
    return prisma.notification.count({
      where: { userId, read: false },
    })
  },

  markRead: async (userId: string, ids: string[]) => {
    if (ids.length === 0) return
    await prisma.notification.updateMany({
      where: { userId, id: { in: ids } },
      data: { read: true },
    })
  },

  markAllRead: async (userId: string) => {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })
  },
}
