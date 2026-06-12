export const CACHE = {
  noStore: { 'Cache-Control': 'no-store' },
  privateShort: { 'Cache-Control': 'private, max-age=30' },
  publicTheme: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
  },
  health: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
} as const
