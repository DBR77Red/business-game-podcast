import { describe, it, expect, vi } from 'vitest'
import { app } from '../src/index.js'

const fakeAudioChunk = new Uint8Array([0x49, 0x44, 0x33, 0x04])

vi.mock('@anthropic-ai/sdk', () => {
  const create = vi.fn().mockImplementation(async () => {
    const tokens = [
      '{"segment":"INTRO","score":0,"path":null}\n',
      'Welcome to Business Game! ',
      'Tell us about yourself.',
    ]
    return {
      async *[Symbol.asyncIterator]() {
        for (const text of tokens) {
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text } }
        }
        yield { type: 'message_stop' }
      },
      controller: { abort: vi.fn() },
    }
  })
  const Anthropic = vi.fn().mockImplementation(() => ({ messages: { create } }))
  return { default: Anthropic }
})

vi.mock('@elevenlabs/elevenlabs-js', () => ({
  ElevenLabsClient: vi.fn().mockImplementation(() => ({
    textToSpeech: {
      stream: vi.fn().mockImplementation(async function* () {
        yield fakeAudioChunk
      }),
    },
  })),
}))

const validGameState = {
  segment: 'IDLE',
  turnCount: 0,
  score: 0,
  path: null,
  history: [],
}

async function collectSSE(res: Response): Promise<Array<{ event: string; data: string }>> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  const out: Array<{ event: string; data: string }> = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let idx: number
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const frame = buf.slice(0, idx)
      buf = buf.slice(idx + 2)
      const event = frame.match(/^event:\s*(\S+)/m)?.[1] ?? 'message'
      const data = frame.match(/^data:\s*(.*)$/m)?.[1] ?? ''
      out.push({ event, data })
    }
  }
  return out
}

describe('POST /api/turn', () => {
  it('streams a state event followed by audio events and a done event', async () => {
    const res = await app.request('/api/turn', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ gameState: validGameState, playerReply: '' }),
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')

    const events = await collectSSE(res)
    const types = events.map((e) => e.event)
    expect(types[0]).toBe('state')
    expect(types).toContain('audio')
    expect(types[types.length - 1]).toBe('done')

    const state = JSON.parse(events[0].data)
    expect(state.segment).toBe('INTRO')
    expect(state.score).toBe(0)
  })

  it('returns 400 if gameState is missing', async () => {
    const res = await app.request('/api/turn', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ playerReply: 'hi' }),
    })
    expect(res.status).toBe(400)
  })
})
