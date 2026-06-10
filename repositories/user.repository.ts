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
}