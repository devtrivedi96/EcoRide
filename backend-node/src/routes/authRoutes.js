const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

/**
 * Equivalent to AuthController - /api/auth
 */

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.json(result);
  } catch (err) {
    if (err.message === 'Email already in use') return res.status(400).json({ message: err.message });
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    if (err.message === 'Invalid email or password') return res.status(401).json({ message: err.message });
    next(err);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    await authService.generatePasswordResetToken(req.body.email);
    res.json({ message: 'If the email exists, a reset token has been generated.' });
  } catch (err) {
    if (err.message?.includes('credentials') || err.message?.includes('not found')) {
      return res.json({ message: 'If the email exists, a reset token has been generated.' });
    }
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    res.json({ message: 'Password successfully reset.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
