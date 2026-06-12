export async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      ...init?.headers,
    },
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Request failed (${res.status})`
    )
  }

  return data as T
}
