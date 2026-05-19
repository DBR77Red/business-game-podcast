import { useState } from 'react'
import type { GameState, Segment, EndingPath } from '../types'

const initialState: GameState = {
  segment: 'IDLE',
  turnCount: 0,
  score: 0,
  path: null,
  history: [],
}

interface TurnState {
  segment: Segment
  score: number
  path: EndingPath | null
}

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>(initialState)

  const startGame = () => setGameState((s) => ({ ...s, segment: 'INTRO' }))

  const applyTurn = (state: TurnState, playerReply: string, narration: string) => {
    setGameState((s) => ({
      ...s,
      segment: state.segment,
      score: state.score,
      path: state.path,
      turnCount: s.turnCount + 1,
      history: [
        ...s.history,
        { role: 'player' as const, text: playerReply },
        { role: 'host' as const, text: narration },
      ],
    }))
  }

  const reset = () => setGameState(initialState)

  return { gameState, startGame, applyTurn, reset }
}
