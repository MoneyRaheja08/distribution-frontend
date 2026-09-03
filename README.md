# Ashoka Distribution — Frontend (React + Vite PWA)

Mobile-first PWA for the distribution collection app. One codebase, three roles:
**collector** (field collection), **manager** (data entry + reconciliation),
**admin** (everything + user management). Talks to the FastAPI backend.

## Run locally

```bash
cd distribution-frontend
npm install
cp .env.example .env
npm run dev            # http://localhost:5173
```

`.env` controls what it talks to:

```
VITE_API_BASE=http://localhost:8000   # your FastAPI URL
VITE_USE_MOCK=true                    # true = built-in demo data, no backend
```

- **First look, no backend:** keep `VITE_USE_MOCK=true`. Log in with
  `Money / 1234` (admin), `Rakesh / 1111` (manager), or `Gurpreet Singh / 1111`
  (collector).
- **Against the real API:** start the backend, set `VITE_USE_MOCK=false` and
  `VITE_API_BASE` to its URL. Nothing else changes — the `src/api/client.js`
  layer swaps mock calls for real `fetch`es.

## Structure

```
src/
  api/client.js      # the ONLY place that talks to the backend (1 fn per endpoint)
  api/mock.js        # in-memory mock backend for VITE_USE_MOCK=true
  auth/AuthContext.jsx  # login, logout, token persisted in localStorage
  components/Shell.jsx  # frame + role-based bottom nav
  components/ui.jsx     # shared inputs, cards, modal
  pages/collector/*  # Beat, Dealer, Collect, MyDay, StockView
  pages/staff/*      # Dashboard, Dealers, Stock, Money, Users
  App.jsx            # role-based routing
```

## Build

```bash
npm run build        # outputs static site to dist/
npm run preview      # preview the production build locally
```

---

# Deployment

Three pieces: **database**, **backend**, **frontend**. Cheapest reliable combo
below; all have free tiers.

### 1. Database — MongoDB Atlas
1. Create a free M0 cluster at mongodb.com/atlas.
2. Add a database user + allow your backend host's IP (or 0.0.0.0/0 while testing).
3. Copy the connection string (`mongodb+srv://...`) — that's your `MONGO_URI`.

### 2. Backend (FastAPI) — Render (or Railway / Fly.io / a VPS)
On **Render** (render.com), New → Web Service → point at your backend repo:
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment variables:** `MONGO_URI`, `DB_NAME`, `JWT_SECRET`,
  `CORS_ORIGINS` (your frontend URL, see below), and set `TZ=Asia/Kolkata`.

You get a URL like `https://ashoka-api.onrender.com`. Open `/docs` to confirm,
then hit `/auth/bootstrap` once to create your admin.

*(On a VPS instead: run uvicorn behind Nginx with a Let's Encrypt cert, or
containerise — a 6-line Dockerfile on `python:3.12-slim` running the same
uvicorn command.)*

### 3. Frontend (this app) — Firebase Hosting, Netlify, or Vercel
It's a static bundle after `npm run build`, so any static host works.

**Firebase Hosting** (you already use it):
```bash
npm run build
npm i -g firebase-tools
firebase login
firebase init hosting     # public dir: dist ; single-page app: Yes
firebase deploy
```
Set `.env` before building: `VITE_USE_MOCK=false` and `VITE_API_BASE=https://ashoka-api.onrender.com`.

**Netlify / Vercel:** connect the repo, build command `npm run build`, publish
directory `dist`, add the two `VITE_` env vars. Both auto-deploy on git push.

### 4. Wire them together (the one step people miss)
- Frontend `VITE_API_BASE` → backend URL.
- Backend `CORS_ORIGINS` → frontend URL (e.g. `https://ashoka.web.app`).
  If these don't match, the browser blocks the calls.

### PWA install
Once served over HTTPS (all the hosts above give you that), open the site on a
collector's phone → browser menu → **Add to Home Screen**. It then launches
full-screen like a native app and caches the shell for flaky network.
