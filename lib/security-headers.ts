export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-DNS-Prefetch-Control': 'on',
}

export function applySecurityHeaders(headers: Headers): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value)
  }
}
