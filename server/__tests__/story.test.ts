import { describe, it, expect } from 'vitest'
import { app } from '../src/index.js'

describe('GET /api/story', () => {
  it('returns episode title', async () => {
    const res = await app.request('/api/story')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.episodeTitle).toBe('Business Game')
  })

  it('returns four ending reply texts', async () => {
    const res = await app.request('/api/story')
    const body = await res.json()
    const keys = Object.keys(body.participant.replyTexts)
    expect(keys).toEqual(expect.arrayContaining(['breakout', 'solid-win', 'partial', 'setback']))
  })
})
