export const REQUEST_ID_HEADER = 'x-request-id'

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function getOrCreateRequestId(value: string | null): string {
  if (value?.trim()) return value.trim()
  return createRequestId()
}
