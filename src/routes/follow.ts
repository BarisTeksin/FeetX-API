import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../server.js';
import { requireAuth } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

const targetSchema = z.object({ targetUserId: z.string().cuid() });

router.post('/follow', requireAuth, async (req, res) => {
  const parsed = targetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { targetUserId } = parsed.data;
  if (req.user!.id === targetUserId) return res.status(400).json({ error: 'Cannot follow yourself' });
  const creator = await prisma.user.findUnique({ where: { id: targetUserId, role: { in: [Role.CREATOR, Role.ADMIN] } }, select: { role: true } });
  if (!creator) return res.status(404).json({ error: 'User not found' });
  if (!([Role.CREATOR, Role.ADMIN] as Role[]).includes(creator.role)) {
    return res.status(400).json({ error: 'Target is not a content creator' });
  }
  try {
    const follow = await prisma.follow.create({ data: { followerId: req.user!.id, creatorId: targetUserId } });
    return res.status(201).json(follow);
  } catch (e) {
    return res.status(409).json({ error: 'Already following' });
  }
});

router.post('/unfollow', requireAuth, async (req, res) => {
  const parsed = targetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { targetUserId } = parsed.data;
  await prisma.follow.deleteMany({ where: { followerId: req.user!.id, creatorId: targetUserId } });
  return res.json({ ok: true });
});

// List followers of a user
router.get('/followers/:userId', requireAuth, async (req, res) => {
  const { userId } = z.object({ userId: z.string().cuid() }).parse(req.params);
  const { cursor, take } = z
    .object({ cursor: z.string().cuid().optional(), take: z.coerce.number().int().min(1).max(50).optional() })
    .parse(req.query);
  const limit = take ?? 20;
  const followers = await prisma.follow.findMany({
    where: { creatorId: userId },
    include: { follower: { select: { id: true, username: true, role: true } } },
    orderBy: { id: 'desc' },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
  return res.json({ data: followers.map(f => f.follower), nextCursor: followers.length === limit ? followers[followers.length - 1]?.id : null });
});

// List following (creators) of a user
router.get('/following/:userId', requireAuth, async (req, res) => {
  const { userId } = z.object({ userId: z.string().cuid() }).parse(req.params);
  const { cursor, take } = z
    .object({ cursor: z.string().cuid().optional(), take: z.coerce.number().int().min(1).max(50).optional() })
    .parse(req.query);
  const limit = take ?? 20;
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    include: { creator: { select: { id: true, username: true, role: true } } },
    orderBy: { id: 'desc' },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
  return res.json({ data: following.map(f => f.creator), nextCursor: following.length === limit ? following[following.length - 1]?.id : null });
});

// Check follow status
router.get('/status/:targetUserId', requireAuth, async (req, res) => {
  const { targetUserId } = z.object({ targetUserId: z.string().cuid() }).parse(req.params);
  const exists = await prisma.follow.findFirst({ where: { followerId: req.user!.id, creatorId: targetUserId } });
  return res.json({ following: Boolean(exists) });
});

export default router;


