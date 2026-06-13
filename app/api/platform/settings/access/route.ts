import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { platformSettingsRepository } from '@/repositories/platform-settings.repository'
import { platformAccessSettingsSchema } from '@/validators/admin.schema'
import { CACHE } from '@/lib/cache-headers'

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser(req)
    const settings = await platformSettingsRepository.get()
    return NextResponse.json({ settings }, { status: 200, headers: CACHE.noStore })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    const status =
      message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdminUser(req)
    const body = platformAccessSettingsSchema.parse(await req.json())
    const settings = await platformSettingsRepository.upsert(body, admin.id)
    return NextResponse.json(
      {
        settings: {
          maxConsecutiveIrrelevant: settings.maxConsecutiveIrrelevant,
          strikeWarningAt: settings.strikeWarningAt,
          appealSlaBusinessDays: settings.appealSlaBusinessDays,
        },
      },
      { status: 200, headers: CACHE.noStore }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Update failed'
    const status =
      message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
