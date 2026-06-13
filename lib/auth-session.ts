import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { userRepository } from '@/repositories/user.repository'
import { isAccessRestricted } from '@/lib/access-control'
import type { User } from '@prisma/client'

export async function requireAuthUser(req: NextRequest): Promise<User> {
  const payload = verifyToken(req)
  const user = await userRepository.findById(payload.userId)

  if (!user) {
    throw new Error('Unauthorized')
  }

  const tokenVersion = payload.tv ?? 0
  if (tokenVersion !== user.tokenVersion) {
    throw new Error('Unauthorized')
  }

  return user
}

export async function requireEmailVerified(req: NextRequest): Promise<User> {
  const user = await requireAuthUser(req)
  if (!user.emailVerified) {
    throw new Error('Email not verified')
  }
  return user
}

/** Blocks restricted users from portal APIs (admins always pass). */
export async function requirePortalAccess(req: NextRequest): Promise<User> {
  const user = await requireEmailVerified(req)
  if (isAccessRestricted(user)) {
    throw new Error('Access restricted')
  }
  return user
}
