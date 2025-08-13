import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Menu from './pages/Menu'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import MyOrders from './pages/MyOrders'
import AdminItems from './pages/AdminItems'
import AdminOrders from './pages/AdminOrders'
import AdminCategories from './pages/AdminCategories'
import { CartProvider, useCartCount } from './store/cart'
import { getToken, getUser, logout } from './services/auth'

function Nav() {
  const user = getUser()
  const isAdmin = user?.role === 'admin'
  const count = useCartCount?.() ?? 0

  return (
    <nav style={{ display:'flex', gap:12, padding:10, borderBottom:'1px solid #ddd' }}>
      <Link to="/">Menu</Link>
      {!isAdmin && (

      <Link to="/cart" style={{ position:'relative', display:'inline-flex', alignItems:'center' }}>
         Cart
         {count > 0 && (
           <span
             style={{
               marginLeft: 6,
               minWidth: 18, height: 18,
               borderRadius: 9,
               padding: '0 6px',
               fontSize: 12,
               lineHeight: '18px',
               textAlign: 'center',
               color: '#fff',
               background: '#111'
             }}
           >
             {count}
           </span>
         )}
      </Link>
      )}

      {user && !isAdmin && <Link to="/my-orders">My Orders</Link>}
      {user?.role === 'admin' && (
        <>
          <Link to="/admin/items">Admin Items</Link>
          <Link to="/admin/orders">Admin Orders</Link>
          <Link to="/admin/categories">Admin Categories</Link>
        </>
      )}
      {!user && <Link to="/login">Login</Link>}
      {user && <button onClick={()=>{ logout(); location.href='/' }}>Logout ({user.name})</button>}
    </nav>
  )
}

function Guard({ children, role, disallowRole }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  
  return children
}

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Nav />
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Guard><Checkout /></Guard>} />
          <Route path="/my-orders" element={<Guard><MyOrders /></Guard>} />
          <Route path="/admin/items" element={<Guard role="admin"><AdminItems /></Guard>} />
          <Route path="/admin/orders" element={<Guard role="admin"><AdminOrders /></Guard>} />
          <Route path="/admin/categories" element={<Guard role="admin"><AdminCategories /></Guard>} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
