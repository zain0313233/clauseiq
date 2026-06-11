import { prisma } from '@/lib/prisma'

export const userRepository = {
  findByEmail: async (email: string) => {
    return prisma.user.findUnique({ where: { email } })
  },

  findById: async (id: string) => {
    return prisma.user.findUnique({ where: { id } })
  },

  create: async (data: { name: string; email: string; password: string }) => {
    return prisma.user.create({ data })
  },

  incrementTokenVersion: async (id: string) => {
    return prisma.user.update({
      where: { id },
      data: { tokenVersion: { increment: 1 } },
    })
  },
}