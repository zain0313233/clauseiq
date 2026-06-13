import { NextRequest } from 'next/server'
import { requireEmailVerified } from '@/lib/auth-session'
import { hasPermission } from '@/lib/rbac'
import type { User } from '@prisma/client'

export async function requireAdminUser(req: NextRequest): Promise<User> {
  const user = await requireEmailVerified(req)
  if (!hasPermission(user.role, 'user:read')) {
    throw new Error('Forbidden')
  }
  return user
}
