import { logger } from '@/lib/logger'
import { aiService } from '@/services/ai.service'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function deleteDocumentVectorsWithRetry(
  documentId: string,
  userId: string,
  attempts = 3
): Promise<void> {
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await aiService.deleteDocumentVectors({
        document_id: documentId,
        user_id: userId,
      })
      return
    } catch (error) {
      lastError = error
      logger.warn('pinecone.delete_retry', {
        documentId,
        attempt,
        error: error instanceof Error ? error.message : 'unknown',
      })
      if (attempt < attempts) {
        await sleep(400 * attempt)
      }
    }
  }

  logger.error('pinecone.delete_failed', {
    documentId,
    userId,
    error: lastError instanceof Error ? lastError.message : 'unknown',
  })

  const message =
    lastError instanceof Error ? lastError.message : 'Failed to purge document embeddings'
  throw new Error(message)
}
