# PresentAI — Full Stack

An AI-powered presentation generator: describe a topic, get a full, editable, exportable deck.
This is a monorepo with two real, independently-buildable apps:

```
presentai-app/
├── backend/    Express + TypeScript + MongoDB API (see backend/README.md for full API docs)
└── frontend/   React 19 + TypeScript + Vite + Tailwind app
```

Both have been installed, type-checked, built, and (for the backend) integration-tested in the process of
building this. See each folder's own README for details specific to that service.

---

## Run everything with Docker Compose (recommended)

This is the fastest path to a fully working app — MongoDB, the API, and the web frontend all start together.

```bash
cd backend
cp .env.example .env
# edit backend/.env: fill in JWT secrets (openssl rand -hex 32 x4) and GEMINI_API_KEY at minimum
cd ..
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:5000/api/v1
- MongoDB: localhost:27017

The frontend container proxies `/api/*` to the backend container internally via nginx, so no CORS
configuration is needed in this setup.

---

## Run locally without Docker (for active development)

You'll want two terminals.

**Terminal 1 — backend:**
```bash
cd backend
npm install
cp .env.example .env
# fill in .env: MONGO_URI (Atlas or local mongod), JWT secrets, GEMINI_API_KEY
npm run dev
```
Runs on `http://localhost:5000`.

**Terminal 2 — frontend:**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Runs on `http://localhost:5173` and proxies `/api` requests to `http://localhost:5000` automatically
(configured in `frontend/vite.config.ts`).

Open `http://localhost:5173` and sign up — the whole flow (auth → generate → edit → export) works end to end
against your local backend.

---

## What actually works, end to end

1. **Sign up / log in** — real JWT auth with httpOnly refresh-token cookies, rotating on every refresh
2. **Generate a presentation** — fill in topic/audience/style/tone/theme/slide count, submit, and the backend
   calls Gemini (or your configured fallback chain) to write and structure a full deck
3. **Edit** — reorder slides by drag-and-drop, edit any field by hand, or ask AI to regenerate a slide or
   rewrite specific text (expand/shorten/change tone/fix grammar)
4. **Export** — download a real `.pptx` (opens in PowerPoint/Keynote/Google Slides) or `.pdf`
5. **Manage your library** — search, favorite, duplicate, delete from the dashboard

## What's not included

- Google/GitHub OAuth (backend models are ready for it; the OAuth strategy itself isn't wired up)
- Billing/Stripe integration (subscription fields exist on the User model but aren't driven by a payment
  provider)
- Admin panel **UI** (the backend admin API exists and is documented in `backend/README.md`; there's no
  frontend screen for it yet)
- Real-time collaborative editing

## Troubleshooting

See `backend/README.md` for backend-specific troubleshooting (AI provider setup, email/SMTP, Puppeteer/PDF
export). Frontend-specific:

- **Frontend can't reach the API in dev** — confirm the backend is actually running on port 5000, or set
  `VITE_API_PROXY_TARGET` in `frontend/.env` if it's running elsewhere.
- **Login works but then immediately logs out** — check that your backend's `CLIENT_URL` in `backend/.env`
  matches where the frontend is actually served from (needed for the CORS + cookie config to line up).
