import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EndingScreen } from '../EndingScreen'

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    blob: () => Promise.resolve(new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/mpeg' })),
  }) as unknown as typeof fetch
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:fake'),
    revokeObjectURL: vi.fn(),
  })
  vi.stubGlobal(
    'Audio',
    vi.fn(() => ({
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      onended: null,
    })),
  )
})

describe('EndingScreen', () => {
  it('shows replay button', () => {
    render(
      <EndingScreen
        path="breakout"
        replyText="It worked!"
        participantVoiceId="voice-id"
        onReplay={vi.fn()}
      />,
    )
    expect(screen.getByText(/play again/i)).toBeInTheDocument()
  })

  it('calls onReplay when replay button is clicked', () => {
    const onReplay = vi.fn()
    render(
      <EndingScreen
        path="solid-win"
        replyText="Solid!"
        participantVoiceId="voice-id"
        onReplay={onReplay}
      />,
    )
    fireEvent.click(screen.getByText(/play again/i))
    expect(onReplay).toHaveBeenCalledOnce()
  })
})
