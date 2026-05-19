import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export const ttsRoute = new Hono()

let elevenlabs: ElevenLabsClient | null = null
function getClient(): ElevenLabsClient {
  if (!elevenlabs) elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
  return elevenlabs
}

ttsRoute.post('/', async (c) => {
  const body = await c.req.json<{ text?: string; voiceId?: string }>()
  if (!body.text || !body.voiceId) {
    return c.json({ error: 'text and voiceId are required' }, 400)
  }

  c.header('Content-Type', 'audio/mpeg')

  return stream(c, async (s) => {
    const audioStream = await getClient().textToSpeech.stream(body.voiceId!, {
      text: body.text!,
      modelId: 'eleven_turbo_v2_5',
      outputFormat: 'mp3_44100_128',
    })
    for await (const chunk of audioStream) {
      await s.write(chunk as Uint8Array)
    }
  })
})
