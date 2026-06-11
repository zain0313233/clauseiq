import { NextRequest, NextResponse } from 'next/server'
import { loginSchema } from '@/validators/auth.schema'
import { userService } from '@/services/user.service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = loginSchema.parse(body)
    const result = await userService.login(input)
    return NextResponse.json(result, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
