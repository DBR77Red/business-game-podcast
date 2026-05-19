# business-game-podcast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a voice-only interactive podcast game where a player is interviewed as a business expert, helps a live participant with their problem, and receives a verdict a month later — all through ElevenLabs audio and Claude narration.

**Architecture:** React + Vite + Tailwind frontend talks to a **Hono** backend that proxies all ElevenLabs (TTS/STT) and Claude API calls. Per turn, the frontend records audio → posts to `/api/transcribe` → posts to a streaming **`/api/turn`** endpoint that pipes Claude's tokens through a sentence buffer into ElevenLabs TTS and emits Server-Sent Events back to the client. The browser queues audio chunks, plays them sequentially via the Web Audio API, and routes the playing-audio amplitude into the 3D `Orb` so it reacts to the host's actual voice. Game state lives in `useGameEngine` on the frontend.

**Tech Stack:**
- **Frontend:** React 19 + React Compiler (auto-memoization, no manual `useMemo`/`useCallback`), Vite 8, Tailwind CSS v4 (via `@tailwindcss/vite`), shadcn/ui style "base-nova" on `@base-ui/react`, React Three Fiber + Three.js (existing `Orb`), TypeScript 6, Vitest 3 + React Testing Library
- **Backend:** Hono on `@hono/node-server` (Web-Standards-based, runs on Node/Bun/Deno/CF Workers), `@anthropic-ai/sdk` (streaming Messages API), `@elevenlabs/elevenlabs-js` (`textToSpeech.stream` + Scribe STT), TypeScript 6, Vitest 3
- **Deploy:** Railway

**Pre-existing scaffold (preserved, not rebuilt):** The repo root already contains a working Vite + React 19 + Tailwind v4 + shadcn scaffold with `Orb`, `Waveform`, and `Button` components under `src/components/ui/`. Task 1 **restructures** these files into a `client/` directory rather than scaffolding fresh.

**Why these choices (talking points for the demo):**
- **Hono over Express 5:** Web-Standards request/response, native streaming, multi-runtime, smaller surface area. Tests use `app.request()` — no supertest needed.
- **Streaming /api/turn over separate narrate + speak:** Cuts perceived turn latency from ~3s to ~700ms by starting TTS on Claude's first complete sentence while later tokens are still arriving.
- **React Compiler:** automatic memoization across the component tree; demonstrates fluency with React 19's compiler-first model.
- **React 19 `use()` hook + Suspense:** modern data loading for the story config (no `useEffect` + `useState` for fetch).
- **Real audio amplitude into the 3D Orb:** uses Web Audio `AnalyserNode` instead of canned animations — the orb genuinely tracks the host voice.

---

## File Map

After Task 1 the layout is:

```
D:\VibeCoding_Projects\11Labs-Demo\
├── client/                          # moved from repo root
│   ├── src/
│   │   ├── types.ts                 # NEW
│   │   ├── lib/
│   │   │   ├── utils.ts             # PRESERVED
│   │   │   └── fetchStory.ts        # NEW — cached promise for React 19 use()
│   │   ├── hooks/                   # NEW
│   │   │   ├── useGameEngine.ts
│   │   │   ├── useVoiceRecorder.ts
│   │   │   └── useAudioStream.ts    # SSE consumer + Web Audio queue + AnalyserNode
│   │   ├── components/
│   │   │   ├── StatusIndicator.tsx  # NEW
│   │   │   ├── HostOrb.tsx          # NEW — wrapper around the existing Orb
│   │   │   ├── MicButton.tsx        # NEW
│   │   │   ├── BroadcastStudio.tsx  # NEW
│   │   │   ├── EndingScreen.tsx     # NEW
│   │   │   └── ui/                  # PRESERVED
│   │   │       ├── button.tsx
│   │   │       ├── orb.tsx
│   │   │       └── waveform.tsx
│   │   ├── assets/                  # PRESERVED (Vite-template assets removed in Task 16)
│   │   ├── App.tsx                  # REWRITTEN in Task 17
│   │   ├── main.tsx                 # PRESERVED
│   │   └── index.css                # PRESERVED (Tailwind v4 @theme)
│   ├── index.html                   # PRESERVED
│   ├── vite.config.ts               # MODIFIED (add proxy + test)
│   ├── tsconfig.json                # PRESERVED
│   ├── tsconfig.app.json            # PRESERVED
│   ├── tsconfig.node.json           # PRESERVED
│   ├── eslint.config.js             # PRESERVED
│   ├── components.json              # PRESERVED (shadcn config)
│   ├── public/                      # PRESERVED
│   └── package.json                 # PRESERVED (now under client/)
├── server/                          # NEW (Hono)
│   ├── src/
│   │   ├── index.ts                 # Hono app + serve()
│   │   ├── routes/
│   │   │   ├── story.ts
│   │   │   ├── transcribe.ts
│   │   │   └── turn.ts              # streaming SSE: Claude → sentence buffer → ElevenLabs TTS
│   │   └── prompts/
│   │       └── hostSystemPrompt.ts
│   ├── __tests__/
│   │   ├── story.test.ts
│   │   ├── transcribe.test.ts
│   │   └── turn.test.ts
│   ├── tsconfig.json
│   └── package.json
├── .env                             # NEW
├── .env.example                     # NEW
├── .gitignore                       # MODIFIED
├── railway.json                     # NEW (Task 19)
├── CLAUDE.md                        # PRESERVED
├── README.md                        # PRESERVED
├── docs/                            # PRESERVED
└── package.json                     # NEW root (concurrently)
```

> **Tailwind note:** This repo uses Tailwind **v4**, configured via `@tailwindcss/vite` and an `@theme inline { ... }` block in `client/src/index.css`. There is no `tailwind.config.ts`. The `@tailwind base/components/utilities` directives from v3 do **not** apply.

---

## Task 1: Restructure into Monorepo (client/ + server/)

The repo root already contains a working Vite + React 19 + Tailwind v4 + shadcn scaffold. This task **moves** that scaffold into `client/` and creates a fresh `server/` directory beside it — it does **not** run `npm create vite`.

**Files affected:**
- Move: root scaffold (`src/`, `public/`, `index.html`, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `components.json`) → `client/`
- Modify: `client/vite.config.ts` (add `/api` proxy)
- Modify: `.gitignore` (add server/dist, client/dist, .env)
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts` (deferred — Task 4 fills it; for now create an empty placeholder so `tsx watch` doesn't crash)
- Create: root `package.json`
- Create: `.env` and `.env.example`

- [ ] **Step 1: Move root scaffold into `client/`**

From `D:\VibeCoding_Projects\11Labs-Demo`, in PowerShell:
```powershell
New-Item -ItemType Directory client
Move-Item src, public, index.html, vite.config.ts, tsconfig.json, tsconfig.app.json, tsconfig.node.json, eslint.config.js, components.json, package.json, package-lock.json client/
```

Do **not** move `node_modules/` — delete it instead and reinstall under `client/`:
```powershell
Remove-Item -Recurse -Force node_modules
```

`README.md`, `CLAUDE.md`, `.gitignore`, `.git/`, and `docs/` stay at the repo root.

- [ ] **Step 2: Reinstall client dependencies**

```bash
cd client && npm install
```

Expected: `client/node_modules/` populated. No errors.

- [ ] **Step 3: Install React Compiler in client**

```bash
cd client && npm install -D babel-plugin-react-compiler@latest
```

(React Compiler ships as a Babel plugin. `@vitejs/plugin-react` runs Babel under the hood when a `babel` option is supplied, so we don't need to swap to plugin-react-swc.)

- [ ] **Step 4: Update `client/vite.config.ts` — add `/api` proxy + React Compiler**

Replace `client/vite.config.ts` with:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
```

- [ ] **Step 5: Rename `client/package.json` name field**

Open `client/package.json` and change the `"name"` field:
```json
"name": "business-game-podcast-client",
```

(Vitest scripts are added in Task 3 — leave `"scripts"` as-is for now.)

- [ ] **Step 6: Create `server/` directory and `server/package.json`**

```bash
mkdir server
```

Create `server/package.json`:
```json
{
  "name": "business-game-podcast-server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "latest",
    "@elevenlabs/elevenlabs-js": "latest",
    "@hono/node-server": "^1.13.0",
    "dotenv": "^16.4.7",
    "hono": "^4.7.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^6.0.0",
    "vitest": "^3.0.0"
  }
}
```

Run:
```bash
cd server && npm install
```

- [ ] **Step 7: Create `server/tsconfig.json`**

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

- [ ] **Step 8: Create placeholder `server/src/index.ts`**

```bash
mkdir server/src
```

Create `server/src/index.ts`:
```typescript
// Placeholder — fully implemented in Task 4.
console.log('server starting…')
```

Task 4 replaces this with the real Hono app.

- [ ] **Step 9: Create root `package.json`**

At repo root:
```json
{
  "name": "business-game-podcast",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm:dev:client\" \"npm:dev:server\"",
    "dev:client": "npm run dev --prefix client",
    "dev:server": "npm run dev --prefix server",
    "build:client": "npm run build --prefix client",
    "build:server": "npm run build --prefix server",
    "test:client": "npm test --prefix client",
    "test:server": "npm test --prefix server",
    "test": "npm run test:client && npm run test:server"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

Run:
```bash
npm install
```

- [ ] **Step 10: Create `.env` and `.env.example`**

Create `.env` at repo root (real keys go here — never committed):
```
ELEVENLABS_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
HOST_VOICE_ID=onwK4e9ZLuTAKqWW03F9
PARTICIPANT_VOICE_ID=21m00Tcm4TlvDq8ikWAM
PORT=3001
```

Create `.env.example` at repo root (committed; documents required vars):
```
ELEVENLABS_API_KEY=
ANTHROPIC_API_KEY=
HOST_VOICE_ID=onwK4e9ZLuTAKqWW03F9
PARTICIPANT_VOICE_ID=21m00Tcm4TlvDq8ikWAM
PORT=3001
```

Note: `HOST_VOICE_ID` is ElevenLabs' "Daniel". `PARTICIPANT_VOICE_ID` is "Rachel". Swap for your own voices from elevenlabs.io/voice-library if desired.

- [ ] **Step 11: Update `.gitignore`**

Replace `.gitignore` at repo root with:
```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Dependencies
node_modules/

# Builds
dist/
dist-ssr/

# Env
.env
.env.local
*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Superpowers
.superpowers/
```

- [ ] **Step 12: Verify dev servers start**

From repo root:
```bash
npm run dev
```

Expected:
- Client logs `VITE v8.x ready` and serves http://localhost:5173
- Server logs `server starting…` (placeholder from Step 7)

Press `Ctrl+C` to stop both.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: restructure into monorepo (client + server, Hono, React Compiler)"
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

## Task 3: Vitest 3 Setup for Client

The story content lives server-side (Task 5) and is fetched at runtime via `/api/story`. The client doesn't need a duplicate config. Task 3 just configures the client's test runner.

**Files:**
- Modify: `client/package.json` (add test scripts)
- Modify: `client/vite.config.ts` (add `test` block)
- Create: `client/src/test-setup.ts`

- [ ] **Step 1: Install Vitest 3 + RTL in client**

```bash
cd client && npm install -D vitest@^3.0.0 @vitest/ui@^3.0.0 @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14 jsdom@^25
```

Add to `client/package.json` scripts (alongside existing `dev`, `build`, `lint`, `preview`):
```json
"test": "vitest run",
"test:watch": "vitest"
```

Vitest reads its config from `vite.config.ts`. Replace `client/vite.config.ts` (this **extends** the version from Task 1 Step 4 — keeps React Compiler — and adds a `test` block):
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: false,
  },
})
```

Create `client/src/test-setup.ts`:
```typescript
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 2: Add a sanity test to confirm the runner works**

Create `client/src/__tests__/smoke.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 3: Run tests — expect PASS**

```bash
cd client && npm test
```

Expected: PASS (1 test).

- [ ] **Step 4: Commit**

```bash
git add client/src/test-setup.ts client/src/__tests__/ client/vite.config.ts client/package.json
git commit -m "chore: configure Vitest 3 + RTL + jsdom for client tests"
```

---

## Task 4: Hono Server Skeleton

**Files:**
- Modify: `server/src/index.ts` (replace Task 1 placeholder)

- [ ] **Step 1: Write the Hono app**

Replace `server/src/index.ts`:
```typescript
import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { storyRoute } from './routes/story.js'
import { transcribeRoute } from './routes/transcribe.js'
import { turnRoute } from './routes/turn.js'

export const app = new Hono()

app.use('/api/*', cors({ origin: 'http://localhost:5173' }))

app.route('/api/story', storyRoute)
app.route('/api/transcribe', transcribeRoute)
app.route('/api/turn', turnRoute)

const port = Number(process.env.PORT ?? 3001)

// Only start the server when run directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}`)
  })
}
```

> **Why the import.meta.url guard:** Hono tests call `app.request(...)` against the same `app` instance. Without the guard, `import` from a test file would start a live HTTP listener and leave it open.

- [ ] **Step 2: Stub the route modules so the import chain compiles**

Create empty stubs that Tasks 5, 6, 7 will replace.

`server/src/routes/story.ts`:
```typescript
import { Hono } from 'hono'
export const storyRoute = new Hono()
```

`server/src/routes/transcribe.ts`:
```typescript
import { Hono } from 'hono'
export const transcribeRoute = new Hono()
```

`server/src/routes/turn.ts`:
```typescript
import { Hono } from 'hono'
export const turnRoute = new Hono()
```

- [ ] **Step 3: Type-check the server**

```bash
cd server && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/index.ts server/src/routes/
git commit -m "feat: add Hono server skeleton with route stubs"
```

---

## Task 5: GET /api/story Hono Route

**Files:**
- Modify: `server/src/routes/story.ts` (replace Task 4 stub)
- Create: `server/__tests__/story.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/__tests__/story.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { app } from '../src/index.js'

describe('GET /api/story', () => {
  it('returns episode title', async () => {
    const res = await app.request('/api/story')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.episodeTitle).toBe('Business Game')
  })

  it('returns four ending reply texts', async () => {
    const res = await app.request('/api/story')
    const body = await res.json()
    const keys = Object.keys(body.participant.replyTexts)
    expect(keys).toEqual(expect.arrayContaining(['breakout', 'solid-win', 'partial', 'setback']))
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd server && npm test
```

Expected: FAIL — `episodeTitle` is undefined (route stub returns no data).

- [ ] **Step 3: Implement the route**

Replace `server/src/routes/story.ts`:
```typescript
import { Hono } from 'hono'

export const storyRoute = new Hono()

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
} as const

storyRoute.get('/', (c) => c.json(config))
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd server && npm test -- story
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/story.ts server/__tests__/story.test.ts
git commit -m "feat: add GET /api/story Hono route with episode config"
```

---

## Task 6: POST /api/transcribe Hono Route (ElevenLabs Scribe STT)

**Files:**
- Modify: `server/src/routes/transcribe.ts` (replace Task 4 stub)
- Create: `server/__tests__/transcribe.test.ts`

Hono uses Fetch API multipart natively via `c.req.parseBody()` — no `multer`.

- [ ] **Step 1: Write the failing test**

Create `server/__tests__/transcribe.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { app } from '../src/index.js'

vi.mock('@elevenlabs/elevenlabs-js', () => ({
  ElevenLabsClient: vi.fn().mockImplementation(() => ({
    speechToText: {
      convert: vi.fn().mockResolvedValue({ text: 'hello world' }),
    },
  })),
}))

describe('POST /api/transcribe', () => {
  it('returns a transcript string', async () => {
    const form = new FormData()
    form.append('audio', new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'audio/webm' }), 'recording.webm')

    const res = await app.request('/api/transcribe', {
      method: 'POST',
      body: form,
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.transcript).toBe('hello world')
  })

  it('returns 400 if no audio file attached', async () => {
    const res = await app.request('/api/transcribe', {
      method: 'POST',
      body: new FormData(),
    })
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd server && npm test -- transcribe
```

Expected: FAIL — route stub returns 404.

- [ ] **Step 3: Implement the route**

Replace `server/src/routes/transcribe.ts`:
```typescript
import { Hono } from 'hono'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export const transcribeRoute = new Hono()

const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })

transcribeRoute.post('/', async (c) => {
  const body = await c.req.parseBody()
  const file = body['audio']

  if (!(file instanceof File)) {
    return c.json({ error: 'No audio file provided' }, 400)
  }

  try {
    const result = await elevenlabs.speechToText.convert({
      file,
      modelId: 'scribe_v1',
    })
    return c.json({ transcript: result.text })
  } catch (err) {
    console.error('STT error:', err)
    return c.json({ error: 'Transcription failed' }, 500)
  }
})
```

> **Note on `file` parameter name:** newer `@elevenlabs/elevenlabs-js` accepts a `File` directly on the `file` key. If the SDK version installed in your `package.json` expects a different shape, check `node_modules/@elevenlabs/elevenlabs-js/api/resources/speechToText/client/Client.d.ts` for the actual `convert()` signature and adjust.

- [ ] **Step 4: Run test — expect PASS**

```bash
cd server && npm test -- transcribe
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/transcribe.ts server/__tests__/transcribe.test.ts
git commit -m "feat: add POST /api/transcribe (Hono parseBody + @elevenlabs/elevenlabs-js)"
```

---

## Task 7: POST /api/turn (Streaming SSE: Claude → Sentence Buffer → ElevenLabs TTS)

This is the heart of the demo. The endpoint streams Claude tokens, parses a state-header JSON line, buffers tokens into sentences, calls ElevenLabs TTS on each completed sentence, and emits Server-Sent Events back to the browser. The browser plays audio chunks sequentially while Claude is still generating — perceived latency from button release to first audio is ~600–800ms.

**Wire protocol:**
- `event: state\ndata: {"segment":"TIPS","score":15,"path":null}\n\n` (sent once, before any audio)
- `event: audio\ndata: <base64 mp3 bytes>\n\n` (one per completed sentence)
- `event: done\ndata: \n\n` (sent last)

**Files:**
- Create: `server/src/prompts/hostSystemPrompt.ts`
- Modify: `server/src/routes/turn.ts` (replace Task 4 stub)
- Create: `server/__tests__/turn.test.ts`
- Create: `server/src/lib/sentenceBuffer.ts` (testable helper)
- Create: `server/__tests__/sentenceBuffer.test.ts`

- [ ] **Step 1: Write tests for the sentence buffer helper**

Create `server/__tests__/sentenceBuffer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { SentenceBuffer } from '../src/lib/sentenceBuffer.js'

describe('SentenceBuffer', () => {
  it('extracts the state header before any sentences', () => {
    const buf = new SentenceBuffer()
    buf.push('{"segment":"INTRO","score":0,"path":null}\n')
    expect(buf.takeStateHeader()).toEqual({ segment: 'INTRO', score: 0, path: null })
  })

  it('does not return state header until newline arrives', () => {
    const buf = new SentenceBuffer()
    buf.push('{"segment":"INTRO"')
    expect(buf.takeStateHeader()).toBeNull()
    buf.push(',"score":0,"path":null}\n')
    expect(buf.takeStateHeader()).toEqual({ segment: 'INTRO', score: 0, path: null })
  })

  it('emits sentences split on . ! ? followed by space', () => {
    const buf = new SentenceBuffer()
    buf.push('{"segment":"INTRO","score":0,"path":null}\n')
    buf.takeStateHeader()
    buf.push('Hello there. How are')
    expect(buf.takeSentences()).toEqual(['Hello there.'])
    buf.push(' you today? Great!')
    expect(buf.takeSentences()).toEqual(['How are you today?', 'Great!'])
  })

  it('flushes trailing buffer as a final sentence', () => {
    const buf = new SentenceBuffer()
    buf.push('{"segment":"INTRO","score":0,"path":null}\n')
    buf.takeStateHeader()
    buf.push('No terminal punctuation here')
    expect(buf.takeSentences()).toEqual([])
    expect(buf.flush()).toBe('No terminal punctuation here')
    expect(buf.flush()).toBe('')
  })

  it('does not split on decimals like 2.5%', () => {
    const buf = new SentenceBuffer()
    buf.push('{"segment":"INTRO","score":0,"path":null}\n')
    buf.takeStateHeader()
    buf.push('Growth was 2.5% last quarter. ')
    expect(buf.takeSentences()).toEqual(['Growth was 2.5% last quarter.'])
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd server && npm test -- sentenceBuffer
```

Expected: FAIL — `Cannot find module '../src/lib/sentenceBuffer.js'`.

- [ ] **Step 3: Implement the sentence buffer**

Create `server/src/lib/sentenceBuffer.ts`:
```typescript
export interface StateHeader {
  segment: string
  score: number
  path: string | null
}

const SENTENCE_END = /([.!?])(?=\s)/g

export class SentenceBuffer {
  private buffer = ''
  private headerTaken = false

  push(chunk: string): void {
    this.buffer += chunk
  }

  takeStateHeader(): StateHeader | null {
    if (this.headerTaken) return null
    const newlineIdx = this.buffer.indexOf('\n')
    if (newlineIdx === -1) return null
    const headerLine = this.buffer.slice(0, newlineIdx)
    this.buffer = this.buffer.slice(newlineIdx + 1)
    this.headerTaken = true
    try {
      return JSON.parse(headerLine) as StateHeader
    } catch {
      throw new Error(`Invalid state header JSON: ${headerLine}`)
    }
  }

  takeSentences(): string[] {
    if (!this.headerTaken) return []
    const sentences: string[] = []
    let lastIdx = 0
    SENTENCE_END.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = SENTENCE_END.exec(this.buffer)) !== null) {
      const endIdx = match.index + 1
      const charBefore = this.buffer[match.index - 1]
      if (charBefore && /\d/.test(charBefore) && match[1] === '.') continue
      const sentence = this.buffer.slice(lastIdx, endIdx).trim()
      if (sentence) sentences.push(sentence)
      lastIdx = endIdx
    }
    this.buffer = this.buffer.slice(lastIdx).replace(/^\s+/, '')
    return sentences
  }

  flush(): string {
    const trailing = this.buffer.trim()
    this.buffer = ''
    return trailing
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd server && npm test -- sentenceBuffer
```

Expected: PASS (5 tests).

- [ ] **Step 5: Write the system prompt builder**

Create `server/src/prompts/hostSystemPrompt.ts`:
```typescript
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
- CHALLENGE: Announce Marco's problem. Let the player ask up to 2 clarifying questions, then prompt them for their implementation plan. After the plan, advance to SCORING.
- SCORING: Do not say anything new. Just set segment to ENDING_1, ENDING_2, ENDING_3, or ENDING_4 based on the score.
- ENDING_*: Deliver a warm, professional closing as the host. Thank the guest. Tell listeners Marco will send an update in a month.

SCORING RUBRIC (accumulate across TIPS and CHALLENGE):
- Each TIPS answer: 0-15 points. Award 15 for specific, concrete answers with real examples. Award 8 for solid but general answers. Award 3 for vague or clichéd answers.
- CHALLENGE clarifying questions: +5 if the player asks at least one good clarifying question.
- CHALLENGE implementation plan: 0-40 points. Award 40 for a specific, structured, step-by-step plan tailored to Marco's agency. Award 25 for solid but somewhat generic. Award 10 for vague. Award 0 for off-topic.

ENDING THRESHOLDS:
- Score >= 80 → ENDING_1
- Score >= 60 → ENDING_2
- Score >= 40 → ENDING_3
- Score < 40  → ENDING_4

OUTPUT FORMAT (CRITICAL — followed exactly, no exceptions):
Line 1: a single JSON object on one line with keys "segment" (one of the segments above), "score" (number 0-100), "path" (one of "breakout","solid-win","partial","setback", or null). Example: {"segment":"INTRO","score":0,"path":null}
Line 2: blank
Line 3+: your spoken narration in plain prose. No markdown, no stage directions, no bracketed labels. Just what the host says out loud.

IMPORTANT RULES:
- Stay in character as the host at all times. Never break the fourth wall.
- Acknowledge what the player just said before moving on — react like a real host.
- Keep narration under 80 words — this is spoken audio, not text.
- Output ONLY the format described above. No preamble, no explanation, no closing notes.`
}
```

- [ ] **Step 6: Write the failing test for /api/turn**

Create `server/__tests__/turn.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { app } from '../src/index.js'

const fakeAudioChunk = new Uint8Array([0x49, 0x44, 0x33, 0x04])

vi.mock('@anthropic-ai/sdk', () => {
  const create = vi.fn().mockImplementation(async () => {
    const tokens = [
      '{"segment":"INTRO","score":0,"path":null}\n',
      'Welcome to Business Game! ',
      'Tell us about yourself.',
    ]
    return {
      async *[Symbol.asyncIterator]() {
        for (const text of tokens) {
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text } }
        }
        yield { type: 'message_stop' }
      },
      controller: { abort: vi.fn() },
    }
  })
  const Anthropic = vi.fn().mockImplementation(() => ({ messages: { create } }))
  return { default: Anthropic }
})

vi.mock('@elevenlabs/elevenlabs-js', () => ({
  ElevenLabsClient: vi.fn().mockImplementation(() => ({
    textToSpeech: {
      stream: vi.fn().mockImplementation(async function* () {
        yield fakeAudioChunk
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

async function collectSSE(res: Response): Promise<Array<{ event: string; data: string }>> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  const out: Array<{ event: string; data: string }> = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let idx: number
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const frame = buf.slice(0, idx)
      buf = buf.slice(idx + 2)
      const event = frame.match(/^event:\s*(\S+)/m)?.[1] ?? 'message'
      const data = frame.match(/^data:\s*(.*)$/m)?.[1] ?? ''
      out.push({ event, data })
    }
  }
  return out
}

describe('POST /api/turn', () => {
  it('streams a state event followed by audio events and a done event', async () => {
    const res = await app.request('/api/turn', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ gameState: validGameState, playerReply: '' }),
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')

    const events = await collectSSE(res)
    const types = events.map((e) => e.event)
    expect(types[0]).toBe('state')
    expect(types).toContain('audio')
    expect(types[types.length - 1]).toBe('done')

    const state = JSON.parse(events[0].data)
    expect(state.segment).toBe('INTRO')
    expect(state.score).toBe(0)
  })

  it('returns 400 if gameState is missing', async () => {
    const res = await app.request('/api/turn', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ playerReply: 'hi' }),
    })
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 7: Run test — expect FAIL**

```bash
cd server && npm test -- turn
```

Expected: FAIL — route stub returns 404.

- [ ] **Step 8: Implement the streaming route**

Replace `server/src/routes/turn.ts`:
```typescript
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import Anthropic from '@anthropic-ai/sdk'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { buildSystemPrompt, type ServerGameState } from '../prompts/hostSystemPrompt.js'
import { SentenceBuffer } from '../lib/sentenceBuffer.js'

export const turnRoute = new Hono()

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
const HOST_VOICE_ID = process.env.HOST_VOICE_ID ?? 'onwK4e9ZLuTAKqWW03F9'

async function ttsBase64(text: string, voiceId: string): Promise<string> {
  const audioStream = await elevenlabs.textToSpeech.stream(voiceId, {
    text,
    modelId: 'eleven_turbo_v2_5',
    outputFormat: 'mp3_44100_128',
  })
  const chunks: Uint8Array[] = []
  for await (const chunk of audioStream) chunks.push(chunk as Uint8Array)
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const merged = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    merged.set(c, offset)
    offset += c.length
  }
  return Buffer.from(merged).toString('base64')
}

turnRoute.post('/', async (c) => {
  const body = await c.req.json<{
    gameState?: ServerGameState
    playerReply?: string
    voiceId?: string
  }>()

  if (!body.gameState) {
    return c.json({ error: 'gameState is required' }, 400)
  }

  const gameState = body.gameState
  const voiceId = body.voiceId ?? HOST_VOICE_ID

  const messages: Anthropic.MessageParam[] = [
    ...gameState.history.map((turn) => ({
      role: (turn.role === 'host' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: turn.text,
    })),
    { role: 'user', content: body.playerReply ?? '' },
  ]

  return streamSSE(c, async (sse) => {
    const buffer = new SentenceBuffer()
    let stateSent = false
    const sentSentences: string[] = []

    const flushSentencesAsAudio = async (sentences: string[]) => {
      for (const sentence of sentences) {
        sentSentences.push(sentence)
        const audio = await ttsBase64(sentence, voiceId)
        await sse.writeSSE({ event: 'audio', data: audio })
      }
    }

    try {
      const stream = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        stream: true,
        system: buildSystemPrompt(gameState),
        messages,
      })

      for await (const event of stream) {
        if (event.type !== 'content_block_delta') continue
        if (event.delta.type !== 'text_delta') continue
        buffer.push(event.delta.text)

        if (!stateSent) {
          const header = buffer.takeStateHeader()
          if (header) {
            stateSent = true
            await sse.writeSSE({ event: 'state', data: JSON.stringify(header) })
          }
        }

        if (stateSent) {
          await flushSentencesAsAudio(buffer.takeSentences())
        }
      }

      const trailing = buffer.flush()
      if (trailing) await flushSentencesAsAudio([trailing])

      const narration = sentSentences.join(' ')
      await sse.writeSSE({ event: 'done', data: JSON.stringify({ narration }) })
    } catch (err) {
      console.error('turn route error:', err)
      await sse.writeSSE({ event: 'error', data: String(err) })
    }
  })
})
```

- [ ] **Step 9: Run tests — expect PASS**

```bash
cd server && npm test -- turn
```

Expected: PASS (2 tests).

- [ ] **Step 10: Commit**

```bash
git add server/src/routes/turn.ts server/src/prompts/hostSystemPrompt.ts server/src/lib/sentenceBuffer.ts server/__tests__/turn.test.ts server/__tests__/sentenceBuffer.test.ts
git commit -m "feat: add streaming POST /api/turn (Claude stream -> sentence buffer -> ElevenLabs TTS)"
```

---

## Task 8: useGameEngine Hook

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

  it('applyTurn updates segment, score, path, and history', () => {
    const { result } = renderHook(() => useGameEngine())
    act(() => result.current.startGame())
    act(() => {
      result.current.applyTurn(
        { segment: 'TIPS', score: 10, path: null },
        'I am a product manager',
        'Great to have you!'
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

interface TurnState {
  segment: Segment
  score: number
  path: EndingPath | null
}

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>(initialState)

  const startGame = () =>
    setGameState((s) => ({ ...s, segment: 'INTRO' }))

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

## Task 9: useVoiceRecorder Hook

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

## Task 10: useAudioStream Hook (SSE Consumer + Sequential Audio Queue + AnalyserNode)

This hook is the client-side counterpart to `/api/turn`. It POSTs the turn body, consumes the SSE stream, queues base64-encoded MP3 chunks, decodes them into `AudioBuffer`s, plays them sequentially through an `AnalyserNode` so the orb can read live amplitude, and exposes:

- `playTurn(body) → { stateReady: Promise<TurnState>, done: Promise<void> }`
- `isPlaying: boolean`
- `outputVolumeRef: RefObject<number>` — current 0–1 amplitude, updated each animation frame from the AnalyserNode
- `stop(): void` — abort and silence

**Files:**
- Create: `client/src/hooks/useAudioStream.ts`
- Create: `client/src/hooks/__tests__/useAudioStream.test.ts`

- [ ] **Step 1: Write the failing test**

Create `client/src/hooks/__tests__/useAudioStream.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioStream } from '../useAudioStream'

function sseStream(events: Array<{ event: string; data: string }>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const e of events) {
        controller.enqueue(encoder.encode(`event: ${e.event}\ndata: ${e.data}\n\n`))
      }
      controller.close()
    },
  })
}

const mockBufferSource = () => ({
  connect: vi.fn().mockReturnThis(),
  start: vi.fn(),
  stop: vi.fn(),
  onended: null as null | (() => void),
  buffer: null as unknown,
})

const sources: ReturnType<typeof mockBufferSource>[] = []

beforeEach(() => {
  sources.length = 0
  vi.stubGlobal('AudioContext', vi.fn(() => ({
    createBufferSource: vi.fn(() => {
      const s = mockBufferSource()
      sources.push(s)
      return s
    }),
    createAnalyser: vi.fn(() => ({
      connect: vi.fn().mockReturnThis(),
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: vi.fn(),
    })),
    destination: {},
    decodeAudioData: vi.fn().mockResolvedValue({ duration: 0.5 }),
    state: 'running',
    resume: vi.fn(),
  })))
  global.fetch = vi.fn().mockImplementation(async () => ({
    ok: true,
    body: sseStream([
      { event: 'state', data: JSON.stringify({ segment: 'INTRO', score: 0, path: null }) },
      { event: 'audio', data: btoa('first-sentence-audio') },
      { event: 'audio', data: btoa('second-sentence-audio') },
      { event: 'done', data: '' },
    ]),
  }))
})

describe('useAudioStream', () => {
  it('starts not playing and outputVolumeRef is 0', () => {
    const { result } = renderHook(() => useAudioStream())
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.outputVolumeRef.current).toBe(0)
  })

  it('resolves stateReady with the first SSE state event', async () => {
    const { result } = renderHook(() => useAudioStream())
    let state: { segment: string; score: number; path: string | null } | null = null
    await act(async () => {
      const { stateReady } = result.current.playTurn({ gameState: { segment: 'IDLE', turnCount: 0, score: 0, path: null, history: [] }, playerReply: '' })
      state = await stateReady
    })
    expect(state).toEqual({ segment: 'INTRO', score: 0, path: null })
  })

  it('decodes each audio SSE event and queues two buffer sources', async () => {
    const { result } = renderHook(() => useAudioStream())
    await act(async () => {
      const { done } = result.current.playTurn({ gameState: { segment: 'IDLE', turnCount: 0, score: 0, path: null, history: [] }, playerReply: '' })
      // Immediately fire onended for each source so the queue drains.
      const drain = async () => {
        while (sources.length === 0) await new Promise((r) => setTimeout(r, 5))
        for (const s of sources) {
          s.start.mockImplementation(() => queueMicrotask(() => s.onended?.()))
        }
      }
      drain()
      await done
    })
    expect(sources.length).toBe(2)
  })

  it('POSTs to /api/turn with the request body as JSON', async () => {
    const { result } = renderHook(() => useAudioStream())
    await act(async () => {
      const { stateReady } = result.current.playTurn({ gameState: { segment: 'IDLE', turnCount: 0, score: 0, path: null, history: [] }, playerReply: 'hi' })
      await stateReady
    })
    expect(global.fetch).toHaveBeenCalledWith('/api/turn', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'content-type': 'application/json' }),
    }))
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd client && npm test -- useAudioStream
```

Expected: FAIL — `Cannot find module '../useAudioStream'`.

- [ ] **Step 3: Implement the hook**

Create `client/src/hooks/useAudioStream.ts`:
```typescript
import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameState, NarrateResponse } from '../types'

type TurnState = NarrateResponse['state']

interface PlayTurnBody {
  gameState: GameState
  playerReply: string
  voiceId?: string
}

interface PlayHandle {
  stateReady: Promise<TurnState>
  done: Promise<{ narration: string }>
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

interface SSEFrame {
  event: string
  data: string
}

async function* readSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<SSEFrame> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let idx: number
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const frame = buf.slice(0, idx)
      buf = buf.slice(idx + 2)
      const event = frame.match(/^event:\s*(\S+)/m)?.[1] ?? 'message'
      const data = frame.match(/^data:\s*(.*)$/m)?.[1] ?? ''
      yield { event, data }
    }
  }
}

export function useAudioStream() {
  const [isPlaying, setIsPlaying] = useState(false)
  const outputVolumeRef = useRef(0)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const queueRef = useRef<AudioBuffer[]>([])
  const playingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const rafRef = useRef(0)

  const ensureContext = useCallback(() => {
    if (ctxRef.current) return ctxRef.current
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.connect(ctx.destination)
    ctxRef.current = ctx
    analyserRef.current = analyser

    const data = new Uint8Array(analyser.frequencyBinCount)
    const loop = () => {
      analyser.getByteFrequencyData(data)
      let sum = 0
      for (let i = 0; i < data.length; i++) sum += data[i]
      outputVolumeRef.current = sum / (data.length * 255)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return ctx
  }, [])

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current)
    ctxRef.current?.close()
  }, [])

  const playNextInQueue = useCallback(() => {
    const ctx = ctxRef.current
    const analyser = analyserRef.current
    if (!ctx || !analyser) return
    const buf = queueRef.current.shift()
    if (!buf) {
      playingRef.current = false
      setIsPlaying(false)
      outputVolumeRef.current = 0
      return
    }
    playingRef.current = true
    setIsPlaying(true)
    const source = ctx.createBufferSource()
    source.buffer = buf
    source.connect(analyser)
    source.onended = () => playNextInQueue()
    source.start()
  }, [])

  const enqueueAudio = useCallback(async (b64: string) => {
    const ctx = ensureContext()
    if (ctx.state === 'suspended') await ctx.resume()
    const arrayBuf = base64ToArrayBuffer(b64)
    const audioBuf = await ctx.decodeAudioData(arrayBuf)
    queueRef.current.push(audioBuf)
    if (!playingRef.current) playNextInQueue()
  }, [ensureContext, playNextInQueue])

  const playTurn = useCallback((body: PlayTurnBody): PlayHandle => {
    abortRef.current = new AbortController()

    let resolveState: (s: TurnState) => void
    let rejectState: (e: unknown) => void
    const stateReady = new Promise<TurnState>((res, rej) => {
      resolveState = res
      rejectState = rej
    })

    let resolveDone: (payload: { narration: string }) => void
    const done = new Promise<{ narration: string }>((res) => { resolveDone = res })
    let donePayload: { narration: string } = { narration: '' }

    ;(async () => {
      try {
        const res = await fetch('/api/turn', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          signal: abortRef.current!.signal,
        })
        if (!res.ok || !res.body) throw new Error(`turn request failed: ${res.status}`)

        for await (const frame of readSSE(res.body)) {
          if (frame.event === 'state') {
            resolveState(JSON.parse(frame.data) as TurnState)
          } else if (frame.event === 'audio') {
            await enqueueAudio(frame.data)
          } else if (frame.event === 'done') {
            try {
              donePayload = frame.data ? JSON.parse(frame.data) : { narration: '' }
            } catch {
              donePayload = { narration: '' }
            }
            break
          } else if (frame.event === 'error') {
            throw new Error(frame.data)
          }
        }

        // Wait for the audio queue to fully drain before resolving done.
        await new Promise<void>((res) => {
          const check = () => {
            if (!playingRef.current && queueRef.current.length === 0) res()
            else setTimeout(check, 50)
          }
          check()
        })
        resolveDone!(donePayload)
      } catch (err) {
        rejectState!(err)
        resolveDone!({ narration: '' })
      }
    })()

    return { stateReady, done }
  }, [enqueueAudio])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    queueRef.current.length = 0
    playingRef.current = false
    setIsPlaying(false)
    outputVolumeRef.current = 0
  }, [])

  return { playTurn, stop, isPlaying, outputVolumeRef }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd client && npm test -- useAudioStream
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/useAudioStream.ts client/src/hooks/__tests__/useAudioStream.test.ts
git commit -m "feat: add useAudioStream (SSE consumer + Web Audio queue + AnalyserNode amplitude)"
```

---

## Task 11: StatusIndicator Component

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

## Task 12: HostOrb Component (wraps the existing 3D Orb with real audio amplitude)

The repo already contains `client/src/components/ui/orb.tsx` — a React Three Fiber 3D orb. It accepts:
- `agentState: "thinking" | "listening" | "talking" | null` — drives idle/active visual state
- `outputVolumeRef: RefObject<number>` — current 0–1 amplitude of the host voice; drives pulsation in real time
- `volumeMode: "auto" | "manual"` — `"manual"` when we supply our own volume

This wrapper maps our `AppState` to the orb's `AgentState`, accepts an `outputVolumeRef` from `useAudioStream`, and supplies broadcast-studio colors.

**Files:**
- Create: `client/src/components/HostOrb.tsx`

**Why no Vitest test?** The Orb uses WebGL via R3F/Three.js, which jsdom can't render. Smoke-testing the import would only verify TypeScript, not behaviour. Visual verification happens in Task 17 (manual smoke test).

- [ ] **Step 1: Implement `HostOrb.tsx`**

Create `client/src/components/HostOrb.tsx`:
```typescript
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
```

- [ ] **Step 2: Type-check the client**

```bash
cd client && npx tsc -b
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/HostOrb.tsx
git commit -m "feat: add HostOrb wrapper with real audio amplitude via outputVolumeRef"
```

---

## Task 13: MicButton Component

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

## Task 14: BroadcastStudio Component (Game Loop, uses React 19 `use()` for story config)

This is the main game loop. It reads the story config via the React 19 `use()` hook from a module-scoped promise (Suspense-aware — the parent will provide a fallback), then orchestrates the record → `/api/transcribe` → streaming `/api/turn` pipeline. It threads `outputVolumeRef` from `useAudioStream` into the `HostOrb` so the 3D orb reacts to the host's real voice amplitude.

**Files:**
- Create: `client/src/components/BroadcastStudio.tsx`
- Create: `client/src/lib/fetchStory.ts` (cached promise for `use()`)

- [ ] **Step 1: Create the cached story promise**

Create `client/src/lib/fetchStory.ts`:
```typescript
import type { StoryConfig } from '../types'

let cached: Promise<StoryConfig> | null = null

export function fetchStoryConfig(): Promise<StoryConfig> {
  if (!cached) {
    cached = fetch('/api/story').then(async (r) => {
      if (!r.ok) throw new Error(`fetchStoryConfig failed: ${r.status}`)
      return (await r.json()) as StoryConfig
    })
  }
  return cached
}
```

> **Why a module-scoped cached promise?** React 19's `use()` hook reads a promise during render. A new promise on every render would loop forever — we need a stable reference. Module scope is the simplest stable cache for a single-fetch config.

- [ ] **Step 2: Implement `BroadcastStudio.tsx`**

Create `client/src/components/BroadcastStudio.tsx`:
```typescript
import { use, useCallback, useRef, useState } from 'react'
import { useGameEngine } from '../hooks/useGameEngine'
import { useAudioStream } from '../hooks/useAudioStream'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { StatusIndicator } from './StatusIndicator'
import { HostOrb } from './HostOrb'
import { MicButton } from './MicButton'
import { fetchStoryConfig } from '../lib/fetchStory'
import type { AppState, EndingPath } from '../types'

interface Props {
  onEnding: (path: EndingPath, replyText: string, participantVoiceId: string) => void
}

export function BroadcastStudio({ onEnding }: Props) {
  const story = use(fetchStoryConfig())
  const { gameState, startGame, applyTurn } = useGameEngine()
  const { playTurn, outputVolumeRef } = useAudioStream()
  const { startRecording, stopRecording, isRecording } = useVoiceRecorder()
  const [appState, setAppState] = useState<AppState>('IDLE')
  const runningRef = useRef(false)

  const runHostTurn = useCallback(
    async (playerReply: string, currentState: typeof gameState) => {
      if (runningRef.current) return
      runningRef.current = true
      setAppState('PROCESSING')

      try {
        const { stateReady, done } = playTurn({
          gameState: currentState,
          playerReply,
          voiceId: story.hostVoiceId,
        })

        const state = await stateReady
        setAppState('NARRATOR_SPEAKING')
        const { narration } = await done
        applyTurn(state, playerReply, narration)

        if (state.segment.startsWith('ENDING')) {
          const path = (state.path ?? 'setback') as EndingPath
          const replyText = story.participant.replyTexts[path]
          onEnding(path, replyText, story.participant.voiceId)
          return
        }

        setAppState('PLAYER_TURN')
      } finally {
        runningRef.current = false
      }
    },
    [story, playTurn, applyTurn, onEnding]
  )

  const handleStart = async () => {
    startGame()
    await runHostTurn('', { ...gameState, segment: 'INTRO' })
  }

  const handleMicDown = () => {
    if (appState === 'PLAYER_TURN') startRecording()
  }

  const handleMicUp = async () => {
    if (!isRecording) return
    setAppState('PROCESSING')
    const transcript = await stopRecording()
    await runHostTurn(transcript, gameState)
  }

  if (appState === 'IDLE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c0a09] gap-8">
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs tracking-[0.3em] uppercase text-stone-500">Welcome to</p>
          <h1 className="text-4xl font-bold text-stone-100 tracking-wide">{story.episodeTitle}</h1>
          <p className="text-stone-500 text-sm mt-1">A live podcast experience</p>
        </div>
        <button
          onClick={handleStart}
          className="px-8 py-3 border border-red-500 text-red-400 text-sm tracking-[0.2em] uppercase hover:bg-red-500/10 transition-colors"
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
          {story.episodeTitle}
        </div>
      </div>

      <HostOrb appState={appState} outputVolumeRef={outputVolumeRef} />

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

- [ ] **Step 3: Commit**

```bash
git add client/src/components/BroadcastStudio.tsx client/src/lib/fetchStory.ts
git commit -m "feat: add BroadcastStudio (React 19 use() + streaming pipeline + Orb amplitude)"
```

---

## Task 15: EndingScreen Component + One-Shot `/api/tts` Route

The participant reveal at the end uses a different voice and is not driven by Claude — it's pre-written text in the story config. A one-shot `/api/tts` route gives a clean, separate primitive from the streaming `/api/turn`.

**Files:**
- Create: `server/src/routes/tts.ts`
- Modify: `server/src/index.ts` (mount `/api/tts`)
- Create: `server/__tests__/tts.test.ts`
- Create: `client/src/components/EndingScreen.tsx`
- Create: `client/src/components/__tests__/EndingScreen.test.tsx`

- [ ] **Step 1: Write the failing test for /api/tts**

Create `server/__tests__/tts.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { app } from '../src/index.js'

const fakeChunk = new Uint8Array([0x49, 0x44, 0x33, 0x04])

vi.mock('@elevenlabs/elevenlabs-js', () => ({
  ElevenLabsClient: vi.fn().mockImplementation(() => ({
    textToSpeech: {
      stream: vi.fn().mockImplementation(async function* () {
        yield fakeChunk
      }),
    },
  })),
}))

describe('POST /api/tts', () => {
  it('streams audio/mpeg bytes for given text + voiceId', async () => {
    const res = await app.request('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Hi Marco', voiceId: 'test-voice-id' }),
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('audio/mpeg')
    const bytes = new Uint8Array(await res.arrayBuffer())
    expect(bytes.length).toBeGreaterThan(0)
  })

  it('returns 400 if text or voiceId missing', async () => {
    const res = await app.request('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'only text' }),
    })
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd server && npm test -- tts
```

Expected: FAIL — route not found.

- [ ] **Step 3: Implement /api/tts**

Create `server/src/routes/tts.ts`:
```typescript
import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export const ttsRoute = new Hono()

const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })

ttsRoute.post('/', async (c) => {
  const body = await c.req.json<{ text?: string; voiceId?: string }>()
  if (!body.text || !body.voiceId) {
    return c.json({ error: 'text and voiceId are required' }, 400)
  }

  c.header('Content-Type', 'audio/mpeg')

  return stream(c, async (s) => {
    const audioStream = await elevenlabs.textToSpeech.stream(body.voiceId!, {
      text: body.text!,
      modelId: 'eleven_turbo_v2_5',
      outputFormat: 'mp3_44100_128',
    })
    for await (const chunk of audioStream) {
      await s.write(chunk as Uint8Array)
    }
  })
})
```

Mount it in `server/src/index.ts` (add to imports and route mounts):
```typescript
import { ttsRoute } from './routes/tts.js'
// ...
app.route('/api/tts', ttsRoute)
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd server && npm test -- tts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing test for EndingScreen**

Create `client/src/components/__tests__/EndingScreen.test.tsx`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EndingScreen } from '../EndingScreen'

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    blob: () => Promise.resolve(new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/mpeg' })),
  }) as unknown as typeof fetch
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:fake'), revokeObjectURL: vi.fn() })
})

describe('EndingScreen', () => {
  it('shows replay button', () => {
    render(
      <EndingScreen path="breakout" replyText="It worked!" participantVoiceId="voice-id" onReplay={vi.fn()} />,
    )
    expect(screen.getByText(/play again/i)).toBeInTheDocument()
  })

  it('calls onReplay when replay button is clicked', () => {
    const onReplay = vi.fn()
    render(
      <EndingScreen path="solid-win" replyText="Solid!" participantVoiceId="voice-id" onReplay={onReplay} />,
    )
    fireEvent.click(screen.getByText(/play again/i))
    expect(onReplay).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 6: Run test — expect FAIL**

```bash
cd client && npm test -- EndingScreen
```

Expected: FAIL — `Cannot find module '../EndingScreen'`.

- [ ] **Step 7: Implement EndingScreen**

Create `client/src/components/EndingScreen.tsx`:
```typescript
import { useEffect, useRef, useState } from 'react'
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
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const meta = endingMeta[path]

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    ;(async () => {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: replyText, voiceId: participantVoiceId }),
      })
      if (cancelled || !res.ok) return
      const blob = await res.blob()
      if (cancelled) return
      objectUrl = URL.createObjectURL(blob)
      const audio = new Audio(objectUrl)
      audioRef.current = audio
      audio.onended = () => setIsPlaying(false)
      setIsPlaying(true)
      audio.play().catch(() => setIsPlaying(false))
    })()
    return () => {
      cancelled = true
      audioRef.current?.pause()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [replyText, participantVoiceId])

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

- [ ] **Step 8: Run test — expect PASS**

```bash
cd client && npm test -- EndingScreen
```

Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
git add server/src/routes/tts.ts server/src/index.ts server/__tests__/tts.test.ts client/src/components/EndingScreen.tsx client/src/components/__tests__/EndingScreen.test.tsx
git commit -m "feat: add /api/tts one-shot route + EndingScreen with participant reply playback"
```

---

## Task 16: App.tsx Entry Point + Cleanup

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/main.tsx`
- Modify: `client/src/index.css` (strip Vite-template leftovers)
- Delete: `client/src/App.css`, `client/src/assets/{react.svg,vite.svg,hero.png}`, `client/public/icons.svg`

- [ ] **Step 1: Replace App.tsx**

Replace `client/src/App.tsx`:
```typescript
import { Suspense, useState } from 'react'
import { BroadcastStudio } from './components/BroadcastStudio'
import { EndingScreen } from './components/EndingScreen'
import type { EndingPath } from './types'

interface EndingState {
  path: EndingPath
  replyText: string
  participantVoiceId: string
}

function Booting() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c0a09] gap-3">
      <p className="text-xs tracking-[0.3em] uppercase text-stone-500">Tuning in…</p>
      <div className="flex gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-stone-500 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [ending, setEnding] = useState<EndingState | null>(null)

  const handleEnding = (path: EndingPath, replyText: string, participantVoiceId: string) => {
    setEnding({ path, replyText, participantVoiceId })
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

  return (
    <Suspense fallback={<Booting />}>
      <BroadcastStudio onEnding={handleEnding} />
    </Suspense>
  )
}
```

> **Why Suspense:** `BroadcastStudio` calls `use(fetchStoryConfig())`. The first render suspends until the story fetch resolves. The `Suspense` boundary catches that and renders the `Booting` fallback. Without this, React would throw.

- [ ] **Step 2: Verify main.tsx (no change required)**

`client/src/main.tsx` should already match exactly:
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

If it doesn't, replace it with the snippet above. Otherwise skip.

- [ ] **Step 3: Strip Vite-template leftovers from `index.css`**

Open `client/src/index.css` and **delete** the following blocks (they conflict with the fullscreen studio layout):
- The legacy palette block under `:root` (lines starting with `--text:`, `--text-h:`, `--bg:`, `--code-bg:`, `--accent:`, `--accent-bg:`, `--accent-border:`, `--social-bg:`, `--shadow:`, `--sans:`, `--heading:`, `--mono:`, and the `font:` / `letter-spacing:` / `color-scheme:` / `color:` / `background:` / `font-synthesis:` / `text-rendering:` / `-webkit-font-smoothing:` / `-moz-osx-font-smoothing:` declarations and the `@media (max-width: 1024px)` inside `:root`)
- The `@media (prefers-color-scheme: dark) { :root { … } #social .button-icon { … } }` block
- The `#root { … }` block (width: 1126px, etc.)
- The `body { margin: 0 }` rule (the shadcn `@layer base` rule below handles body)
- The `h1, h2 { … }` rule, the `h1 { … }` rule, the `h2 { … }` rule, and the `p { margin: 0 }` rule
- The `code, .counter { … }` and `code { … }` rules

Keep:
- `@import "tailwindcss";`, `@import "tw-animate-css";`, `@import "shadcn/tailwind.css";`, `@import "@fontsource-variable/geist";`
- `@custom-variant dark (&:is(.dark *));`
- The shadcn design-token `:root { --background, --foreground, --primary, … }` declarations
- The `@theme inline { … }` block
- The `.dark { … }` block
- The `@layer base { … }` block at the end

- [ ] **Step 4: Delete unused Vite-template assets**

```powershell
Remove-Item client/src/App.css, client/src/assets/react.svg, client/src/assets/vite.svg, client/src/assets/hero.png, client/public/icons.svg
```

(Keep `client/public/favicon.svg` — it's referenced by `index.html`.)

- [ ] **Step 5: Verify build compiles**

```bash
cd client && npm run build
```

Expected: Build succeeds with no TypeScript errors and no unresolved asset imports.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: wire App.tsx with BroadcastStudio + EndingScreen, remove Vite-template leftovers"
```

---

## Task 17: End-to-End Smoke Test (Local)

- [ ] **Step 1: Add real API keys to .env**

Edit `.env` at project root (only the server reads this — the client gets voice IDs from `/api/story`):
```
ELEVENLABS_API_KEY=<your_real_key>
ANTHROPIC_API_KEY=<your_real_key>
HOST_VOICE_ID=onwK4e9ZLuTAKqWW03F9
PARTICIPANT_VOICE_ID=21m00Tcm4TlvDq8ikWAM
PORT=3001
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

## Task 18: Railway Deployment

**Files:**
- Create: `railway.json`
- Create: `Procfile`

- [ ] **Step 1: Build the client for production**

```bash
cd client && npm run build
```

Expected: `client/dist/` folder created.

- [ ] **Step 2: Serve client from Hono in production**

Install the Hono Node-side static-file middleware:
```bash
cd server && npm install @hono/node-server
```

(Already installed in Task 1 — confirm.)

Add to `server/src/index.ts` after existing imports:
```typescript
import { serveStatic } from '@hono/node-server/serve-static'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
```

Add **before** the `if (import.meta.url === ...)` guard:
```typescript
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../client/dist')
  app.use('/*', serveStatic({ root: distPath }))
  // SPA fallback: any non-/api path that didn't match a file serves index.html
  app.get('*', async (c) => {
    const indexHtml = await import('node:fs/promises').then((m) =>
      m.readFile(path.join(distPath, 'index.html'), 'utf-8'),
    )
    return c.html(indexHtml)
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

Run all tests at any time from the repo root:
```bash
npm test                # runs both test:client and test:server
npm run test:server     # sentenceBuffer, story, transcribe, turn, tts
npm run test:client     # vitest setup smoke, useGameEngine, useVoiceRecorder, useAudioStream, StatusIndicator, MicButton, EndingScreen
```

Expected total: ~26 tests, all passing.

---

## Talking points for the demo

When walking an interviewer through the code:

1. **Streaming pipeline (Task 7).** Open `server/src/routes/turn.ts` and the dev-tools Network tab. Point out: Claude streams text → server parses state header → buffers sentences → TTSes each sentence → emits SSE → browser plays them in order. Show that audio starts ~600ms after the player releases the mic button, while Claude is still generating.
2. **React 19 `use()` + Suspense (Tasks 14, 16).** Open `BroadcastStudio.tsx` line 1 — no `useEffect`, no `useState` for the fetch. The boundary in `App.tsx` shows the booting screen during the first paint.
3. **React Compiler (Task 1).** No `useMemo` or `useCallback` in the components beyond what's needed for stable identities across renders — the compiler handles memoization. Show the Vite config.
4. **Real audio amplitude on the Orb (Tasks 10, 12).** Open `useAudioStream.ts` — the `AnalyserNode` reads frequency data each RAF and writes to `outputVolumeRef`. The 3D `Orb` reads that ref every frame via the R3F `useFrame` hook. The pulsation tracks Marco's voice on the ending screen too.
5. **Hono on Web Standards (Task 4).** No express, no supertest. Tests call `app.request(new Request(...))` — the same `app` runs unchanged on Node, Bun, Deno, or Cloudflare Workers.
6. **Tailwind v4 + shadcn `base-nova`.** No `tailwind.config.ts` — design tokens live in `@theme inline { ... }` in `index.css`. The `Button` primitive wraps `@base-ui/react`.
