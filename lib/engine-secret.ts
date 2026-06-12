import fs from 'node:fs'
import path from 'node:path'

import dotenv from 'dotenv'

let cached: string | null = null

function normalizeSecret(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, '')
}

/** Read ENGINE_API_SECRET without Next.js $variable expansion (breaks secrets containing $). */
function readSecretFromEnvFiles(): string | undefined {
  const root = process.cwd()
  for (const file of ['.env.local', '.env']) {
    const envPath = path.join(root, file)
    if (!fs.existsSync(envPath)) continue

    const parsed = dotenv.parse(fs.readFileSync(envPath, 'utf8'))
    const raw = parsed.ENGINE_API_SECRET
    if (raw?.trim()) return normalizeSecret(raw)
  }

  return undefined
}

/** Normalize ENGINE_API_SECRET from .env (trim quotes / whitespace). */
export function getEngineApiSecret(): string {
  if (cached) return cached

  const fromFile = readSecretFromEnvFiles()
  if (fromFile) {
    cached = fromFile
    return cached
  }

  const raw = process.env.ENGINE_API_SECRET
  if (!raw?.trim()) {
    throw new Error('ENGINE_API_SECRET is required')
  }

  cached = normalizeSecret(raw)
  return cached
}
