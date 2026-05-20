import { useState } from 'react'
import type { GameState, Segment, EndingPath } from '../types'

const initialState: GameState = {
  segment: 'IDLE',
  turnCount: 0,
  segmentTurnCount: 0,
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
    const hasPlayerReply = playerReply.trim().length > 0

    setGameState((s) => {
      const segmentChanged = state.segment !== s.segment

      return {
        ...s,
        segment: state.segment,
        score: state.score,
        path: state.path,
        turnCount: hasPlayerReply ? s.turnCount + 1 : s.turnCount,
        segmentTurnCount: hasPlayerReply && !segmentChanged ? s.segmentTurnCount + 1 : 0,
        history: [
          ...s.history,
          ...(hasPlayerReply ? [{ role: 'player' as const, text: playerReply }] : []),
          { role: 'host' as const, text: narration },
        ],
      }
    })
  }

  const reset = () => setGameState(initialState)

  return { gameState, startGame, applyTurn, reset }
}
