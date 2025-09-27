import { PrismaClient, Role, MediaType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Passw0rd!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const creator1 = await prisma.user.upsert({
    where: { email: 'creator1@example.com' },
    update: {},
    create: {
      email: 'creator1@example.com',
      username: 'creator1',
      passwordHash,
      role: Role.CREATOR,
    },
  });

  const creator2 = await prisma.user.upsert({
    where: { email: 'creator2@example.com' },
    update: {},
    create: {
      email: 'creator2@example.com',
      username: 'creator2',
      passwordHash,
      role: Role.CREATOR,
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      email: 'user1@example.com',
      username: 'user1',
      passwordHash,
      role: Role.USER,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      email: 'user2@example.com',
      username: 'user2',
      passwordHash,
      role: Role.USER,
    },
  });

  // Follows
  await prisma.follow.upsert({
    where: { followerId_creatorId: { followerId: user1.id, creatorId: creator1.id } },
    update: {},
    create: { followerId: user1.id, creatorId: creator1.id },
  });
  await prisma.follow.upsert({
    where: { followerId_creatorId: { followerId: user2.id, creatorId: creator1.id } },
    update: {},
    create: { followerId: user2.id, creatorId: creator1.id },
  });
  await prisma.follow.upsert({
    where: { followerId_creatorId: { followerId: user2.id, creatorId: creator2.id } },
    update: {},
    create: { followerId: user2.id, creatorId: creator2.id },
  });

  // Posts
  const c1Public = await prisma.post.upsert({
    where: { id: 'seed-c1-public' },
    update: {},
    create: {
      id: 'seed-c1-public',
      title: 'Creator1 Public Post',
      content: 'Welcome to my public post!',
      isSecret: false,
      mediaUrl: 'https://via.placeholder.com/600x400.png',
      mediaType: MediaType.IMAGE,
      authorId: creator1.id,
    },
  });
  const c1Secret = await prisma.post.upsert({
    where: { id: 'seed-c1-secret' },
    update: {},
    create: {
      id: 'seed-c1-secret',
      title: 'Creator1 Secret Post',
      content: 'Only followers can see this.',
      isSecret: true,
      mediaUrl: 'https://example.com/secret-video.mp4',
      mediaType: MediaType.VIDEO,
      authorId: creator1.id,
    },
  });
  const c2Secret = await prisma.post.upsert({
    where: { id: 'seed-c2-secret' },
    update: {},
    create: {
      id: 'seed-c2-secret',
      title: 'Creator2 Secret Post',
      content: 'Exclusive content for followers.',
      isSecret: true,
      mediaUrl: 'https://via.placeholder.com/800x600.jpg',
      mediaType: MediaType.IMAGE,
      authorId: creator2.id,
    },
  });
  const c2Public = await prisma.post.upsert({
    where: { id: 'seed-c2-public' },
    update: {},
    create: {
      id: 'seed-c2-public',
      title: 'Creator2 Public Post',
      content: 'Another public post.',
      isSecret: false,
      mediaUrl: 'https://example.com/public-video.mp4',
      mediaType: MediaType.VIDEO,
      authorId: creator2.id,
    },
  });

  // Likes & Saves
  await prisma.like.upsert({
    where: { userId_postId: { userId: user1.id, postId: c1Public.id } },
    update: {},
    create: { userId: user1.id, postId: c1Public.id },
  });
  await prisma.save.upsert({
    where: { userId_postId: { userId: user2.id, postId: c2Public.id } },
    update: {},
    create: { userId: user2.id, postId: c2Public.id },
  });

  // Output credentials
  // eslint-disable-next-line no-console
  console.log('Seed complete. Login with:');
  console.log('creator1@example.com / Passw0rd!');
  console.log('creator2@example.com / Passw0rd!');
  console.log('user1@example.com / Passw0rd!');
  console.log('user2@example.com / Passw0rd!');
  console.log('admin@example.com / Passw0rd!');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


