import { describe, it, expect } from 'vitest'
import { SentenceBuffer } from '../src/lib/sentenceBuffer.js'

describe('SentenceBuffer', () => {
  it('extracts the state header before any sentences', () => {
    const buf = new SentenceBuffer()
    buf.push('{"segment":"INTRO","score":0,"path":null}\n')
    expect(buf.takeStateHeader()).toEqual({ segment: 'INTRO', score: 0, path: null })
  })

  it('does not return state header until newline arrives', () => {
    const buf = new SentenceBuffer()
    buf.push('{"segment":"INTRO"')
    expect(buf.takeStateHeader()).toBeNull()
    buf.push(',"score":0,"path":null}\n')
    expect(buf.takeStateHeader()).toEqual({ segment: 'INTRO', score: 0, path: null })
  })

  it('emits sentences split on . ! ? followed by whitespace, holds trailing partial in buffer', () => {
    const buf = new SentenceBuffer()
    buf.push('{"segment":"INTRO","score":0,"path":null}\n')
    buf.takeStateHeader()
    buf.push('Hello there. How are')
    expect(buf.takeSentences()).toEqual(['Hello there.'])
    buf.push(' you today? Great!')
    // "Great!" has no trailing whitespace yet, so it stays buffered.
    expect(buf.takeSentences()).toEqual(['How are you today?'])
    expect(buf.flush()).toBe('Great!')
  })

  it('flushes trailing buffer as a final sentence', () => {
    const buf = new SentenceBuffer()
    buf.push('{"segment":"INTRO","score":0,"path":null}\n')
    buf.takeStateHeader()
    buf.push('No terminal punctuation here')
    expect(buf.takeSentences()).toEqual([])
    expect(buf.flush()).toBe('No terminal punctuation here')
    expect(buf.flush()).toBe('')
  })

  it('does not split on decimals like 2.5%', () => {
    const buf = new SentenceBuffer()
    buf.push('{"segment":"INTRO","score":0,"path":null}\n')
    buf.takeStateHeader()
    buf.push('Growth was 2.5% last quarter. ')
    expect(buf.takeSentences()).toEqual(['Growth was 2.5% last quarter.'])
  })
})
