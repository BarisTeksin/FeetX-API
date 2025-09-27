# FeetX API

## Setup

1. Ensure PostgreSQL is running and create a database named `feetx-cursor` (or update `DATABASE_URL` in `.env`).
2. Install deps:

```
npm install
```

3. Generate Prisma client and create migration:

```
npx prisma migrate dev --name init
```

4. Start dev server:

```
npm run dev
```

## Environment

- `PORT` (default 4000)
- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET` (required)

## Auth

- POST `/auth/register` { email, username, password, role? }
- POST `/auth/login` { emailOrUsername, password }

## Follows

- POST `/follows/follow` { targetUserId } (auth)
- POST `/follows/unfollow` { targetUserId } (auth)

## Posts

- POST `/posts` { title, content, isSecret } (creator/admin only)
- GET `/posts` (auth) – public + followed creators' secret posts
- GET `/posts/user/:userId` (auth) – respects secret visibility
- GET `/posts/:postId` (auth) – respects secret visibility
- DELETE `/posts/:postId` (author or admin)

## Reactions

- POST `/reactions/like` { postId } (auth)
- POST `/reactions/unlike` { postId } (auth)
- POST `/reactions/save` { postId } (auth)
- POST `/reactions/unsave` { postId } (auth)
