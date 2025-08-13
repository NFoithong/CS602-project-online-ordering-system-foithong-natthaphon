// import React, { useEffect, useState } from 'react'
// import { api } from '../services/api'
// import ErrorBanner from '../components/ErrorBanner'

// export default function AdminItems(){
//   const [items, setItems] = useState([])
//   const [cats, setCats] = useState([])
//   const [form, setForm] = useState({ name:'', price:'', description:'', isAvailable:true, categories: [] })
//   const [err, setErr] = useState('')

//   async function loadAll(){
//     setErr('')
//     try {
//       const [categories, list] = await Promise.all([
//         api('/api/categories'),
//         api('/api/menu/admin') // 🔒 admin-only list (no availability filter)
//       ])
//       setCats(categories || [])
//       setItems(list || [])
//     } catch(e){
//       setErr(String(e.message))
//     }
//   }
//   useEffect(()=>{ loadAll() }, [])

//   async function add(e){
//     e?.preventDefault()
//     setErr('')
//     const payload = {
//       name: (form.name||'').trim(),
//       price: Number(form.price),
//       description: (form.description||'').trim(),
//       isAvailable: !!form.isAvailable,
//       categories: form.categories || []
//     }
//     if (!payload.name) return setErr('Name is required.')
//     if (!(payload.price > 0)) return setErr('Price must be greater than 0.')

//     try {
//       await api('/api/menu', { method:'POST', body: JSON.stringify(payload) })
//       setForm({ name:'', price:'', description:'', isAvailable:true, categories: [] })
//       await loadAll()
//     } catch(e){
//       setErr(String(e.message))
//     }
//   }

//   async function remove(id){
//     setErr('')
//     try {
//       await api('/api/menu/'+id, { method:'DELETE' })
//       await loadAll()
//     } catch(e){
//       setErr(String(e.message))
//     }
//   }

//   function toggleCategory(catId){
//     setForm(f => {
//       const arr = new Set(f.categories || [])
//       if (arr.has(catId)) arr.delete(catId); else arr.add(catId)
//       return { ...f, categories: Array.from(arr) }
//     })
//   }

//   return (
//     <div style={{ padding:20, maxWidth:1000, margin:'0 auto' }}>
//       <h2>Admin — Items</h2>
//       <ErrorBanner message={err} onClose={()=>setErr('')} />

//       <form onSubmit={add} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 3fr auto', gap:12, alignItems:'end' }}>
//         <div>
//           <label>Name<br/>
//             <input
//               value={form.name}
//               onChange={e=>setForm(f=>({ ...f, name:e.target.value }))}
//               placeholder="e.g. Margherita Pizza"
//               required
//             />
//           </label>
//         </div>
//         <div>
//           <label>Price<br/>
//             <input
//               type="number" step="0.01" min="0"
//               value={form.price}
//               onChange={e=>setForm(f=>({ ...f, price:e.target.value }))}
//               placeholder="9.99"
//               required
//             />
//           </label>
//         </div>
//         <div>
//           <label>Description<br/>
//             <textarea
//               value={form.description}
//               onChange={e=>setForm(f=>({ ...f, description:e.target.value }))}
//               placeholder="Short enticing copy for the menu item"
//               rows={3}
//             />
//           </label>
//           <div style={{ marginTop:8 }}>
//             <label style={{ display:'inline-flex', gap:6, alignItems:'center' }}>
//               <input
//                 type="checkbox"
//                 checked={!!form.isAvailable}
//                 onChange={e=>setForm(f=>({ ...f, isAvailable: e.target.checked }))}
//               />
//               Available
//             </label>
//           </div>
//           <div style={{ marginTop:8 }}>
//             <div style={{ fontSize:12, marginBottom:4 }}>Categories</div>
//             <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
//               {cats.map(c => (
//                 <label key={c._id} style={{ display:'inline-flex', gap:6, alignItems:'center', border:'1px solid #ddd', padding:'4px 8px', borderRadius:8 }}>
//                   <input
//                     type="checkbox"
//                     checked={form.categories.includes(c._id)}
//                     onChange={()=>toggleCategory(c._id)}
//                   />
//                   {c.name}
//                 </label>
//               ))}
//               {cats.length === 0 && <em>No categories yet</em>}
//             </div>
//           </div>
//         </div>
//         <button type="submit">Add</button>
//       </form>

//       <hr style={{ margin:'16px 0' }}/>

//       {items.map(m => (
//         <div key={m._id} style={{ border:'1px solid #eee', borderRadius:8, padding:12, marginBottom:10 }}>
//           <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
//             <b>{m.name}</b>
//             <span>${Number(m.price).toFixed(2)}</span>
//           </div>
//           {m.description && <p style={{ margin:'6px 0 0', color:'#555' }}>{m.description}</p>}
//           {Array.isArray(m.categories) && m.categories.length > 0 && (
//             <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
//               {m.categories.map((c, i) => {
//                 const key = c?._id || c || i
//                 const label = c?.name || String(c)
//                 return (
//                   <span key={key} style={{ fontSize:12, padding:'2px 8px', borderRadius:999, border:'1px solid #ddd', background:'#f7f7f7' }}>
//                     {label}
//                   </span>
//                 )
//               })}
//             </div>
//           )}
//           <div style={{ marginTop:8 }}>
//             <button onClick={()=>remove(m._id)}>Delete</button>
//           </div>
//         </div>
//       ))}
//     </div>
//   )
// }


// frontend/src/pages/AdminItems.jsx
import React, { useEffect, useState } from 'react'
import { api } from '../services/api'
import ErrorBanner from '../components/ErrorBanner'

export default function AdminItems(){
  const [items, setItems] = useState([])
  const [cats, setCats] = useState([])
  const [err, setErr] = useState('')

  // Create form
  const [form, setForm] = useState({
    name:'', price:'', description:'', imageUrl:'', isAvailable:true, categories:[]
  })

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    name:'', price:'', description:'', imageUrl:'', isAvailable:true, categories:[]
  })
  const isEditing = (id) => editingId === id

  async function loadAll(){
    setErr('')
    try {
      const [categories, list] = await Promise.all([
        api('/api/categories'),     // admin categories (with itemCount)
        api('/api/menu/admin')      // admin items (populated categories)
      ])
      setCats(categories || [])
      setItems(list || [])
    } catch(e){ setErr(String(e.message)) }
  }
  useEffect(()=>{ loadAll() }, [])

  // Helpers
  const toIdArray = (arr) =>
    (arr || []).map(c => (typeof c === 'string' ? c : c?._id)).filter(Boolean)

  function toggleCreateCategory(catId){
    setForm(f => {
      const set = new Set(f.categories)
      set.has(catId) ? set.delete(catId) : set.add(catId)
      return { ...f, categories: [...set] }
    })
  }
  function toggleEditCategory(catId){
    setEditForm(f => {
      const set = new Set(f.categories)
      set.has(catId) ? set.delete(catId) : set.add(catId)
      return { ...f, categories: [...set] }
    })
  }

  // Create
  async function add(e){
    e?.preventDefault()
    setErr('')
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      description: (form.description||'').trim(),
      imageUrl: (form.imageUrl||'').trim(),
      isAvailable: !!form.isAvailable,
      categories: form.categories
    }
    if (!payload.name) return setErr('Name is required.')
    if (!(payload.price > 0)) return setErr('Price must be greater than 0.')
    try {
      const created = await api('/api/menu', { method:'POST', body: JSON.stringify(payload) })
      setItems(prev => [created, ...prev])
      setForm({ name:'', price:'', description:'', imageUrl:'', isAvailable:true, categories:[] })
    } catch(e){ setErr(String(e.message)) }
  }

  // Enter edit
  function startEdit(item){
    setEditingId(item._id)
    setEditForm({
      name: item.name || '',
      price: String(item.price ?? ''),
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      isAvailable: !!item.isAvailable,
      categories: toIdArray(item.categories)
    })
  }
  function cancelEdit(){
    setEditingId(null)
    setEditForm({ name:'', price:'', description:'', imageUrl:'', isAvailable:true, categories:[] })
  }

  // Save edit
  async function saveEdit(id){
    setErr('')
    const payload = {
      name: editForm.name.trim(),
      price: Number(editForm.price),
      description: (editForm.description||'').trim(),
      imageUrl: (editForm.imageUrl||'').trim(),
      isAvailable: !!editForm.isAvailable,
      categories: editForm.categories
    }
    if (!payload.name) return setErr('Name is required.')
    if (!(payload.price > 0)) return setErr('Price must be greater than 0.')
    try {
      const updated = await api(`/api/menu/${id}`, {
        method:'PUT',
        body: JSON.stringify(payload)
      })
      setItems(prev => prev.map(it => it._id === id ? updated : it))
      cancelEdit()
    } catch(e){ setErr(String(e.message)) }
  }

  // Delete
  async function remove(id){
    setErr('')
    try {
      await api('/api/menu/'+id, { method:'DELETE' })
      setItems(prev => prev.filter(it => it._id !== id))
      if (editingId === id) cancelEdit()
    } catch(e){ setErr(String(e.message)) }
  }

  // UI bits
  function CatChips({ value }){
    const arr = Array.isArray(value) ? value : []
    if (arr.length === 0) return null
    return (
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
        {arr.map((c, i) => {
          const key = c?._id || c || i
          const label = c?.name || String(c)
          return (
            <span key={key} style={{ fontSize:12, padding:'2px 8px', borderRadius:999, border:'1px solid #ddd', background:'#f7f7f7' }}>
              {label}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ padding:20, maxWidth:1100, margin:'0 auto' }}>
      <h2>Admin — Items</h2>
      <ErrorBanner message={err} onClose={()=>setErr('')} />

      {/* Create form */}
      <form onSubmit={add} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 2fr 2fr auto', gap:12, alignItems:'end' }}>
        <div>
          <label>Name<br/>
            <input value={form.name} onChange={e=>setForm(f=>({ ...f, name:e.target.value }))} placeholder="e.g. Margherita Pizza" required />
          </label>
        </div>
        <div>
          <label>Price<br/>
            <input type="number" step="0.01" min="0" value={form.price} onChange={e=>setForm(f=>({ ...f, price:e.target.value }))} placeholder="9.99" required />
          </label>
        </div>
        <div>
          <label>Description<br/>
            <textarea rows={2} value={form.description} onChange={e=>setForm(f=>({ ...f, description:e.target.value }))} placeholder="Short enticing copy" />
          </label>
        </div>
        <div>
          <label>Image URL<br/>
            <input value={form.imageUrl} onChange={e=>setForm(f=>({ ...f, imageUrl:e.target.value }))} placeholder="https://…" />
          </label>
          <div style={{ marginTop:8 }}>
            <label style={{ display:'inline-flex', gap:6, alignItems:'center' }}>
              <input type="checkbox" checked={!!form.isAvailable} onChange={e=>setForm(f=>({ ...f, isAvailable: e.target.checked }))} />
              Available
            </label>
          </div>
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:12, marginBottom:4 }}>Categories</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {cats.map(c => (
                <label key={c._id} style={{ display:'inline-flex', gap:6, alignItems:'center', border:'1px solid #ddd', padding:'4px 8px', borderRadius:8 }}>
                  <input type="checkbox" checked={form.categories.includes(c._id)} onChange={()=>toggleCreateCategory(c._id)} />
                  {c.name}
                </label>
              ))}
              {cats.length === 0 && <em>No categories yet</em>}
            </div>
          </div>
        </div>
        <button type="submit">Add</button>
      </form>

      <hr style={{ margin:'16px 0' }}/>

      {/* Items list */}
      {items.map(m => (
        <div key={m._id} style={{ border:'1px solid #eee', borderRadius:8, padding:12, marginBottom:10 }}>
          {!isEditing(m._id) ? (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <div>
                  <b>{m.name}</b> {m.isAvailable ? <span style={{ fontSize:12, color:'#2e7d32' }}>• available</span> : <span style={{ fontSize:12, color:'#b10000' }}>• unavailable</span>}
                </div>
                <span>${Number(m.price).toFixed(2)}</span>
              </div>
              {m.imageUrl && <div style={{ marginTop:6, fontSize:12, color:'#666' }}>{m.imageUrl}</div>}
              {m.description && <p style={{ margin:'6px 0 0', color:'#555' }}>{m.description}</p>}
              <CatChips value={m.categories} />
              <div style={{ marginTop:10, display:'flex', gap:8 }}>
                <button onClick={()=>startEdit(m)}>Edit</button>
                <button onClick={()=>remove(m._id)}>Delete</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 2fr 2fr', gap:12 }}>
                <div>
                  <label>Name<br/>
                    <input value={editForm.name} onChange={e=>setEditForm(f=>({ ...f, name:e.target.value }))} />
                  </label>
                </div>
                <div>
                  <label>Price<br/>
                    <input type="number" step="0.01" min="0" value={editForm.price} onChange={e=>setEditForm(f=>({ ...f, price:e.target.value }))} />
                  </label>
                </div>
                <div>
                  <label>Description<br/>
                    <textarea rows={2} value={editForm.description} onChange={e=>setEditForm(f=>({ ...f, description:e.target.value }))} />
                  </label>
                </div>
                <div>
                  <label>Image URL<br/>
                    <input value={editForm.imageUrl} onChange={e=>setEditForm(f=>({ ...f, imageUrl:e.target.value }))} />
                  </label>
                  <div style={{ marginTop:8 }}>
                    <label style={{ display:'inline-flex', gap:6, alignItems:'center' }}>
                      <input type="checkbox" checked={!!editForm.isAvailable} onChange={e=>setEditForm(f=>({ ...f, isAvailable: e.target.checked }))} />
                      Available
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:12, marginBottom:4 }}>Categories</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {cats.map(c => (
                    <label key={c._id} style={{ display:'inline-flex', gap:6, alignItems:'center', border:'1px solid #ddd', padding:'4px 8px', borderRadius:8 }}>
                      <input type="checkbox" checked={editForm.categories.includes(c._id)} onChange={()=>toggleEditCategory(c._id)} />
                      {c.name}
                    </label>
                  ))}
                  {cats.length === 0 && <em>No categories yet</em>}
                </div>
              </div>

              <div style={{ marginTop:10, display:'flex', gap:8 }}>
                <button onClick={()=>saveEdit(m._id)}>Save</button>
                <button onClick={cancelEdit}>Cancel</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
