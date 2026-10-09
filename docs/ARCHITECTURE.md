# Phase 2 – Architecture

```
Browser (React SPA) ──► services/api.js ──► Express REST API ──► Mongoose ──► MongoDB
        ▲                                         │
        └────────────── JSON response ◄───────────┘
```
Mirrors the report's flow: User → Web Interface → Web Logic → Database → Response.

## Roles
| Role | Can do |
|---|---|
| Visitor | Browse public pages, send contact message, register for events |
| Student | + profile, own registrations, submit projects, view status |
| Faculty | + submit notices/resources (pending approval), manage permitted projects |
| Admin | Full CRUD on all modules, approvals, users and roles |

## Collections (planned for backend phase)
User, Faculty (report: name, qualification, designation, email + specialization, experience), Course (report: name, duration, description), Laboratory, Notice (title, description, date + category, pinned), Event, EventRegistration (unique event+email), Achievement/StudentProject (approval status), AcademicResource, ContactMessage.

## Frontend structure
`client/src/{components,layouts,pages,context,services,data,utils}`. Public layout and an admin layout with sidebar; routes guarded by role.

## Data source modes
`VITE_USE_MOCK=false` (default) calls the real API at `VITE_API_URL`. `VITE_USE_MOCK=true` serves clearly labelled **demo data** held in browser memory so the UI can be previewed before the backend exists; a banner is shown whenever it is on, and nothing is persisted.
