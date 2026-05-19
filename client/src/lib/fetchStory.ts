import type { StoryConfig } from '../types'

let cached: Promise<StoryConfig> | null = null

/**
 * Returns a stable promise resolving to the episode config from /api/story.
 * Cached at module scope so React 19's `use()` hook sees the same promise
 * on every render — without that stability, `use()` would loop forever.
 *
 * Cache lifetime: the page lifetime. Refreshing the tab refetches.
 * "Play Again" intentionally reuses the cached config; if /api/story ever
 * becomes per-session randomized, expose a `clearStoryCache()` helper here.
 */
export function fetchStoryConfig(): Promise<StoryConfig> {
  if (!cached) {
    cached = fetch('/api/story').then(async (r) => {
      if (!r.ok) throw new Error(`fetchStoryConfig failed: ${r.status}`)
      return (await r.json()) as StoryConfig
    })
  }
  return cached
}
