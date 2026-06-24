# Twitter clone — backend (MVP)

## What's here
- `prisma/schema.prisma` — the database schema (Users, Tweets, Likes, Follows)
- `src/lib/prisma.js` — shared database client
- `src/middleware/auth.js` — JWT verification for protected routes
- `src/routes/auth.routes.js` — register & login
- `src/routes/tweets.routes.js` — create tweet & fetch feed
- `src/index.js` — server entry point

## Setup

1. Install Postgres locally (or use a free hosted one like Supabase/Neon/Railway).

2. Install dependencies:
   ```
   npm install
   ```

3. Edit `.env` — replace `DATABASE_URL` with your real Postgres connection
   string, and replace `JWT_SECRET` with a long random string (you can
   generate one with `openssl rand -base64 32`).

4. Run the migration — this reads `schema.prisma` and creates your tables:
   ```
   npx prisma migrate dev --name init
   ```

5. Start the server:
   ```
   npm run dev
   ```

   You should see `Server running on http://localhost:3000`.

## Test it (Milestone 1 — your original goal)

Register a user:
```
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"password123"}'
```

Copy the `token` from the response, then post a tweet:
```
curl -X POST http://localhost:3000/api/tweets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"content":"hello world"}'
```

Fetch the feed (no token needed):
```
curl http://localhost:3000/api/tweets
```

If that last command returns your tweet — you've hit Milestone 1.

## What's NOT built yet (on purpose)
Likes and follows are in the schema already, but there are no routes for
them yet — that's the next milestone once auth + posting + feed feel solid.
