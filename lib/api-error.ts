import { NextResponse } from 'next/server'

export function resolveApiError(error: unknown): { message: string; status: number } {
  if (error instanceof Error) {
    switch (error.message) {
      case 'Unauthorized':
        return { message: error.message, status: 401 }
      case 'Forbidden':
        return { message: error.message, status: 403 }
      case 'Not found':
        return { message: error.message, status: 404 }
      default:
        return { message: error.message, status: 400 }
    }
  }

  return { message: 'Request failed', status: 500 }
}

export function apiErrorResponse(
  error: unknown,
  headers?: HeadersInit
): NextResponse {
  const { message, status } = resolveApiError(error)
  return NextResponse.json({ error: message }, { status, headers })
}
