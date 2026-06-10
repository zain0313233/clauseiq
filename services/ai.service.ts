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
  }) => {
    const response = await fetch(`${AI_ENGINE_URL}/query/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) throw new Error('Failed to query document')
    return response.json()
  },
}