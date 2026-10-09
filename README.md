# College Department Website — Electronics & Computer Engineering


## Project status (read this first)

| Part | Status |
|---|---|
| **Frontend** (`client/`) — React + Vite + Tailwind | ✅ Built. Production build succeeds; 10 automated tests pass (Vitest + React Testing Library). |
| Demo mode (in-browser sample data) | ✅ Works, so the UI can be demonstrated without a backend. Nothing is saved; data resets on reload. |
| **Backend** (`server/` — Express, SQLite/libSQL, JWT, uploads) | ✅ Implemented; SQLite runs locally, hosted SQL is required for production. |
| File/image uploads | ✅ API route implemented with content checks; forms can be connected as a follow-up. |
| Real authentication, CSRF, rate limiting, Helmet | ✅ Implemented for real API mode. Demo-mode logins remain browser-only. |
| Backend tests and seed scripts | ✅ Added; tests use isolated in-memory SQLite. |

Nothing in demo mode is official college data. Items marked **Sample** are placeholders. Department contact details shown on the site are the address, email and phone supplied for this project.

## Run the frontend (Windows + VS Code)
1. Install Node.js 20+ from nodejs.org.
2. Open the `client` folder in VS Code, then a terminal:
```
npm install
copy .env.example .env
npm run dev
```
3. Open http://localhost:5173.
4. Demo logins (shown on the Login page): `admin@demo.local / demo-admin`, `faculty@demo.local / demo-faculty`, `student@demo.local / demo-student`.

Other commands: `npm test` (tests), `npm run build` (production build).

### Switching to the real backend
In `client/.env` set `VITE_USE_MOCK=false` and `VITE_API_URL=http://localhost:5000/api`. Authentication will use an HTTP-only cookie; the frontend never stores tokens in localStorage.

See [`server/README.md`](server/README.md) for local SQLite setup, Turso production deployment, admin seeding, backend tests, uploads, and security notes.

### Vercel preview deployment
The `client/vercel.json` configuration keeps the frontend in demo mode until the API is connected to a persistent hosted SQL database. Demo data is in-memory and is not saved. To use real accounts and persistent data, configure Turso credentials on the server's Vercel project, verify the API health check reports a connected database, then set the frontend Production variables `VITE_USE_MOCK=false` and `VITE_API_URL` to the API origin plus `/api` and redeploy.

## What the frontend contains
- **Public pages:** Home, About, Faculty (search, filter, profile pages), Academics (courses, laboratories, study material), Notices (search, category filter, pagination, pinned), Events (upcoming/past, registration form, duplicate prevention in demo), Student Corner (projects, achievements, resources, links), Contact (validated form), Login.
- **Admin dashboard** (`/admin`, admin and faculty roles): live stat tiles, Recharts charts, recent activity, and full add/edit/delete tables with search, filter, pagination and confirm dialogs for Faculty, Courses, Laboratories, Notices, Events, Registrations, Projects & Achievements (approve/reject), Resources, Messages, Users & Roles.
- **Portal** (`/portal`): project/achievement submission, submission status, announcements, events, resources.
- **UI:** responsive navbar, dark/light mode (saved), toasts, loading skeletons, empty and error states, back-to-top, keyboard-accessible dialogs, skip link.
- Role checks are in the UI **and** simulated in demo mode; the real enforcement will be in the backend.

## Mapping to the report
Faculty / Course / Notice tables (4.2) → pages and admin modules; Add Faculty, Notice and Event algorithms (5.2, 5.4) → admin forms with validate → store → success toast; Search algorithm (5.3) → search boxes; Laboratories and Achievements (1.4, 9.1) → Academics and Student Corner; Student/faculty/role-based login (7.3 future scope) → implemented as enhancements.

## API contract the frontend expects (to be implemented in `server/`)
Response shape: `{ success, data, meta?: { page, limit, total, pages }, message?, errors?: { field: message } }`

`POST /auth/login` · `POST /auth/logout` · `GET /auth/me` · `GET|POST /{faculty,courses,labs,notices,events,projects,resources}` · `GET|PUT|DELETE /{resource}/:id` · `POST /events/:id/register` · `GET|DELETE /registrations` · `POST /contact` · `GET|PUT|DELETE /messages` · `GET|POST|PUT|DELETE /users` · `GET /dashboard/stats` · `GET /dashboard/public-stats`.
List queries accept `q, page, limit, sort` plus filters (`category, designation, type, status, role, upcoming`).

## Known limitations
- Upload endpoints are implemented; the faculty, event, notice, resource, and project forms still need file-input integration.
- Faculty photos use initials until a profile photo is uploaded and rendered by the client.
- A map is not displayed; the supplied contact address is shown on the Contact page and in the footer.
- The report's **cover page** is titled "Online Library Management System using Java Servlet and MySQL", which contradicts the rest of the report. Please fix it.
- Not visually checked in a real browser in this environment (no browser available); layout was verified only through the build and DOM-level tests. Please review it in Chrome and report anything that looks off.

## Documents
`docs/REQUIREMENTS.md` (Phase 1) and `docs/ARCHITECTURE.md` (Phase 2).
