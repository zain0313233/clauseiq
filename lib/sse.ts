export function encodeSseEvent(
  event: string,
  data: unknown,
  id?: string
): string {
  const lines = [`event: ${event}`, `data: ${JSON.stringify(data)}`]
  if (id) lines.push(`id: ${id}`)
  return `${lines.join('\n')}\n\n`
}

export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
} as const
