import { prisma } from '@/lib/prisma'

export const comparisonRepository = {
  findByDocumentId: async (documentId: string) => {
    return prisma.documentComparison.findMany({
      where: { documentId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  },

  findByDocumentAndTemplate: async (documentId: string, templateId: string) => {
    return prisma.documentComparison.findUnique({
      where: {
        documentId_templateId: { documentId, templateId },
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    })
  },

  upsertPending: async (documentId: string, templateId: string) => {
    return prisma.documentComparison.upsert({
      where: {
        documentId_templateId: { documentId, templateId },
      },
      create: {
        documentId,
        templateId,
        status: 'pending',
      },
      update: {
        status: 'pending',
      },
    })
  },
}
