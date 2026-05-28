const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { bucket } = require('../config/firebase')
const { getGridFSBucket } = require('../config/gridfs')
const router = express.Router()

// Configure multer to use Memory Storage (100% immune to Vercel filesystem restrictions)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
})

// POST /api/upload - Uploads a file to Firebase, GridFS, or local fallback
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    // Generate a safe unique filename
    const uniqueName = Date.now() + '-' + req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')

    // 1. Firebase Storage (Tier 1)
    if (bucket) {
      try {
        const destination = `secured_pdfs/${uniqueName}`
        const fileRef = bucket.file(destination)
        
        await fileRef.save(req.file.buffer, {
          metadata: { contentType: req.file.mimetype || 'application/pdf' }
        })
        
        return res.status(200).json({ fileUrl: `firebase:${destination}` })
      } catch (firebaseErr) {
        console.warn('⚠️ Firebase upload failed:', firebaseErr.message)
      }
    }

    // 2. MongoDB GridFS Storage (Tier 2)
    try {
      const gridBucket = getGridFSBucket()
      if (gridBucket) {
        const uploadStream = gridBucket.openUploadStream(uniqueName, {
          contentType: req.file.mimetype || 'application/pdf',
          metadata: { originalName: req.file.originalname }
        })

        uploadStream.end(req.file.buffer)

        await new Promise((resolve, reject) => {
          uploadStream.on('error', reject)
          uploadStream.on('finish', resolve)
        })
        
        return res.status(200).json({ fileUrl: `gridfs:${uploadStream.id}` })
      }
    } catch (gridfsErr) {
      console.warn('⚠️ GridFS upload failed:', gridfsErr.message)
    }

    // 3. Local Storage Fallback (Tier 3 - Mostly for local development)
    const uploadDir = path.join(__dirname, '../uploads')
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
    
    const localPath = path.join(uploadDir, uniqueName)
    fs.writeFileSync(localPath, req.file.buffer)
    
    const fileUrl = `${process.env.CLIENT_URL || 'http://localhost:5000'}/uploads/${uniqueName}`
    return res.status(200).json({ fileUrl })

  } catch (error) {
    console.error('Upload Error:', error)
    res.status(500).json({ message: 'Error uploading file', error: error.message })
  }
})

module.exports = router

