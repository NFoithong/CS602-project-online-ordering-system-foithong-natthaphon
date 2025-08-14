// frontend/src/services/api.js
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
import { getToken, logout } from './auth'

const DEFAULT_TIMEOUT = 15000 // 15s

export async function api(path, opts = {}) {
  const controller = new AbortController()
  const timeout = opts.timeout ?? DEFAULT_TIMEOUT
  const timer = setTimeout(() => controller.abort(), timeout)

  const headers = new Headers(opts.headers || {})
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')

  const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData
  // Only set Content-Type for JSON/plain bodies (fetch sets it for FormData/Blob)
  if (!isFormData && !headers.has('Content-Type') && opts.body && !(opts.body instanceof Blob)) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getToken()
  if (token && !opts.noAuth) headers.set('Authorization', `Bearer ${token}`)

  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      ...opts,
      headers,
      signal: controller.signal,
      credentials: opts.credentials ?? 'same-origin',
    })
  } catch (e) {
    clearTimeout(timer)
    if (e?.name === 'AbortError') throw new Error('Request timed out. Please try again.')
    throw new Error('Network error. Please check your connection and try again.')
  } finally {
    clearTimeout(timer)
  }

  // No content
  if (res.status === 204 || res.status === 205) return null

  // Try to parse JSON; fall back to text
  const raw = await res.text()
  let data
  try { data = raw ? JSON.parse(raw) : null } catch { data = raw }

  if (!res.ok) {
    const msg = (data && data.error) || (typeof data === 'string' ? data : `${res.status} ${res.statusText}`)

    // Auto-logout on auth errors (seed invalidated tokens, expiration, etc.)
    // if ((res.status === 401 || res.status === 403) &&
    //     /invalid token user|invalid token|missing token|unauthorized/i.test(String(msg))) {
    if ((res.status === 401 || res.status === 403) &&
      (/invalid token user|invalid token|missing token|jwt expired|token expired/i.test(String(msg)) ||
      /invalid_token|expired/.test(res.headers.get('www-authenticate') || ''))) {
      try { await logout() } catch {}
      if (typeof window !== 'undefined') window.location.href = '/login?sessionExpired=1'
      return
    }

    // Surface server validation array/messages cleanly
    throw new Error(String(msg).replace(/^"|"$/g, ''))
  }

  return data
}
