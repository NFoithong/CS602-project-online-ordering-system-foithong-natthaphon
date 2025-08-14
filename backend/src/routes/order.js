// const router = require('express').Router();
// const { authRequired, isAdmin } = require('../middleware/auth');
// const Order = require('../models/Order');
// const MenuItem = require('../models/MenuItem');
// const sseHub = require('../realtime/sseHub');

// // Customer place order
// router.post('/', authRequired, async (req, res) => {
//   const { items, fulfillment = 'pickup', address } = req.body; // items: [{menuItem, quantity, notes}]
//   if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items' });
//   const detailed = [];
//   let subtotal = 0;
//   for (const it of items) {
//     const m = await MenuItem.findById(it.menuItem);
//     if (!m || !m.isAvailable) return res.status(400).json({ error: 'Invalid menu item' });
//     const qty = Math.max(1, parseInt(it.quantity || 1));
//     const lineTotal = m.price * qty;
//     subtotal += lineTotal;
//     detailed.push({
//       menuItem: m._id, name: m.name, price: m.price, quantity: qty, notes: it.notes || ''
//     });
//   }
//   const tax = +(subtotal * 0.07).toFixed(2);
//   const total = +(subtotal + tax).toFixed(2);
//   const order = await Order.create({
//     user: req.user._id,
//     items: detailed,
//     subtotal, tax, total,
//     status: 'pending',
//     fulfillment,
//     address: fulfillment === 'delivery' ? (address || '') : ''
//   });
//   res.status(201).json(order);
//   try { sseHub.broadcast('order_created', order); } catch(_) {}
// });

// // Customer: my orders
// router.get('/mine', authRequired, async (req, res) => {
//   const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
//   res.json(orders);
// });

// // Admin: list all orders
// router.get('/', authRequired, isAdmin, async (req, res) => {
//   const orders = await Order.find().populate('user', 'email name').sort({ createdAt: -1 });
//   res.json(orders);
// });

// // Admin: update status
// router.patch('/:id/status', authRequired, isAdmin, async (req, res) => {
//   const { status } = req.body;
//   const allowed = ['pending','preparing','ready','completed','cancelled'];
//   if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
//   const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
//   res.json(order);
//   try { sseHub.broadcast('order_updated', order); } catch(_) {}
// });

// module.exports = router;
const router = require('express').Router();
const Stripe = require('stripe');
const { authRequired, isAdmin } = require('../middleware/auth');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const sseHub = require('../realtime/sseHub');

const CURRENCY = process.env.STRIPE_CURRENCY || 'usd';

// Lazy Stripe init (same pattern you used in payments.js)
let stripeClient = null;
function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET;
    if (key) {
      stripeClient = new Stripe(key, { apiVersion: '2024-06-20' });
    }
  }
  return stripeClient;
}

// Server-side totals (don’t trust client)
async function computeTotals(items = []) {
  let subtotal = 0;
  const detailed = [];
  for (const it of items) {
    const m = await MenuItem.findById(it.menuItem);
    if (!m || !m.isAvailable) throw new Error('Invalid menu item');
    const qty = Math.max(1, parseInt(it.quantity || 1, 10));
    subtotal += Number(m.price) * qty;
    detailed.push({
      menuItem: m._id, name: m.name, price: m.price, quantity: qty, notes: it.notes || ''
    });
  }
  const tax = +(subtotal * 0.07).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);
  const amountCents = Math.round(total * 100);
  return { detailed, subtotal, tax, total, amountCents };
}

// Customer place order
// body: { items: [{menuItem, quantity, notes}], fulfillment, address, paymentIntentId }
router.post('/', authRequired, async (req, res) => {
  try {
    const { items, fulfillment = 'pickup', address = '', paymentIntentId } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items' });
    }

    const { detailed, subtotal, tax, total, amountCents } = await computeTotals(items);

    // Defaults: unpaid
    let paymentStatus = 'unpaid';
    let paidAt = null;
    let currency = CURRENCY;
    let receiptUrl = null;

    // If client passed a PaymentIntent, verify it with Stripe
    if (paymentIntentId) {
      const stripe = getStripe();
      if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      currency = pi.currency || CURRENCY;

      const amountsMatch = Number(pi.amount) === Number(amountCents);
      if (!amountsMatch) {
        return res.status(400).json({ error: 'Payment amount mismatch' });
      }

      if (pi.status === 'succeeded') {
        paymentStatus = 'paid';
        paidAt = new Date(pi.created * 1000);
        const charge = pi.charges?.data?.[0];
        if (charge?.receipt_url) receiptUrl = charge.receipt_url;
      } else {
        // Not succeeded yet (e.g., requires_action). You can choose to:
        // - return 400 to let client retry
        // - or let it create an "unpaid" order that your webhook flips to paid later
        // For now we keep the unpaid default.
      }
    }

    const order = await Order.create({
      user: req.user._id,
      items: detailed,
      subtotal, tax, total,
      status: 'pending',
      fulfillment,
      address: fulfillment === 'delivery' ? address : '',
      // Payment snapshot
      paymentIntentId: paymentIntentId || null,
      paymentStatus,
      paidAt,
      amount: amountCents,
      currency,
      receiptUrl
    });

    res.status(201).json(order);

    // Notify admins (SSE/WebSocket)
    try { sseHub.broadcast('order_created', order); } catch(_) {}
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Customer: my orders
router.get('/mine', authRequired, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// Admin: list all orders
router.get('/', authRequired, isAdmin, async (req, res) => {
  const orders = await Order.find().populate('user', 'email name').sort({ createdAt: -1 });
  res.json(orders);
});

// Admin: update status
router.patch('/:id/status', authRequired, isAdmin, async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending','preparing','ready','completed','cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json(order);
  try { sseHub.broadcast('order_updated', order); } catch(_) {}
});

module.exports = router;
