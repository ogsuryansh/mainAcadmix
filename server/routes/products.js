const express = require('express')
const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const Product = require('../models/Product')
const Order = require('../models/Order')
const User = require('../models/User')
const { protect, adminOnly } = require('../middleware/auth')
const { bucket } = require('../config/firebase')
const { getGridFSBucket } = require('../config/gridfs')
const router = express.Router()

// GET /api/products — public, with filters
router.get('/', async (req, res) => {
  try {
    const { type, exam, search, page = 1, limit = 12 } = req.query
    const filter = { isActive: true }
    if (type)   filter.type = type
    if (exam)   filter.exam = exam
    if (search) filter.title = { $regex: search, $options: 'i' }
    const total    = await Product.countDocuments(filter)
    const products = await Product.find(filter)
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit))
    res.json({ products, total, pages: Math.ceil(total / limit) })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/products/:id/view — secure streaming (Firebase / local fallback)
router.get('/:id/view', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    const isFree = product.price === 0 || product.isFree
    
    // Manual token extraction and verification to allow public free access but secure paid access
    let user = null
    let token
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    } else if (req.query.token) {
      token = req.query.token
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        user = await User.findById(decoded.id).select('-password')
      } catch (err) {
        // Continue, token might be invalid
      }
    }

    const isAdmin = user?.role === 'admin'
    let hasPurchased = false

    if (!isFree && !isAdmin) {
      if (!user) {
        return res.status(401).json({ message: 'Authentication required for paid products' })
      }
      const order = await Order.findOne({
        user: user._id,
        product: product._id,
        status: 'completed'
      })
      if (order) hasPurchased = true
    }

    if (!isFree && !isAdmin && !hasPurchased) {
      return res.status(403).json({ message: 'Access denied: Please purchase this product first' })
    }

    // Force inline rendering (no attachment header) for paid content to prevent download prompts
    if (!isFree && !isAdmin) {
      req.query.download = 'false'
    }

    const fileUrl = product.fileUrl
    if (!fileUrl) {
      return res.status(404).json({ message: 'No file associated with this product' })
    }

    // 1. Firebase Cloud Storage Stream
    if (fileUrl.startsWith('firebase:')) {
      if (!bucket) {
        return res.status(500).json({ message: 'Firebase Storage is not configured' })
      }
      const filePath = fileUrl.replace('firebase:', '')
      const file = bucket.file(filePath)
      const [exists] = await file.exists()

      if (!exists) {
        return res.status(404).json({ message: 'File not found in storage bucket' })
      }

      res.setHeader('Content-Type', 'application/pdf')
      if (req.query.download === 'true') {
        res.setHeader('Content-Disposition', `attachment; filename="${product.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`)
      } else {
        res.setHeader('Content-Disposition', 'inline')
      }

      file.createReadStream()
        .on('error', (err) => {
          console.error('Firebase Stream Error:', err)
          if (!res.headersSent) {
            res.status(500).json({ message: 'Error streaming file from cloud' })
          }
        })
        .pipe(res)

    // 2. MongoDB GridFS Stream
    } else if (fileUrl.startsWith('gridfs:')) {
      try {
        const gridBucket = getGridFSBucket()
        if (!gridBucket) {
          return res.status(500).json({ message: 'Database storage is not initialized' })
        }
        const fileId = fileUrl.replace('gridfs:', '')
        const objectId = new mongoose.Types.ObjectId(fileId)

        const files = await gridBucket.find({ _id: objectId }).toArray()
        if (!files || files.length === 0) {
          return res.status(404).json({ message: 'PDF file not found in database' })
        }
        const fileMetadata = files[0]
        const totalSize = fileMetadata.length

        const disposition = req.query.download === 'true'
          ? `attachment; filename="${product.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`
          : 'inline'

        res.setHeader('Accept-Ranges', 'bytes')

        const rangeHeader = req.headers.range
        if (rangeHeader) {
          const parts = rangeHeader.replace(/bytes=/, "").split("-")
          const start = parseInt(parts[0], 10)
          const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1
          const chunksize = (end - start) + 1

          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${totalSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'application/pdf',
            'Content-Disposition': disposition
          })

          gridBucket.openDownloadStream(objectId, { start, end: end + 1 })
            .on('error', (err) => {
              console.error('GridFS Range Stream Error:', err)
            })
            .pipe(res)
        } else {
          res.writeHead(200, {
            'Content-Length': totalSize,
            'Content-Type': 'application/pdf',
            'Content-Disposition': disposition
          })

          gridBucket.openDownloadStream(objectId)
            .on('error', (err) => {
              console.error('GridFS Stream Error:', err)
              if (!res.headersSent) {
                res.status(404).json({ message: 'PDF file not found in database' })
              }
            })
            .pipe(res)
        }
      } catch (err) {
        console.error('GridFS Stream Exception:', err)
        res.status(500).json({ message: 'Error streaming file from database', error: err.message })
      }

    // 3. Local Storage Stream
    } else if (fileUrl.includes('/uploads/')) {
      const filename = fileUrl.split('/uploads/')[1]
      const filePath = path.join(__dirname, '../uploads', filename)

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Local file not found' })
      }

      const disposition = req.query.download === 'true'
        ? `attachment; filename="${product.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`
        : 'inline'

      res.sendFile(filePath, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': disposition
        }
      }, (err) => {
        if (err && !res.headersSent) {
          console.error('Local sendFile error:', err)
          res.status(500).json({ message: 'Error sending local file' })
        }
      })
    } else {
      // 3. Fallback: direct redirect (Google Drive links, etc.)
      res.redirect(fileUrl)
    }
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/products/:id — public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json(product)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/products — admin only
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body)
    res.status(201).json(product)
  } catch (err) { res.status(400).json({ message: err.message }) }
})

// PUT /api/products/:id — admin only
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!product) return res.status(404).json({ message: 'Not found' })
    res.json(product)
  } catch (err) { res.status(400).json({ message: err.message }) }
})

// DELETE /api/products/:id — admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id)
    res.json({ message: 'Product deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router

