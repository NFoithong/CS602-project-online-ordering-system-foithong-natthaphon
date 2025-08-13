// import React, { useEffect, useState } from 'react'
// import { api } from '../services/api'
// import { useCart } from '../store/cart'
// import { getUser } from '../services/auth'

// export default function Menu(){
//   const [items, setItems] = useState([])
//   const [cats, setCats] = useState([])
//   const { dispatch } = useCart()
//   const user = getUser()
//   const [selectedCat, setSelectedCat] = useState('')  // category _id
//   const [err, setErr] = useState('')

//   async function load(){
//     try {
//       setErr('')
//       const [cats, list] = await Promise.all([
//         api('/api/menu/categories').catch(() => []),
//         api('/api/menu' + (selectedCat ? `?category=${encodeURIComponent(selectedCat)}` : ''))
//       ])
//       setCategories(Array.isArray(cats) ? cats : [])
//       setItems(list || [])
//     } catch(e){
//       setErr(String(e.message))
//     }
//   }

//   useEffect(()=>{ load() }, [selectedCat])

//   useEffect(()=>{
//     api('/api/menu').then(setItems).catch(console.error)
//     api('/api/menu/categories').then(setCats).catch(console.error)
//   }, [])

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>Menu</h2>
//       <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12 }}>
//         {items.map(m => (
//           <div key={m._id} style={{ border:'1px solid #ddd', padding:12, borderRadius:8, marginBottom:12 }}>
//             {/* <div style={{ display:'flex', justifyContent:'space-between' }}>

//               <h3>{m.name}</h3>
//               <div>${m.price.toFixed(2)}</div>
//               {m.description && (
//                 <p style={{fontSize:12, opacity:.7}}>{(m.categories||[]).map(c=>c.name).join(', ')}</p>
//               )}
//               <div>{m.description}</div>
//               {user?.role !== 'admin' && (
//                 <button onClick={()=>dispatch({ type:'add', item:{ id: m._id, name: m.name, price: m.price } })}>
//                   Add to Cart
//                 </button>
//               )}
//             </div> */}
//             <h3>{m.name}</h3>
//               <div>${m.price.toFixed(2)}</div>
//               {m.description && (
//                 <p style={{fontSize:12, opacity:.7}}>{(m.categories||[]).map(c=>c.name).join(', ')}</p>
//               )}
//               <div>{m.description}</div>
//               {user?.role !== 'admin' && (
//                 <button onClick={()=>dispatch({ type:'add', item:{ id: m._id, name: m.name, price: m.price } })}>
//                   Add to Cart
//                 </button>
//               )}
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }

import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { useCart } from '../store/cart'
import { getUser } from '../services/auth'

export default function Menu(){
  const user = getUser()
  const { dispatch } = useCart()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCat, setSelectedCat] = useState('')  // category _id
  const [err, setErr] = useState('')

  async function load(){
    try {
      setErr('')
      const [cats, list] = await Promise.all([
        api('/api/menu/categories').catch(() => []),
        api('/api/menu' + (selectedCat ? `?category=${encodeURIComponent(selectedCat)}` : ''))
      ])
      setCategories(Array.isArray(cats) ? cats : [])
      setItems(list || [])
    } catch(e){
      setErr(String(e.message))
    }
  }

  useEffect(()=>{ load() }, [selectedCat])

  function CatBadges({ value }){
    const arr = Array.isArray(value) ? value : []
    if (arr.length === 0) return null
    return (
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
        {arr.map((c, i) => {
          const key = c?._id || c || i
          const label = c?.name || String(c)
          return (
            <span
              key={key}
              style={{
                display:'inline-block',
                fontSize:12,
                padding:'2px 8px',
                borderRadius:999,
                border:'1px solid #ddd',
                background:'#f7f7f7'
              }}
            >
              {label}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ padding:20, maxWidth:1000, margin:'0 auto' }}>
      <h2>Menu</h2>
      {err && (
        <div style={{ background:'#ffe6e6', border:'1px solid #f5c2c2', color:'#b10000', padding:'10px 14px', borderRadius:8 }}>
          {err}
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', margin:'10px 0 16px' }}>
        <button
          onClick={()=>setSelectedCat('')}
          style={{
            padding:'6px 10px',
            borderRadius:8,
            border:selectedCat === '' ? '2px solid #333' : '1px solid #ddd',
            background:selectedCat === '' ? '#f1f1f1' : '#fff',
            cursor:'pointer'
          }}
        >
          All
        </button>
        {categories.map(c => (
          <button
            key={c._id}
            onClick={()=>setSelectedCat(c._id)}
            style={{
              padding:'6px 10px',
              borderRadius:8,
              border:selectedCat === c._id ? '2px solid #333' : '1px solid #ddd',
              background:selectedCat === c._id ? '#f1f1f1' : '#fff',
              cursor:'pointer'
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Items */}
      {items.length === 0 && <p>No items found.</p>}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
        {items.map(m => (
          <div key={m._id} style={{ border:'1px solid #eee', borderRadius:12, padding:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
              <b style={{ fontSize:16 }}>{m.name}</b>
              <span>${Number(m.price).toFixed(2)}</span>
            </div>
            {m.description && <p style={{ color:'#555', margin:'6px 0 0' }}>{m.description}</p>}
            <CatBadges value={m.categories} />
            {user?.role !== 'admin' && (
              <div style={{ marginTop:10 }}>
                <button
                  onClick={()=>dispatch({ type:'add', item:{ id: m._id, name: m.name, price: Number(m.price) } })}
                >
                  Add to Cart
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
