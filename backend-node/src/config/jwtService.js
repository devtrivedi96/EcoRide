const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_EXPIRATION = parseInt(process.env.JWT_EXPIRATION) || 86400000; // ms → convert to seconds

/**
 * Equivalent to Spring Boot JwtService
 */

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.email,
      id: user.id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: Math.floor(JWT_EXPIRATION / 1000) } // jwt library uses seconds
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
