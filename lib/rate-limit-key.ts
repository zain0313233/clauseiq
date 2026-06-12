import { NextRequest } from 'next/server'

import { AUTH_COOKIE_NAME } from '@/lib/auth-cookie'

function decodeJwtUserId(token: string): string | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const payload = JSON.parse(atob(padded)) as { userId?: string }
    return payload.userId ?? null
  } catch {
    return null
  }
}

export function getRateLimitKeys(
  req: NextRequest,
  ip: string
): { ip: string; user: string | null } {
  const token =
    req.cookies.get(AUTH_COOKIE_NAME)?.value ??
    (req.headers.get('authorization')?.startsWith('Bearer ')
      ? req.headers.get('authorization')!.slice(7)
      : null)

  if (!token) {
    return { ip, user: null }
  }

  const userId = decodeJwtUserId(token)
  return userId ? { ip, user: `user:${userId}` } : { ip, user: null }
}
