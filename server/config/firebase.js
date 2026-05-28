const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')

let bucket = null

try {
  const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json')
  
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath)
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.firebasestorage.app`
    })
    console.log('✅ Firebase initialized via service-account.json')
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`
    })
    console.log('✅ Firebase initialized via Environment Variables')
  } else {
    console.warn('⚠️ Firebase configuration missing! PDF uploads will use local fallback.')
  }

  if (admin.apps.length > 0) {
    bucket = admin.storage().bucket()
  }
} catch (error) {
  console.error('❌ Firebase Init Error:', error.message)
}

module.exports = { admin, bucket }
