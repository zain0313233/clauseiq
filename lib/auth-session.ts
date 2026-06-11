import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { userRepository } from '@/repositories/user.repository'
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
