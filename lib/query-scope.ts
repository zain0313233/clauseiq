export const BLOCKED_DOCUMENT_MESSAGE =
  'This document was blocked after an automated security scan detected unsafe content. Chat is disabled until an admin reviews it.'

export function isDocumentQueryAllowed(document: {
  contentReviewStatus?: string | null
  queriesEnabled?: boolean | null
}): { allowed: boolean; reason: string | null } {
  if (document.queriesEnabled === false) {
    return { allowed: false, reason: BLOCKED_DOCUMENT_MESSAGE }
  }
  if (document.contentReviewStatus === 'rejected') {
    return { allowed: false, reason: BLOCKED_DOCUMENT_MESSAGE }
  }
  return { allowed: true, reason: null }
}

export function blockedQuerySse(
  message: string,
  options?: {
    accessRestricted?: boolean
    irrelevant?: boolean
    strikeWarning?: string | null
  }
): string {
  const events = [
    { type: 'status', text: 'Checking…' },
    ...(options?.strikeWarning
      ? [{ type: 'warning', text: options.strikeWarning }]
      : []),
    { type: 'token', text: message },
    { type: 'sources', sources: [] },
    {
      type: 'done',
      confidence: 'low',
      irrelevant: options?.irrelevant ?? false,
      ...(options?.accessRestricted ? { access_restricted: true } : {}),
    },
  ]
  return events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('')
}
