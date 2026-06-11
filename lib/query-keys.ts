import type { PortfolioFilter } from '@/lib/document-filters'

export type DocumentListStatus = 'all' | 'ready' | 'processing' | 'failed'

export const queryKeys = {
  documents: {
    all: () => ['documents', 'all'] as const,
    chat: () => ['documents', 'chat'] as const,
    list: (params: {
      page: number
      limit: number
      search: string
      status: DocumentListStatus
      portfolio: PortfolioFilter
    }) => ['documents', 'list', params] as const,
  },
  stats: () => ['stats'] as const,
  charts: () => ['charts'] as const,
  deadlines: {
    list: (params: { page: number; limit: number }) =>
      ['deadlines', 'list', params] as const,
  },
  templates: () => ['templates'] as const,
}
