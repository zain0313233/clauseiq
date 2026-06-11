import { conversationRepository } from "@/repositories/conversation.repository"
import { messageRepository } from "@/repositories/message.repository"
import { aiService } from "@/services/ai.service"
import type { ClauseMindQueryResponse, QueryMode } from "@/lib/clausemind"

export const queryService = {
  ask: async (
    userId: string,
    documentId: string,
    question: string,
    mode: QueryMode = "default"
  ): Promise<ClauseMindQueryResponse> => {
    const conversation = await conversationRepository.getOrCreate(
      userId,
      documentId
    )

    await messageRepository.create({
      conversationId: conversation.id,
      role: "user",
      content: question,
    })

    const result = await aiService.queryDocument({
      document_id: documentId,
      question,
      user_id: userId,
      mode,
    })

    await messageRepository.create({
      conversationId: conversation.id,
      role: "assistant",
      content: result.answer,
      metadata: {
        sources: result.sources,
        confidence: result.confidence,
      },
    })

    return result
  },
}
