# Software Project Proposal / Plan (SPPP)

## 1) Project Description (Introduction)
A Node.js/Express-centric online ordering platform for restaurants. It emphasizes server-side architecture: REST + GraphQL APIs, JWT authentication/authorization, MongoDB persistence via Mongoose, Stripe payment processing with webhooks, and real-time admin order updates via Server-Sent Events (SSE). The React client delivers a minimal, role-aware UI for customers and admins.

## 2) Key Features
- **Authentication & Roles**: JWT login; route guards; role-aware UI.
- **Menu Management (Admin)**: Create/edit/delete items, toggle availability, assign categories.
- **Categories Management (Admin)**: CRUD categories; safe delete with optional detach from items.
- **Customer Ordering**: Menu browsing with category filters, cart with live badge, review & checkout.
- **Payments**: Stripe PaymentIntents; webhook to update payment status.
- **Orders**: Create orders (client), “My Orders”, admin status workflow (pending → preparing → ready → completed).
- **Realtime Admin Dashboard**: SSE feed for order updates without polling.
- **API Surface**: REST (JSON) + GraphQL at `/graphql`.

## 3) Technology Stack
**Backend**: Node.js, Express.js, Mongoose (MongoDB), Apollo Server (GraphQL), Stripe SDK, SSE  
**Frontend**: React (Vite), React Router, Stripe Elements  
**Tooling**: Nodemon, dotenv, Postman, Apollo Sandbox

## 4) Technical Requirements (Mapping)
- NodeJS centric using ExpressJS 
- Server-side emphasis (auth, Stripe, webhooks, SSE, business rules)
- Persistence with Mongoose/MongoDB 
- One-to-many & many-to-many relationships 
- REST API (JSON) 
- GraphQL endpoint 
- JWT for authentication/authorization 
- React front-end 

## 5) Data Models & Relationships
- **User**
  - `name`, `email` (unique), `passwordHash`, `role` (`admin` | `customer`)
  - Relationship: User **1→N** Orders
- **Category**
  - `name`
  - Relationship: MenuItem **N↔N** Category
- **MenuItem**
  - `name`, `description`, `price`, `isAvailable`, `imageUrl`, `categories: ObjectId[] (Category)`
  - Relationship: **N↔N** with Category
- **Order**
  - `user: ObjectId (User)`, `items: [{ menuItem: ObjectId (MenuItem), quantity }]`,
    `fulfillment` (`pickup` | `delivery` | `dinein`), `address`,
    `status` (`pending|preparing|ready|completed|cancelled`),
    `paymentStatus`, `paymentIntentId`, timestamps
  - Relationship: **belongs to User**; **has many OrderItems** referencing MenuItem

## 6) Authentication & Access Control
- JWT issued on `POST /api/auth/login`
- Middleware: `authRequired`, `isAdmin`
- SSE authentication via `?token=<JWT>` (EventSource limitation)
- Frontend route guards + hidden UI for admin-only / client-only paths

## 7) User Roles
- **Admin**
  - Manage menu items and categories
  - Monitor orders in real time; update statuses
- **Customer**
  - Browse, filter, and order from the menu
  - Manage cart; pay with Stripe; track orders

## 8) User Stories
- As a customer, I can view the menu with category filters to find items quickly.
- As a customer, I can add items to my cart and see a live badge count.
- As a customer, I can pay securely and get confirmation.
- As a customer, I can view my current/past orders and their statuses.
- As an admin, I can create/update/delete menu items and toggle availability.
- As an admin, I can create/rename/delete categories safely.
- As an admin, I can observe new orders in real time and progress their status.

## 9) Future Enhancements
- Kitchen Display System (KDS) for back-of-house
- Delivery workflow & driver assignment
- Coupons/Promotions and service fees
- Inventory tracking & stock alerts
- Multi-location (multi-tenant) support
- Email/SMS notifications on order updates
- WebSockets with Redis Pub/Sub for horizontal scale
