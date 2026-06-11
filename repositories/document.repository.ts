import { prisma } from '@/lib/prisma'

export const documentRepository = {
  create: async (data: {
    title: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number
    userId: string
  }) => {
    return prisma.document.create({ data })
  },

  findByUserId: async (userId: string) => {
    return prisma.document.findMany({
      where: { userId },
      include: { analysis: true, agentReport: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  findReadyByUserId: async (userId: string) => {
    return prisma.document.findMany({
      where: { userId, status: 'ready' },
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  findById: async (id: string) => {
    return prisma.document.findUnique({
      where: { id },
      include: { analysis: true, agentReport: true },
    })
  },

  updateStatus: async (id: string, status: string) => {
    return prisma.document.update({
      where: { id },
      data: { status },
    })
  },

  delete: async (id: string) => {
    return prisma.document.delete({ where: { id } })
  },
}