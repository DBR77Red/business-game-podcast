import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MicButton } from '../MicButton'

describe('MicButton', () => {
  it('renders a button when idle', () => {
    render(<MicButton onPressStart={vi.fn()} onPressEnd={vi.fn()} isRecording={false} isDisabled={false} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onPressStart on mousedown', () => {
    const onStart = vi.fn()
    render(<MicButton onPressStart={onStart} onPressEnd={vi.fn()} isRecording={false} isDisabled={false} />)
    fireEvent.mouseDown(screen.getByRole('button'))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('calls onPressEnd on mouseup', () => {
    const onEnd = vi.fn()
    render(<MicButton onPressStart={vi.fn()} onPressEnd={onEnd} isRecording={false} isDisabled={false} />)
    fireEvent.mouseUp(screen.getByRole('button'))
    expect(onEnd).toHaveBeenCalledOnce()
  })

  it('is not interactive when disabled', () => {
    const onStart = vi.fn()
    render(<MicButton onPressStart={onStart} onPressEnd={vi.fn()} isRecording={false} isDisabled={true} />)
    fireEvent.mouseDown(screen.getByRole('button'))
    expect(onStart).not.toHaveBeenCalled()
  })
})
