import type { QueryClient } from '@tanstack/react-query'

export function invalidateDocuments(client: QueryClient) {
  return client.invalidateQueries({ queryKey: ['documents'] })
}

export function invalidateTemplates(client: QueryClient) {
  return client.invalidateQueries({ queryKey: ['templates'] })
}

export function invalidateDashboard(client: QueryClient) {
  return Promise.all([
    client.invalidateQueries({ queryKey: ['stats'] }),
    client.invalidateQueries({ queryKey: ['charts'] }),
    client.invalidateQueries({ queryKey: ['deadlines'] }),
    invalidateDocuments(client),
  ])
}
