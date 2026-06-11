import jwt, { type SignOptions } from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { getSessionToken } from '@/lib/auth-cookie'

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return secret
}

const JWT_SECRET = requireJwtSecret()

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d'

export interface JwtPayload {
  userId: string
  tv?: number
}

export function verifyToken(req: NextRequest): JwtPayload {
  const token = getSessionToken(req)
  if (!token) {
    throw new Error('Unauthorized')
  }

  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as JwtPayload
  } catch {
    throw new Error('Unauthorized')
  }
}

export function signAccessToken(userId: string, tokenVersion: number): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
    algorithm: 'HS256',
  }
  return jwt.sign({ userId, tv: tokenVersion }, JWT_SECRET, options)
}
