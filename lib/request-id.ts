import { randomUUID } from 'crypto'

export const REQUEST_ID_HEADER = 'x-request-id'

export function getOrCreateRequestId(value: string | null): string {
  if (value?.trim()) return value.trim()
  return randomUUID()
}
