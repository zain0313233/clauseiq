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
    const existing = await prisma.conversation.findFirst({
      where: { userId, documentId },
    })
    if (existing) return existing

    return prisma.conversation.create({
      data: { userId, documentId },
    })
  },
}
