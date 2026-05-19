import { Hono } from 'hono'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export const transcribeRoute = new Hono()

const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })

transcribeRoute.post('/', async (c) => {
  const body = await c.req.parseBody()
  const file = body['audio']

  if (!(file instanceof File)) {
    return c.json({ error: 'No audio file provided' }, 400)
  }

  try {
    const result = await elevenlabs.speechToText.convert({
      file,
      modelId: 'scribe_v1',
    })
    return c.json({ transcript: result.text })
  } catch (err) {
    console.error('STT error:', err)
    return c.json({ error: 'Transcription failed' }, 500)
  }
})
