export type SseHandler = (event: string, data: unknown) => void

export async function consumeSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: SseHandler
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      if (!part.trim()) continue

      let event = 'message'
      let dataRaw = ''

      for (const line of part.split('\n')) {
        if (line.startsWith('event:')) {
          event = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          dataRaw += line.slice(5).trim()
        }
      }

      if (!dataRaw) continue

      try {
        onEvent(event, JSON.parse(dataRaw))
      } catch {
        onEvent(event, dataRaw)
      }
    }
  }
}

export async function consumeJsonSseDataStream(
  body: ReadableStream<Uint8Array>,
  onData: (payload: { type: string; [key: string]: unknown }) => void
): Promise<void> {
  await consumeSseStream(body, (_event, data) => {
    if (data && typeof data === 'object' && 'type' in data) {
      onData(data as { type: string; [key: string]: unknown })
    }
  })
}
