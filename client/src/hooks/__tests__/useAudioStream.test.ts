import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioStream } from '../useAudioStream'

function sseStream(events: Array<{ event: string; data: string }>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const e of events) {
        controller.enqueue(encoder.encode(`event: ${e.event}\ndata: ${e.data}\n\n`))
      }
      controller.close()
    },
  })
}

interface MockSource {
  connect: ReturnType<typeof vi.fn>
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  onended: null | (() => void)
  buffer: unknown
}

const sources: MockSource[] = []

function mockBufferSource(): MockSource {
  const source: MockSource = {
    connect: vi.fn().mockReturnThis(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null,
    buffer: null,
  }
  // Auto-fire onended on next microtask so the queue drains in tests.
  source.start.mockImplementation(() => {
    queueMicrotask(() => source.onended?.())
  })
  return source
}

beforeEach(() => {
  sources.length = 0
  vi.stubGlobal(
    'AudioContext',
    vi.fn(() => ({
      createBufferSource: vi.fn(() => {
        const s = mockBufferSource()
        sources.push(s)
        return s
      }),
      createAnalyser: vi.fn(() => ({
        connect: vi.fn().mockReturnThis(),
        fftSize: 256,
        frequencyBinCount: 128,
        getByteFrequencyData: vi.fn(),
      })),
      destination: {},
      decodeAudioData: vi.fn().mockResolvedValue({ duration: 0.5 }),
      state: 'running',
      resume: vi.fn(),
      close: vi.fn(),
    })),
  )
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 0),
  )
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  global.fetch = vi.fn().mockImplementation(async () => ({
    ok: true,
    body: sseStream([
      { event: 'state', data: JSON.stringify({ segment: 'INTRO', score: 0, path: null }) },
      { event: 'audio', data: btoa('first-sentence-audio') },
      { event: 'audio', data: btoa('second-sentence-audio') },
      { event: 'done', data: JSON.stringify({ narration: 'hello world' }) },
    ]),
  })) as unknown as typeof fetch
})

describe('useAudioStream', () => {
  it('starts not playing and outputVolumeRef is 0', () => {
    const { result } = renderHook(() => useAudioStream())
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.outputVolumeRef.current).toBe(0)
  })

  it('resolves stateReady with the first SSE state event', async () => {
    const { result } = renderHook(() => useAudioStream())
    let state: { segment: string; score: number; path: string | null } | null = null
    await act(async () => {
      const { stateReady } = result.current.playTurn({
        gameState: { segment: 'IDLE', turnCount: 0, score: 0, path: null, history: [] },
        playerReply: '',
      })
      state = await stateReady
    })
    expect(state).toEqual({ segment: 'INTRO', score: 0, path: null })
  })

  it('decodes each audio SSE event and queues two buffer sources', async () => {
    const { result } = renderHook(() => useAudioStream())
    await act(async () => {
      const { done } = result.current.playTurn({
        gameState: { segment: 'IDLE', turnCount: 0, score: 0, path: null, history: [] },
        playerReply: '',
      })
      await done
    })
    expect(sources.length).toBe(2)
  })

  it('POSTs to /api/turn with JSON content-type', async () => {
    const { result } = renderHook(() => useAudioStream())
    await act(async () => {
      const { stateReady } = result.current.playTurn({
        gameState: { segment: 'IDLE', turnCount: 0, score: 0, path: null, history: [] },
        playerReply: 'hi',
      })
      await stateReady
    })
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/turn',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'content-type': 'application/json' }),
      }),
    )
  })
})
