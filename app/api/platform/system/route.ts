import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { getEngineApiSecret } from '@/lib/engine-secret'
import { CACHE } from '@/lib/cache-headers'

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000'

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser(req)

    const checks: Record<string, string> = {}

    try {
      await prisma.$queryRaw`SELECT 1`
      checks.database = 'ok'
    } catch {
      checks.database = 'error'
    }

    try {
      const res = await fetch(`${AI_ENGINE_URL}/health`, {
        headers: { Authorization: `Bearer ${getEngineApiSecret()}` },
        signal: AbortSignal.timeout(8000),
      })
      checks.engine = res.ok ? 'ok' : 'error'
    } catch {
      checks.engine = 'error'
    }

    checks.web = 'ok'
    checks.smtp = process.env.SMTP_HOST && process.env.SMTP_USER ? 'ok' : 'missing'

    const healthy = checks.database === 'ok' && checks.engine === 'ok'

    return NextResponse.json(
      {
        status: healthy ? 'healthy' : 'degraded',
        checks,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
        engineUrl: AI_ENGINE_URL,
      },
      { status: 200, headers: CACHE.noStore }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    const status =
      message === 'Forbidden'
        ? 403
        : message === 'Unauthorized' || message === 'Email not verified'
          ? 401
          : 400
    return NextResponse.json({ error: message }, { status })
  }
}
