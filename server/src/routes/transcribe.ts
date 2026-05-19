import { Hono } from 'hono'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export const transcribeRoute = new Hono()

let elevenlabs: ElevenLabsClient | null = null
function getClient(): ElevenLabsClient {
  if (!elevenlabs) elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
  return elevenlabs
}

transcribeRoute.post('/', async (c) => {
  const body = await c.req.parseBody()
  const file = body['audio']

  if (!(file instanceof File)) {
    return c.json({ error: 'No audio file provided' }, 400)
  }

  try {
    const result = await getClient().speechToText.convert({
      file,
      modelId: 'scribe_v1',
    })
    return c.json({ transcript: result.text })
  } catch (err) {
    console.error('STT error:', err)
    return c.json({ error: 'Transcription failed' }, 500)
  }
})
