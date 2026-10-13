const jwt = require('jsonwebtoken');
const config = require('../config/config');

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required.' });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

exports.requireOfficer = (req, res, next) => {
  if (!req.user || req.user.role !== 'officer') {
    return res.status(403).json({ success: false, error: 'Access restricted to authorized officers.' });
  }
  next();
};
