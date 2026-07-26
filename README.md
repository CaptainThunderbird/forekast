# Forekast

Forekast is a social forecasting MVP. People publish testable predictions,
follow forecasters, signal useful forecasts, report outcomes with evidence, and
build a public accuracy record.

## MVP features

- Account registration and sign-in
- Structured forecasts with reasoning, category, and target date
- Public timeline and followed-user feed
- Category and status filters
- Public profiles and editable biographies
- Follow/unfollow and forecast signals
- Author-reported resolution with an optional evidence link
- Profile accuracy based on correct and incorrect resolved forecasts
- Owner-only deletion of open forecasts

## Local setup

You need Node.js and PostgreSQL.

1. Copy `server/.env.example` to `server/.env`.
2. Put your PostgreSQL connection string and a long random JWT secret in
   `server/.env`.
3. Install dependencies:

   ```powershell
   npm install
   npm --prefix client install
   npm --prefix server install
   ```

4. Create the database tables and generate the database client:

   ```powershell
   npm --prefix server run migrate:deploy
   npm --prefix server run generate
   ```

5. Start the API in one terminal:

   ```powershell
   npm run dev:server
   ```

6. Start the website in a second terminal:

   ```powershell
   npm run dev:client
   ```

7. Open `http://localhost:5173`.

The API runs at `http://localhost:5001`. For a remotely hosted API, create
`client/.env` and set `VITE_API_URL=https://your-api.example/api`.

## Verification

Run the complete local check:

```powershell
npm run validate
```

This runs the backend contract tests, frontend lint, and production build.

## Deployment checklist

- Use separate development and production PostgreSQL databases.
- Set `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, and `PORT` on the API host.
- Set `VITE_API_URL` before building the production frontend.
- Run `npm --prefix server run migrate:deploy` during deployment.
- Serve the frontend over HTTPS.
- Configure database backups and application error monitoring.

## Current boundary

The migration is ready, but it has not been applied to a real database in this
workspace because no `server/.env` credentials are present. Database-backed
registration, posting, following, signaling, and resolution should be exercised
after that connection is configured.
