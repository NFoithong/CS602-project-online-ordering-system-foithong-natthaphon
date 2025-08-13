import React from 'react'
import { useCart } from '../store/cart'
import { Link } from 'react-router-dom'
import { getUser } from '../services/auth'

export default function Cart(){
  const { state, dispatch } = useCart()
  const user = getUser()
  const subtotal = state.items.reduce((s,i)=> s + i.price*i.qty, 0)
  const tax = +(subtotal * 0.07).toFixed(2)
  const total = +(subtotal + tax).toFixed(2)

  return (
    <div style={{ padding:20, maxWidth:1100, margin:'0 auto' }}>
      <h2>Cart</h2>
      {state.items.length === 0 && <p>Your cart is empty.</p>}
      {state.items.map(i => (
        <div key={i.id} style={{ display:'flex', gap:12, alignItems:'center', padding:'6px 0' }}>
          <b>{i.name}</b> ${i.price.toFixed(2)}
          <input type="number" min="1" value={i.qty} onChange={e=>dispatch({ type:'qty', id:i.id, qty: +e.target.value })} style={{ width:60 }} />
          <button onClick={()=>dispatch({ type:'remove', id:i.id })}>Remove</button>
        </div>
      ))}
      {state.items.length > 0 && (
        <>
          <hr/>
          <div>Subtotal: ${subtotal.toFixed(2)}</div>
          <div>Tax (7%): ${tax.toFixed(2)}</div>
          <div><b>Total: ${total.toFixed(2)}</b></div>
          {user?.role !== 'admin' && (
            <>
              <br/>
              <Link to="/checkout"><button>Proceed to Checkout</button></Link>
            </>
          )}
        </>
      )}
    </div>
  )
}