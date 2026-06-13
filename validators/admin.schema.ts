import { z } from 'zod'
import { passwordSchema } from '@/lib/password-validation'

export const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
})

export const adminUserIdSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
})

export const adminUnblockSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  note: z.string().trim().min(3, 'Please provide a short reason for restoring access'),
})

export const platformAccessSettingsSchema = z.object({
  maxConsecutiveIrrelevant: z.number().int().min(3).max(20).optional(),
  strikeWarningAt: z.number().int().min(1).max(19).optional(),
  appealSlaBusinessDays: z.number().int().min(1).max(14).optional(),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
