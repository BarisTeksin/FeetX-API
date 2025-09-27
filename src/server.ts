import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

import authRouter from './routes/auth.js';
import followRouter from './routes/follow.js';
import postsRouter from './routes/posts.js';
import reactionsRouter from './routes/reactions.js';

// Validate environment
const EnvSchema = z.object({
  PORT: z.string().regex(/^\d+$/).optional(),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  CORS_ORIGINS: z.string().optional(), // comma separated
});
const env = EnvSchema.parse(process.env);

const app = express();
export const prisma = new PrismaClient();

app.use(helmet());
const allowedOrigins = env.CORS_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean);
app.use(cors(allowedOrigins && allowedOrigins.length > 0 ? { origin: allowedOrigins } : undefined));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/auth', authRouter);
app.use('/follows', followRouter);
app.use('/posts', postsRouter);
app.use('/reactions', reactionsRouter);

// 404 handler
app.use((_req, res) => {
  return res.status(404).json({ error: 'Not Found' });
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = env.PORT ? parseInt(env.PORT, 10) : 4000;
const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT}`);
});

// Graceful shutdown
const shutdown = async () => {
  // eslint-disable-next-line no-console
  console.log('Shutting down...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);


