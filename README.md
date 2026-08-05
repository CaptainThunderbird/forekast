# Forekast

**Make the call. Set the date.** Publish a clear prediction, set the date
when it can be checked, discuss it, and return to record what happened.

[![Open the live demo](https://img.shields.io/badge/OPEN_LIVE_DEMO-ED6B4E?style=for-the-badge&logo=render&logoColor=white)](https://forekast-lca2.onrender.com)
[![API status](https://img.shields.io/badge/API_STATUS-173F35?style=for-the-badge)](https://forekast-api.onrender.com/api/health)

[![Forekast's logged-out landing page with its account access panel](docs/forekast-live-demo.png)](https://forekast-lca2.onrender.com)

_The live logged-out experience. Select the image to open the deployed app._

Forekast combines a compact social feed with structured categories, target
dates, discussion, reposts, evidence-backed resolution, and public accuracy
records. For the reasoning behind the implementation, see the
[project plan](docs/PROJECT_PLAN.md), [roadmap](docs/ROADMAP.md), and
[technical architecture](docs/ARCHITECTURE.md).

## The problem

Online predictions are usually scattered through posts and conversations. They
often omit a deadline, become difficult to find later, and rarely record a
clear outcome. That makes it hard to distinguish a useful prediction from a
confident-sounding opinion.

Forekast gives each prediction a testable statement, category, target date, and
eventual status. The product keeps the social behavior people already
understand—profiles, comments, signals, follows, and reposts—while making the
prediction itself easier to revisit and evaluate.

## Intended users

- People who enjoy making and discussing predictions
- Students and communities following technology, business, politics, science,
  sports, culture, fiction, books, television, and movies
- Writers or researchers who want a public record of dated claims
- Small beta communities studying what makes predictions useful and testable

Forekast is currently a controlled-beta MVP. It is not a financial-advice
platform, betting product, or authoritative fact-checking service.

## Features

- Account registration and sign-in
- Structured forekasts with a 280-character statement, optional reasoning,
  category, and future target date
- Public timeline with category and status filters
- Signals, comments, reposts, and follow/unfollow
- Public profiles with biography, profile picture, activity, and accuracy
- Author-controlled outcome resolution with explanation and optional evidence
- Owner-only deletion of unresolved forekasts
- Responsive layouts for phone, tablet, and desktop
- Keyboard-accessible controls and Escape-to-close dialogs
- Privacy-limited server analytics for beta activation and engagement

## Technical overview

```text
React + Vite client
        |
        | HTTPS JSON requests with a bearer JWT
        v
Express API
        |
        | Prisma queries and transactions
        v
PostgreSQL
```

The client is a single-page React application. The API owns validation,
authentication, authorization, product rules, and analytics. PostgreSQL is the
source of truth for all durable account and product data.

### Important technical decisions

| Decision | Reason |
|---|---|
| Modular monolith | One client, API, and database are easier to understand and operate during beta |
| REST with JSON | Fits the resource-oriented flows and keeps debugging straightforward |
| PostgreSQL | Relations and transactions fit follows, comments, outcomes, and accuracy calculations |
| Prisma | Provides typed database access and committed schema migrations |
| Zod at the API boundary | Invalid input is rejected before database work |
| JWT bearer authentication | Keeps the client/API deployment independent while the product is small |
| Derived accuracy | Avoids maintaining a counter that could disagree with resolved records |
| Server-side analytics | Records completed actions more reliably than browser-only events |
| Build-time client API URL | Lets the same frontend source target local or hosted APIs |

## Code guide

### Repository root

- `package.json` provides commands that coordinate the client and server.
- `render.yaml` defines the two Render services, health check, migration step,
  environment-variable wiring, and single-page-app rewrite.
- `.github/workflows/ci.yml` installs both applications, generates Prisma,
  runs tests and lint, and verifies a production build.
- `docs/` contains the project plan, roadmap, and deeper architecture notes.

### Client

- `client/src/main.jsx` mounts React into the HTML page.
- `client/src/App.jsx` is the application coordinator. It owns the current
  session, browser path, API requests, timeline state, composer state, dialogs,
  and the actions passed to page components.
- `client/src/FeedPage.jsx` renders navigation, the compact composer, filters,
  timeline cards, engagement controls, forekast details, and comments.
- `client/src/ProfilePage.jsx` renders public profile information, profile
  editing, statistics, and chronological activity.
- `client/src/lib/categories.js` is the single source of truth for category
  values and user-facing labels.
- `client/src/App.css` contains the shared responsive design system and page
  styling.
- `client/src/index.css` provides base document and typography rules.

### Server

- `server/index.js` creates the Express application, applies security and
  parsing middleware, mounts route modules, and starts the HTTP listener.
- `server/auth.js` reads and verifies bearer tokens. It exposes required and
  optional authentication middleware.
- `server/auth.routes.js` registers users, hashes passwords, signs tokens, and
  logs successful authentication events.
- `server/forecasts.routes.js` handles timelines, forekast CRUD, resolution,
  signals, comments, and reposts. Ownership rules and multi-record
  transactions live here.
- `server/users.routes.js` handles profile reads/updates and follow
  relationships. It also derives status totals and accuracy.
- `server/validation.js` defines every accepted request shape and its limits.
- `server/analytics.js` contains the small allowlist of permitted beta events.
  It cannot accept arbitrary event names or product content.
- `server/prisma.js` creates the database client using `DATABASE_URL`.
- `server/schema.prisma` is the authoritative data model.
- `server/migrations/` contains ordered, reviewable SQL changes.
- `server/errors.js` provides consistent not-found and unexpected-error
  responses.
- `server/tests/api-contract.test.js` checks the public HTTP contract,
  authorization boundaries, validation rules, and analytics vocabulary.

### How a major request moves through the code

Creating a forekast is representative:

1. `FeedPage.jsx` collects the statement, reasoning, category, and target date.
2. `App.jsx` sends `POST /api/forecasts` with the stored bearer token.
3. `auth.js` verifies the token and supplies the user ID.
4. `validation.js` rejects malformed or out-of-range values.
5. `forecasts.routes.js` creates the forekast and its analytics event in one
   transaction.
6. Prisma writes both records to PostgreSQL.
7. The returned forekast is inserted into React state and appears immediately.

The server remains authoritative even when the client disables an invalid
button. Client checks improve usability; server checks provide security.

## Data model

The central records are:

- `User`: identity, password hash, biography, and profile picture
- `Forecast`: statement, reasoning, category, dates, and status
- `Resolution`: one recorded outcome for one forekast
- `Comment`: a user's reply to a forekast
- `Signal`: a user's lightweight endorsement
- `Repost`: a user's repost relationship
- `Follow`: the directed relationship between two users
- `AnalyticsEvent`: an allowlisted event name and optional record identifiers

`Forecast` maps to the historical `tweets` database table and `Signal` maps to
`likes`. Those table names are retained to avoid a risky cosmetic migration
during beta.

## Local development

### Requirements

- Node.js 24
- PostgreSQL 13 or newer

### Environment

Copy `server/.env.example` to `server/.env`:

```env
DATABASE_URL="postgresql://user:password@127.0.0.1:5432/forekast"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=5001
CLIENT_URL="http://localhost:5173"
```

The hosted URL belongs only in Render. Never commit `server/.env`,
`client/.env`, database credentials, or JWT secrets.

To use a non-local API during client development, create `client/.env`:

```env
VITE_API_URL="https://your-api.example/api"
```

### Install and prepare

```powershell
npm install
npm --prefix client install
npm --prefix server install
npm --prefix server run generate
npm --prefix server run migrate:deploy
```

### Run

Start the API:

```powershell
npm run dev:server
```

Start the client in another terminal:

```powershell
npm run dev:client
```

Open `http://localhost:5173`.

## Tests and quality checks

Run everything:

```powershell
npm run validate
```

This runs:

1. Server tests (contract tests locally, plus the database integration test in CI)
2. Client ESLint checks
3. Client production build

Useful individual commands:

```powershell
npm test
npm run lint
npm run build
npm --prefix server run validate
```

Contract tests cover the public HTTP boundary without database writes. CI also
starts an isolated PostgreSQL service and runs a database-backed registration
and forekast-creation test, verifying that the forekast and its analytics event
are committed together. The database test is skipped by default for local runs
unless `RUN_DATABASE_INTEGRATION_TESTS=true` and a disposable database is
available.

## Deployment

Forekast uses:

- Render Static Site for `client/`
- Render Web Service for `server/`
- Render PostgreSQL for durable data

`render.yaml` documents the expected service configuration. Existing services
can be synchronized with it after confirming that their Render names match.

Required API environment variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Render PostgreSQL internal connection URL |
| `JWT_SECRET` | Long random token-signing secret |
| `CLIENT_URL` | Exact public client origin, without a trailing slash |

Required client build variable:

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Public API base URL ending in `/api` |

The release sequence is:

1. CI passes.
2. Render builds the API and generates Prisma.
3. The pre-deploy command applies pending migrations.
4. Render starts the API and checks `/api/health`.
5. Render builds and publishes the static client.
6. The rewrite `/* -> /index.html` keeps `/feed` and `/profile/:username`
   available on direct visits.

After deployment, test registration, login, timeline loading, one controlled
write, profile persistence, and a direct `/feed` visit.

Render configuration follows the official
[Blueprint specification](https://render.com/docs/blueprint-spec) and
[static rewrite guidance](https://render.com/docs/redirects-rewrites).

## Privacy and security boundaries

- Passwords are hashed with bcrypt and never returned.
- JWTs expire after seven days.
- Protected actions require server-verified identity.
- Ownership rules are enforced on the server.
- Zod limits text, URLs, dates, categories, and image data.
- Authentication endpoints are rate-limited.
- Helmet and explicit CORS settings reduce common web exposure.
- Analytics never store email addresses, passwords, tokens, forekast text,
  comments, or arbitrary request bodies.

Before a broad public launch, add password reset, email verification, account
deletion, moderation/reporting, dependency scanning, monitored backups, and a
documented secret-rotation process.

## Challenges and lessons

### Safe database evolution

The product gained profiles, image data, categories, comments, reposts, and
analytics after the initial schema. Each change required an additive migration
that existing hosted data could survive. Deployment must run migrations before
new server code starts using the new columns or tables.

### Static-site routing

`/feed` and `/profile/:username` are client routes, but Render initially looks
for physical files at those paths. The deployment therefore needs a rewrite to
`/index.html`.

### Windows development and Linux deployment

Committing `node_modules` caused Render to encounter Windows-generated
executables. Dependencies are now ignored and installed fresh on each target
platform.

### Durable data versus visible data

A narrower personalized feed once made saved forekasts appear missing even
though PostgreSQL still contained them. The database is the source of truth,
and empty/loading/filter states must not imply deletion.

### Keeping the vocabulary coherent

Internal APIs and the Prisma model retain `Forecast` for stability, while the
product consistently presents the brand spelling “forekast.” Centralized
category metadata prevents similar label drift.

## Future improvements

Work should remain evidence-driven and incremental:

1. Expand database-backed integration coverage to commenting, reposting, and
   resolution flows
2. Cursor pagination for timelines and profile activity
3. Clear loading, retry, offline, and expired-session states
4. Password reset and email verification
5. Moderation, reporting, and account deletion
6. Structured logs, request IDs, and hosted error monitoring
7. Database backups with a documented restore test
8. Notification or reminder support only if beta evidence shows users forget
   to resolve forekasts
9. Accessibility testing with keyboard, screen reader, zoom, and contrast tools

Add one meaningful feature at a time. Each addition should include its server
rules, migration when needed, tests, deployment impact, and documentation.
