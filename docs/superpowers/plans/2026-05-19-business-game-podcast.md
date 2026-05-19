# business-game-podcast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a voice-only interactive podcast game where a player is interviewed as a business expert, helps a live participant with their problem, and receives a verdict a month later — all through ElevenLabs audio and Claude narration.

**Architecture:** React + Vite + Tailwind frontend communicates with an Express backend that proxies all ElevenLabs (TTS/STT) and Claude API calls. The frontend records audio, sends it to the backend for transcription, receives Claude's narration text, then plays it back via streamed TTS. Game state lives in `useGameEngine` on the frontend.

**Tech Stack:** React 18, Vite 5, Tailwind CSS 3, Express.js, ElevenLabs SDK (`elevenlabs`), Anthropic SDK (`@anthropic-ai/sdk`), Vitest, React Testing Library, Railway

---

## File Map

```
D:\VibeCoding_Projects\11Labs-Demo\
├── client/
│   ├── src/
│   │   ├── types.ts
│   │   ├── engine/
│   │   │   └── storyConfig.ts
│   │   ├── hooks/
│   │   │   ├── useGameEngine.ts
│   │   │   ├── useVoiceRecorder.ts
│   │   │   └── useAudioPlayer.ts
│   │   ├── components/
│   │   │   ├── StatusIndicator.tsx
│   │   │   ├── AudioVisualizer.tsx
│   │   │   ├── MicButton.tsx
│   │   │   ├── BroadcastStudio.tsx
│   │   │   └── EndingScreen.tsx
│   │   └── App.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── server/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   ├── story.ts
│   │   │   ├── transcribe.ts
│   │   │   ├── speak.ts
│   │   │   └── narrate.ts
│   │   └── prompts/
│   │       └── hostSystemPrompt.ts
│   ├── __tests__/
│   │   ├── story.test.ts
│   │   ├── transcribe.test.ts
│   │   ├── speak.test.ts
│   │   └── narrate.test.ts
│   ├── tsconfig.json
│   └── package.json
├── .env
├── .gitignore
├── railway.json
└── package.json
```

---

## Task 1: Project Scaffold & Monorepo Setup

**Files:**
- Create: `package.json` (root)
- Create: `client/` (Vite scaffold)
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `client/vite.config.ts`
- Create: `client/tailwind.config.ts`
- Create: `.env`
- Create: `.gitignore`

- [ ] **Step 1: Scaffold the client with Vite**

Run from `D:\VibeCoding_Projects\11Labs-Demo`:
```bash
npm create vite@latest client -- --template react-ts
cd client && npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install
```

- [ ] **Step 2: Configure Tailwind**

Replace `client/tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config
```

Add to `client/src/index.css` (replace all content):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: Configure Vite proxy**

Replace `client/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
```

- [ ] **Step 4: Set up the server**

Run from `D:\VibeCoding_Projects\11Labs-Demo`:
```bash
mkdir server && cd server
```

Create `server/package.json`:
```json
{
  "name": "business-game-podcast-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "elevenlabs": "^1.50.0",
    "express": "^4.19.2",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/multer": "^1.4.11",
    "@types/node": "^22.0.0",
    "supertest": "^7.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

Run: `cd server && npm install`

- [ ] **Step 5: Server TypeScript config**

Create `server/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*", "__tests__/**/*"]
}
```

- [ ] **Step 6: Root package.json**

Create `package.json` at project root:
```json
{
  "name": "business-game-podcast",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix client\" \"npm run dev --prefix server\"",
    "test:server": "npm test --prefix server",
    "test:client": "npm test --prefix client"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

Run: `npm install` (at root)

- [ ] **Step 7: Environment file**

Create `.env` at project root:
```
ELEVENLABS_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
HOST_VOICE_ID=onwK4e9ZLuTAKqWW03F9
PARTICIPANT_VOICE_ID=21m00Tcm4TlvDq8ikWAM
PORT=3001
```

Note: `HOST_VOICE_ID` uses ElevenLabs' "Daniel" voice. `PARTICIPANT_VOICE_ID` uses "Rachel". Replace with actual voice IDs from your ElevenLabs dashboard at elevenlabs.io/voice-library.

- [ ] **Step 8: Gitignore**

Create `.gitignore`:
```
node_modules/
dist/
.env
*.local
.superpowers/
```

- [ ] **Step 9: Verify dev servers start**

```bash
npm run dev
```

Expected: Client on http://localhost:5173, Server on http://localhost:3001 (will error until index.ts exists — that's fine for now).

- [ ] **Step 10: Commit**

```bash
git add client/ server/package.json server/tsconfig.json package.json .gitignore .env.example
git commit -m "feat: scaffold monorepo with client (React+Vite+Tailwind) and server (Express+TS)"
```

---

## Task 2: Shared TypeScript Types

**Files:**
- Create: `client/src/types.ts`

- [ ] **Step 1: Write the types file**

Create `client/src/types.ts`:
```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/types.ts
git commit -m "feat: add shared TypeScript types for game state and API contracts"
```

---

## Task 3: Story Config (Episode Content)

**Files:**
- Create: `client/src/engine/storyConfig.ts`
- Create: `client/src/engine/__tests__/storyConfig.test.ts`

- [ ] **Step 1: Install Vitest in client**

```bash
cd client && npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

Add to `client/package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

Add vitest config to `client/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

Create `client/src/test-setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 2: Write the failing test**

Create `client/src/engine/__tests__/storyConfig.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { storyConfig } from '../storyConfig'

describe('storyConfig', () => {
  it('has all four ending reply texts', () => {
    const endings: Array<keyof typeof storyConfig.participant.replyTexts> = [
      'breakout', 'solid-win', 'partial', 'setback'
    ]
    for (const ending of endings) {
      expect(storyConfig.participant.replyTexts[ending]).toBeTruthy()
    }
  })

  it('has scoring thresholds in descending order', () => {
    const { breakout, solidWin, partial } = storyConfig.scoringThresholds
    expect(breakout).toBeGreaterThan(solidWin)
    expect(solidWin).toBeGreaterThan(partial)
  })

  it('has non-empty participant problem description', () => {
    expect(storyConfig.participant.problemDescription.length).toBeGreaterThan(50)
  })
})
```

- [ ] **Step 3: Run test — expect FAIL**

```bash
cd client && npm test
```

Expected: FAIL — `Cannot find module '../storyConfig'`

- [ ] **Step 4: Implement the story config**

Create `client/src/engine/storyConfig.ts`:
```typescript
import type { StoryConfig } from '../types'

export const storyConfig: StoryConfig = {
  episodeTitle: 'Business Game',
  hostVoiceId: import.meta.env.VITE_HOST_VOICE_ID ?? 'onwK4e9ZLuTAKqWW03F9',
  participant: {
    name: 'Marco',
    voiceId: import.meta.env.VITE_PARTICIPANT_VOICE_ID ?? '21m00Tcm4TlvDq8ikWAM',
    problemDescription: `My name is Marco and I run a small digital marketing agency with eight people. We have been growing steadily but our biggest problem is client churn. We sign clients on three-month contracts but about forty percent do not renew. I believe we are delivering results but clients do not seem to see the value. I need help figuring out how to retain them.`,
    replyTexts: {
      'breakout': `Hi, this is Marco. I wanted to write back with an update. I followed the framework our guest laid out — the monthly value reports, the success metrics we agreed on at onboarding, and the quarterly business reviews. Within six weeks our churn dropped from forty percent to twelve percent. Two clients actually upgraded their packages. The episode went viral in a few marketing groups and I have had five referrals from it. I cannot thank you enough. This changed the trajectory of my business.`,
      'solid-win': `Hello, this is Marco. Quick update on the advice from the episode. I implemented most of what was suggested — the reporting cadence took some time to set up but once it was running, clients started engaging much more. After two months our renewal rate improved from sixty to seventy-eight percent. Still work to do but the direction is clearly right. Appreciate the clarity and the practical steps.`,
      'partial': `This is Marco. I wanted to give you an honest update. I tried to follow the advice but some of it was a bit general for my situation. I set up the reporting but clients did not respond as expected. I ended up pivoting to a different approach — more frequent check-in calls instead of written reports. That helped somewhat. Churn is down a little but I am still figuring out the right system. The conversation pointed me in the right direction even if I had to adapt it.`,
      'setback': `Hi, this is Marco. I appreciate the guest's time on the episode. I followed the advice as best I could but honestly the plan was not specific enough for my situation. The reporting templates felt generic and clients did not engage with them. I am still struggling with churn. I have since brought in a consultant who worked with us directly. I think the advice could work for a different kind of agency but it missed some key context about my business. No hard feelings — just being honest.`,
    },
  },
  scoringThresholds: {
    breakout: 80,
    solidWin: 60,
    partial: 40,
  },
}
```

Add to `client/.env` (create this file):
```
VITE_HOST_VOICE_ID=onwK4e9ZLuTAKqWW03F9
VITE_PARTICIPANT_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

- [ ] **Step 5: Run test — expect PASS**

```bash
cd client && npm test
```

Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add client/src/engine/ client/src/test-setup.ts client/vite.config.ts client/package.json
git commit -m "feat: add story config with participant problem and four endings"
```

---

## Task 4: Express Server Skeleton

**Files:**
- Create: `server/src/index.ts`

- [ ] **Step 1: Write the server entry point**

Create `server/src/index.ts`:
```typescript
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { storyRouter } from './routes/story.js'
import { transcribeRouter } from './routes/transcribe.js'
import { speakRouter } from './routes/speak.js'
import { narrateRouter } from './routes/narrate.js'

const app = express()
const port = Number(process.env.PORT ?? 3001)

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/story', storyRouter)
app.use('/api/transcribe', transcribeRouter)
app.use('/api/speak', speakRouter)
app.use('/api/narrate', narrateRouter)

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

export { app }
```

- [ ] **Step 2: Commit**

```bash
git add server/src/index.ts
git commit -m "feat: add Express server skeleton with route mounts"
```

---

## Task 5: GET /api/story Route

**Files:**
- Create: `server/src/routes/story.ts`
- Create: `server/__tests__/story.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/__tests__/story.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../src/index.js'

describe('GET /api/story', () => {
  it('returns episode title', async () => {
    const res = await request(app).get('/api/story')
    expect(res.status).toBe(200)
    expect(res.body.episodeTitle).toBe('Business Game')
  })

  it('returns four ending reply texts', async () => {
    const res = await request(app).get('/api/story')
    const keys = Object.keys(res.body.participant.replyTexts)
    expect(keys).toEqual(expect.arrayContaining(['breakout', 'solid-win', 'partial', 'setback']))
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd server && npm test
```

Expected: FAIL — Cannot find module `../src/index.js`

- [ ] **Step 3: Implement the route**

Create `server/src/routes/story.ts`:
```typescript
import { Router } from 'express'

export const storyRouter = Router()

const config = {
  episodeTitle: 'Business Game',
  hostVoiceId: process.env.HOST_VOICE_ID ?? 'onwK4e9ZLuTAKqWW03F9',
  participant: {
    name: 'Marco',
    voiceId: process.env.PARTICIPANT_VOICE_ID ?? '21m00Tcm4TlvDq8ikWAM',
    problemDescription: `My name is Marco and I run a small digital marketing agency with eight people. We have been growing steadily but our biggest problem is client churn. We sign clients on three-month contracts but about forty percent do not renew. I believe we are delivering results but clients do not seem to see the value. I need help figuring out how to retain them.`,
    replyTexts: {
      'breakout': `Hi, this is Marco. I wanted to write back with an update. I followed the framework our guest laid out — the monthly value reports, the success metrics we agreed on at onboarding, and the quarterly business reviews. Within six weeks our churn dropped from forty percent to twelve percent. Two clients actually upgraded their packages. The episode went viral in a few marketing groups and I have had five referrals from it. I cannot thank you enough. This changed the trajectory of my business.`,
      'solid-win': `Hello, this is Marco. Quick update on the advice from the episode. I implemented most of what was suggested — the reporting cadence took some time to set up but once it was running, clients started engaging much more. After two months our renewal rate improved from sixty to seventy-eight percent. Still work to do but the direction is clearly right. Appreciate the clarity and the practical steps.`,
      'partial': `This is Marco. I wanted to give you an honest update. I tried to follow the advice but some of it was a bit general for my situation. I set up the reporting but clients did not respond as expected. I ended up pivoting to a different approach. Churn is down a little but I am still figuring out the right system.`,
      'setback': `Hi, this is Marco. I appreciate the guest's time on the episode. I followed the advice as best I could but the plan was not specific enough for my situation. I am still struggling with churn. No hard feelings — just being honest.`,
    },
  },
  scoringThresholds: {
    breakout: 80,
    solidWin: 60,
    partial: 40,
  },
}

storyRouter.get('/', (_req, res) => {
  res.json(config)
})
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd server && npm test -- story
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/story.ts server/__tests__/story.test.ts
git commit -m "feat: add GET /api/story route with episode config"
```

---

## Task 6: POST /api/transcribe (ElevenLabs Scribe STT)

**Files:**
- Create: `server/src/routes/transcribe.ts`
- Create: `server/__tests__/transcribe.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/__tests__/transcribe.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { app } from '../src/index.js'

vi.mock('elevenlabs', () => ({
  ElevenLabsClient: vi.fn().mockImplementation(() => ({
    speechToText: {
      convert: vi.fn().mockResolvedValue({ text: 'hello world' }),
    },
  })),
}))

describe('POST /api/transcribe', () => {
  it('returns a transcript string', async () => {
    const res = await request(app)
      .post('/api/transcribe')
      .attach('audio', Buffer.from('fake-audio'), { filename: 'recording.webm', contentType: 'audio/webm' })

    expect(res.status).toBe(200)
    expect(res.body.transcript).toBe('hello world')
  })

  it('returns 400 if no audio file attached', async () => {
    const res = await request(app).post('/api/transcribe')
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd server && npm test -- transcribe
```

Expected: FAIL — route not found

- [ ] **Step 3: Implement the route**

Create `server/src/routes/transcribe.ts`:
```typescript
import { Router } from 'express'
import multer from 'multer'
import { ElevenLabsClient } from 'elevenlabs'
import { Readable } from 'stream'

export const transcribeRouter = Router()

const upload = multer({ storage: multer.memoryStorage() })
const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })

transcribeRouter.post('/', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No audio file provided' })
    return
  }

  try {
    const audioStream = Readable.from(req.file.buffer)
    const result = await elevenlabs.speechToText.convert({
      audio: audioStream,
      model_id: 'scribe_v1',
    })
    res.json({ transcript: result.text })
  } catch (err) {
    console.error('STT error:', err)
    res.status(500).json({ error: 'Transcription failed' })
  }
})
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd server && npm test -- transcribe
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/transcribe.ts server/__tests__/transcribe.test.ts
git commit -m "feat: add POST /api/transcribe using ElevenLabs Scribe STT"
```

---

## Task 7: POST /api/speak (ElevenLabs TTS Streaming)

**Files:**
- Create: `server/src/routes/speak.ts`
- Create: `server/__tests__/speak.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/__tests__/speak.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { app } from '../src/index.js'

const fakeAudioChunk = Buffer.from([0x49, 0x44, 0x33]) // fake mp3 header bytes

vi.mock('elevenlabs', () => ({
  ElevenLabsClient: vi.fn().mockImplementation(() => ({
    textToSpeech: {
      convertAsStream: vi.fn().mockResolvedValue(
        (async function* () { yield fakeAudioChunk })()
      ),
    },
    speechToText: {
      convert: vi.fn().mockResolvedValue({ text: 'hello world' }),
    },
  })),
}))

describe('POST /api/speak', () => {
  it('streams audio with correct content-type', async () => {
    const res = await request(app)
      .post('/api/speak')
      .send({ text: 'Welcome to Business Game', voiceId: 'test-voice-id' })

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('audio/mpeg')
    expect(res.body).toBeInstanceOf(Buffer)
  })

  it('returns 400 if text is missing', async () => {
    const res = await request(app).post('/api/speak').send({ voiceId: 'test-id' })
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd server && npm test -- speak
```

Expected: FAIL — route not found

- [ ] **Step 3: Implement the route**

Create `server/src/routes/speak.ts`:
```typescript
import { Router } from 'express'
import { ElevenLabsClient } from 'elevenlabs'

export const speakRouter = Router()

const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })

speakRouter.post('/', async (req, res) => {
  const { text, voiceId } = req.body as { text?: string; voiceId?: string }

  if (!text || !voiceId) {
    res.status(400).json({ error: 'text and voiceId are required' })
    return
  }

  try {
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Transfer-Encoding', 'chunked')

    const audioStream = await elevenlabs.textToSpeech.convertAsStream(voiceId, {
      text,
      model_id: 'eleven_turbo_v2_5',
      output_format: 'mp3_44100_128',
    })

    for await (const chunk of audioStream) {
      res.write(chunk)
    }
    res.end()
  } catch (err) {
    console.error('TTS error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: 'TTS failed' })
    }
  }
})
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd server && npm test -- speak
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/speak.ts server/__tests__/speak.test.ts
git commit -m "feat: add POST /api/speak with ElevenLabs TTS audio streaming"
```

---

## Task 8: POST /api/narrate (Claude + Scoring)

**Files:**
- Create: `server/src/prompts/hostSystemPrompt.ts`
- Create: `server/src/routes/narrate.ts`
- Create: `server/__tests__/narrate.test.ts`

- [ ] **Step 1: Write the system prompt builder**

Create `server/src/prompts/hostSystemPrompt.ts`:
```typescript
import type { GameState } from './types.js'

// Re-declare locally to avoid circular dep — server doesn't import from client
export interface ServerGameState {
  segment: string
  score: number
  path: string | null
  history: Array<{ role: 'host' | 'player'; text: string }>
}

export function buildSystemPrompt(gameState: ServerGameState): string {
  return `You are the charismatic and sharp host of "Business Game", a professional business podcast. You are interviewing a guest live on air right now.

CURRENT SEGMENT: ${gameState.segment}
CURRENT SCORE: ${gameState.score}/100

PARTICIPANT CONTEXT:
A listener named Marco runs a digital marketing agency and is struggling with 40% client churn. He will join the show in the CHALLENGE segment.

SEGMENTS IN ORDER: IDLE → INTRO → TIPS → CHALLENGE → SCORING → ENDING_1/2/3/4

SEGMENT RULES:
- INTRO: Welcome the guest, ask about their background and one core business belief. After 2 player replies, advance to TIPS.
- TIPS: Ask 2-3 sharp business questions (team building, handling failure, pricing, client retention). After 3 player replies, advance to CHALLENGE.
- CHALLENGE: Announce Marco's problem (read it out naturally). Let the player ask up to 2 clarifying questions, then prompt them for their implementation plan. After the player delivers their plan, advance to SCORING.
- SCORING: Do not say anything new. Just set segment to ENDING_1, ENDING_2, ENDING_3, or ENDING_4 based on the score.
- ENDING_*: Deliver a warm, professional closing as the host. Thank the guest. Tell listeners Marco will send an update in a month.

SCORING RUBRIC (accumulate across TIPS and CHALLENGE):
- Each TIPS answer: 0-15 points. Award 15 for specific, concrete answers with real examples. Award 8 for solid but general answers. Award 3 for vague or clichéd answers.
- CHALLENGE clarifying questions: +5 if the player asks at least one good clarifying question.
- CHALLENGE implementation plan: 0-40 points. Award 40 for a specific, structured, step-by-step plan tailored to Marco's agency. Award 25 for a solid but somewhat generic plan. Award 10 for a vague plan. Award 0 for no plan or off-topic.

ENDING THRESHOLDS:
- Score >= 80 → ENDING_1
- Score >= 60 → ENDING_2
- Score >= 40 → ENDING_3
- Score < 40  → ENDING_4

IMPORTANT RULES:
- Stay in character as the host at all times. Never break the fourth wall.
- Acknowledge what the player just said before moving on — react like a real host.
- Keep narration under 80 words — this is spoken audio, not text.
- Return ONLY the JSON object using the narrate tool. No other text.`
}
```

- [ ] **Step 2: Write the failing test**

Create `server/__tests__/narrate.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { app } from '../src/index.js'

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'narrate',
            input: {
              narration: 'Welcome to Business Game! Tell us about yourself.',
              segment: 'INTRO',
              score: 0,
              path: null,
            },
          },
        ],
      }),
    },
  })),
}))

const validGameState = {
  segment: 'IDLE',
  turnCount: 0,
  score: 0,
  path: null,
  history: [],
}

describe('POST /api/narrate', () => {
  it('returns narration and updated state', async () => {
    const res = await request(app)
      .post('/api/narrate')
      .send({ gameState: validGameState, playerReply: '' })

    expect(res.status).toBe(200)
    expect(res.body.narration).toBeTypeOf('string')
    expect(res.body.state.segment).toBeTypeOf('string')
    expect(res.body.state.score).toBeTypeOf('number')
  })

  it('returns 400 if gameState is missing', async () => {
    const res = await request(app).post('/api/narrate').send({ playerReply: 'hi' })
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 3: Run test — expect FAIL**

```bash
cd server && npm test -- narrate
```

Expected: FAIL — route not found

- [ ] **Step 4: Implement the route**

Create `server/src/routes/narrate.ts`:
```typescript
import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt, type ServerGameState } from '../prompts/hostSystemPrompt.js'

export const narrateRouter = Router()

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const narrateTool: Anthropic.Tool = {
  name: 'narrate',
  description: 'Deliver the host next spoken line and update the game state',
  input_schema: {
    type: 'object' as const,
    properties: {
      narration: { type: 'string', description: "Host's next spoken line, under 80 words" },
      segment: {
        type: 'string',
        enum: ['INTRO', 'TIPS', 'CHALLENGE', 'SCORING', 'ENDING_1', 'ENDING_2', 'ENDING_3', 'ENDING_4'],
      },
      score: { type: 'number', description: 'Cumulative score 0-100' },
      path: {
        type: 'string',
        enum: ['breakout', 'solid-win', 'partial', 'setback'],
        description: 'Current ending path, null if not yet determined',
      },
    },
    required: ['narration', 'segment', 'score'],
  },
}

narrateRouter.post('/', async (req, res) => {
  const { gameState, playerReply } = req.body as {
    gameState?: ServerGameState
    playerReply?: string
  }

  if (!gameState) {
    res.status(400).json({ error: 'gameState is required' })
    return
  }

  const messages: Anthropic.MessageParam[] = [
    ...gameState.history.map((turn) => ({
      role: (turn.role === 'host' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: turn.text,
    })),
    { role: 'user', content: playerReply ?? '' },
  ]

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: buildSystemPrompt(gameState),
      messages,
      tools: [narrateTool],
      tool_choice: { type: 'tool', name: 'narrate' },
    })

    const toolUse = response.content.find((c) => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      res.status(500).json({ error: 'No tool use in response' })
      return
    }

    const input = toolUse.input as {
      narration: string
      segment: string
      score: number
      path?: string | null
    }

    res.json({
      narration: input.narration,
      state: {
        segment: input.segment,
        score: input.score,
        path: input.path ?? null,
      },
    })
  } catch (err) {
    console.error('Narrate error:', err)
    res.status(500).json({ error: 'Narration failed' })
  }
})
```

- [ ] **Step 5: Run test — expect PASS**

```bash
cd server && npm test -- narrate
```

Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/narrate.ts server/src/prompts/hostSystemPrompt.ts server/__tests__/narrate.test.ts
git commit -m "feat: add POST /api/narrate with Claude tool-use scoring and game state transitions"
```

---

## Task 9: useGameEngine Hook

**Files:**
- Create: `client/src/hooks/useGameEngine.ts`
- Create: `client/src/hooks/__tests__/useGameEngine.test.ts`

- [ ] **Step 1: Write the failing test**

Create `client/src/hooks/__tests__/useGameEngine.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameEngine } from '../useGameEngine'

describe('useGameEngine', () => {
  it('starts in IDLE segment', () => {
    const { result } = renderHook(() => useGameEngine())
    expect(result.current.gameState.segment).toBe('IDLE')
    expect(result.current.gameState.score).toBe(0)
    expect(result.current.gameState.history).toHaveLength(0)
  })

  it('startGame transitions to INTRO', () => {
    const { result } = renderHook(() => useGameEngine())
    act(() => result.current.startGame())
    expect(result.current.gameState.segment).toBe('INTRO')
  })

  it('applyNarrateResponse updates segment, score, path, and history', () => {
    const { result } = renderHook(() => useGameEngine())
    act(() => result.current.startGame())
    act(() => {
      result.current.applyNarrateResponse(
        'Great to have you!',
        { segment: 'TIPS', score: 10, path: null },
        'I am a product manager'
      )
    })
    expect(result.current.gameState.segment).toBe('TIPS')
    expect(result.current.gameState.score).toBe(10)
    expect(result.current.gameState.history).toHaveLength(2)
    expect(result.current.gameState.history[0]).toEqual({ role: 'player', text: 'I am a product manager' })
    expect(result.current.gameState.history[1]).toEqual({ role: 'host', text: 'Great to have you!' })
  })

  it('reset returns to initial state', () => {
    const { result } = renderHook(() => useGameEngine())
    act(() => result.current.startGame())
    act(() => result.current.reset())
    expect(result.current.gameState.segment).toBe('IDLE')
    expect(result.current.gameState.history).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd client && npm test -- useGameEngine
```

Expected: FAIL — `Cannot find module '../useGameEngine'`

- [ ] **Step 3: Implement the hook**

Create `client/src/hooks/useGameEngine.ts`:
```typescript
import { useState } from 'react'
import type { GameState, Segment, EndingPath } from '../types'

const initialState: GameState = {
  segment: 'IDLE',
  turnCount: 0,
  score: 0,
  path: null,
  history: [],
}

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>(initialState)

  const startGame = () =>
    setGameState((s) => ({ ...s, segment: 'INTRO' }))

  const applyNarrateResponse = (
    narration: string,
    stateUpdate: { segment: Segment; score: number; path: EndingPath | null },
    playerReply: string
  ) => {
    setGameState((s) => ({
      ...s,
      segment: stateUpdate.segment,
      score: stateUpdate.score,
      path: stateUpdate.path,
      turnCount: s.turnCount + 1,
      history: [
        ...s.history,
        { role: 'player' as const, text: playerReply },
        { role: 'host' as const, text: narration },
      ],
    }))
  }

  const reset = () => setGameState(initialState)

  return { gameState, startGame, applyNarrateResponse, reset }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd client && npm test -- useGameEngine
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/useGameEngine.ts client/src/hooks/__tests__/useGameEngine.test.ts
git commit -m "feat: add useGameEngine state machine hook with full test coverage"
```

---

## Task 10: useVoiceRecorder Hook

**Files:**
- Create: `client/src/hooks/useVoiceRecorder.ts`
- Create: `client/src/hooks/__tests__/useVoiceRecorder.test.ts`

- [ ] **Step 1: Write the failing test**

Create `client/src/hooks/__tests__/useVoiceRecorder.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVoiceRecorder } from '../useVoiceRecorder'

const mockStop = vi.fn()
const mockStart = vi.fn()
const mockTrackStop = vi.fn()

const mockMediaRecorder = {
  start: mockStart,
  stop: mockStop,
  ondataavailable: null as unknown as ((e: BlobEvent) => void) | null,
  onstop: null as unknown as (() => void) | null,
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
    json: () => Promise.resolve({ transcript: 'my answer' }),
  })
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
    await act(async () => { await result.current.startRecording() })

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
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd client && npm test -- useVoiceRecorder
```

Expected: FAIL — `Cannot find module '../useVoiceRecorder'`

- [ ] **Step 3: Implement the hook**

Create `client/src/hooks/useVoiceRecorder.ts`:
```typescript
import { useRef, useState } from 'react'

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
  }

  const stopRecording = (): Promise<string> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current!
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('audio', blob, 'recording.webm')
        const response = await fetch('/api/transcribe', { method: 'POST', body: formData })
        const { transcript } = await response.json()
        setIsRecording(false)
        resolve(transcript as string)
      }
      recorder.stop()
      recorder.stream.getTracks().forEach((t) => t.stop())
    })
  }

  return { startRecording, stopRecording, isRecording }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd client && npm test -- useVoiceRecorder
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/useVoiceRecorder.ts client/src/hooks/__tests__/useVoiceRecorder.test.ts
git commit -m "feat: add useVoiceRecorder push-to-talk hook with ElevenLabs Scribe STT"
```

---

## Task 11: useAudioPlayer Hook

**Files:**
- Create: `client/src/hooks/useAudioPlayer.ts`
- Create: `client/src/hooks/__tests__/useAudioPlayer.test.ts`

- [ ] **Step 1: Write the failing test**

Create `client/src/hooks/__tests__/useAudioPlayer.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioPlayer } from '../useAudioPlayer'

const mockPlay = vi.fn().mockResolvedValue(undefined)
const mockAudio = { play: mockPlay, onended: null as unknown as (() => void) | null, src: '' }

beforeEach(() => {
  vi.stubGlobal('Audio', vi.fn(() => mockAudio))
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:fake'), revokeObjectURL: vi.fn() })
  global.fetch = vi.fn().mockResolvedValue({
    blob: () => Promise.resolve(new Blob(['fake-audio'], { type: 'audio/mpeg' })),
  })
})

describe('useAudioPlayer', () => {
  it('starts not playing', () => {
    const { result } = renderHook(() => useAudioPlayer())
    expect(result.current.isPlaying).toBe(false)
  })

  it('sets isPlaying true after play() is called', async () => {
    const { result } = renderHook(() => useAudioPlayer())
    await act(async () => {
      await result.current.play('Hello world', 'voice-id')
    })
    expect(result.current.isPlaying).toBe(true)
  })

  it('calls /api/speak with correct body', async () => {
    const { result } = renderHook(() => useAudioPlayer())
    await act(async () => {
      await result.current.play('Hello', 'my-voice-id')
    })
    expect(global.fetch).toHaveBeenCalledWith('/api/speak', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ text: 'Hello', voiceId: 'my-voice-id' }),
    }))
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd client && npm test -- useAudioPlayer
```

Expected: FAIL — `Cannot find module '../useAudioPlayer'`

- [ ] **Step 3: Implement the hook**

Create `client/src/hooks/useAudioPlayer.ts`:
```typescript
import { useRef, useState } from 'react'

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const play = async (text: string, voiceId: string): Promise<void> => {
    const response = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId }),
    })

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audioRef.current = audio

    setIsPlaying(true)

    return new Promise((resolve) => {
      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(url)
        resolve()
      }
      audio.play()
    })
  }

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  return { play, stop, isPlaying }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd client && npm test -- useAudioPlayer
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/useAudioPlayer.ts client/src/hooks/__tests__/useAudioPlayer.test.ts
git commit -m "feat: add useAudioPlayer hook for TTS audio streaming playback"
```

---

## Task 12: StatusIndicator Component

**Files:**
- Create: `client/src/components/StatusIndicator.tsx`
- Create: `client/src/components/__tests__/StatusIndicator.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/__tests__/StatusIndicator.test.tsx`:
```typescript
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
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd client && npm test -- StatusIndicator
```

Expected: FAIL — cannot find module

- [ ] **Step 3: Implement the component**

Create `client/src/components/StatusIndicator.tsx`:
```typescript
import type { AppState } from '../types'

const config: Record<AppState, { label: string; dotClass: string; textClass: string }> = {
  IDLE: { label: 'STANDBY', dotClass: 'bg-stone-500', textClass: 'text-stone-400' },
  NARRATOR_SPEAKING: { label: 'ON AIR', dotClass: 'bg-red-500 shadow-[0_0_10px_#ef4444]', textClass: 'text-red-400' },
  PLAYER_TURN: { label: 'YOUR TURN', dotClass: 'bg-green-400 shadow-[0_0_10px_#4ade80]', textClass: 'text-green-400' },
  PROCESSING: { label: 'STANDBY', dotClass: 'bg-stone-500 animate-pulse', textClass: 'text-stone-400' },
  ENDING: { label: 'ENDING', dotClass: 'bg-amber-400 shadow-[0_0_10px_#fbbf24]', textClass: 'text-amber-400' },
}

interface Props {
  appState: AppState
}

export function StatusIndicator({ appState }: Props) {
  const { label, dotClass, textClass } = config[appState]
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
      <span className={`text-xs font-bold tracking-[0.2em] uppercase ${textClass}`}>{label}</span>
    </div>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd client && npm test -- StatusIndicator
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add client/src/components/StatusIndicator.tsx client/src/components/__tests__/StatusIndicator.test.tsx
git commit -m "feat: add StatusIndicator component with ON AIR / YOUR TURN / STANDBY states"
```

---

## Task 13: AudioVisualizer Component

**Files:**
- Create: `client/src/components/AudioVisualizer.tsx`

- [ ] **Step 1: Implement the component**

Create `client/src/components/AudioVisualizer.tsx`:
```typescript
import { useEffect, useRef } from 'react'

interface Props {
  isActive: boolean
  barCount?: number
}

export function AudioVisualizer({ isActive, barCount = 12 }: Props) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([])
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (!isActive) {
      barsRef.current.forEach((bar) => {
        if (bar) bar.style.height = '4px'
      })
      return
    }

    const animate = () => {
      barsRef.current.forEach((bar) => {
        if (!bar) return
        const height = Math.random() * 44 + 4
        bar.style.height = `${height}px`
      })
      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [isActive])

  return (
    <div className="flex items-center gap-1 h-14">
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { barsRef.current[i] = el }}
          className="w-1.5 rounded-sm bg-red-500 transition-none"
          style={{ height: '4px' }}
        />
      ))}
    </div>
  )
}
```

Note: Uses random animation values to simulate audio activity. In a future enhancement, pass a real `AnalyserNode` for frequency-driven animation. For the demo, random bars are visually convincing and avoid Web Audio API complexity during testing.

- [ ] **Step 2: Commit**

```bash
git add client/src/components/AudioVisualizer.tsx
git commit -m "feat: add AudioVisualizer component with animated frequency bars"
```

---

## Task 14: MicButton Component

**Files:**
- Create: `client/src/components/MicButton.tsx`
- Create: `client/src/components/__tests__/MicButton.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/__tests__/MicButton.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MicButton } from '../MicButton'

describe('MicButton', () => {
  it('renders mic icon when idle', () => {
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
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd client && npm test -- MicButton
```

Expected: FAIL — cannot find module

- [ ] **Step 3: Implement the component**

Create `client/src/components/MicButton.tsx`:
```typescript
interface Props {
  onPressStart: () => void
  onPressEnd: () => void
  isRecording: boolean
  isDisabled: boolean
}

export function MicButton({ onPressStart, onPressEnd, isRecording, isDisabled }: Props) {
  const handleMouseDown = () => {
    if (!isDisabled) onPressStart()
  }
  const handleMouseUp = () => {
    if (!isDisabled) onPressEnd()
  }

  return (
    <button
      role="button"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={(e) => { e.preventDefault(); handleMouseDown() }}
      onTouchEnd={(e) => { e.preventDefault(); handleMouseUp() }}
      disabled={isDisabled}
      className={[
        'w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-150 select-none',
        isDisabled
          ? 'border-stone-700 text-stone-700 cursor-not-allowed'
          : isRecording
          ? 'border-green-400 bg-green-400/20 text-green-400 scale-110 shadow-[0_0_20px_rgba(74,222,128,0.4)]'
          : 'border-stone-500 text-stone-400 hover:border-green-400 hover:text-green-400 cursor-pointer',
      ].join(' ')}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    </button>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd client && npm test -- MicButton
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add client/src/components/MicButton.tsx client/src/components/__tests__/MicButton.test.tsx
git commit -m "feat: add MicButton push-to-talk component with recording state styles"
```

---

## Task 15: BroadcastStudio Component (Game Loop)

**Files:**
- Create: `client/src/components/BroadcastStudio.tsx`

- [ ] **Step 1: Implement the component**

Create `client/src/components/BroadcastStudio.tsx`:
```typescript
import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameEngine } from '../hooks/useGameEngine'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { StatusIndicator } from './StatusIndicator'
import { AudioVisualizer } from './AudioVisualizer'
import { MicButton } from './MicButton'
import type { AppState, NarrateResponse, StoryConfig } from '../types'

interface Props {
  onEnding: (path: string, replyText: string, participantVoiceId: string) => void
}

export function BroadcastStudio({ onEnding }: Props) {
  const { gameState, startGame, applyNarrateResponse } = useGameEngine()
  const { play, isPlaying } = useAudioPlayer()
  const { startRecording, stopRecording, isRecording } = useVoiceRecorder()
  const [appState, setAppState] = useState<AppState>('IDLE')
  const [story, setStory] = useState<StoryConfig | null>(null)
  const isRunningRef = useRef(false)

  useEffect(() => {
    fetch('/api/story').then((r) => r.json()).then(setStory)
  }, [])

  const runNarratorTurn = useCallback(
    async (playerReply: string, currentState: typeof gameState) => {
      if (!story || isRunningRef.current) return
      isRunningRef.current = true
      setAppState('PROCESSING')

      try {
        const res = await fetch('/api/narrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameState: currentState, playerReply }),
        })
        const { narration, state }: NarrateResponse = await res.json()
        applyNarrateResponse(narration, state, playerReply)

        setAppState('NARRATOR_SPEAKING')
        await play(narration, story.hostVoiceId)

        if (state.segment.startsWith('ENDING')) {
          const path = state.path ?? 'setback'
          const replyText = story.participant.replyTexts[path as keyof typeof story.participant.replyTexts]
          onEnding(path, replyText, story.participant.voiceId)
          return
        }

        setAppState('PLAYER_TURN')
      } finally {
        isRunningRef.current = false
      }
    },
    [story, play, applyNarrateResponse, onEnding]
  )

  const handleStart = async () => {
    startGame()
    const initialState = { ...gameState, segment: 'INTRO' as const }
    await runNarratorTurn('', initialState)
  }

  const handleMicDown = () => {
    if (appState === 'PLAYER_TURN') startRecording()
  }

  const handleMicUp = async () => {
    if (!isRecording) return
    setAppState('PROCESSING')
    const transcript = await stopRecording()
    await runNarratorTurn(transcript, gameState)
  }

  if (appState === 'IDLE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c0a09] gap-8">
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs tracking-[0.3em] uppercase text-stone-500">Welcome to</p>
          <h1 className="text-4xl font-bold text-stone-100 tracking-wide">Business Game</h1>
          <p className="text-stone-500 text-sm mt-1">A live podcast experience</p>
        </div>
        <button
          onClick={handleStart}
          disabled={!story}
          className="px-8 py-3 border border-red-500 text-red-400 text-sm tracking-[0.2em] uppercase hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Go On Air
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-[#0c0a09] px-6 py-10">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        <StatusIndicator appState={appState} />
        <div className="text-xs tracking-[0.25em] uppercase text-stone-600">
          {story?.episodeTitle}
        </div>
      </div>

      <AudioVisualizer isActive={isPlaying} />

      <div className="flex flex-col items-center gap-4">
        <MicButton
          onPressStart={handleMicDown}
          onPressEnd={handleMicUp}
          isRecording={isRecording}
          isDisabled={appState !== 'PLAYER_TURN'}
        />
        <p className="text-xs text-stone-600 tracking-wide">
          {appState === 'PLAYER_TURN' ? 'Hold to speak' : ''}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/BroadcastStudio.tsx
git commit -m "feat: add BroadcastStudio game loop component wiring all hooks and sub-components"
```

---

## Task 16: EndingScreen Component

**Files:**
- Create: `client/src/components/EndingScreen.tsx`
- Create: `client/src/components/__tests__/EndingScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/__tests__/EndingScreen.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EndingScreen } from '../EndingScreen'

describe('EndingScreen', () => {
  it('shows replay button', () => {
    render(
      <EndingScreen
        path="breakout"
        replyText="It worked!"
        participantVoiceId="voice-id"
        onReplay={vi.fn()}
      />
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
      />
    )
    fireEvent.click(screen.getByText(/play again/i))
    expect(onReplay).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd client && npm test -- EndingScreen
```

Expected: FAIL — cannot find module

- [ ] **Step 3: Implement the component**

Create `client/src/components/EndingScreen.tsx`:
```typescript
import { useEffect } from 'react'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import type { EndingPath } from '../types'

const endingMeta: Record<EndingPath, { label: string; color: string }> = {
  'breakout': { label: 'Breakout Success', color: 'text-green-400' },
  'solid-win': { label: 'Solid Win', color: 'text-indigo-400' },
  'partial': { label: 'Partial Result', color: 'text-amber-400' },
  'setback': { label: 'Setback', color: 'text-red-400' },
}

interface Props {
  path: EndingPath
  replyText: string
  participantVoiceId: string
  onReplay: () => void
}

export function EndingScreen({ path, replyText, participantVoiceId, onReplay }: Props) {
  const { play, isPlaying } = useAudioPlayer()
  const meta = endingMeta[path]

  useEffect(() => {
    play(replyText, participantVoiceId)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c0a09] gap-10 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-stone-500">Marco's update</p>
        <h2 className={`text-2xl font-bold ${meta.color}`}>{meta.label}</h2>
        {isPlaying && (
          <div className="flex gap-1 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-1 h-4 bg-amber-400 rounded-sm animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}
      </div>
      <button
        onClick={onReplay}
        className="px-8 py-3 border border-stone-600 text-stone-400 text-sm tracking-[0.2em] uppercase hover:border-stone-400 hover:text-stone-200 transition-colors"
      >
        Play Again
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd client && npm test -- EndingScreen
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add client/src/components/EndingScreen.tsx client/src/components/__tests__/EndingScreen.test.tsx
git commit -m "feat: add EndingScreen with participant reply audio and replay option"
```

---

## Task 17: App.tsx Entry Point

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/main.tsx`

- [ ] **Step 1: Replace App.tsx**

Replace `client/src/App.tsx`:
```typescript
import { useState } from 'react'
import { BroadcastStudio } from './components/BroadcastStudio'
import { EndingScreen } from './components/EndingScreen'
import type { EndingPath } from './types'

interface EndingState {
  path: EndingPath
  replyText: string
  participantVoiceId: string
}

export default function App() {
  const [ending, setEnding] = useState<EndingState | null>(null)

  const handleEnding = (path: string, replyText: string, participantVoiceId: string) => {
    setEnding({ path: path as EndingPath, replyText, participantVoiceId })
  }

  const handleReplay = () => setEnding(null)

  if (ending) {
    return (
      <EndingScreen
        path={ending.path}
        replyText={ending.replyText}
        participantVoiceId={ending.participantVoiceId}
        onReplay={handleReplay}
      />
    )
  }

  return <BroadcastStudio onEnding={handleEnding} />
}
```

- [ ] **Step 2: Update main.tsx**

Replace `client/src/main.tsx`:
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: Verify dev build compiles**

```bash
cd client && npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/App.tsx client/src/main.tsx
git commit -m "feat: wire App.tsx with BroadcastStudio and EndingScreen routing"
```

---

## Task 18: End-to-End Smoke Test (Local)

- [ ] **Step 1: Add real API keys to .env**

Edit `.env` at project root:
```
ELEVENLABS_API_KEY=<your_real_key>
ANTHROPIC_API_KEY=<your_real_key>
HOST_VOICE_ID=onwK4e9ZLuTAKqWW03F9
PARTICIPANT_VOICE_ID=21m00Tcm4TlvDq8ikWAM
PORT=3001
```

And `client/.env`:
```
VITE_HOST_VOICE_ID=onwK4e9ZLuTAKqWW03F9
VITE_PARTICIPANT_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

- [ ] **Step 2: Run all tests**

```bash
npm run test:server && npm run test:client
```

Expected: All tests pass.

- [ ] **Step 3: Start dev servers**

```bash
npm run dev
```

Open http://localhost:5173. Click "Go On Air". Verify:
- Host voice plays the introduction
- ON AIR indicator is red and animating
- After host finishes, YOUR TURN indicator activates and mic button glows green
- Hold mic button and speak — release — host responds
- Episode progresses through INTRO → TIPS → CHALLENGE → ENDING
- Ending screen plays Marco's reply in a different voice
- Play Again button resets to the start screen

- [ ] **Step 4: Fix any issues found during manual test, then commit**

```bash
git add -A
git commit -m "fix: smoke test fixes"
```

---

## Task 19: Railway Deployment

**Files:**
- Create: `railway.json`
- Create: `Procfile`

- [ ] **Step 1: Build the client for production**

```bash
cd client && npm run build
```

Expected: `client/dist/` folder created.

- [ ] **Step 2: Serve client from Express in production**

Add to `server/src/index.ts` after existing imports:
```typescript
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
```

Add after the route mounts:
```typescript
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'))
  })
}
```

- [ ] **Step 3: Create railway.json**

Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm install --prefix client && npm install --prefix server && npm run build --prefix client && npm run build --prefix server"
  },
  "deploy": {
    "startCommand": "node server/dist/index.js",
    "healthcheckPath": "/api/story",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

- [ ] **Step 4: Set environment variables on Railway**

In the Railway dashboard:
- `ELEVENLABS_API_KEY` = your key
- `ANTHROPIC_API_KEY` = your key
- `HOST_VOICE_ID` = `onwK4e9ZLuTAKqWW03F9`
- `PARTICIPANT_VOICE_ID` = `21m00Tcm4TlvDq8ikWAM`
- `NODE_ENV` = `production`
- `PORT` = `3001`

- [ ] **Step 5: Deploy**

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Expected output includes a deployment URL like `https://business-game-podcast.up.railway.app`.

- [ ] **Step 6: Verify live URL**

Open the Railway URL in an incognito browser. Complete a full episode. Confirm audio latency is acceptable (narrator starts within ~1s of player releasing the mic button).

- [ ] **Step 7: Final commit**

```bash
git add railway.json server/src/index.ts
git commit -m "feat: add Railway deployment config and production static file serving"
```

---

## All Tests Summary

Run all tests at any time:
```bash
npm run test:server   # story, transcribe, speak, narrate
npm run test:client   # storyConfig, useGameEngine, useVoiceRecorder, useAudioPlayer, StatusIndicator, MicButton, EndingScreen
```

Expected total: ~22 tests, all passing.
