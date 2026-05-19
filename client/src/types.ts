export type Segment =
  | 'IDLE'
  | 'INTRO'
  | 'TIPS'
  | 'CHALLENGE'
  | 'SCORING'
  | 'ENDING_1'
  | 'ENDING_2'
  | 'ENDING_3'
  | 'ENDING_4'

export type EndingPath = 'breakout' | 'solid-win' | 'partial' | 'setback'

export type AppState =
  | 'IDLE'
  | 'NARRATOR_SPEAKING'
  | 'PLAYER_TURN'
  | 'PROCESSING'
  | 'ENDING'

export interface ConversationTurn {
  role: 'host' | 'player'
  text: string
}

export interface GameState {
  segment: Segment
  turnCount: number
  score: number
  path: EndingPath | null
  history: ConversationTurn[]
}

export interface NarrateRequest {
  gameState: GameState
  playerReply: string
}

export interface NarrateResponse {
  narration: string
  state: {
    segment: Segment
    score: number
    path: EndingPath | null
  }
}

export interface StoryConfig {
  episodeTitle: string
  hostVoiceId: string
  participant: {
    name: string
    voiceId: string
    problemDescription: string
    replyTexts: Record<EndingPath, string>
  }
  scoringThresholds: {
    breakout: number
    solidWin: number
    partial: number
  }
}
