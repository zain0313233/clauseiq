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

  deleteById: async (id: string) => {
    return prisma.message.delete({ where: { id } })
  },

  createPair: async (data: {
    conversationId: string
    userContent: string
    assistantContent: string
    assistantMetadata?: Prisma.InputJsonValue
  }) => {
    return prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: data.conversationId,
          role: "user",
          content: data.userContent,
        },
      }),
      prisma.message.create({
        data: {
          conversationId: data.conversationId,
          role: "assistant",
          content: data.assistantContent,
          metadata: data.assistantMetadata,
        },
      }),
    ])
  },
}
