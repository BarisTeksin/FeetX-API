import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../server.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Role, MediaType } from '@prisma/client';

const router = Router();

const createSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  isSecret: z.boolean().default(false),
  mediaUrl: z.string().url(),
  mediaType: z.nativeEnum(MediaType),
});

router.post('/', requireAuth, requireRole([Role.CREATOR, Role.ADMIN]), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { title, content, isSecret, mediaUrl, mediaType } = parsed.data;
  const post = await prisma.post.create({ data: { title, content, isSecret, mediaUrl, mediaType, authorId: req.user!.id } });
  return res.status(201).json(post);
});

router.get('/', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const { cursor, take } = z
    .object({
      cursor: z.string().cuid().optional(),
      take: z.coerce.number().int().min(1).max(50).optional(),
    })
    .parse(req.query);
  const limit = take ?? 20;
  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { isSecret: false },
        {
          AND: [
            { isSecret: true },
            {
              author: {
                followers: {
                  some: { followerId: userId },
                },
              },
            },
          ],
        },
      ],
    },
    include: { author: { select: { id: true, username: true, role: true } } },
    orderBy: { id: 'desc' },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
  return res.json({ data: posts, nextCursor: posts.length === limit ? posts[posts.length - 1]?.id : null });
});

router.get('/user/:userId', requireAuth, async (req, res) => {
  const viewerId = req.user!.id;
  const { userId } = z.object({ userId: z.string().cuid() }).parse(req.params);
  const { cursor, take } = z
    .object({
      cursor: z.string().cuid().optional(),
      take: z.coerce.number().int().min(1).max(50).optional(),
    })
    .parse(req.query);
  const limit = take ?? 20;
  const posts = await prisma.post.findMany({
    where: {
      authorId: userId,
      OR: [
        { isSecret: false },
        {
          AND: [
            { isSecret: true },
            { author: { followers: { some: { followerId: viewerId } } } },
          ],
        },
      ],
    },
    orderBy: { id: 'desc' },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
  return res.json({ data: posts, nextCursor: posts.length === limit ? posts[posts.length - 1]?.id : null });
});

router.get('/:postId', requireAuth, async (req, res) => {
  const viewerId = req.user!.id;
  const { postId } = z.object({ postId: z.string().cuid() }).parse(req.params);
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { author: true },
  });
  if (!post) return res.status(404).json({ error: 'Not found' });
  if (post.isSecret && post.authorId !== viewerId) {
    const follows = await prisma.follow.findFirst({ where: { followerId: viewerId, creatorId: post.authorId } });
    if (!follows) return res.status(403).json({ error: 'Forbidden' });
  }
  return res.json(post);
});

router.delete('/:postId', requireAuth, async (req, res) => {
  const { postId } = z.object({ postId: z.string().cuid() }).parse(req.params);
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return res.status(404).json({ error: 'Not found' });
  if (post.authorId !== req.user!.id && req.user!.role !== Role.ADMIN) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await prisma.post.delete({ where: { id: postId } });
  return res.json({ ok: true });
});

export default router;


