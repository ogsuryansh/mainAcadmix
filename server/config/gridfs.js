const mongoose = require('mongoose')
const { GridFSBucket } = require('mongodb')

let gridFSBucket = null

mongoose.connection.once('open', () => {
  try {
    gridFSBucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'pdf_uploads'
    })
    console.log('✅ MongoDB GridFS Bucket Initialized')
  } catch (error) {
    console.error('❌ GridFS Init Error:', error.message)
  }
})

const getGridFSBucket = () => {
  if (!gridFSBucket) {
    if (mongoose.connection.readyState === 1) {
      gridFSBucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'pdf_uploads'
      })
      return gridFSBucket;
    }
    throw new Error('Database is not connected yet. GridFS bucket is unavailable.')
  }
  return gridFSBucket
}

module.exports = { getGridFSBucket }
