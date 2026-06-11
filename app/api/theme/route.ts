import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { themeRepository } from "@/repositories/theme.repository"
import { themeSchema } from "@/validators/theme.schema"
import { normalizeTheme } from "@/lib/theme"

export async function GET() {
  try {
    await themeRepository.ensureDefault()
    const theme = await themeRepository.get()
    return NextResponse.json({ theme }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load theme"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = verifyToken(req)
    const body = await req.json()
    const input = themeSchema.parse(body)
    const theme = normalizeTheme(input)

    await themeRepository.upsert(theme, userId)

    return NextResponse.json({ message: "Theme saved", theme }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save theme"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
