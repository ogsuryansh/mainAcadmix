const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  amount:  { type: Number, required: true },
  status:  { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'completed' },
  paymentId:  { type: String, default: '' }, // Razorpay/Stripe payment ID
  progress:   { type: Number, default: 0, min: 0, max: 100 }, // reading progress %
}, { timestamps: true })

module.exports = mongoose.model('Order', orderSchema)
