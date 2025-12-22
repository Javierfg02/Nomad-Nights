const express = require('express');
const router = express.Router();
const { db, admin } = require('./firebase');
const crypto = require('crypto');

// Middleware for Dual Authentication (Firebase ID Token OR Custom API Token)
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    // 1. Try verify as Firebase ID Token (from Web Dashboard)
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = { uid: decodedToken.uid };
    return next();
  } catch (idTokenError) {
    // 2. If ID Token fails, check if it's a Custom API Token (from iOS Shortcut)
    try {
      if (!db) throw new Error('DB not connected');

      // Query users collection for this api_token
      const snapshot = await db.collection('users').where('api_token', '==', token).limit(1).get();

      if (snapshot.empty) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Token' });
      }

      const userDoc = snapshot.docs[0];
      req.user = { uid: userDoc.id };
      return next();
    } catch (dbError) {
      console.error('Auth Error:', dbError);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
};

// --- API Token Management Endpoints ---

// GET /api/token - Retrieve existing API key for the logged-in user
router.get('/token', authenticate, async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.user.uid).get();
    if (!doc.exists) {
      return res.json({ token: null });
    }
    return res.json({ token: doc.data().api_token || null });
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/generate-token - Generate a new API key
router.post('/generate-token', authenticate, async (req, res) => {
  try {
    // Generate a secure random token
    const newToken = 'nomad_' + crypto.randomBytes(16).toString('hex');

    // Save to Firestore
    await db.collection('users').doc(req.user.uid).set({
      api_token: newToken,
      updated_at: new Date().toISOString()
    }, { merge: true });

    res.json({ token: newToken });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Core Logic Endpoints ---

// POST /api/log
router.post('/log', authenticate, async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Database not connected' });
  }
  try {
    const { date, iso_timestamp, country_code, country_name, city, sub_administrative_area } = req.body;

    // Basic validation
    if (!date || (!country_code && !country_name)) {
      console.log('Validation Error. Body:', req.body);
      return res.status(400).json({
        error: 'Missing required fields',
        received_body: req.body,
        content_type_header: req.headers['content-type'],
        note: 'If received_body is empty {}, the shortcut might be sending empty JSON.'
      });
    }

    // Sanitize date to YYYY-MM-DD
    let dateOnly;
    try {
      // Handle iOS default format "Dec 22, 2025 at 15:12"
      const cleanDate = date.replace(/ at /i, ' ');
      const d = new Date(cleanDate);

      if (isNaN(d.getTime())) {
        throw new Error('Invalid date');
      }
      dateOnly = d.toISOString().split('T')[0];
    } catch (e) {
      console.warn('Date parsing failed for:', date);
      // Fallback: try to split by T if ISO, otherwise just use as is (might fail in frontend)
      dateOnly = date.includes('T') ? date.split('T')[0] : date;
    }

    // USE THE AUTHENTICATED USER ID
    const userId = req.user.uid;
    const docRef = db.collection('users').doc(userId).collection('logs').doc(dateOnly);

    await docRef.set({
      date: dateOnly,
      iso_timestamp: iso_timestamp || date || new Date().toISOString(),
      country_code: country_code || null,
      country_name: country_name || null,
      city: city || null,
      sub_administrative_area: sub_administrative_area || null,
      updated_at: new Date().toISOString()
    });

    res.json({ success: true, message: 'Log saved', id: date });
  } catch (error) {
    console.error('Error saving log:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/logs
router.get('/logs', authenticate, async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Database not connected' });
  }

  try {
    // USE THE AUTHENTICATED USER ID
    const userId = req.user.uid;
    const snapshot = await db.collection('users').doc(userId).collection('logs').get();

    const logs = [];
    snapshot.forEach(doc => {
      logs.push(doc.data());
    });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
