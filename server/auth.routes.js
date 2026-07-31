import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from './prisma.js';
import { analyticsEventData, recordEvent } from './analytics.js';
import { loginSchema, registerSchema, validate } from './validation.js';

const router = express.Router();
const SALT_ROUNDS = 10;

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res) => {
  const { username, email, password } = req.validatedBody;

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: { username, email, passwordHash },
      // Never select passwordHash back out — keep it out of every response
        select: { id: true, username: true, email: true, bio: true, avatarUrl: true, createdAt: true },
      });
      await transaction.analyticsEvent.create({
        data: analyticsEventData('signup_completed', createdUser.id),
      });
      return createdUser;
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    // Prisma's unique constraint violation code
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Username or email already taken' });
    }
    throw err;
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.validatedBody;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Deliberately vague error to not reveal email to hackers
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await recordEvent(prisma, 'login_completed', user.id);

    res.json({
      user: { id: user.id, username: user.username, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl },
      token,
    });
  } catch (err) {
    throw err;
  }
});

export default router;
