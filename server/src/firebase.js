const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let db;

try {
  let serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  // If env var is set but relative, resolve it relative to CWD (project root) or __dirname
  if (serviceAccountPath && !path.isAbsolute(serviceAccountPath)) {
    serviceAccountPath = path.resolve(process.cwd(), serviceAccountPath);
  } else if (!serviceAccountPath) {
    // Default to standard location
    serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
  }

  const fs = require('fs');
  if (fs.existsSync(serviceAccountPath)) {
    // Check if it's a file
    if (fs.lstatSync(serviceAccountPath).isDirectory()) {
      console.warn(`WARNING: ${serviceAccountPath} is a directory, expected a file.`);
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath))
      });
      console.log('Firebase Admin initialized successfully (Service Account).');
    }
  } else {
    // Fallback to Application Default Credentials (ADC) - for Cloud Functions / Google Cloud
    try {
      admin.initializeApp();
      console.log('Firebase Admin initialized successfully (ADC).');
    } catch (e) {
      console.warn('WARNING: serviceAccountKey.json not found and ADC failed. Database features may be disabled.');
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`Looked at: ${serviceAccountPath}`);
      }
    }
  }

  if (admin.apps.length) {
    // connect to the named database 'nomad-nights'
    try {
      const { getFirestore } = require('firebase-admin/firestore');
      db = getFirestore(admin.app(), 'nomad-nights');
    } catch (err) {
      console.warn('Could not import getFirestore, falling back to default (may fail if named db used)', err);
      db = admin.firestore();
    }
  }
} catch (error) {
  // Check if it's a module not found error to give a friendlier message
  if (error.code === 'MODULE_NOT_FOUND') {
    console.warn('WARNING: Could not load serviceAccountKey.json (Module Not Found). Firestore features will fail.');
  } else {
    console.error('Failed to initialize Firebase:', error.message);
  }
}

module.exports = { admin, db };
