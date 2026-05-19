export interface StateHeader {
  segment: string
  score: number
  path: string | null
}

const SENTENCE_END = /([.!?])(?=\s)/g

export class SentenceBuffer {
  private buffer = ''
  private headerTaken = false

  push(chunk: string): void {
    this.buffer += chunk
  }

  takeStateHeader(): StateHeader | null {
    if (this.headerTaken) return null
    const newlineIdx = this.buffer.indexOf('\n')
    if (newlineIdx === -1) return null
    const headerLine = this.buffer.slice(0, newlineIdx)
    this.buffer = this.buffer.slice(newlineIdx + 1)
    this.headerTaken = true
    try {
      return JSON.parse(headerLine) as StateHeader
    } catch {
      throw new Error(`Invalid state header JSON: ${headerLine}`)
    }
  }

  takeSentences(): string[] {
    if (!this.headerTaken) return []
    const sentences: string[] = []
    let lastIdx = 0
    for (const match of this.buffer.matchAll(SENTENCE_END)) {
      const matchIdx = match.index
      if (matchIdx === undefined) continue
      const endIdx = matchIdx + 1
      const charBefore = this.buffer[matchIdx - 1]
      if (charBefore && /\d/.test(charBefore) && match[1] === '.') continue
      const sentence = this.buffer.slice(lastIdx, endIdx).trim()
      if (sentence) sentences.push(sentence)
      lastIdx = endIdx
    }
    this.buffer = this.buffer.slice(lastIdx).replace(/^\s+/, '')
    return sentences
  }

  flush(): string {
    const trailing = this.buffer.trim()
    this.buffer = ''
    return trailing
  }
}
