const router = require('express').Router();
const { authRequired, isAdmin } = require('../middleware/auth');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');

// ADMIN: list categories + how many items use them
router.get('/', authRequired, isAdmin, async (_req, res) => {
  const cats = await Category.find().sort('name').lean();
  const counts = await MenuItem.aggregate([
    { $unwind: '$categories' },
    { $group: { _id: '$categories', count: { $sum: 1 } } }
  ]);
  const countMap = new Map(counts.map(c => [String(c._id), c.count]));
  const result = cats.map(c => ({ ...c, itemCount: countMap.get(String(c._id)) || 0 }));
  res.json(result);
});

// ADMIN: create
router.post('/', authRequired, isAdmin, async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Name is required' });
  // prevent near-duplicates
  const exists = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
  if (exists) return res.status(409).json({ error: 'Category already exists' });
  const cat = await Category.create({ name });
  res.status(201).json(cat);
});

// ADMIN: rename
router.put('/:id', authRequired, isAdmin, async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const exists = await Category.findOne({ _id: { $ne: req.params.id }, name: new RegExp(`^${name}$`, 'i') });
  if (exists) return res.status(409).json({ error: 'Category already exists' });
  const cat = await Category.findByIdAndUpdate(req.params.id, { name }, { new: true });
  if (!cat) return res.status(404).json({ error: 'Not found' });
  res.json(cat);
});

// ADMIN: delete (optionally detach from items with ?force=1)
router.delete('/:id', authRequired, isAdmin, async (req, res) => {
  const id = req.params.id;
  const inUse = await MenuItem.countDocuments({ categories: id });
  if (inUse > 0 && !('force' in req.query)) {
    return res.status(409).json({ error: 'Category is used by items', itemCount: inUse });
  }
  // detach from items, then delete the category
  await MenuItem.updateMany({ categories: id }, { $pull: { categories: id } });
  await Category.findByIdAndDelete(id);
  res.json({ ok: true, detachedFromItems: inUse });
});

module.exports = router;
