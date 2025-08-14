const express = require('express');
const Stripe = require('stripe');
const Order = require('../models/Order');
const sseHub = require('../realtime/sseHub');

const router = express.Router();

// We must use raw body to validate signatures. This router expects to be used as:
// app.use('/webhooks/stripe', express.raw({ type: 'application/json' }), webhookRouter)
const stripe = process.env.STRIPE_SECRET ? new Stripe(process.env.STRIPE_SECRET) : null;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

router.post('/', async (req, res) => {
  if (!stripe || !endpointSecret) {
    return res.status(500).send('Stripe webhook not configured');
  }
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const id = pi.id;
        await Order.updateMany(
          { paymentIntentId: id },
          // { $set: { paymentStatus: 'paid' } }
          { $set: { paymentStatus: 'paid', paidAt: new Date(pi.created * 1000), amount: pi.amount, currency: pi.currency || 'usd', receiptUrl: charge?.receipt_url || null } }
        );
        try { sseHub.broadcast('order_payment_updated', { paymentIntentId: id, paymentStatus: 'paid' }); } catch(_) {}
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const id = pi.id;
        await Order.updateMany(
          { paymentIntentId: id },
          { $set: { paymentStatus: 'failed' } }
        );
        try { sseHub.broadcast('order_payment_updated', { paymentIntentId: id, paymentStatus: 'failed' }); } catch(_) {}
        break;
      }
      default:
        // Other event types can be handled here if needed
        break;
    }
  } catch (e) {
    console.error('Webhook handler error:', e);
    // Return 200 so Stripe doesn't retry forever for logical issues; or 500 to retry.
    // We'll return 200 since this is idempotent and we might create the order later.
  }

  res.json({ received: true });
});

module.exports = router;
