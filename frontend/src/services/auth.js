const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export function setAuth(payload){
  localStorage.setItem('auth', JSON.stringify(payload))
}
export function getAuth(){
  const raw = localStorage.getItem('auth')
  return raw? JSON.parse(raw) : null
}
export function getToken(){
  return getAuth()?.token || null
}
export function getUser(){
  return getAuth()?.user || null
}
export function logout(){
  localStorage.removeItem('auth')
  fetch(`${BASE}/api/auth/logout`, { method:'POST', headers:{ 'Authorization': `Bearer ${getToken()}` } }).catch(()=>{})
}
