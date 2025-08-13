# Online Ordering System — Starter (Express + MongoDB + GraphQL + JWT)
A full-stack food ordering system with role-based access (Admin/Client), REST + GraphQL APIs, JWT auth, Stripe test payments, and real-time admin order updates via Server-Sent Events (SSE).

### This starter meets your project guidelines:
- NodeJS (Express)
- Server-side emphasis with MongoDB (Mongoose)
- One-to-many and many-to-many relationships (User→Orders, Category↔MenuItem)
- REST + GraphQL endpoints
- JWT auth (login/logout client-side) with roles (admin, customer)
- Ready to test in Postman and Apollo
- Minimal React frontend scaffold included

## Description
Customers can browse a menu, add items to a cart, and pay using Stripe test cards. Admins can manage menu items and categories, view orders in real time, and update statuses (pending → preparing → ready → completed). The backend exposes both REST and GraphQL endpoints and persists data in MongoDB via Mongoose.

## Prereqs
- Node 18+
- MongoDB running locally

## How to Start (Server & Client)
### Backend — How to run
```bash
cd backend
cp .env.example .env   # update as needed
npm install
npm run seed           # seeds admin & customer + sample menu
npm run dev            # starts http://localhost:4000
```
1. Create `backend/.env`:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/online_ordering
   JWT_SECRET=supersecret
   PORT=4000

   STRIPE_SECRET=sk_test_xxx            # Test secret key (sk_test_...)
   STRIPE_PUBLISHABLE_KEY=pk_test_xxx   # Test publishable key (pk_test_...)
   STRIPE_CURRENCY=usd
   # Optional for local webhook testing:
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```
2. Install & run:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. (Optional) Start Stripe webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:4000/webhooks/stripe
   ```

**Server URLs**
- REST base: `http://localhost:4000/api`
- GraphQL: `http://localhost:4000/graphql`
- Stripe webhook: `http://localhost:4000/webhooks/stripe`
- SSE stream (admin): `GET http://localhost:4000/api/orders/stream?token=<JWT>`

Seeded users:
- Admin — email: `admin@example.com` / password: `Admin@123`
- Customer — email: `customer@example.com` / password: `Customer@123`

REST base URL: `http://localhost:4000`
GraphQL endpoint: `http://localhost:4000/graphql`

### Test in Postman
Import `backend/postman_collection.json`. Set `{{baseUrl}}` to `http://localhost:4000`.
- Login as admin & set `{{adminToken}}`
- Login as customer & set `{{customerToken}}`
- Try Get Menu, Add Menu (admin), Place Order (customer), My Orders, etc.

### Test in Apollo
Open Apollo Sandbox at `/graphql`. Use the examples in `backend/graphql_tests.graphql` and set `Authorization: Bearer <token>` header where needed.

### Frontend — How to run
```bash
cd frontend
npm install
npm run dev
```

1. Create `frontend/.env`:
   ```env
   VITE_API_BASE=http://localhost:4000
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   ```
2. Install & run:
   ```bash
   cd frontend
   npm install
   npm start
   ```
3. Open: `http://localhost:5173`

This provides:
- Login page (get token)
- Menu page (public list)
- Cart + Checkout (authed customer)
- Admin: Items CRUD (requires admin token)

Set `VITE_API_BASE=http://localhost:4000` in `frontend/.env` if needed.

---

### Relationships
- **User (1) → Orders (N)** via `Order.user`
- **Category (1) ↔ MenuItem (N)** implemented as a many-to-many using `MenuItem.categories` (array of ObjectIds) and `populate()`
- **Order (1) → OrderItem (N)** embedded subdocuments

---

## REST Endpoints (Examples)
- **Auth**
  - `POST /api/auth/login` → `{ token, user }`
- **Menu (public)**
  - `GET /api/menu` (optional `?category=<id>`) → available items (categories populated)
  - `GET /api/menu/categories` → public categories
- **Menu (admin)**
  - `GET /api/menu/admin` → all items (admin, JWT)
  - `POST /api/menu` → create item (admin)
  - `PUT /api/menu/:id` → update item (admin)
  - `DELETE /api/menu/:id` → delete item (admin)
- **Categories (admin)**
  - `GET /api/categories` → categories + item counts (admin)
  - `POST /api/categories` → create (admin)
  - `PUT /api/categories/:id` → rename (admin)
  - `DELETE /api/categories/:id[?force=1]` → delete and detach from items (admin)
- **Orders**
  - `POST /api/orders` → create order (client)
  - `GET /api/orders/my` → current user’s orders (client)
  - `PATCH /api/orders/:id/status` → update status (admin)
  - `GET /api/orders/stream?token=<JWT>` → **SSE** (admin)
- **Payments (Stripe)**
  - `POST /api/payments/create-intent` → `{ clientSecret }`
  - `POST /webhooks/stripe` → Stripe webhook (raw body)

## GraphQL (Apollo at `/graphql`)
Example operations (add `Authorization: Bearer <JWT>` header as needed):

```graphql
# Query menu with categories
query GetMenu {
  menu {
    _id
    name
    price
    description
    categories { _id name }
  }
}

# Optional: customer orders (requires customer JWT)
query MyOrders {
  myOrders {
    _id
    status
    total
    items { quantity menuItem { name price } }
    createdAt
  }
}
```

---

## Demo Checklist (for video)
**Postman**
1) `POST /api/auth/login` (admin) → save token.  
2) `GET /api/menu/admin` with `Authorization: Bearer {{token}}`.

**GraphQL**
1) Set header `{ "authorization": "Bearer <token>" }`.  
2) Run `query GetMenu { menu { _id name price description categories { _id name } } }`.

---


### Notes
- JWT logout is client-side token removal (stateless tokens). Endpoint `/api/auth/logout` returns OK for demo.
- Add Stripe or other payment later if needed.
- This is intentionally minimal but complete for a working demo.
- Webhook route uses `express.raw()` and must be mounted before `express.json()`.
- After reseeding, tokens become invalid → log out/in.
- Admins don’t see Cart/My Orders; Add to Cart hidden for admin users.
