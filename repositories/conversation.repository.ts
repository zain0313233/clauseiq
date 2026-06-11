import { prisma } from "@/lib/prisma"

export const conversationRepository = {
  findByUserAndDocument: async (userId: string, documentId: string) => {
    return prisma.conversation.findFirst({
      where: { userId, documentId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    })
  },

  getOrCreate: async (userId: string, documentId: string) => {
    return prisma.conversation.upsert({
      where: {
        userId_documentId: { userId, documentId },
      },
      create: { userId, documentId },
      update: {},
    })
  },
}
