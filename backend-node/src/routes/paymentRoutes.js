const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const paymentService = require('../services/paymentService');

/**
 * Equivalent to Spring Boot PaymentController - /api/payments
 */

// POST /api/payments/create-order — Create Razorpay order
router.post('/create-order', authenticate, async (req, res, next) => {
  try {
    const amount = req.query.amount || req.body.amount;
    const orderId = await paymentService.createRazorpayOrder(amount);
    res.json({ razorpayOrderId: orderId, amount: parseFloat(amount), currency: 'INR' });
  } catch (err) { next(err); }
});

// POST /api/payments/verify-razorpay — Verify Razorpay signature
router.post('/verify-razorpay', authenticate, async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, purpose, amount, tripId } = req.body;
    const isValid = paymentService.verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) return res.status(400).json({ message: 'Invalid Razorpay Signature' });

    if (purpose?.toUpperCase() === 'RECHARGE') {
      await paymentService.rechargeWallet(req.user.email, { amount, paymentMethod: 'RAZORPAY' });
      return res.json({ status: 'SUCCESS' });
    } else if (purpose?.toUpperCase() === 'TRIP_PAYMENT') {
      const result = await paymentService.payForTrip(req.user.email, { tripId, amount, paymentMethod: 'RAZORPAY' });
      return res.json(result);
    }
    res.status(400).json({ message: 'Unknown payment purpose' });
  } catch (err) { next(err); }
});

// GET /api/payments/wallet
router.get('/wallet', authenticate, async (req, res, next) => {
  try {
    res.json(await paymentService.getMyWallet(req.user.email));
  } catch (err) { next(err); }
});

// POST /api/payments/wallet/recharge
router.post('/wallet/recharge', authenticate, async (req, res, next) => {
  try {
    res.json(await paymentService.rechargeWallet(req.user.email, req.body));
  } catch (err) { next(err); }
});

// POST /api/payments/trip/pay
router.post('/trip/pay', authenticate, async (req, res, next) => {
  try {
    res.json(await paymentService.payForTrip(req.user.email, req.body));
  } catch (err) { next(err); }
});

// GET /api/payments/transactions
router.get('/transactions', authenticate, async (req, res, next) => {
  try {
    res.json(await paymentService.getMyTransactions(req.user.email));
  } catch (err) { next(err); }
});

// POST /api/payments/log-failure
router.post('/log-failure', authenticate, async (req, res, next) => {
  try {
    await paymentService.logFailedPayment(req.user.email, req.body);
    res.status(200).send();
  } catch (err) { next(err); }
});

module.exports = router;
