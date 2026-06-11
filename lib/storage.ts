import { supabaseAdmin } from '@/lib/supabase/client'

const BUCKET = 'documents'
const SIGNED_URL_TTL_SECONDS = 3600

/**
 * Resolve a storage object path from either:
 * - a bare path (new uploads): `userId/123.pdf`
 * - a legacy public Supabase URL
 */
export function getStoragePath(fileUrlOrPath: string): string {
  if (!fileUrlOrPath.startsWith('http')) {
    return fileUrlOrPath.replace(/^\/+/, '')
  }

  const marker = '/documents/'
  const idx = fileUrlOrPath.indexOf(marker)
  if (idx === -1) {
    throw new Error('Invalid storage URL')
  }

  const path = fileUrlOrPath.slice(idx + marker.length).split('?')[0]
  return decodeURIComponent(path)
}

export async function createSignedFileUrl(
  fileUrlOrPath: string,
  expiresInSeconds = SIGNED_URL_TTL_SECONDS
): Promise<string> {
  const path = getStoragePath(fileUrlOrPath)

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds)

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'Failed to create signed file URL')
  }

  return data.signedUrl
}

export async function removeStorageObject(fileUrlOrPath: string): Promise<void> {
  const path = getStoragePath(fileUrlOrPath)
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path])
  if (error) throw new Error(error.message)
}

export function getSupabaseStorageHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}
