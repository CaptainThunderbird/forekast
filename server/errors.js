export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function handleError(error, _req, res, _next) {
  console.error(error);

  if (error?.code === 'P2002') {
    return res.status(409).json({ error: 'That value is already in use' });
  }

  res.status(500).json({ error: 'An unexpected server error occurred' });
}
