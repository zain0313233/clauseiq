import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-zA-Z]/, 'Password must include at least one letter')
  .regex(/[0-9]/, 'Password must include at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must include at least one symbol')

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword
}

export type PasswordRequirement = {
  id: string
  label: string
  met: boolean
}

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { id: 'length', label: 'At least 8 characters', met: password.length >= 8 },
    { id: 'letter', label: 'One letter', met: /[a-zA-Z]/.test(password) },
    { id: 'number', label: 'One number', met: /[0-9]/.test(password) },
    { id: 'symbol', label: 'One symbol', met: /[^a-zA-Z0-9]/.test(password) },
  ]
}
