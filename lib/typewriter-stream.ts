type TypewriterOptions = {
  onUpdate: (text: string) => void
  charDelayMs?: number
}

export function createTypewriter({ onUpdate, charDelayMs = 16 }: TypewriterOptions) {
  let displayed = ''
  let pending = ''
  let timer: ReturnType<typeof setTimeout> | null = null
  let stopped = false

  const tick = () => {
    if (stopped || pending.length === 0) {
      timer = null
      return
    }

    displayed += pending[0]
    pending = pending.slice(1)
    onUpdate(displayed)

    timer = setTimeout(tick, charDelayMs)
  }

  return {
    push(chunk: string) {
      if (!chunk) return
      pending += chunk
      if (!timer && !stopped) tick()
    },
    flush() {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      if (pending.length > 0) {
        displayed += pending
        pending = ''
        onUpdate(displayed)
      }
    },
    stop() {
      stopped = true
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    },
    getText() {
      return displayed + pending
    },
  }
}
