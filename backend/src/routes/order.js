const router = require('express').Router();
const { authRequired, isAdmin } = require('../middleware/auth');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const sseHub = require('../realtime/sseHub');

// Customer place order
router.post('/', authRequired, async (req, res) => {
  const { items, fulfillment = 'pickup', address } = req.body; // items: [{menuItem, quantity, notes}]
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items' });
  const detailed = [];
  let subtotal = 0;
  for (const it of items) {
    const m = await MenuItem.findById(it.menuItem);
    if (!m || !m.isAvailable) return res.status(400).json({ error: 'Invalid menu item' });
    const qty = Math.max(1, parseInt(it.quantity || 1));
    const lineTotal = m.price * qty;
    subtotal += lineTotal;
    detailed.push({
      menuItem: m._id, name: m.name, price: m.price, quantity: qty, notes: it.notes || ''
    });
  }
  const tax = +(subtotal * 0.07).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);
  const order = await Order.create({
    user: req.user._id,
    items: detailed,
    subtotal, tax, total,
    status: 'pending',
    fulfillment,
    address: fulfillment === 'delivery' ? (address || '') : ''
  });
  res.status(201).json(order);
  try { sseHub.broadcast('order_created', order); } catch(_) {}
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
