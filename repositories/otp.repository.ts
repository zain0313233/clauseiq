import { prisma } from '@/lib/prisma'

export type OtpPurpose = 'verify_email' | 'reset_password'

export const otpRepository = {
  deleteForEmail: async (email: string, purpose: OtpPurpose) => {
    await prisma.otpCode.deleteMany({ where: { email, purpose } })
  },

  create: async (data: {
    email: string
    codeHash: string
    purpose: OtpPurpose
    expiresAt: Date
  }) => {
    return prisma.otpCode.create({ data })
  },

  findLatest: async (email: string, purpose: OtpPurpose) => {
    return prisma.otpCode.findFirst({
      where: { email, purpose },
      orderBy: { createdAt: 'desc' },
    })
  },

  countRecentSends: async (email: string, purpose: OtpPurpose, since: Date) => {
    return prisma.otpCode.count({
      where: { email, purpose, createdAt: { gte: since } },
    })
  },

  incrementAttempts: async (id: string) => {
    return prisma.otpCode.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    })
  },

  deleteById: async (id: string) => {
    await prisma.otpCode.delete({ where: { id } })
  },

  purgeExpired: async () => {
    await prisma.otpCode.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
  },
}
