import { describe, it, expect, vi, afterEach } from 'vitest'
import { app } from '../src/index.js'

// Keep the paid SDKs from doing real work if a request slips through.
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: vi.fn() },
  })),
}))
vi.mock('@elevenlabs/elevenlabs-js', () => ({
  ElevenLabsClient: vi.fn().mockImplementation(() => ({
    textToSpeech: { stream: vi.fn() },
    speechToText: { convert: vi.fn() },
  })),
}))

const validGameState = { segment: 'IDLE', turnCount: 0, segmentTurnCount: 0, score: 0, path: null, history: [] }

afterEach(() => {
  delete process.env.APP_PASSWORD
})

describe('APP_PASSWORD gate', () => {
  it('returns 401 on a paid route when password is set but header is missing', async () => {
    process.env.APP_PASSWORD = 'secret'
    const res = await app.request('/api/turn', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ gameState: validGameState, playerReply: '' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 401 when the header is wrong', async () => {
    process.env.APP_PASSWORD = 'secret'
    const res = await app.request('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-app-password': 'nope' },
      body: JSON.stringify({ text: 'hi', voiceId: 'v' }),
    })
    expect(res.status).toBe(401)
  })

  it('leaves /api/story open even when a password is set', async () => {
    process.env.APP_PASSWORD = 'secret'
    const res = await app.request('/api/story')
    expect(res.status).toBe(200)
  })

  it('allows paid routes when no password is configured (local dev)', async () => {
    // APP_PASSWORD unset → gate is open. /api/turn reaches validation and
    // rejects only because gameState is omitted here (400, not 401).
    const res = await app.request('/api/turn', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ playerReply: 'hi' }),
    })
    expect(res.status).toBe(400)
  })
})
