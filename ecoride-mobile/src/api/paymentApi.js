import api from './axios';

export const paymentApi = {
  wallet: () => api.get('/payments/wallet').then((res) => res.data),
  rechargeWallet: (payload) => api.post('/payments/wallet/recharge', payload).then((res) => res.data),
  payTrip: (payload) => api.post('/payments/trip/pay', payload).then((res) => res.data),
  transactions: () => api.get('/payments/transactions').then((res) => res.data),
  createOrder: (amount) => api.post('/payments/create-order', { amount }).then((res) => res.data),
  verifyRazorpay: (payload) => api.post('/payments/verify-razorpay', payload).then((res) => res.data),
  logFailure: (payload) => api.post('/payments/log-failure', payload),
};
