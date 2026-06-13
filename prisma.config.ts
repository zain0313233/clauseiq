import { defineConfig } from 'prisma/config'
import * as dotenv from 'dotenv'

dotenv.config()

function prismaDatabaseUrl(): string {
  const raw = process.env.DIRECT_URL ?? process.env.DATABASE_URL
  if (!raw) {
    throw new Error('DATABASE_URL is not set')
  }
  // Prisma CLI can fail with Neon channel_binding=require
  let url = raw.replace(/&?channel_binding=require/g, '')
  if (!url.includes('connect_timeout=')) {
    url += url.includes('?') ? '&connect_timeout=30' : '?connect_timeout=30'
  }
  return url
}

export default defineConfig({
  datasource: {
    url: prismaDatabaseUrl(),
  },
})