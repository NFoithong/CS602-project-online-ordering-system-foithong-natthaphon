const jwt = require('jsonwebtoken');
const User = require('../models/User');

function getTokenFromHeader(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  return (parts.length === 2 && parts[0].toLowerCase() === 'bearer')
    ? parts[1]
    : authHeader; // allow raw token
}

async function authOptional(req, _res, next) {
  const token = getTokenFromHeader(req.headers.authorization);
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const userId = payload.id || payload.sub;     // ✅ accept id or sub
      if (userId) req.user = await User.findById(userId).lean();
    } catch {
      // ignore bad/expired token for optional auth
    }
  }
  return next();
}

async function authRequired(req, res, next) {
  const token = getTokenFromHeader(req.headers.authorization);
  if (!token) return res.status(401).json({ error: 'missing token' }); // ✅ lower-case

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.id || payload.sub;       // ✅ accept id or sub
    if (!userId) return res.status(401).json({ error: 'invalid token' });

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: 'invalid token user' }); // ✅ matches frontend regex

    req.user = user; // keep full doc for isAdmin, etc.
    return next();
  } catch (e) {
    // surface expiry explicitly (frontend handles "jwt expired" specially)
    if (e && e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'jwt expired' });             // ✅ matches regex
    }
    return res.status(401).json({ error: 'invalid token' });
  }
}

function isAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ error: 'admin only' }); // optional: normalize case
}

module.exports = { authOptional, authRequired, isAdmin };
