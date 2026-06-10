import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, authRateLimiter } from '@/lib/rate-limit'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return NextResponse.json({}, { headers: CORS_HEADERS })
  }

  // Apply rate limiting to auth routes
  if (pathname.startsWith('/api/auth')) {
    const { success } = await authRateLimiter.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: CORS_HEADERS }
      )
    }
  }

  // Apply rate limiting to all other API routes
  if (pathname.startsWith('/api')) {
    const { success } = await rateLimiter.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: CORS_HEADERS }
      )
    }
  }

  // Add CORS headers to all responses
  const response = NextResponse.next()
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: '/api/:path*',
}