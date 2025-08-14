const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: String,
  price: Number,
  quantity: { type: Number, default: 1 },
  notes: String
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  subtotal: Number,
  tax: Number,
  total: Number,
  status: { type: String, enum: ['pending','preparing','ready','completed','cancelled'], default: 'pending' },
  fulfillment: { type: String, enum: ['pickup','delivery','dinein'], default: 'pickup' },
  address: String,
  // Payment fields
  paymentIntentId: String,
  paymentStatus: { type: String, enum: ['unpaid','paid','failed','refunded'], default: 'unpaid' },
  paidAt: Date,
  amount: Number,      // amount in cents (mirrors Stripe PI amount)
  currency: { type: String, default: 'usd' },
  receiptUrl: String
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
