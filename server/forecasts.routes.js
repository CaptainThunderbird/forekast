import express from 'express';
import prisma from './prisma.js';
import { optionalAuth, requireAuth } from './auth.js';
import { forecastSchema, resolutionSchema, validate } from './validation.js';

const router = express.Router();

// Public timeline. This also gives a new user something useful to see.
router.get('/', optionalAuth, async (_req, res) => {
  try {
    const where = {};
    if (_req.query.category) where.category = String(_req.query.category).toUpperCase();
    if (_req.query.status) where.status = String(_req.query.status).toUpperCase();

    const forecasts = await prisma.forecast.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, username: true } },
        _count: { select: { signals: true } },
        ...(_req.userId ? { signals: { where: { userId: _req.userId }, select: { id: true } } } : {}),
        resolution: true,
      },
    });
    res.json(forecasts);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Could not retrieve the timeline' });
  }
});

// Authenticated timeline: posts from the user and people they follow.
router.get('/feed', requireAuth, async (req, res) => {
  try {
    const following = await prisma.follow.findMany({
      where: { followerId: req.userId },
      select: { followingId: true },
    });
    const authorIds = [req.userId, ...following.map((item) => item.followingId)];

    const forecasts = await prisma.forecast.findMany({
      where: { userId: { in: authorIds } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, username: true } },
        _count: { select: { signals: true } },
        signals: { where: { userId: req.userId }, select: { id: true } },
        resolution: true,
      },
    });
    res.json(forecasts);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Could not retrieve your feed' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const forecast = await prisma.forecast.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, username: true, bio: true } },
        _count: { select: { signals: true } },
        ...(req.userId ? { signals: { where: { userId: req.userId }, select: { id: true } } } : {}),
        resolution: true,
      },
    });

    if (!forecast) return res.status(404).json({ error: 'Forecast not found' });
    res.json(forecast);
  } catch (error) {
    if (error?.code === 'P2023') return res.status(400).json({ error: 'Invalid forecast ID' });
    throw error;
  }
});

router.post('/', requireAuth, validate(forecastSchema), async (req, res) => {
  const { statement, reasoning, category, targetDate } = req.validatedBody;

  try {
    const forecast = await prisma.forecast.create({
      data: { userId: req.userId, statement, reasoning, category, targetDate },
      include: {
        user: { select: { id: true, username: true } },
        _count: { select: { signals: true } },
      },
    });
    res.status(201).json(forecast);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Could not publish your post' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const forecast = await prisma.forecast.findUnique({
    where: { id: req.params.id },
    select: { userId: true, status: true },
  });

  if (!forecast) return res.status(404).json({ error: 'Forecast not found' });
  if (forecast.userId !== req.userId) return res.status(403).json({ error: 'You can only delete your own forecasts' });
  if (forecast.status !== 'OPEN') return res.status(409).json({ error: 'Resolved forecasts cannot be deleted' });

  await prisma.forecast.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

router.post('/:id/resolve', requireAuth, validate(resolutionSchema), async (req, res) => {
  const forecast = await prisma.forecast.findUnique({
    where: { id: req.params.id },
    select: { id: true, userId: true, status: true, targetDate: true },
  });

  if (!forecast) return res.status(404).json({ error: 'Forecast not found' });
  if (forecast.userId !== req.userId) return res.status(403).json({ error: 'Only the author can resolve this forecast' });
  if (forecast.status !== 'OPEN') return res.status(409).json({ error: 'This forecast is already resolved' });
  if (forecast.targetDate && forecast.targetDate > new Date()) {
    return res.status(409).json({ error: 'This forecast cannot be resolved before its target date' });
  }

  const resolvedAt = new Date();
  const [resolution, updatedForecast] = await prisma.$transaction([
    prisma.resolution.create({
      data: { ...req.validatedBody, forecastId: forecast.id },
    }),
    prisma.forecast.update({
      where: { id: forecast.id },
      data: { status: req.validatedBody.result, resolvedAt },
      include: {
        user: { select: { id: true, username: true } },
        _count: { select: { signals: true } },
        resolution: true,
      },
    }),
  ]);

  res.status(201).json({ forecast: updatedForecast, resolution });
});

router.post('/:id/signal', requireAuth, async (req, res) => {
  const forecast = await prisma.forecast.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!forecast) return res.status(404).json({ error: 'Forecast not found' });

  await prisma.signal.upsert({
    where: { userId_forecastId: { userId: req.userId, forecastId: forecast.id } },
    update: {},
    create: { userId: req.userId, forecastId: forecast.id },
  });
  res.status(201).json({ signaled: true });
});

router.delete('/:id/signal', requireAuth, async (req, res) => {
  await prisma.signal.deleteMany({
    where: { userId: req.userId, forecastId: req.params.id },
  });
  res.status(204).send();
});

export default router;
