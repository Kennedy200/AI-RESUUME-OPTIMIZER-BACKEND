const admin = require('firebase-admin');
const serviceAccount = require('./firebase-key.json'); // Path to your Firebase key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // Firebase bucket name from .env
});

const db = admin.firestore(); // Firestore database instance
const bucket = admin.storage().bucket(); // Cloud Storage bucket instance

module.exports = { db, bucket };
