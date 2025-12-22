const express = require('express');
const router = express.Router();
const { db } = require('./firebase');

// Middleware for Bearer Token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!process.env.API_KEY) {
    console.error('API_KEY not set in environment variables');
    return res.status(500).json({ error: 'Server misconfigured (API_KEY missing)' });
  }

  if (token === process.env.API_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// POST /api/log
router.post('/log', authenticate, async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Database not connected' });
  }

  try {
    const { date, iso_timestamp, country_code, country_name, city, sub_administrative_area } = req.body;

    // Basic validation
    if (!date || (!country_code && !country_name)) {
      return res.status(400).json({ error: 'Missing required fields (date, and either country_code or country_name)' });
    }

    // Path: users/{admin_user}/logs/{date}
    // We assume single user for now, or use a default user ID 'admin'
    // Sanitize date to YYYY-MM-DD if it comes as ISO string
    const dateObj = new Date(date);
    // If date is invalid, this might fail, but we assume ISO format from shortcut.
    // Ideally use date-fns or simple string split if ISO.
    const dateOnly = date.includes('T') ? date.split('T')[0] : date;

    const userId = 'admin';
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
// Used by Frontend (maybe Basic Auth later, for now protect with same API KEY or open if local?)
// PRD says Frontend uses Basic Auth (server level). 
// For now, let's allow fetching logs if authenticated or separate endpoint?
// The PRD implementation plan implied /api/logs for frontend.
// We'll protect it simply for now or leave public if just running local.
// Let's protect it with the same API key for simplicity or check a separate FRONTEND_SECRET.
// or just leave it open for localhost? 
// PRD: "API Endpoint rejects 100% of requests without the correct Bearer Token." applies to "Ingress".
// Frontend calls API. Frontend might need the token too.
router.get('/logs', async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Database not connected' });
  }

  try {
    const userId = 'admin';
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
