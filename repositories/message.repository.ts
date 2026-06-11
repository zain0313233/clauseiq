import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export const messageRepository = {
  create: async (data: {
    conversationId: string
    role: string
    content: string
    metadata?: Prisma.InputJsonValue
  }) => {
    return prisma.message.create({ data })
  },

  findByConversationId: async (conversationId: string) => {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    })
  },
}
