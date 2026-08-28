# Deploying to Vercel

Three Vercel projects from this one repo:

| Project | Root Directory | What it serves |
|---|---|---|
| `pilates-api` | `apps/api` | the REST API (serverless function) |
| `pilates-web` | `apps/web` | public site + member booking |
| `pilates-admin` | `apps/admin` | staff / admin portal |

Plus a Postgres database (Neon).

The repo already contains everything Vercel needs: `apps/*/vercel.json`, the
serverless entrypoint `apps/api/api/index.ts`, and the cron route
`GET /internal/sweep`. You only do dashboard steps.

---

## 1 · Database (Neon)

1. Create a project at <https://neon.tech> (free tier).
2. From the dashboard copy **two** connection strings:
   - **Pooled** — host contains `-pooler`. Used by the API at runtime.
   - **Direct** — no `-pooler`. Used once, for migrations.
3. From your machine, run migrations + demo data against the **direct** URL:
   ```bash
   DATABASE_URL="<DIRECT_URL>" DATABASE_SSL=true \
     npm --workspace apps/api run migration:run
   DATABASE_URL="<DIRECT_URL>" DATABASE_SSL=true \
     npm --workspace apps/api run seed
   ```

## 2 · API project

1. Vercel → **Add New → Project** → import this repo.
2. **Root Directory:** `apps/api`. Framework preset: **Other**. Leave build/output
   settings as detected (`vercel.json` overrides them).
3. **Environment Variables:**

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the **pooled** Neon string |
   | `DATABASE_SSL` | `true` |
   | `DB_POOL_MAX` | `3` |
   | `DISABLE_IN_PROCESS_CRON` | `true` |
   | `JWT_ACCESS_SECRET` | a long random string |
   | `JWT_REFRESH_SECRET` | a different long random string |
   | `JWT_ACCESS_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` |
   | `CANCELLATION_WINDOW_HOURS_DEFAULT` | `2` |
   | `SWEEP_SECRET` | a random string (used by non-Vercel schedulers) |
   | `CORS_ORIGINS` | *fill in after step 3* |
   | `CRON_SECRET` | a random string — Vercel Cron will send it as a Bearer token |

4. **Deploy.** Note the URL, e.g. `https://pilates-api.vercel.app`.
5. Sanity check: `curl https://pilates-api.vercel.app/health` → `{"status":"ok"}`.
   (First hit after idle is slow — cold start.)

The `crons` block in `apps/api/vercel.json` makes Vercel call
`GET /internal/sweep` every 10 minutes with `Authorization: Bearer $CRON_SECRET`
— that runs the no-show sweep and lapses stale waitlist offers.

## 3 · Frontend projects (do this twice)

For **`apps/web`**, then again for **`apps/admin`**:

1. Vercel → **Add New → Project** → same repo.
2. **Root Directory:** `apps/web` (then `apps/admin`).
3. Framework preset: **Vite** (auto-detected).
4. **Environment Variable:** `VITE_API_URL` = your API URL from step 2.
5. Deploy. Note each URL, e.g. `https://pilates-web.vercel.app`,
   `https://pilates-admin.vercel.app`.

The `vercel.json` in each rewrites all paths to `index.html` so React Router
deep links work on refresh.

## 4 · Wire CORS

Back in the **API** project → Settings → Environment Variables → set
`CORS_ORIGINS` to both frontend URLs, comma-separated and **no trailing slash**:

```
https://pilates-web.vercel.app,https://pilates-admin.vercel.app
```

Redeploy the API (Deployments → ⋯ → Redeploy).

## 5 · Test

- Open `https://pilates-web.vercel.app` → browse classes → sign in as
  `member1@studio.test` / `password123`.
- Open `https://pilates-admin.vercel.app` → sign in as `admin@studio.test`.

Re-seed anytime (wipes + repopulates):
```bash
DATABASE_URL="<DIRECT_URL>" DATABASE_SSL=true npm --workspace apps/api run seed
```

---

## Gotchas

- **Cold starts** — the API function sleeps when idle; the first request after a
  pause takes a few seconds. Fine for a demo.
- **Neon free tier** also sleeps; first query wakes it.
- **Connection limits** — always use the **pooled** URL for `DATABASE_URL` and keep
  `DB_POOL_MAX` small (3). Migrations use the direct URL.
- **Time zone** — class times are stored as UTC wall-clock and display in the
  viewer's zone (known limitation).

## Fallback: API on Render instead of Vercel

If the serverless API misbehaves, `render.yaml` at the repo root deploys the API
as a normal always-on Node service (no serverless entrypoint, in-process cron
works). Render → New → Blueprint → pick this repo. Still use Neon for the DB and
Vercel for the two frontends; point `VITE_API_URL` and `CORS_ORIGINS` at the
Render URL.
