export const MAX_QUERY_LENGTH = 2000

export function normalizeQueryQuestion(question: string): string {
  const trimmed = question.trim().slice(0, MAX_QUERY_LENGTH)
  return trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
}

export function assertValidQueryQuestion(question: string): string {
  const normalized = normalizeQueryQuestion(question)
  if (!normalized) {
    throw new Error('question is required')
  }
  return normalized
}
