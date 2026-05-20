import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusIndicator } from '../StatusIndicator'

describe('StatusIndicator', () => {
  it('shows ON AIR when narrator is speaking', () => {
    render(<StatusIndicator appState="NARRATOR_SPEAKING" />)
    expect(screen.getByText('ON AIR')).toBeInTheDocument()
  })

  it('shows YOUR TURN when player turn', () => {
    render(<StatusIndicator appState="PLAYER_TURN" />)
    expect(screen.getByText('YOUR TURN')).toBeInTheDocument()
  })

  it('shows STANDBY when processing', () => {
    render(<StatusIndicator appState="PROCESSING" />)
    expect(screen.getByText('STANDBY')).toBeInTheDocument()
  })

  it('shows ENDING when in ending state', () => {
    render(<StatusIndicator appState="ENDING" />)
    expect(screen.getByText('ENDING')).toBeInTheDocument()
  })
})
