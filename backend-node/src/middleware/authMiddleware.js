const { verifyToken } = require('../config/jwtService');

/**
 * Equivalent to Spring Boot JwtAuthenticationFilter
 * Reads Authorization: Bearer <token>, verifies it and attaches
 * req.user = { email, id, role } to the request.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.substring(7);
  try {
    const payload = verifyToken(token);
    req.user = { email: payload.sub, id: payload.id, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Equivalent to @PreAuthorize("hasRole('ADMIN')")
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied: Admin role required' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
