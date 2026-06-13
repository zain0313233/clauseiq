export type ChatHistoryTurn = {
  role: 'user' | 'assistant'
  content: string
}

const MAX_TURNS = 5
const MAX_CHARS = 600

export function buildConversationHistory(
  messages: Array<{ role: string; content: string }>
): ChatHistoryTurn[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-(MAX_TURNS * 2))
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content.slice(0, MAX_CHARS),
    }))
}
