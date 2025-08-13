const jwt = require('jsonwebtoken');
const User = require('../models/User');

function getTokenFromHeader(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') return parts[1];
  return authHeader; // allow raw token
}

async function authOptional(req, res, next) {
  const token = getTokenFromHeader(req.headers.authorization);
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(payload.sub).lean();
    } catch (e) { /* ignore bad token */ }
  }
  return next();
}

async function authRequired(req, res, next) {
  const token = getTokenFromHeader(req.headers.authorization);
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Invalid token user' });
    req.user = user;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function isAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin only' });
}

module.exports = { authOptional, authRequired, isAdmin };
