import express from 'express';
import prisma from './prisma.js';
import { optionalAuth, requireAuth } from './auth.js';
import { profileSchema, validate } from './validation.js';

const router = express.Router();

router.patch('/me', requireAuth, validate(profileSchema), async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { bio: req.validatedBody.bio },
    select: { id: true, username: true, email: true, bio: true, createdAt: true },
  });
  res.json(user);
});

router.get('/:username', optionalAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
    select: {
      id: true,
      username: true,
      bio: true,
      createdAt: true,
      _count: { select: { forecasts: true, followers: true, following: true } },
      forecasts: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { _count: { select: { signals: true } } },
      },
    },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  const statusCounts = await prisma.forecast.groupBy({
    by: ['status'],
    where: { userId: user.id },
    _count: { _all: true },
  });
  const trackRecord = Object.fromEntries(statusCounts.map((item) => [item.status, item._count._all]));
  const decided = (trackRecord.CORRECT || 0) + (trackRecord.INCORRECT || 0);
  const accuracy = decided ? Math.round(((trackRecord.CORRECT || 0) / decided) * 100) : null;

  const relationship = req.userId && req.userId !== user.id
    ? await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: req.userId, followingId: user.id } },
      })
    : null;

  res.json({ ...user, isFollowing: Boolean(relationship), trackRecord, accuracy });
});

router.post('/:id/follow', requireAuth, async (req, res) => {
  if (req.params.id === req.userId) {
    return res.status(400).json({ error: 'You cannot follow yourself' });
  }

  const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!target) return res.status(404).json({ error: 'User not found' });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: req.userId, followingId: target.id } },
    update: {},
    create: { followerId: req.userId, followingId: target.id },
  });
  res.status(201).json({ following: true });
});

router.delete('/:id/follow', requireAuth, async (req, res) => {
  await prisma.follow.deleteMany({
    where: { followerId: req.userId, followingId: req.params.id },
  });
  res.status(204).send();
});

export default router;
