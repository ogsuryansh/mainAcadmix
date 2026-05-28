require('dotenv').config()
const express  = require('express')
const cors     = require('cors')
const path     = require('path')
const connectDB = require('./config/db')

const app = express()

// Connect DB
connectDB()

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
]
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.endsWith('.netlify.app')) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'), false)
  },
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.use('/api/auth',     require('./routes/auth'))
app.use('/api/products', require('./routes/products'))
app.use('/api/users',    require('./routes/users'))
app.use('/api/orders',   require('./routes/orders'))
app.use('/api/upload',   require('./routes/upload'))

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', db: 'connected' }))

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }))

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Server error', error: err.message })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
