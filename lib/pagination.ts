export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function parsePage(value: string | null, fallback = 1): number {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export function parseLimit(
  value: string | null,
  fallback = 10,
  max = 50
): number {
  const n = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(n) || n < 1) return fallback
  return Math.min(n, max)
}

export function buildPagination(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = total === 0 ? 1 : Math.ceil(total / limit)
  const safePage = Math.min(Math.max(1, page), totalPages)
  return { page: safePage, limit, total, totalPages }
}
