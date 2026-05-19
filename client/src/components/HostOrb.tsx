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

interface Props {
  appState: AppState
  outputVolumeRef?: RefObject<number>
  className?: string
}

export function HostOrb({ appState, outputVolumeRef, className }: Props) {
  return (
    <div className={className ?? 'w-72 h-72 md:w-80 md:h-80'}>
      <Orb
        colors={['#fbbf24', '#ef4444']}
        agentState={appStateToAgent[appState]}
        volumeMode={outputVolumeRef ? 'manual' : 'auto'}
        outputVolumeRef={outputVolumeRef}
      />
    </div>
  )
}
