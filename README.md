# Forekast

Forekast is a small social forecasting app built with React, Express, PostgreSQL, and Prisma.

## Run it locally

1. Copy `.env.example` to `server/.env`.
2. Replace `DATABASE_URL` with your PostgreSQL connection string and set a long, random `JWT_SECRET`.
3. In one terminal:

   ```powershell
   cd server
   npm install
   npm run generate
   npx prisma migrate dev --schema=schema.prisma --name init
   npm run dev
   ```

4. In a second terminal:

   ```powershell
   cd client
   npm install
   npm run dev
   ```

5. Open `http://localhost:5173`.

The API runs on `http://localhost:5001` by default. Set `VITE_API_URL` in
`client/.env` if the API is hosted somewhere else.

## Available features

- Create an account and sign in
- Publish forecasts up to 280 characters
- View the public timeline
- View a personal feed containing your posts and posts from followed users

The database already supports likes and follows; controls for those are a good
next feature.
