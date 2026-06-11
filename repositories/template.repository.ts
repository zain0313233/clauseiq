import { prisma } from '@/lib/prisma'

export const templateRepository = {
  create: async (data: {
    name: string
    type: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number
    userId: string
  }) => {
    return prisma.standardTemplate.create({ data })
  },

  findByUserId: async (userId: string) => {
    return prisma.standardTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  },

  findById: async (id: string) => {
    return prisma.standardTemplate.findUnique({ where: { id } })
  },

  delete: async (id: string) => {
    return prisma.standardTemplate.delete({ where: { id } })
  },
}
