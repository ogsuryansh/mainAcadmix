const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { bucket } = require('../config/firebase')
const { getGridFSBucket } = require('../config/gridfs')
const router = express.Router()

const os = require('os')

// Ensure uploads directory exists
// Use OS temp dir for Vercel/Serverless environments, fallback to local uploads dir
const uploadDir = process.env.NODE_ENV === 'production' || process.env.VERCEL ? os.tmpdir() : path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '-'))
  }
})

const upload = multer({ storage: storage })

// POST /api/upload - Uploads a file to Firebase, GridFS, or local fallback
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    // 1. Firebase Storage (Tier 1)
    if (bucket) {
      try {
        const destination = `secured_pdfs/${req.file.filename}`
        
        // Upload to Firebase Storage
        await bucket.upload(req.file.path, {
          destination,
          metadata: {
            contentType: req.file.mimetype || 'application/pdf',
          }
        })

        // Clean up local temp file
        fs.unlinkSync(req.file.path)
        
        return res.status(200).json({ fileUrl: `firebase:${destination}` })
      } catch (firebaseErr) {
        console.warn('⚠️ Firebase upload failed (bucket might not exist or lacks permission):', firebaseErr.message)
        // Fall through to GridFS
      }
    }

    // 2. MongoDB GridFS Storage (Tier 2)
    try {
      const gridBucket = getGridFSBucket()
      if (gridBucket) {
        const uploadStream = gridBucket.openUploadStream(req.file.filename, {
          contentType: req.file.mimetype || 'application/pdf',
          metadata: { originalName: req.file.originalname }
        })

        await new Promise((resolve, reject) => {
          fs.createReadStream(req.file.path)
            .pipe(uploadStream)
            .on('error', reject)
            .on('finish', resolve)
        })

        // Clean up local temp file
        fs.unlinkSync(req.file.path)
        
        return res.status(200).json({ fileUrl: `gridfs:${uploadStream.id}` })
      }
    } catch (gridfsErr) {
      console.warn('⚠️ GridFS upload failed, falling back to local storage:', gridfsErr.message)
    }

    // 3. Local Storage Fallback (Tier 3)
    const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`
    return res.status(200).json({ fileUrl })
  } catch (error) {
    console.error('Upload Error:', error)
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path) } catch (err) {}
    }
    res.status(500).json({ message: 'Error uploading file', error: error.message })
  }
})

module.exports = router

