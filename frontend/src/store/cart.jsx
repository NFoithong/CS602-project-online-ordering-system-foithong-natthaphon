import React, { createContext, useReducer, useContext, useEffect } from 'react'

const Ctx = createContext()

function reducer(state, action){
  switch(action.type){
    case 'add': {
      const exists = state.items.find(i => i.id === action.item.id)
      const delta = Math.max(1, parseInt(action.qty ?? 1, 10) || 1)
      const items = exists
        // ? state.items.map(i => i.id===action.item.id? {...i, qty: i.qty + (action.qty||1)} : i)
        // : [...state.items, { ...action.item, qty: action.qty || 1 }]
        ? state.items.map(i => i.id===action.item.id? {...i, qty: i.qty + delta} : i)
        : [...state.items, { ...action.item, qty: delta }]
      return { ...state, items }
    }
    case 'remove': return { ...state, items: state.items.filter(i => i.id !== action.id) }
    // case 'qty': return { ...state, items: state.items.map(i => i.id===action.id? {...i, qty: action.qty} : i) }
    case 'qty': {
      const q = Math.max(1, parseInt(action.qty, 10) || 1)
      return { ...state, items: state.items.map(i => i.id===action.id? {...i, qty: q} : i) }
    }
    case 'clear': return { items: [] }
    default: return state
  }
}

export function CartProvider({ children }){
  const persisted = JSON.parse(localStorage.getItem('cart') || '{"items":[]}')
  const [state, dispatch] = useReducer(reducer, persisted)
  useEffect(()=> localStorage.setItem('cart', JSON.stringify(state)), [state])
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useCart() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export function useCartCount() {
  const { state } = useCart();
  return state.items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
}
