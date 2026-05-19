import { describe, it, expect, vi } from 'vitest'
import { app } from '../src/index.js'

vi.mock('@elevenlabs/elevenlabs-js', () => ({
  ElevenLabsClient: vi.fn().mockImplementation(() => ({
    speechToText: {
      convert: vi.fn().mockResolvedValue({ text: 'hello world' }),
    },
  })),
}))

describe('POST /api/transcribe', () => {
  it('returns a transcript string', async () => {
    const form = new FormData()
    form.append('audio', new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'audio/webm' }), 'recording.webm')

    const res = await app.request('/api/transcribe', {
      method: 'POST',
      body: form,
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.transcript).toBe('hello world')
  })

  it('returns 400 if no audio file attached', async () => {
    const res = await app.request('/api/transcribe', {
      method: 'POST',
      body: new FormData(),
    })
    expect(res.status).toBe(400)
  })
})
