// const router = require('express').Router();
// const { authOptional, authRequired, isAdmin } = require('../middleware/auth');
// const MenuItem = require('../models/MenuItem');
// const Category = require('../models/Category');

// // Public list
// router.get('/', authOptional, async (req, res) => {
//   const { category } = req.query;
//   const filter = { isAvailable: true };
//   if (category) filter.categories = category; // filter by category id
//   const items = await MenuItem
//   .find({ filter })
//   .populate('categories', '_id name').lean();
//   res.json(items);
// });

// router.get('/categories', async (req, res) => {
//   const cats = await Category.find().sort('name').lean();
//   // const cats = await require('../models/Category').find().sort('name');
//   res.json(cats);
// });

// // Admin CRUD
// // create
// router.post('/', authRequired, isAdmin, async (req, res) => {
//   const { name, description = '', price, imageUrl, categories = [], isAvailable = true } = req.body;
//   const payload = {
//     name,
//     price,
//     description,
//     isAvailable,
//     // categories can be ids or strings; ensure array of ids
//     categories: Array.isArray(categories) ? categories : []
//   };
//   const item = await MenuItem.create(payload);
//   const populated = await item.populate('categories', '_id name');
//   res.status(201).json(populated);
//   // const item = await MenuItem.create({ name, description, price, imageUrl, categories, isAvailable });
//   // res.status(201).json(item);
// });

// // update
// // router.put('/:id', authRequired, isAdmin, async (req, res) => {
// //   const updated = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
// //   res.json(updated);
// // });
// router.put('/:id', authRequired, isAdmin, async (req, res) => {
//   const { name, price, description, isAvailable, categories } = req.body;
//   const item = await MenuItem.findById(req.params.id);
//   if (!item) return res.status(404).json({ error: 'Not found' });
//   if (name !== undefined) item.name = name;
//   if (price !== undefined) item.price = price;
//   if (description !== undefined) item.description = description;   // ✅ update desc
//   if (isAvailable !== undefined) item.isAvailable = isAvailable;
//   if (categories !== undefined) item.categories = Array.isArray(categories) ? categories : [];
//   await item.save();
//   const populated = await item.populate('categories', '_id name');
//   res.json(populated);
// });

// router.delete('/:id', authRequired, isAdmin, async (req, res) => {
//   await MenuItem.findByIdAndDelete(req.params.id);
//   res.json({ ok: true });
// });

// module.exports = router;

// backend/src/routes/menu.js
const router = require('express').Router();
const { authRequired, isAdmin /* authOptional not needed */ } = require('../middleware/auth');
const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');

// PUBLIC: list available items (optional filter by category id)
router.get('/', async (req, res) => {
  const { category } = req.query;
  const filter = { isAvailable: true };
  if (category) filter.categories = category;
  const items = await MenuItem
    .find(filter) // ✅ fix: was .find({ filter })
    .populate('categories', '_id name');
  res.json(items);
});

// ADMIN: list ALL items (no availability filter)
router.get('/admin', authRequired, isAdmin, async (req, res) => {
  const items = await MenuItem
    .find()
    .populate('categories', '_id name')
    .sort({ createdAt: -1 });
  res.json(items);
});

// Categories list (shared)
router.get('/categories', async (_req, res) => {
  const cats = await Category.find().sort('name');
  res.json(cats);
});

// CREATE (admin)
router.post('/', authRequired, isAdmin, async (req, res) => {
  const {
    name,
    price,
    description = '',
    imageUrl,
    categories = [],
    isAvailable = true
  } = req.body;

  if (!name || !(price > 0)) {
    return res.status(400).json({ error: 'Name and positive price are required' });
  }

  const item = await MenuItem.create({
    name,
    price,
    description,
    imageUrl,
    isAvailable,
    categories: Array.isArray(categories) ? categories : []
  });

  const populated = await item.populate('categories', '_id name');
  res.status(201).json(populated);
});

// UPDATE (admin)
router.put('/:id', authRequired, isAdmin, async (req, res) => {
  const { name, price, description, isAvailable, categories, imageUrl } = req.body;
  const item = await MenuItem.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  if (name !== undefined) item.name = name;
  if (price !== undefined) item.price = price;
  if (description !== undefined) item.description = description;
  if (isAvailable !== undefined) item.isAvailable = isAvailable;
  if (imageUrl !== undefined) item.imageUrl = imageUrl;
  if (categories !== undefined) item.categories = Array.isArray(categories) ? categories : [];

  await item.save();
  const populated = await item.populate('categories', '_id name');
  res.json(populated);
});

// DELETE (admin)
router.delete('/:id', authRequired, isAdmin, async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
