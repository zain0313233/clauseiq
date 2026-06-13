import { prisma } from '@/lib/prisma'

const DEFAULTS = {
  maxConsecutiveIrrelevant: 5,
  strikeWarningAt: 3,
  appealSlaBusinessDays: 2,
}

export const platformSettingsRepository = {
  async get() {
    const row = await prisma.platformSettings.findUnique({
      where: { id: 'singleton' },
    })
    if (row) {
      return {
        maxConsecutiveIrrelevant: row.maxConsecutiveIrrelevant,
        strikeWarningAt: row.strikeWarningAt,
        appealSlaBusinessDays: row.appealSlaBusinessDays,
      }
    }
    return { ...DEFAULTS }
  },

  async upsert(
    data: {
      maxConsecutiveIrrelevant?: number
      strikeWarningAt?: number
      appealSlaBusinessDays?: number
    },
    updatedById: string
  ) {
    return prisma.platformSettings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        maxConsecutiveIrrelevant:
          data.maxConsecutiveIrrelevant ?? DEFAULTS.maxConsecutiveIrrelevant,
        strikeWarningAt: data.strikeWarningAt ?? DEFAULTS.strikeWarningAt,
        appealSlaBusinessDays:
          data.appealSlaBusinessDays ?? DEFAULTS.appealSlaBusinessDays,
        updatedById,
      },
      update: {
        ...(data.maxConsecutiveIrrelevant !== undefined
          ? { maxConsecutiveIrrelevant: data.maxConsecutiveIrrelevant }
          : {}),
        ...(data.strikeWarningAt !== undefined
          ? { strikeWarningAt: data.strikeWarningAt }
          : {}),
        ...(data.appealSlaBusinessDays !== undefined
          ? { appealSlaBusinessDays: data.appealSlaBusinessDays }
          : {}),
        updatedById,
      },
    })
  },
}
