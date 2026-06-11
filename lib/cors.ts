export function getAllowedOrigin(): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (process.env.NODE_ENV === 'production') {
    if (!origin) {
      throw new Error('NEXT_PUBLIC_APP_URL must be set in production')
    }
    return origin
  }

  return origin || 'http://localhost:3000'
}

export function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}
