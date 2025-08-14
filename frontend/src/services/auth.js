// frontend/src/services/auth.js
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
const KEY = 'auth'

function safeParse(raw) {
  try { return JSON.parse(raw) } catch { return null }
}

export function setAuth(payload /* { token, user } */) {
  if (!payload || !payload.token || !payload.user) return
  localStorage.setItem(KEY, JSON.stringify({ token: payload.token, user: payload.user }))
}

export function getAuth() {
  const raw = localStorage.getItem(KEY)
  return raw ? safeParse(raw) : null
}

export function getToken() {
  // Return empty string to avoid "Bearer null"
  return getAuth()?.token ?? ''
}

export function getUser() {
  return getAuth()?.user ?? null
}

export function isAdmin() {
  return getUser()?.role === 'admin'
}

// Optional server-side logout (your backend just returns { ok: true })
// Call BEFORE clearing localStorage so the header has a real token.
// If it fails, we still clear local state.
export async function logout() {
  const token = getToken()
  try {
    if (token) {
      await fetch(`${BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
    }
  } catch { /* ignore */ }
  localStorage.removeItem(KEY)
}
