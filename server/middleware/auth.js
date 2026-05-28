const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  let token
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.query.token) {
    token = req.query.token
  }
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' })
  try {
    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET is missing in environment variables!')
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_to_prevent_crash')
    
    // Check for Env-based Admin Backdoor Token
    if (decoded.id === 'super-admin-env') {
      req.user = {
        _id: 'super-admin-env',
        name: 'Super Admin',
        email: process.env.ADMIN_EMAIL || 'admin@acadmix.com',
        role: 'admin'
      }
      return next()
    }

    req.user = await User.findById(decoded.id).select('-password')
    if (!req.user) throw new Error('User not found')
    next()
  } catch (err) {
    res.status(401).json({ message: 'Token invalid or expired' })
  }
}

const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next()
  res.status(403).json({ message: 'Admin access required' })
}

module.exports = { protect, adminOnly }
