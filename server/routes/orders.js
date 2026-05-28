const express = require('express')
const Order = require('../models/Order')
const Product = require('../models/Product')
const User = require('../models/User')
const { protect, adminOnly } = require('../middleware/auth')
const router = express.Router()

const CASHFREE_API = process.env.CASHFREE_ENV === 'PRODUCTION'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg'

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-client-id': process.env.CASHFREE_APP_ID,
  'x-client-secret': process.env.CASHFREE_SECRET_KEY,
  'x-api-version': '2023-08-01'
})

// POST /api/orders/create-cashfree
router.post('/create-cashfree', protect, async (req, res) => {
  try {
    const { productId } = req.body
    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    const existing = await Order.findOne({ user: req.user._id, product: productId, status: 'completed' })
    if (existing) return res.status(400).json({ message: 'Already purchased' })

    const orderId = `order_${Date.now()}_${req.user._id}`

    const cfReq = await fetch(`${CASHFREE_API}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        order_id: orderId,
        order_amount: product.price,
        order_currency: 'INR',
        customer_details: {
          customer_id: req.user._id.toString(),
          customer_name: req.user.name || 'Student',
          customer_email: req.user.email || 'student@acadmix.com',
          customer_phone: '9999999999'
        },
        order_meta: {
          return_url: `${process.env.CLIENT_URL}/purchases?order_id={order_id}`
        }
      })
    })
    const cfRes = await cfReq.json()

    if (!cfReq.ok) return res.status(400).json({ message: cfRes.message || 'Payment initiation failed' })

    await Order.create({
      user: req.user._id, product: productId,
      amount: product.price, paymentId: orderId, status: 'pending'
    })

    res.json({ payment_session_id: cfRes.payment_session_id, order_id: orderId })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/orders/verify-cashfree
router.post('/verify-cashfree', protect, async (req, res) => {
  try {
    const { order_id } = req.body
    const order = await Order.findOne({ paymentId: order_id })
    if (!order) return res.status(404).json({ message: 'Order not found' })
    if (order.status === 'completed') return res.json({ success: true })

    const cfReq = await fetch(`${CASHFREE_API}/orders/${order_id}`, { headers: getHeaders() })
    const cfRes = await cfReq.json()

    if (cfRes.order_status === 'PAID') {
      order.status = 'completed'
      await order.save()
      await Product.findByIdAndUpdate(order.product, { $inc: { totalSales: 1 } })
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { purchases: order._id } })
      return res.json({ success: true })
    }
    res.json({ success: false, status: cfRes.order_status })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/orders/my — user's own purchases
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('product').sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/orders — admin: all orders
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const total  = await Order.countDocuments()
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('product', 'title type')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit))
    res.json({ orders, total })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/orders/stats — admin dashboard stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [totalRevenue, totalOrders, totalUsers, totalProducts] = await Promise.all([
      Order.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Product.countDocuments({ isActive: true }),
    ])
    res.json({
      revenue:  totalRevenue[0]?.sum || 0,
      orders:   totalOrders,
      users:    totalUsers,
      products: totalProducts,
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/orders/:id/progress — update reading progress
router.patch('/:id/progress', protect, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { progress: req.body.progress },
      { returnDocument: 'after' }
    )
    res.json(order)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
