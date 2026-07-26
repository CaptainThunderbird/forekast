import jwt from 'jsonwebtoken';

// Expects header: Authorization: Bearer <token>
function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed authorization header' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Attach the decoded user info so route handlers can use req.userId
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.userId = jwt.verify(header.slice(7), process.env.JWT_SECRET).userId;
    } catch {
      req.userId = null;
    }
  }
  next();
}

export { optionalAuth, requireAuth };
