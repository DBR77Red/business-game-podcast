import type { RefObject } from 'react'
import { Orb, type AgentState } from './ui/orb'
import type { AppState } from '../types'

const appStateToAgent: Record<AppState, AgentState> = {
  IDLE: null,
  NARRATOR_SPEAKING: 'talking',
  PLAYER_TURN: 'listening',
  PROCESSING: 'thinking',
  ENDING: 'talking',
}

// Module-scoped so the array identity is stable across renders. Otherwise the
// underlying Orb re-fires its `[colors]` effect every parent render.
const ORB_COLORS: [string, string] = ['#fbbf24', '#ef4444']

interface Props {
  appState: AppState
  outputVolumeRef?: RefObject<number>
  className?: string
}

export function HostOrb({ appState, outputVolumeRef, className }: Props) {
  return (
    <div className={className ?? 'w-72 h-72 md:w-80 md:h-80'}>
      <Orb
        colors={ORB_COLORS}
        agentState={appStateToAgent[appState]}
        volumeMode={outputVolumeRef ? 'manual' : 'auto'}
        outputVolumeRef={outputVolumeRef}
      />
    </div>
  )
}
