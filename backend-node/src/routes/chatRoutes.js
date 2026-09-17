const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { COLLECTIONS, findAll, getDb } = require('../models');

// GET /api/chat/:tripId — Chat history
router.get('/:tripId', authenticate, async (req, res, next) => {
  try {
    const db = getDb();
    const snap = await db.collection(COLLECTIONS.CHAT)
      .where('tripId', '==', req.params.tripId)
      .orderBy('timestamp', 'asc')
      .get();
    const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(messages.map(m => ({
      id: m.id, senderEmail: m.senderEmail, content: m.content, timestamp: m.timestamp,
    })));
  } catch (err) { next(err); }
});

module.exports = router;
