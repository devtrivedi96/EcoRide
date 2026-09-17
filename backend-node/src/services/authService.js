const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { COLLECTIONS, findOne, create, removeWhere } = require('../models');
const { generateToken } = require('../config/jwtService');
const { logEvent } = require('./auditService');

async function register({ firstName, lastName, email, password, phoneNumber }) {
  const existing = await findOne(COLLECTIONS.USERS, 'email', email);
  if (existing) throw new Error('Email already in use');

  // Auto-create company from email domain
  const emailDomain = email.substring(email.indexOf('@') + 1);
  let company = await findOne(COLLECTIONS.COMPANIES, 'emailDomain', emailDomain);
  if (!company) {
    company = await create(COLLECTIONS.COMPANIES, { name: emailDomain, emailDomain, active: true });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await create(COLLECTIONS.USERS, {
    firstName, lastName, email,
    password: hashedPassword,
    phoneNumber: phoneNumber || null,
    role: 'EMPLOYEE',
    companyId: company.id,
    driverLicense: null,
  });

  // Auto-create wallet
  await create(COLLECTIONS.WALLETS, { userId: user.id, balance: 0 });

  const token = generateToken(user);
  return { token, user: mapToDto(user, company) };
}

async function login({ email, password }) {
  const user = await findOne(COLLECTIONS.USERS, 'email', email);
  if (!user) throw new Error('Invalid email or password');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid email or password');

  const company = user.companyId ? await require('../models').findById(COLLECTIONS.COMPANIES, user.companyId) : null;
  await logEvent('USER_LOGIN', email, 'Successful login', 'IP_NOT_CAPTURED');

  const token = generateToken(user);
  return { token, user: mapToDto(user, company) };
}

async function generatePasswordResetToken(email) {
  const user = await findOne(COLLECTIONS.USERS, 'email', email);
  if (!user) throw new Error('User with this email not found');

  // Delete old tokens
  await removeWhere(COLLECTIONS.PASSWORD_RESET, 'userId', user.id);

  const token = uuidv4();
  const expiryDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await create(COLLECTIONS.PASSWORD_RESET, { token, userId: user.id, expiryDate });

  console.log(`PASSWORD RESET TOKEN FOR ${email}: ${token}`);
}

async function resetPassword(token, newPassword) {
  const resetToken = await findOne(COLLECTIONS.PASSWORD_RESET, 'token', token);
  if (!resetToken) throw new Error('Invalid token');

  if (new Date() > new Date(resetToken.expiryDate)) {
    await require('../models').remove(COLLECTIONS.PASSWORD_RESET, resetToken.id);
    throw new Error('Token has expired');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await require('../models').update(COLLECTIONS.USERS, resetToken.userId, { password: hashedPassword });
  await require('../models').remove(COLLECTIONS.PASSWORD_RESET, resetToken.id);
}

function mapToDto(user, company) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    companyName: company ? company.name : null,
  };
}

module.exports = { register, login, generatePasswordResetToken, resetPassword, mapToDto };
