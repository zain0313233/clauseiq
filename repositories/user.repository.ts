import { prisma } from '@/lib/prisma'

export const userRepository = {
  findByEmail: async (email: string) => {
    return prisma.user.findUnique({ where: { email } })
  },

  findById: async (id: string) => {
    return prisma.user.findUnique({ where: { id } })
  },

  create: async (data: {
    name: string
    email: string
    password: string
    emailVerified?: boolean
  }) => {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        emailVerified: data.emailVerified ?? false,
      },
    })
  },

  markEmailVerified: async (email: string) => {
    return prisma.user.update({
      where: { email },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    })
  },

  updatePassword: async (id: string, password: string) => {
    return prisma.user.update({
      where: { id },
      data: { password },
    })
  },

  incrementTokenVersion: async (id: string) => {
    return prisma.user.update({
      where: { id },
      data: { tokenVersion: { increment: 1 } },
    })
  },
}