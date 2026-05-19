# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**Business Game** — a voice-only interactive podcast game. The player is the guest on an AI-hosted podcast, answers business questions live (push-to-talk), helps an audience participant with a real problem, and a month later hears how the advice played out. The UI is audio-first: no story text is ever shown to the player.

Planned data flow per turn: `mic → ElevenLabs Scribe (STT) → Claude (story logic + hidden scoring + prose) → ElevenLabs TTS (streamed) → speakers`. Steps 2–4 run through an Express backend so API keys never reach the browser.

Reference docs (in git history, currently deleted from the working tree — read via `git show HEAD:<path>`):
- `docs/superpowers/specs/2026-05-19-business-game-voice-podcast-design.md` — design spec (4 endings, milestone structure, API routes)
- `docs/superpowers/plans/2026-05-19-business-game-podcast.md` — 19-task implementation plan

## Current state

The repo is a **fresh Vite scaffold** plus two custom UI components added in preparation for the game. The backend, hooks, game engine, and Express server described in the plan **do not exist yet** — `src/App.tsx` is still the default Vite template. Treat the spec/plan as the target, not the current state.

Already in place:
- Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui scaffold
- `src/components/ui/orb.tsx` — 3D audio-reactive orb (React Three Fiber). Accepts `agentState: "thinking" | "listening" | "talking" | null` and either auto/manual volume input. This is the intended visual for the host's voice.
- `src/components/ui/waveform.tsx` — canvas waveform renderer
- `src/components/ui/button.tsx` — shadcn button on top of `@base-ui/react`

## Commands

```bash
npm run dev       # Vite dev server (frontend only)
npm run build     # tsc -b && vite build  — type-checks all referenced projects before bundling
npm run lint      # eslint .
npm run preview   # serve the built dist/
```

There is **no test runner configured yet**. The plan calls for Vitest + React Testing Library; add them when the first test arrives, don't claim tests pass before then.

There is **no backend yet**. When the Express server is added (per plan: `server/` next to `client/`), the repo will become a monorepo and `npm run dev` will likely need to start both.

## Architecture & conventions

**Tailwind v4 (not v3).** Configured via `@tailwindcss/vite` and `@theme inline { ... }` blocks in `src/index.css` — there is no `tailwind.config.js`. Design tokens are CSS custom properties (`--background`, `--primary`, etc.) referenced as `bg-background`, `text-foreground`. Dark mode is class-based via `@custom-variant dark (&:is(.dark *))`.

**shadcn/ui style: `base-nova`** (see `components.json`). New components go under `src/components/ui/` and import the `cn` helper from `@/lib/utils`. Path alias `@/*` → `src/*` is configured in both `tsconfig.app.json` and `vite.config.ts` — use it consistently instead of relative imports.

**Component primitives:** shadcn here is wired to `@base-ui/react` (not Radix). The `Button` accepts `ButtonPrimitive.Props` directly — match that pattern for new primitives rather than reaching for Radix.

**TypeScript flags worth knowing** (`tsconfig.app.json`):
- `verbatimModuleSyntax: true` — type-only imports must be `import type { ... }`. Mixing types into a value import will fail the build.
- `erasableSyntaxOnly: true` — no enums, namespaces, or parameter properties; use unions and plain classes.
- `noUnusedLocals` / `noUnusedParameters` — prefix intentionally unused params with `_`.
- `target: es2023`, `module: esnext`, `moduleResolution: bundler`.

**ESLint** is flat-config (`eslint.config.js`) with `tseslint.configs.recommended`, `react-hooks`, and `react-refresh/vite`. The `react-refresh` rule means components in a file should be the only exports — splitting hooks/utils into their own files matters for HMR.

## Working in this repo

- API keys for ElevenLabs and Claude must stay server-side. When wiring API calls, route them through the Express backend rather than calling vendor SDKs from `src/`.
- Audio UX is the product. When implementing or modifying anything in the pipeline (recording, streaming, playback), the user expects you to actually run `npm run dev`, exercise the mic in a browser, and confirm it works end-to-end — type-checking is not enough here.
- The ElevenLabs MCP server is available in this environment for prototyping (voice search, TTS/STT, agent creation). Useful for exploring voices/models before wiring the backend, but not a substitute for the server-side implementation in the plan.
- Project memory lives at `~/.claude/projects/D--VibeCoding-Projects-11Labs-Demo/memory/` and identifies this as the `business-game-podcast` project — keep it in sync if the scope or stack changes.
