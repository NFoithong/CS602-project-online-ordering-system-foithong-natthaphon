const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
import { getToken, logout } from './auth'

export async function api(path, opts={}){
  const headers = { 'Content-Type': 'application/json', ...(opts.headers||{}) }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  let res
  try {
    res = await fetch(`${BASE}${path}`, { ...opts, headers })
  } catch {
    throw new Error('Network error. Please check your connection and try again.')
  }

  if (!res.ok) {
    const text = await res.text()
    const msg = text || `${res.status} ${res.statusText}`

    // Auto-logout on auth errors (tokens invalidated by seeding, expired, etc.)
    if ((res.status === 401 || res.status === 403) &&
        /invalid token user|invalid token|missing token|unauthorized/i.test(msg)) {
      try { logout() } catch {}
      if (typeof window !== 'undefined') {
        // Preserve intent: send to login with a small flag
        window.location.href = '/login?sessionExpired=1'
      }
      // Stop here so callers don’t double-handle
      return
    }
    throw new Error(msg.replace(/^"|"$/g, ''))
  }
  return res.json()
}