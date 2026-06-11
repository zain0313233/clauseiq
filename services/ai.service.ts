import type {
  ClauseMindPortfolioResponse,
  ClauseMindQueryResponse,
  QueryMode,
} from '@/lib/clausemind'

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000'

export const aiService = {
  processDocument: async (data: {
    document_id: string
    file_url: string
    file_type: string
    user_id: string
  }) => {
    const response = await fetch(`${AI_ENGINE_URL}/process/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) throw new Error('Failed to process document')
    return response.json()
  },

  queryDocument: async (data: {
    document_id: string
    question: string
    user_id: string
    mode?: QueryMode
  }): Promise<ClauseMindQueryResponse> => {
    const response = await fetch(`${AI_ENGINE_URL}/query/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_id: data.document_id,
        question: data.question,
        user_id: data.user_id,
        mode: data.mode ?? 'default',
      }),
    })

    const body = await response.json()
    if (!response.ok) throw new Error(body.detail || body.error || 'Failed to query document')
    return body as ClauseMindQueryResponse
  },

  queryPortfolio: async (data: {
    question: string
    user_id: string
    document_ids: string[]
    document_titles: Record<string, string>
  }): Promise<ClauseMindPortfolioResponse> => {
    const response = await fetch(`${AI_ENGINE_URL}/portfolio/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const body = await response.json()
    if (!response.ok) {
      throw new Error(body.detail || body.error || 'Portfolio query failed')
    }

    return {
      answer: body.answer,
      confidence: body.confidence,
      documentsSearched: body.documents_searched,
      sources: (body.sources || []).map(
        (s: {
          content: string
          chunk_index: number
          document_id: string
          document_title: string
          score: number
        }) => ({
          content: s.content,
          chunkIndex: s.chunk_index,
          documentId: s.document_id,
          documentTitle: s.document_title,
          score: s.score,
        })
      ),
    }
  },

  triggerComparison: async (data: {
    document_id: string
    template_id: string
    document_file_url: string
    document_file_type: string
    template_file_url: string
    template_file_type: string
    template_name: string
  }) => {
    const response = await fetch(`${AI_ENGINE_URL}/compare/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) throw new Error('Failed to trigger comparison')
    return response.json()
  },

  triggerAgents: async (data: {
    document_id: string
    file_url: string
    file_type: string
  }) => {
    const response = await fetch(`${AI_ENGINE_URL}/agents/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_id: data.document_id,
        file_url: data.file_url,
        file_type: data.file_type,
      }),
    })

    if (!response.ok) throw new Error('Failed to trigger agent team')
    return response.json()
  },

  triggerAnalysis: async (data: {
    document_id: string
    file_url: string
    file_type: string
  }) => {
    const response = await fetch(`${AI_ENGINE_URL}/analyze/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_id: data.document_id,
        file_url: data.file_url,
        file_type: data.file_type,
      }),
    })

    if (!response.ok) throw new Error('Failed to trigger analysis')
    return response.json()
  },
}