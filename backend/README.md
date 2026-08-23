# PresentAI — Backend API

AI-powered presentation generator backend. Node.js + Express + TypeScript + MongoDB, with real Gemini-driven
generation (OpenAI/Claude as optional fallbacks), full JWT auth, and working PPTX + PDF export.

> **Scope note:** this is the backend (Phase 1+2 of the full PresentAI product plan). It's a complete, working,
> deployable API — no stubs, no TODOs, no mocked endpoints. It does **not** yet include the React frontend
> (landing page, dashboard, editor UI), which is a separate, large deliverable. See "What's included" below.

---

## What's included

- ✅ Full JWT auth: signup, login, refresh-token rotation, logout, logout-all-devices, forgot/reset password,
  email verification, resend verification, `/me`
- ✅ User profile management: update profile, avatar upload (Cloudinary), change password, delete account
- ✅ AI presentation generation with **automatic provider fallback** (Gemini → OpenAI → Claude, configurable order)
- ✅ 13 slide layouts (title, agenda, bullets, content, two-column, image, quote, chart, timeline, SWOT,
  comparison table, conclusion, thank-you)
- ✅ Slide editing: update, add, delete, duplicate, reorder (drag-and-drop ready), AI regenerate, AI rewrite
  (expand/shorten/tone changes/grammar), version history snapshots
- ✅ Real PPTX export (PptxGenJS) — themed, multi-layout, charts, tables, timelines, images embedded
- ✅ Real PDF export (Puppeteer) — themed HTML-to-PDF render matching the PPTX design
- ✅ Presentation library: list/search/filter/paginate, favorites, folders, tags, duplicate
- ✅ Admin panel API: user management, role/subscription management, analytics, system health
- ✅ Security: Helmet, CORS, rate limiting (general + strict auth + generation), Mongo sanitization, HPP
  protection, bcrypt password hashing, JWT with rotating refresh tokens + reuse detection
- ✅ Activity logging for auditing
- ✅ Zod validation on every input
- ✅ Centralized error handling with operational vs. programmer error distinction
- ✅ Jest + Supertest integration tests (auth flow, generation flow, CRUD, rate limits) using an in-memory MongoDB
- ✅ Docker + Docker Compose, ESLint, Prettier

## What's NOT included yet

- ❌ Frontend (React app: landing page, dashboard, auth pages, slide editor UI)
- ❌ Google/GitHub OAuth (the User model and routes are ready for it — `provider`/`providerId` fields exist —
  but the actual OAuth strategy wiring is not implemented)
- ❌ Real-time collaboration
- ❌ Stripe/subscription billing (the `subscription` fields on the User model are ready to be driven by a
  billing webhook, but no payment provider is wired up)

---

## Quick start

### 1. Prerequisites
- Node.js 18+
- MongoDB (Atlas free tier, or local via Docker Compose)
- A Gemini API key (free at https://aistudio.google.com/apikey)

### 2. Install
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Then edit `.env` and fill in at minimum:
- `MONGO_URI` — your MongoDB connection string
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `EMAIL_VERIFICATION_SECRET`, `PASSWORD_RESET_SECRET` — generate each with:
  ```bash
  openssl rand -hex 32
  ```
- `GEMINI_API_KEY` — required for generation to work

Everything else (SMTP, Cloudinary, Unsplash, OpenAI, Claude) is optional. The app runs and generates full
presentations with just Gemini configured — it gracefully degrades:
- No SMTP configured → verification/reset emails are logged to the console instead of sent
- No Unsplash key → slides render with clean gradient placeholders instead of stock photos
- No Cloudinary → avatar upload endpoint returns a clear error, everything else works fine

### 4. Run
```bash
npm run dev      # development, with auto-reload
npm run build && npm start   # production
```

The API will be live at `http://localhost:5000/api/v1`. Check `GET /api/v1/health`.

### 5. Run tests
```bash
npm test
```
Tests spin up an ephemeral in-memory MongoDB automatically (via `mongodb-memory-server`) — no setup needed,
as long as your environment has normal internet access to download the MongoDB binary on first run.

### 6. Docker
This backend is one service in the top-level `docker-compose.yml` (in the parent `presentai-app/` folder,
alongside `frontend/`), which starts MongoDB, this API, and the web frontend together:
```bash
cd ..
docker compose up --build
```
See the root `README.md` for the full-stack setup.

---

## API Reference

Base URL: `/api/v1`

### Auth (`/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | — | Create account, returns access token + sets refresh cookie |
| POST | `/auth/login` | — | Login |
| POST | `/auth/refresh` | cookie | Rotate refresh token, get new access token |
| POST | `/auth/logout` | — | Revoke current refresh token |
| POST | `/auth/logout-all` | required | Revoke all sessions for the user |
| POST | `/auth/forgot-password` | — | Request password reset email |
| POST | `/auth/reset-password` | — | Reset password with token |
| POST | `/auth/verify-email` | — | Verify email with token |
| POST | `/auth/resend-verification` | required | Resend verification email |
| GET | `/auth/me` | required | Current user |

### Users (`/users`) — all require auth
| Method | Path | Description |
|---|---|---|
| PATCH | `/users/me` | Update name/avatar URL |
| POST | `/users/me/avatar` | Upload avatar image (multipart `avatar` field) |
| POST | `/users/me/change-password` | Change password (revokes all sessions) |
| DELETE | `/users/me` | Soft-delete (deactivate) account |

### Presentations (`/presentations`) — all require auth
| Method | Path | Description |
|---|---|---|
| POST | `/presentations/generate` | Generate a full presentation with AI |
| GET | `/presentations` | List (paginated, searchable, sortable) |
| GET | `/presentations/:id` | Get one |
| PATCH | `/presentations/:id` | Update title/folder/tags/favorite |
| DELETE | `/presentations/:id` | Delete |
| POST | `/presentations/:id/duplicate` | Duplicate |
| POST | `/presentations/:id/reorder` | Reorder slides (body: `{ order: [slideId, ...] }`) |
| POST | `/presentations/:id/slides` | Add a slide |
| PATCH | `/presentations/:id/slides/:slideId` | Edit a slide's content |
| DELETE | `/presentations/:id/slides/:slideId` | Delete a slide |
| POST | `/presentations/:id/slides/:slideId/duplicate` | Duplicate a slide |
| POST | `/presentations/:id/slides/:slideId/regenerate` | AI-regenerate a slide |
| POST | `/presentations/:id/slides/:slideId/rewrite?field=bodyText|bullets|speakerNotes` | AI-rewrite text |

### Export (`/export`) — all require auth
| Method | Path | Description |
|---|---|---|
| GET | `/export/:id/pptx` | Download as `.pptx` |
| GET | `/export/:id/pdf` | Download as `.pdf` |

### Admin (`/admin`) — all require admin role
| Method | Path | Description |
|---|---|---|
| GET | `/admin/users` | List/search users |
| PATCH | `/admin/users/:userId/role` | Change role |
| PATCH | `/admin/users/:userId/subscription` | Change plan/limit |
| PATCH | `/admin/users/:userId/deactivate` | Deactivate a user |
| GET | `/admin/analytics` | Platform analytics |
| GET | `/admin/system-health` | Uptime, DB status, memory |

All responses follow the shape: `{ success: boolean, message?: string, data?: {...}, errors?: [...] }`

---

## Architecture

```
src/
├── config/          # env validation (zod), logger (winston), DB connection
├── models/          # Mongoose schemas: User, RefreshToken, Presentation (embeds Slides), ActivityLog
├── middleware/       # auth guard, error handler, rate limiters, zod validator, multer upload
├── controllers/      # request handlers — thin, delegate to services
├── services/
│   ├── ai/            # provider-agnostic AI interface + Gemini/OpenAI/Claude implementations + fallback factory
│   ├── token.service.ts        # JWT issuing/rotation/revocation
│   ├── email.service.ts        # nodemailer wrapper
│   ├── image.service.ts        # Unsplash lookup
│   ├── cloudinary.service.ts   # avatar uploads
│   ├── pptx.service.ts         # PowerPoint generation (PptxGenJS)
│   ├── pdf.service.ts          # PDF generation (Puppeteer)
│   └── presentation.service.ts # orchestrates AI + images + persistence
├── routes/           # Express routers, one per resource
├── validators/       # Zod request schemas
├── utils/            # AppError, catchAsync
├── app.ts            # Express app assembly (security middleware, routes, error handling)
└── server.ts         # entrypoint, DB connection, graceful shutdown
```

**Why AI providers are pluggable:** every provider (`gemini.provider.ts`, `openai.provider.ts`,
`claude.provider.ts`) implements the same `AIProvider` interface. `ai.factory.ts` builds a fallback chain from
whichever API keys you've configured, in the order set by `AI_PROVIDER` — if your primary provider is down or
rate-limited, generation automatically retries with the next one.

**Why slides are embedded, not a separate collection:** presentations are read/written as a whole unit (open
the editor, get all slides; reorder slides, need atomic writes). Embedding avoids N+1 queries and keeps
reordering/versioning atomic.

---

## Security notes

- Passwords hashed with bcrypt (cost factor 12)
- Access tokens are short-lived (15 min default); refresh tokens are rotated on every use and stored as
  SHA-256 hashes (never the raw token) with reuse-detection — if a revoked refresh token is replayed, all
  sessions for that user are invalidated
- Refresh tokens are httpOnly cookies, not accessible to JS
- Rate limits: 300 req/15min general, 20 req/15min on auth endpoints, 30 req/hour on AI generation endpoints
- All inputs validated with Zod before touching the database
- Mongo query sanitization against NoSQL injection, HPP protection against parameter pollution
- Helmet security headers

## Troubleshooting

- **"GEMINI_API_KEY is required" on startup** — you must set at least one AI provider key in `.env`.
- **Emails not arriving** — if `SMTP_HOST` isn't set, emails are logged to the console instead (visible in
  `npm run dev` output) rather than actually sent. This is intentional for local dev.
- **PDF export fails locally** — Puppeteer needs a Chromium binary. Run `npx puppeteer browsers install chrome`
  once, or use the provided Docker image, which installs system Chromium.
- **"No AI providers are configured"** — check that `GEMINI_API_KEY` (or `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`)
  is actually set and non-empty in `.env`, and that you copied `.env.example` to `.env` (not just edited the example).
- **Tests hang or fail to start** — `mongodb-memory-server` downloads a MongoDB binary the first time it runs;
  this requires outbound internet access to `fastdl.mongodb.org`. In network-restricted CI/sandboxes, point
  `MONGOMS_SYSTEM_BINARY` at a local `mongod` instead, or run tests against Docker Compose's `mongo` service.

## License
Proprietary — built for the PresentAI project.
