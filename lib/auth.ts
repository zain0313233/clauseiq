import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return secret
}

const JWT_SECRET = requireJwtSecret()

export interface JwtPayload {
  userId: string
}

export function verifyToken(req: NextRequest): JwtPayload {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }

  const token = authHeader.split(' ')[1]
  const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload
  return payload
}