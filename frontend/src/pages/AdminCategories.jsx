import React, { useEffect, useState } from 'react'
import { Categories } from '../services/categories'
import ErrorBanner from '../components/ErrorBanner'

export default function AdminCategories(){
  const [cats, setCats] = useState([])
  const [name, setName] = useState('')
  const [renaming, setRenaming] = useState(null) // { _id, name }
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function load(){
    setLoading(true); setErr('')
    try { setCats(await Categories.list()) }
    catch(e){ setErr(String(e.message)) }
    finally{ setLoading(false) }
  }
  useEffect(()=>{ load() }, [])

  async function add(e){
    e?.preventDefault()
    const n = name.trim()
    if(!n) return setErr('Name is required.')
    setErr('')
    try { await Categories.create(n); setName(''); await load() }
    catch(e){ setErr(String(e.message)) }
  }

  async function saveRename(){
    const n = (renaming?.name || '').trim()
    if(!n) return setErr('Name is required.')
    try { await Categories.rename(renaming._id, n); setRenaming(null); await load() }
    catch(e){ setErr(String(e.message)) }
  }

  async function remove(cat){
    try {
      const res = await Categories.remove(cat._id) // try normal delete
      if (res?.ok) return load()
    } catch(e){
      // if in use, API responds 409 with itemCount
      const msg = String(e.message || '')
      if (/Category is used by items/i.test(msg)) {
        const ok = confirm(`${cat.name} is used by items. Remove it from those items and delete anyway?`)
        if (ok) { await Categories.remove(cat._id, { force: true }); await load(); return }
      }
      setErr(msg)
    }
  }

  return (
    <div style={{ padding:20, maxWidth:700, margin:'0 auto' }}>
      <h2>Admin — Categories</h2>
      <ErrorBanner message={err} onClose={()=>setErr('')} />

      <form onSubmit={add} style={{ display:'flex', gap:8, margin:'10px 0 16px' }}>
        <input
          value={name}
          onChange={e=>setName(e.target.value)}
          placeholder="New category name"
        />
        <button type="submit" disabled={loading}>Add</button>
      </form>

      {cats.length === 0 && <p>No categories yet.</p>}
      <div style={{ display:'grid', gap:8 }}>
        {cats.map(c => (
          <div key={c._id} style={{ border:'1px solid #eee', borderRadius:8, padding:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            {renaming?. _id === c._id ? (
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input value={renaming.name} onChange={e=>setRenaming({ ...renaming, name: e.target.value })} />
                <button type="button" onClick={saveRename}>Save</button>
                <button type="button" onClick={()=>setRenaming(null)}>Cancel</button>
              </div>
            ) : (
              <>
                <div>
                  <b>{c.name}</b>
                  <div style={{ fontSize:12, color:'#666' }}>{c.itemCount} item{c.itemCount===1?'':'s'}</div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>setRenaming({ _id: c._id, name: c.name })}>Rename</button>
                  <button onClick={()=>remove(c)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
