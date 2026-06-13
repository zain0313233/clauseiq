import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export type NotificationType =
  | 'document_ready'
  | 'document_failed'
  | 'analysis_complete'
  | 'analysis_failed'
  | 'risk_alert'
  | 'user_access_restricted'
  | 'unblock_request'
  | 'access_restored'
  | 'document_security_alert'

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

  createForUser: async (data: {
    userId: string
    type: NotificationType
    title: string
    body: string
    referenceKey: string
    metadata?: Record<string, unknown>
  }) => {
    try {
      return await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          body: data.body,
          referenceKey: data.referenceKey,
          metadata: (data.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      })
    } catch {
      return null
    }
  },

  notifyAdmins: async (data: {
    type: NotificationType
    title: string
    body: string
    referenceKey: string
    metadata?: Record<string, unknown>
  }) => {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true },
    })

    await Promise.all(
      admins.map((admin) =>
        notificationRepository.createForUser({
          userId: admin.id,
          type: data.type,
          title: data.title,
          body: data.body,
          referenceKey: `${data.referenceKey}:${admin.id}`,
          metadata: data.metadata,
        })
      )
    )
  },
}
