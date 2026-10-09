# College Department API

Express 5 API for the React client. Requires Node.js 20+. Local development uses SQLite through libSQL; production uses a persistent hosted Turso/libSQL database.

## Local setup

```powershell
cd server
npm install
Copy-Item .env.example .env
npm run dev
```

SQLite is created automatically at `server/data/college.db`; no database service is needed. Set a private `JWT_SECRET` of at least 32 characters in `.env`. The API listens on `http://localhost:5000`; health check: `GET /api/health`. Configure the client with `VITE_USE_MOCK=false` and `VITE_API_URL=http://localhost:5000/api`.

To create an administrator, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (minimum 8 characters) in the environment and run `npm run seed:admin`. `npm run seed:demo` inserts marked sample records and demo accounts; it refuses to run in production or on a non-empty database. Demo passwords are for local use only.

Students can request an account from the sign-in page. New self-registered accounts are pending until an administrator approves them under **Users & Roles**. Admin-created accounts are approved immediately. To update an administrator password, set `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then run `npm run admin:password`.

## Tests

`npm test` runs API and SQL repository tests against an isolated in-memory SQLite database.

## Vercel and Turso deployment

Vercel runs the exported Express app from `index.js` as one function for all routes. SQLite files are local-development-only because Vercel's filesystem is ephemeral. Before deploying production, create a persistent Turso database and configure these Production variables in the `college-department-api` Vercel project:

- `NODE_ENV=production`
- `TURSO_DATABASE_URL` (Turso database URL)
- `TURSO_AUTH_TOKEN` (sensitive database token)
- `JWT_SECRET` (fresh random value, 32+ characters)

One way to create a Turso database is with its CLI: `turso auth login`, `turso db create college-department`, `turso db show --url college-department`, then `turso db tokens create college-department`. Add the returned URL and token to Vercel as Production variables; do not commit them or paste them into chat. The API creates its tables on first connection. Confirm `GET /api/health` reports `database: "connected"` before switching the frontend.

Deploy from `server/` with `vercel deploy --prod`. Keep `CLIENT_ORIGINS` restricted to the exact frontend origin. `COOKIE_SAMESITE=none` and `COOKIE_SECURE=true` are set for cross-site production cookies. Allow public access to the production API deployment in Vercel Deployment Protection so browser requests are not redirected to a login page.

After the API health check passes, set the frontend Production variables `VITE_API_URL` to the API origin and `VITE_USE_MOCK=false`, then redeploy the client. The client appends `/api` automatically. The first production administrator must be seeded against the hosted database with `npm run seed:admin` using `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `ADMIN_EMAIL`, and a strong `ADMIN_PASSWORD` in the local environment.

Uploads are stored under `/tmp` on Vercel and are ephemeral; use object storage for persistent production files. Authentication uses a two-hour HS256 HTTP-only cookie plus a double-submit CSRF token. The API intentionally has no public account registration without administrator approval.