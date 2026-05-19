import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVoiceRecorder } from '../useVoiceRecorder'

const mockStop = vi.fn()
const mockStart = vi.fn()
const mockTrackStop = vi.fn()

const mockMediaRecorder: {
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  ondataavailable: ((e: BlobEvent) => void) | null
  onstop: (() => void) | null
  stream: { getTracks: () => Array<{ stop: ReturnType<typeof vi.fn> }> }
  state: string
} = {
  start: mockStart,
  stop: mockStop,
  ondataavailable: null,
  onstop: null,
  stream: { getTracks: () => [{ stop: mockTrackStop }] },
  state: 'inactive',
}

beforeEach(() => {
  vi.stubGlobal('MediaRecorder', vi.fn(() => mockMediaRecorder))
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] }),
    },
  })
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ transcript: 'my answer' }),
  }) as unknown as typeof fetch
})

describe('useVoiceRecorder', () => {
  it('starts in not-recording state', () => {
    const { result } = renderHook(() => useVoiceRecorder())
    expect(result.current.isRecording).toBe(false)
  })

  it('sets isRecording to true after startRecording', async () => {
    const { result } = renderHook(() => useVoiceRecorder())
    await act(async () => {
      await result.current.startRecording()
    })
    expect(result.current.isRecording).toBe(true)
  })

  it('resolves transcript after stopRecording', async () => {
    const { result } = renderHook(() => useVoiceRecorder())
    await act(async () => {
      await result.current.startRecording()
    })

    let transcript = ''
    await act(async () => {
      const promise = result.current.stopRecording()
      mockMediaRecorder.onstop?.()
      transcript = await promise
    })

    expect(transcript).toBe('my answer')
    expect(result.current.isRecording).toBe(false)
  })
})
