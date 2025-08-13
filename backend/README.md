# Backend README — Online Ordering System (Node/Express, MongoDB, GraphQL, Stripe, SSE)

This is the **server** for the Online Ordering System. It exposes REST and GraphQL APIs, handles JWT authentication/authorization, processes Stripe test payments (with webhooks), streams real-time order updates via **SSE**, and persists data to **MongoDB** using **Mongoose**.

---

## 1) Prerequisites
- Node.js 18+ (tested with Node 22)
- MongoDB (local or Atlas)
- Stripe account (for **test** keys)

---

## 2) Setup

### 2.1 Environment variables
Create **`backend/.env`**:

```env
MONGO_URI=mongodb://127.0.0.1:27017/online_ordering
JWT_SECRET=supersecret
PORT=4000

# Stripe (TEST keys)
STRIPE_SECRET=sk_test_xxx            # must start with sk_test_
STRIPE_PUBLISHABLE_KEY=pk_test_xxx   # for reference; not used on server
STRIPE_CURRENCY=usd

# Optional: only if you run `stripe listen`
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

> Ensure `require('dotenv').config()` runs at the very top of `src/index.js` **before** routes are required.

### 2.2 Install & run
```bash
cd backend
npm install
npm run dev
```
Server should start on **http://localhost:4000**.

---

## 3) Initialize Data (MongoDB)

- **Seed script:** `backend/src/seed/seed.js`
- **Run:**
  ```bash
  cd backend
  npm run seed
  ```

This creates 2 users, base categories, and a sample menu.

### Seeded users
- **Admin** → `admin@example.com` / `Admin@123`
- **Customer** → `customer@example.com` / `Customer@123`

> If you seed while logged in, existing JWTs become invalid → clients must log back in.

---

## 4) Endpoints

### 4.1 REST (JSON)

**Auth**
- `POST /api/auth/login` → `{ token, user }`

**Menu (public)**
- `GET /api/menu` → available items; supports `?category=<id>`; categories populated
- `GET /api/menu/categories` → public list of categories

**Menu (admin)**
- `GET /api/menu/admin` → **all** items (JWT admin required)
- `POST /api/menu` → create item (admin)
- `PUT /api/menu/:id` → update item (admin)
- `DELETE /api/menu/:id` → delete item (admin)

**Categories (admin)**
- `GET /api/categories` → list categories + `itemCount`
- `POST /api/categories` → create
- `PUT /api/categories/:id` → rename
- `DELETE /api/categories/:id[?force=1]` → delete; `force=1` detaches from items first

**Orders**
- `POST /api/orders` → create order (client)
- `GET /api/orders/my` → current user’s orders (client)
- `PATCH /api/orders/:id/status` → update status (admin)
- `GET /api/orders/stream?token=<JWT>` → **SSE** stream (admin-only)

**Payments (Stripe)**
- `POST /api/payments/create-intent` → `{ clientSecret }` for Stripe Elements
- `POST /webhooks/stripe` → Stripe webhook (raw body)

> **Webhook body parser:** must be mounted like  
> `app.use('/webhooks/stripe', express.raw({ type: 'application/json' }), webhookRoutes);`  
> and **before** `express.json()` for all other routes.

#### Example: login (curl)
```bash
curl -s -X POST http://localhost:4000/api/auth/login  -H "Content-Type: application/json"  -d '{"email":"admin@example.com","password":"Admin@123"}'
```

#### Example: admin list items (curl)
```bash
# assume TOKEN env var contains the JWT from login
curl -s http://localhost:4000/api/menu/admin  -H "Authorization: Bearer $TOKEN"
```

### 4.2 GraphQL (Apollo at `/graphql`)
Open **http://localhost:4000/graphql**. Add header:
```json
{ "authorization": "Bearer <JWT>" }
```

**Query — menu with categories**
```graphql
query GetMenu {
  menu { _id name price description categories { _id name } }
}
```

**Query — my orders (customer token)**
```graphql
query MyOrders {
  myOrders {
    _id status total
    items { quantity menuItem { name price } }
    createdAt
  }
}
```

---

## 5) Stripe Webhook (optional but recommended for demo)
Forward test events to your local server:
```bash
stripe listen --forward-to localhost:4000/webhooks/stripe
```
Copy the `whsec_...` secret into `STRIPE_WEBHOOK_SECRET` and restart the backend.

---

## 6) Realtime via SSE
Admins connect to: `GET /api/orders/stream?token=<JWT>`  
The server pushes events on new/updated orders. Client-side uses `EventSource`.

---

## 7) Troubleshooting
- **"Stripe not configured"** → missing/invalid `STRIPE_SECRET` or `dotenv` not loaded early enough.
- **"Invalid token user"** → DB reseeded, token references a deleted user. Log out/in.
- **"Cannot GET /api/menu/admin"** → route not mounted or missing Bearer token.
- **Webhook 400** → ensure raw parser on `/webhooks/stripe` before `express.json()`.

---

## 8) Tech Stack
Node.js • Express • Mongoose • Apollo Server • Stripe • SSE • dotenv • nodemon
