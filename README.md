# TaskFlow Backend

Backend API for the `Gestion_tache` frontend.

## Stack

- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL
- JWT auth (access + refresh)

## Setup

1. Copy `.env.example` to `.env` and update:
   - `DATABASE_URL`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
2. Install deps:
   - `npm install`
3. Generate Prisma client:
   - `npm run prisma:generate`
4. Run migrations:
   - `npm run prisma:migrate`
5. Start API:
   - `npm run dev`

API runs on `http://localhost:8000` with routes under `/api`.

## Expected Frontend .env

`Gestion_tache/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=TaskFlow
```

## Déploiement sur Render

1. **Blueprint** :
   - **Dépôt = uniquement `taskflow-backend`** (racine = `package.json` du backend) : utilise le fichier **`taskflow-backend/render.yaml`** de ce projet (**sans** `rootDir`).
   - **Dépôt = monorepo `saas/`** : utilise le `render.yaml` à la racine du monorepo (avec `rootDir: taskflow-backend`).
2. **Variables d’environnement** (dashboard Render → Environment) :
   - `DATABASE_URL` : chaîne Postgres (idéalement **pooler** Supabase, port `6543`, `sslmode=require`). Pour que le schéma soit appliqué au build, active **Include in build** sur cette variable.
   - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` : au moins 16 caractères chacun.
   - `CORS_ORIGIN` : origines séparées par des virgules (ex. `https://ton-front.vercel.app,https://ton-autre-domaine.com`). Ajoute aussi l’URL Expo / web si tu l’utilises.
3. **Build / Start** (déjà dans `render.yaml`) :
   - Build : `npm ci --include=dev && npm run render:build` (compile TypeScript + `prisma generate` + `prisma db push`).
   - Start : `node dist/index.js` via `npm run render:start`.
4. **Port** : Render définit `PORT` automatiquement ; l’app lit `process.env.PORT` (voir `src/config/env.ts`).
5. **Health check** : `GET /health` doit répondre `{ "status": "ok" }`.

Pour la prod durable, préfère ensuite des **migrations Prisma** (`prisma migrate deploy`) plutôt que `db push` à chaque build.
