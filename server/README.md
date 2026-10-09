# College Department API

Express 5 API for the React client. Requires Node.js 20+ and MongoDB 6+.

## Local setup

```powershell
cd server
npm install
Copy-Item .env.example .env
```

Set a random `JWT_SECRET` of at least 32 characters and configure `MONGO_URI` in `.env`. Start MongoDB Community Server locally or use a MongoDB Atlas URI, then run:

```powershell
npm run seed:admin
npm run dev
```

Provide `ADMIN_EMAIL` and `ADMIN_PASSWORD` (minimum 12 characters) in the environment before `seed:admin`. The API listens on `http://localhost:5000`; health check: `GET /api/health`. Configure the client with `VITE_USE_MOCK=false` and `VITE_API_URL=http://localhost:5000/api`.

`npm run seed:demo` inserts clearly marked sample records and local demo accounts. It refuses to run in production or on a non-empty database. Demo passwords are for local development only.

Students can request an account from the sign-in page. New self-registered accounts are pending and cannot sign in until an administrator approves them under **Users & Roles**. Admin-created accounts are approved immediately and receive their initial password through the admin form. To update the local administrator password, change `ADMIN_PASSWORD` in `.env` and run `npm run admin:password`.

## Tests

`npm test` uses `mongodb-memory-server`. If the sandbox cannot download its MongoDB binary, set `MONGO_URI_TEST` to a disposable test database before running tests. Tests drop that database before each case.

## Security and storage notes

Authentication is a two-hour HS256 HTTP-only cookie; the client obtains a double-submit CSRF token from `GET /api/auth/csrf`. Production cross-site deployments require `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`, and exact frontend origins in `CLIENT_ORIGINS`.

Uploads are locally stored under `uploads/`, with content-based type checks and generated filenames. Local disk is not persistent on many free hosting platforms; attach a persistent disk or replace the storage adapter before deployment. Uploads are not backed up or scanned for malware by this local implementation.

Before deployment, run `npm audit`, use HTTPS, configure an exact CORS allow-list, rotate secrets, and use a persistent MongoDB deployment. The API intentionally has no public account registration.