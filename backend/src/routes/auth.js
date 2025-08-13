const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');
const { signJwt } = require('../utils/jwt');
const { authRequired } = require('../middleware/auth');

router.post('/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password, name } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already used' });
    const user = await User.create({
      email,
      passwordHash: await hashPassword(password),
      role: 'customer',
      name
    });
    const token = signJwt(user);
    res.json({ token, user: { id: user._id, email: user.email, role: user.role, name: user.name } });
  }
);

router.post('/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signJwt(user);
    res.json({ token, user: { id: user._id, email: user.email, role: user.role, name: user.name } });
  }
);

// "Logout" is client-side token removal for JWT; we return OK for demo.
router.post('/logout', authRequired, async (req, res) => {
  res.json({ ok: true });
});

router.get('/me', authRequired, async (req, res) => {
  const u = req.user;
  res.json({ user: { id: u._id, email: u.email, role: u.role, name: u.name } });
});

module.exports = router;
