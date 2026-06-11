import { prisma } from '@/lib/prisma'

export const agentRepository = {
  findByDocumentId: async (documentId: string) => {
    return prisma.agentReport.findUnique({
      where: { documentId },
    })
  },
}
