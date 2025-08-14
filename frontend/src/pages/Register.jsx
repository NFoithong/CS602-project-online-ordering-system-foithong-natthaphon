import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { setAuth } from '../services/auth'
import ErrorBanner from '../components/ErrorBanner'

export default function Register() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    if (!name.trim()) return setErr('Please enter your name.'), false
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr('Please enter a valid email.'), false
    if (password.length < 6) return setErr('Password must be at least 6 characters.'), false
    if (password !== confirm) return setErr('Passwords do not match.'), false
    setErr(''); return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      })
    //   if (!res || !res.token) throw new Error('Unexpected response from server')
    // //   setAuth(res.token, res.user)
    //     setAuth(res)
    //   nav('/', { replace: true })
    // Even if backend returns {token,user}, do NOT auto-login.
        if (!res || !res.token) throw new Error('Unexpected response from server')
            nav(`/login?registered=1&email=${encodeURIComponent(email)}`, { replace: true })
        } catch (e) {
      // Try to show server validation nicely
      try {
        const msg = e.message || ''
        if (/Email already used/i.test(msg)) setErr('That email is already in use.')
        else setErr(msg.replace(/^Error:\s*/, '') || 'Failed to create account.')
      } catch { setErr('Failed to create account.') }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 20 }}>
      <h2>Create your account</h2>
      <ErrorBanner message={err} onClose={() => setErr('')} />
      <form onSubmit={handleSubmit} style={{ display:'grid', gap:12 }}>
        <label>Full name<br/>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Jane Customer" />
        </label>
        <label>Email<br/>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
        <label>Password<br/>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" />
        </label>
        <label>Confirm password<br/>
          <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter password" />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create account'}
        </button>

        {/* <p style={{ marginTop: 8 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p> */}
        <p style={{ marginTop: 8 }}>
            Already have an account?{' '}
                <span style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
                    <Link to="/login">Log in</Link>
                </span>
        </p>
      </form>
    </div>
  )
}
