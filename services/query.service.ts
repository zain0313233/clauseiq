import { conversationRepository } from "@/repositories/conversation.repository"
import { documentRepository } from "@/repositories/document.repository"
import { messageRepository } from "@/repositories/message.repository"
import { aiService } from "@/services/ai.service"
import type { ClauseMindQueryResponse, QueryMode } from "@/lib/clausemind"
import { buildConversationHistory } from "@/lib/conversation-history"
import { sanitizeSourcesForStorage } from "@/lib/message-metadata"

export const queryService = {
  ask: async (
    userId: string,
    documentId: string,
    question: string,
    mode: QueryMode = "conversational"
  ): Promise<ClauseMindQueryResponse> => {
    const document = await documentRepository.findById(documentId)
    if (!document || document.userId !== userId) {
      throw new Error("Forbidden")
    }

    const existing = await conversationRepository.findByUserAndDocument(
      userId,
      documentId
    )
    const history = buildConversationHistory(existing?.messages ?? [])

    const conversation = await conversationRepository.getOrCreate(
      userId,
      documentId
    )

    let result: ClauseMindQueryResponse
    try {
      result = await aiService.queryDocument({
        document_id: documentId,
        question,
        user_id: userId,
        mode,
        history,
      })
    } catch (error) {
      throw error
    }

    try {
      await messageRepository.createPair({
        conversationId: conversation.id,
        userContent: question,
        assistantContent: result.answer,
        assistantMetadata: {
          sources: sanitizeSourcesForStorage(result.sources),
          confidence: result.confidence,
        },
      })
    } catch (error) {
      throw new Error("Failed to save conversation messages")
    }

    return result
  },
}
