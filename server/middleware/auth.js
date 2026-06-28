const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'treasure-game-secret-key';

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: '未登入' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Token 無效或已過期' });
  }
}

module.exports = { requireAuth, JWT_SECRET };
