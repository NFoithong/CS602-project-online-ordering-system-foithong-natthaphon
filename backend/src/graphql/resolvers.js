const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const { hashPassword, comparePassword } = require('../utils/password');
const { signJwt } = require('../utils/jwt');

function getUserFromAuthHeader(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  const token = parts.length === 2 && parts[0].toLowerCase() === 'bearer' ? parts[1] : authHeader;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return { id: payload.id, role: payload.role, name: payload.name };
  } catch {
    return null;
  }
}

module.exports = {
  OrderItem: {
    menuItemNode: (parent, _args, { loaders }) => {
      return loaders.menuItems.load(parent.menuItem);
    },
  },
  Query: {
    me: async (_, __, { authHeader }) => {
      const u = getUserFromAuthHeader(authHeader);
      if (!u) return null;
      const user = await User.findById(u.id);
      if (!user) return null;
      return { id: user._id, email: user.email, role: user.role, name: user.name };
    },
    categories: async () => {
      const cats = await Category.find();
      return cats.map(c => ({ id: c._id, name: c.name }));
    },
    menu: async () => {
      const items = await MenuItem.find({ isAvailable: true }).populate('categories');
      return items.map(i => ({
        id: i._id, name: i.name, description: i.description, price: i.price, imageUrl: i.imageUrl,
        isAvailable: i.isAvailable, categories: i.categories.map(c => ({ id: c._id, name: c.name }))
      }));
    },
    myOrders: async (_, __, { authHeader }) => {
      const u = getUserFromAuthHeader(authHeader);
      if (!u) throw new Error('Unauthorized');
      const orders = await Order.find({ user: u.id }).sort({ createdAt: -1 });
      return orders.map(o => ({
        id: o._id, user: { id: u.id, email: '', role: '', name: '' },
        items: o.items, subtotal: o.subtotal, tax: o.tax, total: o.total,
        status: o.status, fulfillment: o.fulfillment, address: o.address, createdAt: o.createdAt
      }));
    }
  },
  Mutation: {
    register: async (_, { email, password, name }) => {
      const exists = await User.findOne({ email });
      if (exists) throw new Error('Email already used');
      const user = await User.create({ email, passwordHash: await hashPassword(password), role: 'customer', name });
      const token = signJwt(user);
      return { token, user: { id: user._id, email: user.email, role: user.role, name: user.name } };
    },
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error('Invalid credentials');
      const ok = await comparePassword(password, user.passwordHash);
      if (!ok) throw new Error('Invalid credentials');
      const token = signJwt(user);
      return { token, user: { id: user._id, email: user.email, role: user.role, name: user.name } };
    },
    placeOrder: async (_, { items, fulfillment, address }, { authHeader }) => {
      const u = getUserFromAuthHeader(authHeader);
      if (!u) throw new Error('Unauthorized');
      if (!Array.isArray(items) || items.length === 0) throw new Error('No items');
      let subtotal = 0;
      const detailed = [];
      for (const it of items) {
        const m = await MenuItem.findById(it.menuItem);
        if (!m || !m.isAvailable) throw new Error('Invalid menu item');
        const qty = Math.max(1, parseInt(it.quantity || 1));
        subtotal += m.price * qty;
        detailed.push({ menuItem: m._id, name: m.name, price: m.price, quantity: qty, notes: it.notes || '' });
      }
      const tax = +(subtotal * 0.07).toFixed(2);
      const total = +(subtotal + tax).toFixed(2);
      const order = await Order.create({
        user: u.id, items: detailed, subtotal, tax, total, status: 'pending',
        fulfillment: fulfillment || 'pickup', address: fulfillment === 'delivery' ? (address || '') : ''
      });
      return {
        id: order._id, user: { id: u.id, email: '', role: '', name: '' }, items: order.items, subtotal, tax, total,
        status: order.status, fulfillment: order.fulfillment, address: order.address, createdAt: order.createdAt
      };
    },

    // Admin mutations
    addMenuItem: async (_, { input }, { authHeader }) => {
      const u = getUserFromAuthHeader(authHeader);
      if (!u || u.role !== 'admin') throw new Error('Admin only');
      const item = await MenuItem.create(input);
      return { id: item._id, name: item.name, description: item.description, price: item.price, imageUrl: item.imageUrl, isAvailable: item.isAvailable, categories: [] };
    },
    updateMenuItem: async (_, { id, input }, { authHeader }) => {
      const u = getUserFromAuthHeader(authHeader);
      if (!u || u.role !== 'admin') throw new Error('Admin only');
      const item = await MenuItem.findByIdAndUpdate(id, input, { new: true }).populate('categories');
      return { id: item._id, name: item.name, description: item.description, price: item.price, imageUrl: item.imageUrl, isAvailable: item.isAvailable, categories: item.categories.map(c=>({id:c._id,name:c.name})) };
    },
    deleteMenuItem: async (_, { id }, { authHeader }) => {
      const u = getUserFromAuthHeader(authHeader);
      if (!u || u.role !== 'admin') throw new Error('Admin only');
      await MenuItem.findByIdAndDelete(id);
      return true;
    }
  }
};
