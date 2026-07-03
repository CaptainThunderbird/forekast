const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/tweets — create a tweet (requires login)
router.post('/', requireAuth, async (req, res) => {
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Tweet content cannot be empty' });
  }

  if (content.length > 280) {
    return res.status(400).json({ error: 'Tweet content cannot exceed 280 characters' });
  }

  try {
    const tweet = await prisma.tweet.create({
      data: {
        content,
        userId: req.userId, // set by requireAuth middleware from the JWT
      },
      include: {
        user: { select: { id: true, username: true } },
      },
    });

    res.status(201).json(tweet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong creating your tweet' });
  }
});

// GET /api/tweets — fetch the feed (public, no login required)
router.get('/', async (req, res) => {
  // Basic pagination so the feed doesn't try to load entire
  // table at once as the app grows
  const take = Math.min(parseInt(req.query.limit) || 20, 50);
  const cursor = req.query.cursor; // tweet id to start after

  try {
    const tweets = await prisma.tweet.findMany({
      take,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true } },
        _count: { select: { likes: true } },
      },
    });

    const nextCursor = tweets.length === take ? tweets[tweets.length - 1].id : null;

    res.json({ tweets, nextCursor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching the feed' });
  }
});

module.exports = router;
