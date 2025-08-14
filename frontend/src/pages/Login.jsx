import React, { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { setAuth } from '../services/auth'
import { api } from '../services/api'

// const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function Login(){
  const [params] = useSearchParams()
  const sessionExpired = params.get('sessionExpired') === '1'
  const [email, setEmail] = useState('customer@example.com')
  const [password, setPassword] = useState('Customer@123')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const prefillEmail = params.get('email') || 'customer@example.com'
  const registered = params.get('registered') === '1'

  async function submit(e){
    e.preventDefault()
    setErr('')
    setLoading(true)
    try{
      // const res = await fetch(`${BASE}/api/auth/login`, {
      //   method:'POST', headers:{'Content-Type':'application/json'},
      //   body: JSON.stringify({ email, password })
      // })
      // const data = await res.json()
      // if(!res.ok) throw new Error(data.error || 'Login failed')
      const data = await api('/api/auth/login', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, password }),
        noAuth: true
      })
      if (!data || !data.token) throw new Error('Login failed')
      setAuth(data)
      location.href = '/'
    } catch(e){ setErr(String(e.message || 'Login failed')) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth:400, margin:'2rem auto' }}>
      <h2>Login</h2>
      
      {registered && (
        <p style={{ color:'#155724', background:'#d4edda', border:'1px solid #c3e6cb', padding:'8px 10px', borderRadius:6 }}>
          Account created. Please log in.
        </p>
      )}


      {sessionExpired && (
        <p style={{ color:'#8a6d3b', background:'#fcf8e3', border:'1px solid #faebcc', padding:'8px 10px', borderRadius:6 }}>
          Your session expired or became invalid. Please log in again.
        </p>
      )}

  
      {err && <p style={{ color:'crimson' }}>{err}</p>}
      <form onSubmit={submit}>
        <label>Email<br/><input value={email} onChange={e=>setEmail(e.target.value)} /></label><br/><br/>
        <label>Password<br/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></label><br/><br/>
        {/* <button>Login</button> */}
        <button disabled={loading}>{loading ? 'Signing in…' : 'Login'}</button>
      </form>
      <p style={{opacity:.7}}>Admin? Use admin@example.com / Admin@123</p>
      <p style={{ marginTop: 8 }}>
        Don’t have an account? <Link to="/register">Create one</Link>
      </p>
    </div>
  )
}
