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
      orderBy: { createdAt: 'desc' },
    })
  },

  findById: async (id: string) => {
    return prisma.document.findUnique({ where: { id } })
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