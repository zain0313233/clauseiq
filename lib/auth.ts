import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET!

export interface JwtPayload {
  userId: string
}

export function verifyToken(req: NextRequest): JwtPayload {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }

  const token = authHeader.split(' ')[1]
  const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
  return payload
}