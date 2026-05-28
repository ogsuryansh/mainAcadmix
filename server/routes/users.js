const express = require('express')
const User = require('../models/User')
const Order = require('../models/Order')
const { protect, adminOnly } = require('../middleware/auth')
const router = express.Router()

// GET /api/users — admin: all users
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query
    const filter = {}
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
    const total = await User.countDocuments(filter)
    const users = await User.find(filter).select('-password')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit))
    res.json({ users, total, pages: Math.ceil(total / limit) })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/users/me — logged in user profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('purchases')
    res.json(user)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/users/:id/toggle — admin: activate/deactivate
router.put('/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    user.isActive = !user.isActive
    await user.save()
    res.json({ isActive: user.isActive })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/users/:id/role — admin: set role
router.put('/:id/role', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-password')
    res.json(user)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
