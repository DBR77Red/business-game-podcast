import { describe, it, expect, vi } from 'vitest'
import { app } from '../src/index.js'

const fakeChunk = new Uint8Array([0x49, 0x44, 0x33, 0x04])

vi.mock('@elevenlabs/elevenlabs-js', () => ({
  ElevenLabsClient: vi.fn().mockImplementation(() => ({
    textToSpeech: {
      stream: vi.fn().mockImplementation(async function* () {
        yield fakeChunk
      }),
    },
  })),
}))

describe('POST /api/tts', () => {
  it('streams audio/mpeg bytes for given text + voiceId', async () => {
    const res = await app.request('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Hi Marco', voiceId: 'test-voice-id' }),
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('audio/mpeg')
    const bytes = new Uint8Array(await res.arrayBuffer())
    expect(bytes.length).toBeGreaterThan(0)
  })

  it('returns 400 if text or voiceId missing', async () => {
    const res = await app.request('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'only text' }),
    })
    expect(res.status).toBe(400)
  })
})
