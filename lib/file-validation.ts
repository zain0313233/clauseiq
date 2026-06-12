const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export const ALLOWED_DOCUMENT_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

export type AllowedDocumentMime = (typeof ALLOWED_DOCUMENT_MIMES)[number]

function isZipDocx(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  )
}

function isPdf(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString('utf8') === '%PDF-'
}

export function detectDocumentMime(buffer: Buffer): AllowedDocumentMime | null {
  if (isPdf(buffer)) return 'application/pdf'
  if (isZipDocx(buffer)) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  return null
}

export async function validateUploadFile(file: File): Promise<{
  buffer: Buffer
  mime: AllowedDocumentMime
}> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('File size must be under 10MB')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const detected = detectDocumentMime(buffer)

  if (!detected) {
    throw new Error('Only PDF and DOCX files are allowed')
  }

  return { buffer, mime: detected }
}
