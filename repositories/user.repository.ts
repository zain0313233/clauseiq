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
    role?: string
  }) => {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role ?? 'user',
        emailVerified: data.emailVerified ?? false,
        emailVerifiedAt: data.emailVerified ? new Date() : undefined,
      },
    })
  },

  upsertAdmin: async (data: {
    name: string
    email: string
    passwordHash: string
  }) => {
    const email = data.email.trim().toLowerCase()
    return prisma.user.upsert({
      where: { email },
      create: {
        name: data.name,
        email,
        password: data.passwordHash,
        role: 'admin',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      update: {
        name: data.name,
        password: data.passwordHash,
        role: 'admin',
        emailVerified: true,
        emailVerifiedAt: new Date(),
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