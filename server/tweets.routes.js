const express = require('express');
const prisma = require('./prisma');
const { requireAuth } = require('./auth');

const router = express.Router();

// Public timeline. This also gives a new user something useful to see.
router.get('/', async (_req, res) => {
  try {
    const tweets = await prisma.tweet.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, username: true } },
        _count: { select: { likes: true } },
      },
    });
    res.json(tweets);
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

    const tweets = await prisma.tweet.findMany({
      where: { userId: { in: authorIds } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, username: true } },
        _count: { select: { likes: true } },
      },
    });
    res.json(tweets);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Could not retrieve your feed' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

  if (!content || content.length > 280) {
    return res.status(400).json({ error: 'Posts must contain between 1 and 280 characters' });
  }

  try {
    const tweet = await prisma.tweet.create({
      data: { userId: req.userId, content },
      include: {
        user: { select: { id: true, username: true } },
        _count: { select: { likes: true } },
      },
    });
    res.status(201).json(tweet);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Could not publish your post' });
  }
});

module.exports = router;
