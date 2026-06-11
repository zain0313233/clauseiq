import { NextRequest, NextResponse } from 'next/server'
import { setAuthCookie } from '@/lib/auth-cookie'
import { signupSchema } from '@/validators/auth.schema'
import { userService } from '@/services/user.service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = signupSchema.parse(body)
    const result = await userService.signup(input)
    const response = NextResponse.json({ user: result.user }, { status: 201 })
    setAuthCookie(response, result.token)
    return response
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
