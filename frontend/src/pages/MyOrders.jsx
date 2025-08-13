import React, { useEffect, useState } from 'react'
import { api } from '../services/api'
import ErrorBanner from '../components/ErrorBanner'

function OrderCard({ order }){
  return (
    <div style={{ border:'1px solid #eee', borderRadius:8, padding:12, marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div><b>Order #{order._id}</b></div>
        <div>Status: <b>{order.status}</b> • Payment: <b>{order.paymentStatus || 'unpaid'}</b></div>
      </div>
      <div style={{ fontSize:12, opacity:.7 }}>Created: {new Date(order.createdAt).toLocaleString()}</div>
      <div style={{ marginTop:8 }}>
        {order.items.map((it, idx) => (
          <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr 60px 60px', gap:8 }}>
            <div>{it.name} × {it.quantity}</div>
            <div>${it.price.toFixed(2)}</div>
            <div style={{ textAlign:'right' }}>${(it.price * it.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>
      <hr/>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 120px', gap:8 }}>
        <div>Subtotal</div><div style={{ textAlign:'right' }}>${order.subtotal.toFixed(2)}</div>
        <div>Tax</div><div style={{ textAlign:'right' }}>${order.tax.toFixed(2)}</div>
        <div><b>Total</b></div><div style={{ textAlign:'right' }}><b>${order.total.toFixed(2)}</b></div>
      </div>
    </div>
  )
}

export default function MyOrders(){
  const [orders, setOrders] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function load(){
    setLoading(true); setErr('')
    try{
      const res = await api('/api/orders/mine')
      setOrders(res)
    }catch(e){
      setErr(String(e.message))
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{
    load()
    const t = setInterval(load, 8000) // poll every 8s
    return ()=> clearInterval(t)
  }, [])

  return (
    <div style={{ padding:20, maxWidth: 840, margin:'0 auto' }}>
      <h2>My Orders</h2>
      <ErrorBanner message={err} onClose={()=>setErr('')} />
      <button onClick={load} disabled={loading}>{loading? 'Refreshing...' : 'Refresh'}</button>
      <div style={{ marginTop:12 }}>
        {orders.length === 0 && <p>No orders yet.</p>}
        {orders.map(o => <OrderCard key={o._id} order={o} />)}
      </div>
    </div>
  )
}
