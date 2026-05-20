// Runtime-only access password. Entered by the player on the landing screen,
// sent as the `x-app-password` header on the paid routes. Never baked into the
// bundle. Backed by sessionStorage so a "Play Again" remount (or reload) keeps it.

const KEY = 'bg_app_password'

let password = readInitial()

function readInitial(): string {
  try {
    return sessionStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function setAppPassword(pw: string): void {
  password = pw
  try {
    sessionStorage.setItem(KEY, pw)
  } catch {
    // sessionStorage unavailable (private mode / SSR) — in-memory is fine.
  }
}

export function getAppPassword(): string {
  return password
}

/** Header object to spread into fetch() for the paid routes. Empty when no password set. */
export function authHeaders(): Record<string, string> {
  return password ? { 'x-app-password': password } : {}
}
