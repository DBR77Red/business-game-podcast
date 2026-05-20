import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameState, Language, NarrateResponse } from '../types'

type TurnState = NarrateResponse['state']

interface PlayTurnBody {
  gameState: GameState
  playerReply: string
  voiceId?: string
  language?: Language
}

interface PlayHandle {
  stateReady: Promise<TurnState>
  done: Promise<{ narration: string }>
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

interface SSEFrame {
  event: string
  data: string
}

async function* readSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<SSEFrame> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
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
      yield { event, data }
    }
  }
}

export function useAudioStream() {
  const [isPlaying, setIsPlaying] = useState(false)
  const outputVolumeRef = useRef(0)
  const ctxRef = useRef<AudioContext | null>(null)
  // Exposed so visualisers (e.g. HostBars) can read frequency bins per frame.
  const analyserRef = useRef<AnalyserNode | null>(null)
  const queueRef = useRef<AudioBuffer[]>([])
  const playingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const rafRef = useRef(0)

  const ensureContext = useCallback(() => {
    if (ctxRef.current) return ctxRef.current
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.connect(ctx.destination)
    ctxRef.current = ctx
    analyserRef.current = analyser

    const data = new Uint8Array(analyser.frequencyBinCount)
    const loop = () => {
      analyser.getByteFrequencyData(data)
      let sum = 0
      for (let i = 0; i < data.length; i++) sum += data[i]
      outputVolumeRef.current = sum / (data.length * 255)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return ctx
  }, [])

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current)
      ctxRef.current?.close()
    },
    [],
  )

  const playNextInQueue = useCallback(() => {
    const ctx = ctxRef.current
    const analyser = analyserRef.current
    if (!ctx || !analyser) return
    const buf = queueRef.current.shift()
    if (!buf) {
      playingRef.current = false
      setIsPlaying(false)
      outputVolumeRef.current = 0
      return
    }
    playingRef.current = true
    setIsPlaying(true)
    const source = ctx.createBufferSource()
    source.buffer = buf
    source.connect(analyser)
    source.onended = () => playNextInQueue()
    source.start()
  }, [])

  const enqueueAudio = useCallback(
    async (b64: string) => {
      const ctx = ensureContext()
      if (ctx.state === 'suspended') await ctx.resume()
      const arrayBuf = base64ToArrayBuffer(b64)
      const audioBuf = await ctx.decodeAudioData(arrayBuf)
      queueRef.current.push(audioBuf)
      if (!playingRef.current) playNextInQueue()
    },
    [ensureContext, playNextInQueue],
  )

  const playTurn = useCallback(
    (body: PlayTurnBody): PlayHandle => {
      // Abort any in-flight turn before starting a new one.
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      let resolveState!: (s: TurnState) => void
      let rejectState!: (e: unknown) => void
      const stateReady = new Promise<TurnState>((res, rej) => {
        resolveState = res
        rejectState = rej
      })

      let resolveDone!: (payload: { narration: string }) => void
      const done = new Promise<{ narration: string }>((res) => {
        resolveDone = res
      })
      let donePayload: { narration: string } = { narration: '' }

      ;(async () => {
        try {
          const res = await fetch('/api/turn', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
            signal: abortRef.current!.signal,
          })
          if (!res.ok || !res.body) throw new Error(`turn request failed: ${res.status}`)

          for await (const frame of readSSE(res.body)) {
            if (frame.event === 'state') {
              resolveState(JSON.parse(frame.data) as TurnState)
            } else if (frame.event === 'audio') {
              await enqueueAudio(frame.data)
            } else if (frame.event === 'done') {
              try {
                donePayload = frame.data ? JSON.parse(frame.data) : { narration: '' }
              } catch {
                donePayload = { narration: '' }
              }
              break
            } else if (frame.event === 'error') {
              throw new Error(frame.data)
            }
          }

          await new Promise<void>((res) => {
            const check = () => {
              if (!playingRef.current && queueRef.current.length === 0) res()
              else setTimeout(check, 50)
            }
            check()
          })
          resolveDone(donePayload)
        } catch (err) {
          rejectState(err)
          resolveDone({ narration: '' })
        }
      })()

      return { stateReady, done }
    },
    [enqueueAudio],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    queueRef.current.length = 0
    playingRef.current = false
    setIsPlaying(false)
    outputVolumeRef.current = 0
  }, [])

  return { playTurn, stop, isPlaying, outputVolumeRef, analyserRef }
}
