export type AuthUser = {
  id: string
  name: string | null
  email: string
  role: string
  emailVerified: boolean
}

/** @deprecated Token is HttpOnly — use credentials: 'include' on fetch instead */
export function authHeaders(): HeadersInit {
  return {}
}

export function withCredentials(init?: RequestInit): RequestInit {
  return {
    ...init,
    credentials: 'include',
    headers: {
      ...init?.headers,
    },
  }
}
