const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db, admin } = require('./firebase');

// Load RSA Keys from Environment Variables
const privateKey = process.env.RSA_PRIVATE_KEY?.replace(/\\n/g, '\n');
const publicKey = process.env.RSA_PUBLIC_KEY?.replace(/\\n/g, '\n');

if (!privateKey) {
  console.error('CRITICAL: RSA_PRIVATE_KEY not found. Digital signing will fail.');
}
if (!publicKey) {
  console.warn('WARNING: RSA_PUBLIC_KEY not found. Public key endpoint will return null.');
}

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
    const { date, iso_timestamp, country_name, latitude, longitude } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Basic validation
    if (!date || !country_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Sanitize date to YYYY-MM-DD
    let dateOnly;
    try {
      const cleanDate = date.replace(/ at /i, ' ');
      const d = new Date(cleanDate);
      if (isNaN(d.getTime())) throw new Error('Invalid date');
      dateOnly = d.toISOString().split('T')[0];
    } catch (e) {
      dateOnly = date.includes('T') ? date.split('T')[0] : date;
    }

    const userId = req.user.uid;
    const updatedAt = new Date().toISOString();

    const logData = {
      date: dateOnly,
      iso_timestamp: iso_timestamp || date || updatedAt,
      country_name: country_name || null,
      updated_at: updatedAt,
      gps: (latitude && longitude) ? { lat: latitude, lon: longitude } : null,
      client_ip: clientIp || null
    };

    const docRef = db.collection('users').doc(userId).collection('logs').doc(dateOnly);

    // Get previous data for audit trail
    const prevDoc = await docRef.get();
    const prevData = prevDoc.exists ? prevDoc.data() : null;

    // Save Log
    await docRef.set(logData);

    // Create Audit Entry
    const auditRef = db.collection('users').doc(userId).collection('audit_trail').doc();
    await auditRef.set({
      action: prevData ? 'UPDATE' : 'CREATE',
      target_date: dateOnly,
      timestamp: updatedAt,
      new_data: logData,
      previous_data: prevData,
      client_ip: clientIp,
      // In a real blockchain we would hash the prev audit entry here. 
      // For now, we secure it with server-side timestamps.
    });

    res.json({ success: true, message: 'Log saved with audit trail', id: dateOnly });
  } catch (error) {
    console.error('Error saving log:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/log/:date - Delete a log entry
router.delete('/log/:date', authenticate, async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Database not connected' });
  }

  try {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD' });
    }

    const userId = req.user.uid;
    const docRef = db.collection('users').doc(userId).collection('logs').doc(date);
    const prevDoc = await docRef.get();

    if (prevDoc.exists) {
      const prevData = prevDoc.data();
      await docRef.delete();

      // Log deletion in audit trail
      const updatedAt = new Date().toISOString();
      const auditRef = db.collection('users').doc(userId).collection('audit_trail').doc();
      await auditRef.set({
        action: 'DELETE',
        target_date: date,
        timestamp: updatedAt,
        previous_data: prevData,
        client_ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      });
    }

    res.json({ success: true, message: 'Log deleted and audited' });
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/logs
router.get('/logs', authenticate, async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Database not connected' });
  }

  try {
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

// GET /api/certificate/:year - Generate a signed compliance certificate
router.get('/certificate/:year', authenticate, async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Database not connected' });

  try {
    const { year } = req.params;
    const userId = req.user.uid;

    // 1. Fetch all logs for that year
    const logsSnapshot = await db.collection('users').doc(userId).collection('logs')
      .where('date', '>=', `${year}-01-01`)
      .where('date', '<=', `${year}-12-31`)
      .get();

    const logs = [];
    logsSnapshot.forEach(doc => logs.push(doc.data()));

    // 2. Fetch relevant audit trail (simplified: just last 100 entries for proof)
    const auditSnapshot = await db.collection('users').doc(userId).collection('audit_trail')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const auditTrail = [];
    auditSnapshot.forEach(doc => auditTrail.push(doc.data()));

    // 3. Create Manifest
    const manifest = {
      version: "1.0",
      generated_at: new Date().toISOString(),
      user_id: userId,
      year: year,
      log_count: logs.length,
      data: logs,
      audit_evidence: auditTrail
    };

    // 4. Sign Manifest (Cryptographic Proof) using RSA Private Key
    if (!privateKey) {
      throw new Error('RSA Private Key is not configured on the server.');
    }

    let signature;
    try {
      const sign = crypto.createSign('SHA256');
      sign.update(JSON.stringify(manifest));
      sign.end();
      signature = sign.sign(privateKey, 'hex');
    } catch (signError) {
      console.error('Cryptographic signing failed:', signError);
      throw new Error('Failed to sign compliance certificate. Ensure RSA keys are valid.');
    }

    res.json({
      manifest,
      signature,
      verification_notice: "This document is cryptographically signed by Nomad Nights. Use our Public Key to verify its authenticity."
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/public-key - Expose the public key for verification
router.get('/public-key', (req, res) => {
  res.json({ publicKey });
});

module.exports = router;
