import { z } from 'zod'
import { passwordSchema } from '@/lib/password-validation'

export const otpCodeSchema = z
  .string()
  .length(6, 'Code must be 6 digits')
  .regex(/^\d{6}$/, 'Code must be 6 digits')

export const verifyEmailSchema = z.object({
  code: otpCodeSchema,
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: otpCodeSchema,
  password: passwordSchema,
})
