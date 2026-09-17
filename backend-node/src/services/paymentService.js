const Razorpay = require('razorpay');
const crypto = require('crypto');
const { COLLECTIONS, findOne, findById, findAll, create, runTransaction, getDb } = require('../models');
const { logEvent } = require('./auditService');

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

async function getOrCreateWallet(userId) {
  let wallet = await findOne(COLLECTIONS.WALLETS, 'userId', userId);
  if (!wallet) wallet = await create(COLLECTIONS.WALLETS, { userId, balance: 0 });
  return wallet;
}

async function getMyWallet(userEmail) {
  const user = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (!user) throw new Error('User not found');
  const wallet = await getOrCreateWallet(user.id);
  return mapWalletDto(wallet);
}

async function rechargeWallet(userEmail, body) {
  const user = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (!user) throw new Error('User not found');
  const amount = parseFloat(body.amount);

  const db = getDb();
  let walletId;
  await runTransaction(async (t) => {
    let walletRef;
    const walletSnap = await db.collection(COLLECTIONS.WALLETS).where('userId', '==', user.id).limit(1).get();
    if (walletSnap.empty) {
      walletRef = db.collection(COLLECTIONS.WALLETS).doc();
      const now = new Date().toISOString();
      t.set(walletRef, { userId: user.id, balance: amount, createdAt: now, updatedAt: now });
    } else {
      walletRef = walletSnap.docs[0].ref;
      const current = walletSnap.docs[0].data().balance;
      t.update(walletRef, { balance: current + amount, updatedAt: new Date().toISOString() });
    }
    walletId = walletRef.id;
    const txRef = db.collection(COLLECTIONS.TRANSACTIONS).doc();
    const now = new Date().toISOString();
    t.set(txRef, {
      walletId: walletRef.id, amount, paymentMethod: body.paymentMethod || 'WALLET',
      transactionType: 'RECHARGE', status: 'SUCCESS', createdAt: now, updatedAt: now,
    });
  });

  await logEvent('WALLET_RECHARGE', userEmail, `Recharged wallet by ${amount}`, 'IP_NOT_CAPTURED');
  const wallet = await findById(COLLECTIONS.WALLETS, walletId);
  return mapWalletDto(wallet);
}

async function createRazorpayOrder(amount) {
  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: Math.round(parseFloat(amount) * 100),
    currency: 'INR',
    receipt: `txn_${Date.now()}`,
  });
  return order.id;
}

function verifyRazorpayPayment(orderId, paymentId, signature) {
  const generated = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return generated === signature;
}

async function payForTrip(userEmail, body) {
  const passenger = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (!passenger) throw new Error('User not found');

  const tripId = body.tripId || body.trip_id;
  const trip = await findById(COLLECTIONS.TRIPS, tripId);
  if (!trip) throw new Error('Trip not found');

  if (trip.passengerId !== passenger.id) throw new Error('You can only pay for your own trips');
  if (!['COMPLETED', 'PAYMENT_PENDING'].includes(trip.status)) throw new Error('Trip is not ready for payment');

  const paymentMethod = (body.paymentMethod || body.payment_method || '').toUpperCase();
  const passengerWallet = await getOrCreateWallet(passenger.id);

  const db = getDb();
  let txId;

  await runTransaction(async (t) => {
    const walletRef = db.collection(COLLECTIONS.WALLETS).doc(passengerWallet.id);
    const walletDoc = await t.get(walletRef);
    const currentBalance = walletDoc.data().balance;

    if (paymentMethod === 'WALLET') {
      if (currentBalance < trip.totalFare) throw new Error('Insufficient wallet balance');
      t.update(walletRef, { balance: currentBalance - trip.totalFare, updatedAt: new Date().toISOString() });
    } else if (paymentMethod === 'RAZORPAY') {
      const amt = parseFloat(body.amount);
      if (isNaN(amt) || Math.abs(amt - trip.totalFare) > 0.01) throw new Error('Payment amount must exactly match the ride fare');
    } else {
      throw new Error('Invalid Payment Method');
    }

    const txRef = db.collection(COLLECTIONS.TRANSACTIONS).doc();
    txId = txRef.id;
    const now = new Date().toISOString();
    t.set(txRef, {
      tripId, walletId: passengerWallet.id, amount: trip.totalFare,
      paymentMethod, transactionType: 'DEDUCTION', status: 'SUCCESS', createdAt: now, updatedAt: now,
    });

    t.update(db.collection(COLLECTIONS.TRIPS).doc(tripId), { status: 'PAYMENT_COMPLETED', updatedAt: now });
  });

  await logEvent('TRIP_PAYMENT', userEmail, `Paid ${trip.totalFare} via ${paymentMethod} for trip ${tripId}`, 'IP_NOT_CAPTURED');

  // Credit driver wallet
  const ride = await findById(COLLECTIONS.RIDES, trip.rideId);
  const driverWallet = await getOrCreateWallet(ride.driverId);
  const driver = await findById(COLLECTIONS.USERS, ride.driverId);
  await runTransaction(async (t) => {
    const driverWalletRef = db.collection(COLLECTIONS.WALLETS).doc(driverWallet.id);
    const driverWalletDoc = await t.get(driverWalletRef);
    const driverBalance = driverWalletDoc.data().balance;
    const now = new Date().toISOString();
    t.update(driverWalletRef, { balance: driverBalance + trip.totalFare, updatedAt: now });
    const dtxRef = db.collection(COLLECTIONS.TRANSACTIONS).doc();
    t.set(dtxRef, {
      tripId, walletId: driverWallet.id, amount: trip.totalFare,
      paymentMethod: 'SYSTEM_TRANSFER', transactionType: 'CREDIT', status: 'SUCCESS', createdAt: now, updatedAt: now,
    });
  });
  await logEvent('DRIVER_CREDIT', driver.email, `Credited ${trip.totalFare} for trip ${tripId}`, 'IP_NOT_CAPTURED');

  const tx = await findById(COLLECTIONS.TRANSACTIONS, txId);
  return mapTxDto(tx);
}

async function getMyTransactions(userEmail) {
  const user = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (!user) throw new Error('User not found');
  const wallet = await findOne(COLLECTIONS.WALLETS, 'userId', user.id);
  if (!wallet) throw new Error('Wallet not found');
  const txs = await findAll(COLLECTIONS.TRANSACTIONS, [['walletId', '==', wallet.id]]);
  return txs.map(mapTxDto).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function logFailedPayment(userEmail, body) {
  const user = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (!user) return;
  const wallet = await findOne(COLLECTIONS.WALLETS, 'userId', user.id);
  if (!wallet) return;
  await create(COLLECTIONS.TRANSACTIONS, {
    walletId: wallet.id, tripId: body.tripId || body.trip_id || null,
    amount: body.amount || 0, paymentMethod: 'RAZORPAY',
    transactionType: (body.tripId || body.trip_id) ? 'TRIP_PAYMENT' : 'RECHARGE', status: 'FAILED',
  });
  await logEvent('PAYMENT_FAILED', userEmail, `Failed payment of ${body.amount}`, 'IP_NOT_CAPTURED');
}

function mapWalletDto(w) { return { id: w.id, userId: w.userId, balance: parseFloat(w.balance) }; }
function mapTxDto(tx) {
  return {
    id: tx.id, tripId: tx.tripId || null, amount: parseFloat(tx.amount),
    paymentMethod: tx.paymentMethod, transactionType: tx.transactionType,
    status: tx.status, createdAt: tx.createdAt,
  };
}

module.exports = { getMyWallet, rechargeWallet, createRazorpayOrder, verifyRazorpayPayment, payForTrip, getMyTransactions, logFailedPayment };
