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
    try {
      const audioStream = await getClient().textToSpeech.stream(body.voiceId!, {
        text: body.text!,
        modelId: 'eleven_turbo_v2_5',
        outputFormat: 'mp3_44100_128',
      })
      for await (const chunk of audioStream) {
        await s.write(chunk as Uint8Array)
      }
    } catch (err) {
      // The headers are already flushed by Hono's stream(), so we can't switch
      // status codes mid-flight. Log so Railway captures the failure; the
      // client will see a truncated mp3 and the audio.play() call will likely
      // no-op or play a fragment. This is the documented degraded-mode UX.
      console.error('tts route error:', err)
    }
  })
})
