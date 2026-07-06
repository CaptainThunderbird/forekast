const express = require('express');
const router = express.Router();
const prisma = require('./prisma'); // Points to your Prisma Client instance

/**
 * 1. POST A TWEET
 * Replaces: self.tweetMap[userId].append(tweetId)
 */
router.post('/post', async (req, res) => {
  const { userId, content } = req.body;

  if (!userId || !content) {
    return res.status(400).json({ error: "userId and content are required fields." });
  }

  try {
    const newTweet = await prisma.tweet.create({
      data: {
        userId: parseInt(userId),
        content: content
      },
      include: {
        user: {
          select: { username: true } // Automatically grab the author's handle
        }
      }
    });
    return res.status(201).json(newTweet);
  } catch (error) {
    console.error("Error creating tweet:", error);
    return res.status(500).json({ error: "Failed to post tweet to database." });
  }
});

/**
 * 2. GET NEWS FEED (Top 10 Most Recent)
 * Replaces: Min-Heap / Merge K Sorted Lists algorithm
 */
router.get('/feed/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    // Step A: Find everyone this user follows
    const followingRelations = await prisma.follows.findMany({
      where: { followerId: userId },
      select: { followeeId: true }
    });

    // Step B: Map down to an array of integers and include the user's own ID
    const authorIds = followingRelations.map(rel => rel.followeeId);
    authorIds.push(userId); 

    // Step C: Single database lookup replacing the manual sorting heap
    const newsFeed = await prisma.tweet.findMany({
      where: {
        userId: { in: authorIds }
      },
      orderBy: {
        createdAt: 'desc' // Pulls newest tweets first natively
      },
      take: 10, // Max limit constraint
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    return res.json(newsFeed);
  } catch (error) {
    console.error("Error fetching news feed:", error);
    return res.status(500).json({ error: "Could not retrieve feed data." });
  }
});

module.exports = router;