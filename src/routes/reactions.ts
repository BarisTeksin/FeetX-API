import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../server.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const postIdSchema = z.object({ postId: z.string().cuid() });

router.post('/like', requireAuth, async (req, res) => {
  const parsed = postIdSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { postId } = parsed.data;
  // Enforce secret post access for reactions
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.isSecret && post.authorId !== req.user!.id) {
    const follows = await prisma.follow.findFirst({ where: { followerId: req.user!.id, creatorId: post.authorId } });
    if (!follows) return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const like = await prisma.like.create({ data: { postId, userId: req.user!.id } });
    return res.status(201).json(like);
  } catch {
    return res.status(409).json({ error: 'Already liked' });
  }
});

router.post('/unlike', requireAuth, async (req, res) => {
  const parsed = postIdSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { postId } = parsed.data;
  await prisma.like.deleteMany({ where: { postId, userId: req.user!.id } });
  return res.json({ ok: true });
});

router.post('/save', requireAuth, async (req, res) => {
  const parsed = postIdSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { postId } = parsed.data;
  // Enforce secret post access for reactions
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.isSecret && post.authorId !== req.user!.id) {
    const follows = await prisma.follow.findFirst({ where: { followerId: req.user!.id, creatorId: post.authorId } });
    if (!follows) return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const save = await prisma.save.create({ data: { postId, userId: req.user!.id } });
    return res.status(201).json(save);
  } catch {
    return res.status(409).json({ error: 'Already saved' });
  }
});

router.post('/unsave', requireAuth, async (req, res) => {
  const parsed = postIdSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { postId } = parsed.data;
  await prisma.save.deleteMany({ where: { postId, userId: req.user!.id } });
  return res.json({ ok: true });
});

export default router;


