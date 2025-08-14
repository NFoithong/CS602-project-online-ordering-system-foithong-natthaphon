const router = require('express').Router();
const Stripe = require('stripe');
const { authRequired } = require('../middleware/auth');
const MenuItem = require('../models/MenuItem');

const CURRENCY = process.env.STRIPE_CURRENCY || 'usd';

// lazy init so .env order can't break us
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

router.post('/create-intent', authRequired, async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

    const { items = [], fulfillment = 'pickup', address = '' } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items' });
    }

    let subtotal = 0;
    for (const it of items) {
      const m = await MenuItem.findById(it.menuItem);
      if (!m || !m.isAvailable) return res.status(400).json({ error: 'Invalid menu item' });
      const qty = Math.max(1, parseInt(it.quantity || 1, 10));
      subtotal += Number(m.price) * qty;
    }
    const tax = +(subtotal * 0.07).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);
    const amountCents = Math.round(total * 100);

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: CURRENCY,
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: req.user._id.toString(),
        fulfillment,
      },
    });

    return res.json({
      clientSecret: intent.client_secret,
      amountCents,
      subtotal,
      tax,
      total,
    });
  } catch (e) {
    const msg = e?.raw?.message || e?.message || String(e);
    console.error('[payments] error:', msg);
    return res.status(500).json({ error: msg });
  }
});

module.exports = router;
