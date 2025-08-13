const express = require('express');
const jwt = require('jsonwebtoken');
const { addClient, removeClient } = require('../realtime/sseHub');
const Order = require('../models/Order');

const router = express.Router();

function verifyToken(raw) {
  if (!raw) return null;
  try {
    const token = raw.startsWith('Bearer ') ? raw.split(' ')[1] : raw;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload; // { sub, role, name }
  } catch {
    return null;
  }
}

// GET /api/orders/stream?token=JWT
router.get('/stream', async (req, res) => {
  // Using token via querystring because EventSource can't set headers.
  const token = req.query.token;
  const payload = verifyToken(token);
  if (!payload) return res.status(401).end('Unauthorized');
  if (payload.role !== 'admin') return res.status(403).end('Admin only');

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // for nginx
  });
  res.flushHeaders?.();

  // Send an initial hello/ping and initial snapshot (optional)
  res.write(`event: ping\ndata: "connected"\n\n`);

  // Optionally send current latest orders snapshot
  try {
    const latest = await Order.find().sort({ createdAt: -1 }).limit(25).lean();
    res.write(`event: snapshot\ndata: ${JSON.stringify(latest)}\n\n`);
  } catch {}

  addClient(res);

  const heartbeat = setInterval(() => {
    try { res.write(`: keepalive\n\n`); } catch(_) {}
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(res);
  });
});

module.exports = router;
