const jwt = require('jsonwebtoken');

function signJwt(user) {
  const payload = { sub: user._id.toString(), role: user.role, name: user.name };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
}

module.exports = { signJwt };
