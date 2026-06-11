import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, authRateLimiter, queryRateLimiter } from '@/lib/rate-limit'
import { applySecurityHeaders } from '@/lib/security-headers'
import { getOrCreateRequestId, REQUEST_ID_HEADER } from '@/lib/request-id'
import { logger } from '@/lib/logger'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function shouldSkipRateLimit(): boolean {
  if (process.env.NODE_ENV === 'test') return true
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.PLAYWRIGHT_TEST === '1'
  ) {
    return true
  }
  return false
}

function withCommonHeaders(response: NextResponse, requestId: string): NextResponse {
  applySecurityHeaders(response.headers)
  response.headers.set(REQUEST_ID_HEADER, requestId)

  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    if (response.headers.get(key) == null) {
      response.headers.set(key, value)
    }
  })

  return response
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const requestId = getOrCreateRequestId(req.headers.get(REQUEST_ID_HEADER))
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const skipRateLimit = shouldSkipRateLimit()

  if (req.method === 'OPTIONS') {
    return withCommonHeaders(NextResponse.json({}, { headers: CORS_HEADERS }), requestId)
  }

  if (pathname === '/api/health') {
    return withCommonHeaders(NextResponse.next(), requestId)
  }

  if (
    !skipRateLimit &&
    (pathname === '/api/login' || pathname === '/api/signup')
  ) {
    const { success } = await authRateLimiter.limit(ip)
    if (!success) {
      return withCommonHeaders(
        NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429, headers: CORS_HEADERS }
        ),
        requestId
      )
    }
  }

  if (
    !skipRateLimit &&
    (pathname === '/api/query' || pathname === '/api/query/portfolio')
  ) {
    const { success } = await queryRateLimiter.limit(ip)
    if (!success) {
      return withCommonHeaders(
        NextResponse.json(
          { error: 'Query rate limit exceeded. Please try again later.' },
          { status: 429, headers: CORS_HEADERS }
        ),
        requestId
      )
    }
  }

  if (!skipRateLimit && pathname.startsWith('/api')) {
    const { success } = await rateLimiter.limit(ip)
    if (!success) {
      return withCommonHeaders(
        NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429, headers: CORS_HEADERS }
        ),
        requestId
      )
    }
  }

  if (pathname.startsWith('/api') && process.env.NODE_ENV === 'production') {
    logger.info('api.request', {
      requestId,
      method: req.method,
      path: pathname,
    })
  }

  return withCommonHeaders(NextResponse.next(), requestId)
}

export const config = {
  matcher: '/api/:path*',
}
