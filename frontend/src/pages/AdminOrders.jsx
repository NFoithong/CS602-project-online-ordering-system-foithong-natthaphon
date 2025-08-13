import React, { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../services/api'
import { getToken } from '../services/auth'
import ErrorBanner from '../components/ErrorBanner'

const statuses = ['pending','preparing','ready','completed','cancelled']

function Filters({ value, onChange }){
  return (
    <div style={{ display:'flex', gap:12, alignItems:'end', margin:'10px 0' }}>
      <div>
        <label>Status<br/>
          <select value={value.status} onChange={e=>onChange({ ...value, status: e.target.value })}>
            <option value="">All</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <div>
        <label>Fulfillment<br/>
          <select value={value.fulfillment} onChange={e=>onChange({ ...value, fulfillment: e.target.value })}>
            <option value="">All</option>
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
            <option value="dinein">Dine-In</option>
          </select>
        </label>
      </div>
      <button onClick={()=>onChange({ status:'', fulfillment:'' })}>Clear</button>
    </div>
  )
}

function OrderRow({ order, onUpdate }){
  const [saving, setSaving] = useState(false)
  async function changeStatus(e){
    const status = e.target.value
    setSaving(true)
    try{
      const updated = await api(`/api/orders/${order._id}/status`, {
        method:'PATCH',
        body: JSON.stringify({ status })
      })
      onUpdate(updated)
    } finally {
      setSaving(false)
    }
  }
  return (
    <div style={{ border:'1px solid #eee', borderRadius:8, padding:12, marginBottom:10 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
        <div><b>#{order._id}</b> • {new Date(order.createdAt).toLocaleString()}</div>
        <div>Payment: <b>{order.paymentStatus || 'unpaid'}</b></div>
        <div>
          <label>Status:&nbsp;
            <select value={order.status} onChange={changeStatus} disabled={saving}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div style={{ fontSize:12, opacity:.7 }}>User: {order?.user?.email || ''} {order?.user?.name? `(${order.user.name})` : ''} • Fulfillment: {order.fulfillment}</div>
      <div style={{ marginTop:8 }}>
        {order.items.map((it, idx) => (
          <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr 60px 60px', gap:8 }}>
            <div>{it.name} × {it.quantity}</div>
            <div>${it.price.toFixed(2)}</div>
            <div style={{ textAlign:'right' }}>${(it.price * it.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 120px', gap:8, marginTop:6 }}>
        <div>Total</div>
        <div style={{ textAlign:'right' }}><b>${order.total.toFixed(2)}</b></div>
      </div>
    </div>
  )
}

export default function AdminOrders(){
  const [orders, setOrders] = useState([])
  const [filters, setFilters] = useState({ status:'', fulfillment:'' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const esRef = useRef(null)

  const filtered = useMemo(()=>{
    return orders.filter(o => (!filters.status || o.status===filters.status) && (!filters.fulfillment || o.fulfillment===filters.fulfillment))
  }, [orders, filters])

  function applyUpdate(updated){
    setOrders(prev => prev.map(o => o._id===updated._id? updated : o))
  }

  async function load(){
    setLoading(true); setErr('')
    try{
      const res = await api('/api/orders')
      setOrders(res)
    }catch(e){
      setErr(String(e.message))
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{
    load()
    const token = getToken()
    if(!token) return
    const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
    const es = new EventSource(`${BASE}/api/orders/stream?token=${encodeURIComponent(token)}`)
    esRef.value = es
    es.addEventListener('snapshot', (ev)=>{
      try { const data = JSON.parse(ev.data); if(Array.isArray(data)) setOrders(prev => {
        // merge snapshot into current (simple replace)
        return data
      }) } catch(_){}
    })
    es.addEventListener('order_created', (ev)=>{
      try { const order = JSON.parse(ev.data); setOrders(prev => [order, ...prev.filter(o=>o._id!==order._id)]) } catch(_){}
    })
    es.addEventListener('order_updated', (ev)=>{
      try { const order = JSON.parse(ev.data); applyUpdate(order) } catch(_){}
    })
    es.addEventListener('order_payment_updated', async (ev)=>{
      try {
        const data = JSON.parse(ev.data);
        // fetch affected orders with this PI and refresh
        await load()
      } catch(_){}
    })
    es.onerror = () => { /* could add UI signal */ }
    return ()=> { es.close() }
  }, [])

  return (
    <div style={{ padding:20, maxWidth: 980, margin:'0 auto' }}>
      <h2>Admin — Orders Dashboard</h2>
      <ErrorBanner message={err} onClose={()=>setErr('')} />
      <Filters value={filters} onChange={setFilters} />
      <button onClick={load} disabled={loading}>{loading? 'Refreshing...' : 'Refresh'}</button>
      <div style={{ marginTop:12 }}>
        {filtered.length === 0 && <p>No orders match.</p>}
        {filtered.map(o => <OrderRow key={o._id} order={o} onUpdate={applyUpdate} />)}
      </div>
    </div>
  )
}
