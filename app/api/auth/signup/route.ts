import { NextRequest, NextResponse } from 'next/server'
import { signupSchema } from '@/validators/auth.schema'
import { userService } from '@/services/user.service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = signupSchema.parse(body)
    const result = await userService.signup(input)
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}