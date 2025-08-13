# Frontend README — Online Ordering System (React + Vite + Stripe Elements)

This is the **client** application. Customers can browse the menu, filter by categories, add items to a cart (with a live badge), and check out using **Stripe Payment Element**. Admins can manage items, categories, and orders. The UI is role-aware (admins don’t see Cart/My Orders and can’t access those routes).

---

## 1) Prerequisites
- Node.js 18+ (tested with Node 22)
- Backend running at `http://localhost:4000` (or set `VITE_API_BASE` to your server)

---

## 2) Setup

### 2.1 Environment variables
Create **`frontend/.env`**:

```env
VITE_API_BASE=http://localhost:4000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # Stripe TEST publishable key
```

> After changing `.env`, restart Vite so it picks up the new vars.

### 2.2 Install & run
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**.

### 2.3 Build
```bash
npm run build
npm run preview
```

---

## 3) Pages & Behavior
- **Menu**: public menu, category chips, optional filter bar; “Add to Cart” (hidden for admin).
- **Cart**: line items, quantities, totals; **badge** in nav shows total quantity.
- **Checkout**: Stripe Payment Element; form validation; handles expired/invalid sessions.
- **My Orders** *(customer only)*: list of user’s orders with statuses.
- **Admin Items** *(admin only)*: create/edit/delete items, toggle availability, assign categories.
- **Admin Orders** *(admin only)*: real-time (SSE) order stream and status updates.
- **Admin Categories** *(admin only)*: CRUD categories; safe delete with force detach option.
- **Auth**: Login page; nav hides client-only links for admins; route guards enforce access.

---

## 4) Auth & Nav Guards
- Tokens are stored in `localStorage` and attached to API calls via `frontend/src/services/api.js`.
- On 401/403 (e.g., invalidated token), app auto-logs out and redirects to `/login?sessionExpired=1`.
- Admin users do **not** see “Cart” and “My Orders” in the nav; routes `/cart`, `/checkout`, `/my-orders` are blocked for admins.

---

## 5) Stripe Checkout
- Uses **Payment Element**. Button enables only when Stripe and the element are ready.
- Test with card **4242 4242 4242 4242**, any future expiry, any CVC.
- Requires backend endpoint: `POST /api/payments/create-intent` returning `{ clientSecret }`.

Common issues:
- **Publishable key missing** → set `VITE_STRIPE_PUBLISHABLE_KEY` and restart.
- **Button disabled** → wait for element readiness; ensure payment intent was created successfully.

---

## 6) Cart Store
- Location: `frontend/src/store/cart.js` (or `cart.jsx` in your setup)
- Persists to `localStorage`.
- Actions: `add`, `qty`, `remove`, `clear`.
- Selector: `useCartCount()` for the nav badge.

Example “Add to Cart” usage in Menu:
```jsx
<button
  onClick={() =>
    dispatch({ type: 'add', item: { id: m._id, name: m.name, price: Number(m.price) } })
  }
>
  Add to Cart
</button>
```

---

## 7) Environment Matrix (Frontend ↔ Backend)
- `VITE_API_BASE` → points to backend base URL (default `http://localhost:4000`).
- `VITE_STRIPE_PUBLISHABLE_KEY` (frontend) must match a Stripe **test** publishable key; backend uses `STRIPE_SECRET` for server-side calls.

---

## 8) Demo Accounts
Seeded by the backend `npm run seed`:
- **Admin** → `admin@example.com` / `Admin@123`
- **Customer** → `customer@example.com` / `Customer@123`

---

## 9) Troubleshooting
- **Stuck at “Preparing payment…”** → Inspect Network tab for `/api/payments/create-intent` (should return 200 with `clientSecret`).
- **Auto-logout** after clicking Checkout → token invalidated (likely reseed). Log in again.
- **Admin sees Cart/My Orders** → refresh; nav hides these when `user.role === 'admin'`.

---

## 10) Tech Stack
React • Vite • React Router • Stripe Elements • Fetch API • Local Storage
