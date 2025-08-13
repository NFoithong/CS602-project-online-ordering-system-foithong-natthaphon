require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { ApolloServer } = require('apollo-server-express');

// Routes
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/order');
const paymentsRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhooks');       // ✅ add this
const ordersSSERoutes = require('./routes/ordersSSE');     // ✅ SSE (admin stream)
const categoriesRoutes = require('./routes/categories');

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

const app = express();
app.use(cors());
app.use(morgan('dev'));

// ✅ Stripe webhook MUST be mounted with raw body BEFORE express.json()
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }), webhookRoutes);

// JSON parser for the rest
app.use(express.json());

// DB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online_ordering';
mongoose.connect(MONGO_URI).then(()=>console.log('MongoDB connected')).catch(console.error);

// REST routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/orders', ordersSSERoutes); // SSE stream
app.use('/api/categories', categoriesRoutes);

// GraphQL
(async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ authHeader: req.headers.authorization || '' }),
  });
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
})();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
