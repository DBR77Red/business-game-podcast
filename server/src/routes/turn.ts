import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import Anthropic from '@anthropic-ai/sdk'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { buildSystemPrompt, type ServerGameState } from '../prompts/hostSystemPrompt.js'
import { SentenceBuffer } from '../lib/sentenceBuffer.js'

export const turnRoute = new Hono()

let anthropic: Anthropic | null = null
let elevenlabs: ElevenLabsClient | null = null
const HOST_VOICE_ID = process.env.HOST_VOICE_ID ?? 'onwK4e9ZLuTAKqWW03F9'

function getAnthropic(): Anthropic {
  if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return anthropic
}
function getElevenLabs(): ElevenLabsClient {
  if (!elevenlabs) elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
  return elevenlabs
}

async function ttsBase64(text: string, voiceId: string): Promise<string> {
  const audioStream = await getElevenLabs().textToSpeech.stream(voiceId, {
    text,
    modelId: 'eleven_turbo_v2_5',
    outputFormat: 'mp3_44100_128',
  })
  const chunks: Uint8Array[] = []
  for await (const chunk of audioStream) chunks.push(chunk as Uint8Array)
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const merged = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    merged.set(c, offset)
    offset += c.length
  }
  return Buffer.from(merged).toString('base64')
}

turnRoute.post('/', async (c) => {
  const body = await c.req.json<{
    gameState?: ServerGameState
    playerReply?: string
    voiceId?: string
  }>()

  if (!body.gameState) {
    return c.json({ error: 'gameState is required' }, 400)
  }

  const gameState = body.gameState
  const voiceId = body.voiceId ?? HOST_VOICE_ID

  const messages: Anthropic.MessageParam[] = [
    ...gameState.history.map((turn) => ({
      role: (turn.role === 'host' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: turn.text,
    })),
    { role: 'user', content: body.playerReply ?? '' },
  ]

  return streamSSE(c, async (sse) => {
    const buffer = new SentenceBuffer()
    let stateSent = false
    const sentSentences: string[] = []

    const flushSentencesAsAudio = async (sentences: string[]) => {
      for (const sentence of sentences) {
        sentSentences.push(sentence)
        const audio = await ttsBase64(sentence, voiceId)
        await sse.writeSSE({ event: 'audio', data: audio })
      }
    }

    try {
      const stream = await getAnthropic().messages.create({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 600,
        stream: true,
        system: buildSystemPrompt(gameState),
        messages,
      })

      for await (const event of stream) {
        if (event.type !== 'content_block_delta') continue
        if (event.delta.type !== 'text_delta') continue
        buffer.push(event.delta.text)

        if (!stateSent) {
          const header = buffer.takeStateHeader()
          if (header) {
            stateSent = true
            await sse.writeSSE({ event: 'state', data: JSON.stringify(header) })
          }
        }

        if (stateSent) {
          await flushSentencesAsAudio(buffer.takeSentences())
        }
      }

      const trailing = buffer.flush()
      if (trailing) await flushSentencesAsAudio([trailing])

      const narration = sentSentences.join(' ')
      await sse.writeSSE({ event: 'done', data: JSON.stringify({ narration }) })
    } catch (err) {
      console.error('turn route error:', err)
      await sse.writeSSE({ event: 'error', data: String(err) })
    }
  })
})
