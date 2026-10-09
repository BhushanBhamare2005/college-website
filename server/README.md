# College Department API

Express 5 API for the React client. Requires Node.js 20+ and MongoDB 6+.

## Local setup

```powershell
cd server
npm install
Copy-Item .env.example .env
```

Set a random `JWT_SECRET` of at least 32 characters and configure `MONGO_URI` in `.env`. For local development, use MongoDB Community Server; for deployment, use a MongoDB Atlas URI. Start the database, then run:

```powershell
npm run seed:admin
npm run dev
```

Provide `ADMIN_EMAIL` and `ADMIN_PASSWORD` (minimum 8 characters) in the environment before `seed:admin`. The API listens on `http://localhost:5000`; health check: `GET /api/health`. Configure the client with `VITE_USE_MOCK=false` and `VITE_API_URL=http://localhost:5000/api`.

`npm run seed:demo` inserts clearly marked sample records and local demo accounts. It refuses to run in production or on a non-empty database. Demo passwords are for local development only.

Students can request an account from the sign-in page. New self-registered accounts are pending and cannot sign in until an administrator approves them under **Users & Roles**. Admin-created accounts are approved immediately and receive their initial password through the admin form. To update the local administrator password, change `ADMIN_PASSWORD` in `.env` and run `npm run admin:password`.

## Tests

`npm test` uses `mongodb-memory-server`. If the sandbox cannot download its MongoDB binary, set `MONGO_URI_TEST` to a disposable test database before running tests. Tests drop that database before each case.

## Vercel API deployment

The Vercel function entrypoint is `api/[...path].js`; it exports the Express app and does not call `listen()`. Before deploying from the `server/` root, configure these Vercel Production environment variables: `NODE_ENV=production`, `MONGO_URI` (a public MongoDB Atlas connection string with database network access configured), and `JWT_SECRET` (at least 32 random characters). `CLIENT_ORIGINS`, `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`, and the temporary `/tmp` upload directory are set in `vercel.json`. Never use the local `127.0.0.1` database URI on Vercel. Local disk uploads are ephemeral on Vercel; use object storage for persistent production uploads.

### MongoDB Atlas setup

1. In Atlas, create a cluster and a dedicated database user for this application. Grant `readWrite` on the application database only; do not use an Atlas organization owner account in `MONGO_URI`.
2. Under **Network Access**, prefer a Vercel-supported static egress IP or private network configuration when available on the hosting plan. Atlas must allow the API's outbound connection. A temporary `0.0.0.0/0` rule permits connections from any IPv4 address and increases exposure; avoid it for production, and remove it immediately after a temporary connectivity diagnostic.
3. Choose **Connect → Drivers**, copy the SRV URI, replace the username/password/database placeholders locally, and put it into the ignored `server/.env` as `MONGO_URI`. Never commit or paste the URI into chat.
4. Add the same URI as the Vercel project's Production `MONGO_URI` secret. Set a fresh random `JWT_SECRET` (32+ characters) in Vercel; do not reuse the local secret.
5. Deploy the `server/` directory as its own Vercel project. Confirm `GET /api/health` reports `database: "connected"` before switching the client to it.

Deploy from this folder with `vercel deploy --prod`. In Vercel **Settings → Deployment Protection**, allow public access to the Production deployment so browser requests from the public frontend are not redirected to Vercel login; preview deployments can remain protected. The frontend's `VITE_API_URL` must then be set to the deployed API origin plus `/api`, and redeployed. Do not deploy or commit `.env` files.

## Security and storage notes

Authentication is a two-hour HS256 HTTP-only cookie; the client obtains a double-submit CSRF token from `GET /api/auth/csrf`. Production cross-site deployments require `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`, and exact frontend origins in `CLIENT_ORIGINS`.

Uploads are locally stored under `uploads/`, with content-based type checks and generated filenames. Local disk is not persistent on many free hosting platforms; attach a persistent disk or replace the storage adapter before deployment. Uploads are not backed up or scanned for malware by this local implementation.

Before deployment, run `npm audit`, use HTTPS, configure an exact CORS allow-list, rotate secrets, and use a persistent MongoDB deployment. The API intentionally has no public account registration.