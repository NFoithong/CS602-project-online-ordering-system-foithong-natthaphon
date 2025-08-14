// frontend/src/pages/Checkout.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useCart } from '../store/cart'
import { createPaymentIntent } from '../services/payments'
import { api } from '../services/api'
import ErrorBanner from '../components/ErrorBanner'
import { useNavigate } from 'react-router-dom'
import { getUser } from '../services/auth'

import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')
const PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const stripePromise = PK ? loadStripe(PK) : null

function Review({ items, totals }){
  return (
    <div style={{ border:'1px solid #eee', borderRadius:8, padding:12, marginBottom:16 }}>
      <h3>Order Review</h3>
      {items.map(i => (
        <div key={i.id} style={{ display:'grid', gridTemplateColumns:'1fr 100px 80px', gap:8 }}>
          <div>{i.name} × {i.qty}</div>
          <div>${i.price.toFixed(2)}</div>
          <div style={{ textAlign:'right' }}>${(i.price*i.qty).toFixed(2)}</div>
        </div>
      ))}
      <hr/>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 120px', gap:8 }}>
        <div>Subtotal</div><div style={{ textAlign:'right' }}>${totals.subtotal.toFixed(2)}</div>
        <div>Tax (7%)</div><div style={{ textAlign:'right' }}>${totals.tax.toFixed(2)}</div>
        <div><b>Total</b></div><div style={{ textAlign:'right' }}><b>${totals.total.toFixed(2)}</b></div>
      </div>
    </div>
  )
}

function CheckoutForm({ totals, items }){
  const stripe = useStripe()
  const elements = useElements()
  const { dispatch } = useCart()
  const nav = useNavigate()

  const [fulfillment, setFulfillment] = useState('pickup')
  const [address, setAddress] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [pmReady, setPmReady] = useState(false) // payment element mounted

  const needsAddress = fulfillment === 'delivery'

  function validate(){
    if(!name.trim()) return setErr('Please enter your name.'), false
    if(!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr('Please enter a valid email.'), false
    if(needsAddress && !address.trim()) return setErr('Delivery address is required.'), false
    if(!stripe || !elements) return setErr('Payment not ready yet.'), false
    setErr(''); return true
  }

  async function handlePay(){
    if(!validate()) return
    setLoading(true)
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          receipt_email: email,
          payment_method_data: { billing_details: { name, email } }
        },
        redirect: 'if_required'
      })
      if (result.error) throw new Error(result.error.message || 'Payment failed')

      const pi = result.paymentIntent
      if (!pi || pi.status !== 'succeeded') {
        throw new Error('Payment not completed. Status: ' + (pi?.status || 'unknown'))
      }

      const order = await api('/api/orders', {
        method:'POST',
        body: JSON.stringify({
          items: items.map(i => ({ menuItem: i.id, quantity: i.qty })),
          fulfillment,
          address: needsAddress ? address : '',
          paymentIntentId: pi.id
        })
      })
      if (!order || !order._id) {
      // If api() auto-logged us out, we’ll land here with undefined.
        setErr('Your session expired. Please log in again.')
        setTimeout(() => { window.location.href = '/login?sessionExpired=1' }, 1200)
        return
      }
      dispatch({ type:'clear' })
      nav('/my-orders', { replace: true })
      alert('Payment successful! Order #' + order._id)
    } catch(e){
      setErr(String(e.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <ErrorBanner message={err} onClose={()=>setErr('')} />

      <div style={{ display:'grid', gap:12, marginBottom:16 }}>
        <div>
          <label>Your Name<br/>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" />
          </label>
        </div>
        <div>
          <label>Email<br/>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
        </div>
        <div>
          <label>Fulfillment<br/>
            <select value={fulfillment} onChange={e=>setFulfillment(e.target.value)}>
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
              <option value="dinein">Dine-In</option>
            </select>
          </label>
        </div>
        {needsAddress && (
          <div>
            <label>Delivery Address<br/>
              <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="123 Main St, City, ST" />
            </label>
          </div>
        )}
      </div>

      <div style={{ border:'1px solid #eee', borderRadius:8, padding:12, marginBottom:16 }}>
        <PaymentElement 
          onReady={() => setPmReady(true)}
          onChange={(e) => {
          // optional: clear banner once card input looks fine
          if (e.complete && err) setErr('')
          }}
        />
      </div>

      <button onClick={handlePay} disabled={loading || !stripe || !pmReady}>
        {loading ? 'Processing...' : `Pay $${totals.total.toFixed(2)}`}
      </button>
      <p style={{ fontSize:12, opacity:.7, marginTop:8 }}>
        Use Stripe test cards (e.g. <code>4242 4242 4242 4242</code>, future expiry, any CVC).
      </p>
    </div>
  )
}

export default function Checkout(){
  const { state } = useCart()
  const nav = useNavigate()
  const user = getUser()
  const [err, setErr] = useState('')

  const totals = useMemo(()=>{
    const subtotal = state.items.reduce((s,i)=> s + i.price*i.qty, 0)
    const tax = +(subtotal * 0.07).toFixed(2)
    const total = +(subtotal + tax).toFixed(2)
    return { subtotal, tax, total }
  }, [state.items])

  useEffect(()=>{
    if(!user){ setErr('Please login before checkout.'); nav('/login') }
    else if(state.items.length === 0){ setErr('Your cart is empty.'); nav('/cart') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if(!user || state.items.length === 0) return null

  return (
    <div style={{ padding:20, maxWidth: 920, margin:'0 auto' }}>
      <h2>Checkout</h2>
      <ErrorBanner message={err} onClose={()=>setErr('')} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div>
          <Review items={state.items} totals={totals} />
        </div>
        <div>
          <ElementsWrapper items={state.items} totals={totals} />
        </div>
      </div>
    </div>
  )
}

function ElementsWrapper({ items, totals }){
  const [clientSecret, setClientSecret] = useState('')
  const [error, setError] = useState('')

  useEffect(()=>{
    (async ()=>{
      try {
        setError('')
        const res = await createPaymentIntent({
          items: items.map(i => ({ menuItem: i.id, quantity: i.qty }))
        })
        // setClientSecret(res.clientSecret)
        // If api() auto-logged us out, res will be undefined.
        //   if (!res || !res.clientSecret) {
        //   setError('Your session expired. Please log in again.')
        //   setTimeout(() => { window.location.href = '/login?sessionExpired=1' }, 1200)
        //   return
        // }
        if (!res || !res.clientSecret) {
          setError('Failed to initialize payment (no client secret).')
          console.warn('createPaymentIntent response:', res)
          return
        }
        setClientSecret(res.clientSecret)
        } catch(e){
        setError('Failed to initialize payment: ' + String(e?.message || e))
        // const msg = String(e && e.message || e)
        // // if (/AUTH_LOGOUT|invalid token user|unauthorized|missing token|invalid token/i.test(msg)) {
        // if (/AUTH_LOGOUT|invalid token user|invalid token|missing token|jwt expired|token expired/i.test(msg)) {
        //   setError('Your session expired. Please log in again.')
        //   setTimeout(() => { window.location.href = '/login?sessionExpired=1' }, 1200)
        // } else {
        //   setError('Failed to initialize payment: ' + msg)
        // }
      }
    })()
  }, [items])

  // if (error) return <ErrorBanner message={error} onClose={()=>setError('')} />
  // if (!clientSecret) return <div>Preparing payment…</div>
  if (!PK) return <ErrorBanner message={'Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY in frontend/.env and restart.'} onClose={()=>{}} />
  if (error) return <ErrorBanner message={error} onClose={()=>{}} />
  if (!clientSecret || !stripePromise) return <div>Preparing payment…</div>
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm items={items} totals={totals} />
    </Elements>
  )
}
