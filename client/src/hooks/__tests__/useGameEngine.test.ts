import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameEngine } from '../useGameEngine'

describe('useGameEngine', () => {
  it('starts in IDLE segment', () => {
    const { result } = renderHook(() => useGameEngine())
    expect(result.current.gameState.segment).toBe('IDLE')
    expect(result.current.gameState.score).toBe(0)
    expect(result.current.gameState.turnCount).toBe(0)
    expect(result.current.gameState.segmentTurnCount).toBe(0)
    expect(result.current.gameState.history).toHaveLength(0)
  })

  it('startGame transitions to INTRO', () => {
    const { result } = renderHook(() => useGameEngine())
    act(() => result.current.startGame())
    expect(result.current.gameState.segment).toBe('INTRO')
  })

  it('applyTurn updates segment, score, path, and history', () => {
    const { result } = renderHook(() => useGameEngine())
    act(() => result.current.startGame())
    act(() => {
      result.current.applyTurn(
        { segment: 'TIPS', score: 10, path: null },
        'I am a product manager',
        'Great to have you!',
      )
    })
    expect(result.current.gameState.segment).toBe('TIPS')
    expect(result.current.gameState.score).toBe(10)
    expect(result.current.gameState.turnCount).toBe(1)
    expect(result.current.gameState.segmentTurnCount).toBe(0)
    expect(result.current.gameState.history).toHaveLength(2)
    expect(result.current.gameState.history[0]).toEqual({ role: 'player', text: 'I am a product manager' })
    expect(result.current.gameState.history[1]).toEqual({ role: 'host', text: 'Great to have you!' })
  })

  it('does not count the opening host turn as a player reply', () => {
    const { result } = renderHook(() => useGameEngine())
    act(() => result.current.startGame())
    act(() => {
      result.current.applyTurn(
        { segment: 'INTRO', score: 0, path: null },
        '',
        'Welcome to Business Game Podcast.',
      )
    })
    expect(result.current.gameState.turnCount).toBe(0)
    expect(result.current.gameState.segmentTurnCount).toBe(0)
    expect(result.current.gameState.history).toEqual([
      { role: 'host', text: 'Welcome to Business Game Podcast.' },
    ])
  })

  it('increments segmentTurnCount only while staying in the same segment', () => {
    const { result } = renderHook(() => useGameEngine())
    act(() => result.current.startGame())
    act(() => {
      result.current.applyTurn(
        { segment: 'INTRO', score: 5, path: null },
        'I run operations.',
        'Tell me one core business belief.',
      )
    })
    expect(result.current.gameState.segmentTurnCount).toBe(1)

    act(() => {
      result.current.applyTurn(
        { segment: 'TIPS', score: 12, path: null },
        'Retention beats acquisition.',
        'Let us move into tactical questions.',
      )
    })
    expect(result.current.gameState.segmentTurnCount).toBe(0)
    expect(result.current.gameState.turnCount).toBe(2)
  })

  it('reset returns to initial state', () => {
    const { result } = renderHook(() => useGameEngine())
    act(() => result.current.startGame())
    act(() => result.current.reset())
    expect(result.current.gameState.segment).toBe('IDLE')
    expect(result.current.gameState.history).toHaveLength(0)
  })
})
