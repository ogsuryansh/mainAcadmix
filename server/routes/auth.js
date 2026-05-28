const express = require('express')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const User = require('../models/User')
const router = express.Router()

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required' })
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' })
    const user = await User.create({ name, email, password })
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, token: genToken(user._id)
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // 1. Env-based Admin Backdoor
    if (
      process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL === email &&
      process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD === password
    ) {
      return res.json({
        _id: 'super-admin-env',
        name: 'Super Admin',
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
        token: genToken('super-admin-env')
      })
    }

    // 2. Regular Database Login
    const user = await User.findOne({ email })
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' })
    if (!user.isActive)
      return res.status(403).json({ message: 'Account disabled' })
    res.json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, token: genToken(user._id)
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body
    
    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    
    const { name, email, picture } = ticket.getPayload()

    // Check if user exists
    let user = await User.findOne({ email })

    if (!user) {
      // Create new user if they don't exist
      user = await User.create({
        name,
        email,
        password: Date.now().toString(), // Dummy password
      })
    } else if (!user.isActive) {
      return res.status(403).json({ message: 'Account disabled' })
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: genToken(user._id)
    })
  } catch (err) {
    console.error('Google Auth Error:', err)
    res.status(401).json({ message: 'Google Auth Error: ' + err.message })
  }
})

module.exports = router
