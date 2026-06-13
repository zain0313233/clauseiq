import { notificationRepository } from '@/repositories/notification.repository'

export const notificationService = {
  list: async (
    userId: string,
    options?: { limit?: number; unreadOnly?: boolean }
  ) => {
    const [notifications, unreadCount] = await Promise.all([
      notificationRepository.listForUser(userId, options),
      notificationRepository.countUnread(userId),
    ])

    return { notifications, unreadCount }
  },

  markRead: async (userId: string, ids: string[]) => {
    await notificationRepository.markRead(userId, ids)
    return notificationRepository.countUnread(userId)
  },

  markAllRead: async (userId: string) => {
    await notificationRepository.markAllRead(userId)
    return 0
  },
}
