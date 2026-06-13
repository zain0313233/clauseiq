import { createTypewriter } from '@/lib/typewriter-stream'

export const STREAM_STATUS = {
  analyzing: 'Analyzing…',
  thinking: 'Thinking…',
} as const

export function isStreamStatusText(content: string): boolean {
  return content === STREAM_STATUS.analyzing || content === STREAM_STATUS.thinking
}

type StreamReplyOptions = {
  onUpdate: (content: string, streaming: boolean) => void
  onSources?: (sources: unknown) => void
  onDone?: (confidence: unknown) => void
}

export function createStreamReplyHandlers(options: StreamReplyOptions) {
  let answerContent = ''
  let receivedTokens = false

  const typewriter = createTypewriter({
    onUpdate: (text) => {
      options.onUpdate(text, true)
    },
  })

  return {
    handlers: {
      onStatus: (text: string) => {
        if (receivedTokens) return
        options.onUpdate(text, true)
      },
      onToken: (text: string) => {
        if (!receivedTokens) {
          receivedTokens = true
          answerContent = ''
        }
        answerContent += text
        typewriter.push(text)
      },
      onSources: (sources: unknown) => {
        options.onSources?.(sources)
      },
      onDone: (confidence: unknown) => {
        typewriter.flush()
        options.onDone?.(confidence)
      },
    },
    finalize: () => {
      typewriter.stop()
      typewriter.flush()
      const finalText = typewriter.getText() || answerContent
      options.onUpdate(finalText, false)
      return finalText
    },
    getAnswer: () => typewriter.getText() || answerContent,
  }
}
