# Deploy FinSight AI (production + .com domain)

Typical setup:

| Piece | Host | Example URL |
|-------|------|-------------|
| Angular UI | [Vercel](https://vercel.com) | `https://www.yourdomain.com` |
| NestJS API | [Render](https://render.com) | `https://api.yourdomain.com` |
| Database | [MongoDB Atlas](https://www.mongodb.com/atlas) | `mongodb+srv://...` |

Free tiers are enough for **10–20 users** if you use **mock AI** (`AI_PROVIDER=mock`).

---

## 1. Buy a domain (.com)

Use **Cloudflare Registrar**, **Namecheap**, or **Google Domains** (e.g. `finsightai.com`).

You will point DNS in step 5.

---

## 2. MongoDB Atlas

1. Create a free **M0** cluster.
2. **Database Access** → user + password.
3. **Network Access** → **Allow access from anywhere** (`0.0.0.0/0`) for Render (or Render’s egress IPs if you tighten later).
4. **Connect** → copy **connection string** → set password in URI:

   `MONGO_URL=mongodb+srv://USER:PASS@cluster.xxxxx.mongodb.net/finsight?retryWrites=true&w=majority`

---

## 3. Deploy the API (Render)

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**.
2. Connect **GitHub** → repo `PONNOJU-7/finsight-ai`.
3. Settings:
   - **Root Directory:** `backend`
   - **Build:** `npm install && npm run build`
   - **Start:** `npm run start`
   - **Health check path:** `/api/v1/health`
4. **Environment variables:**

| Key | Value |
|-----|--------|
| `MONGO_URL` | Atlas URI |
| `JWT_SECRET` | Long random string (64+ chars) |
| `JWT_EXPIRES_IN` | `7d` |
| `AI_PROVIDER` | `mock` (or `anthropic` + key) |
| `MOCK_CLAUDE` | `true` if mock |
| `CORS_ORIGINS` | `https://www.yourdomain.com,https://yourdomain.com` |
| `ANTHROPIC_API_KEY` | Only if real Claude |

5. Deploy → note URL, e.g. `https://finsight-api.onrender.com`.

6. **Custom domain (API):** Render → **Settings** → **Custom Domains** → add `api.yourdomain.com` → follow DNS instructions.

---

## 4. Deploy the frontend (Vercel)

1. Edit **`frontend/src/environments/environment.prod.ts`** — set `apiUrl` to your live API:

   ```typescript
   apiUrl: 'https://api.yourdomain.com/api/v1',
   // or until DNS is ready: 'https://finsight-api.onrender.com/api/v1'
   ```

2. Commit and push that change to GitHub.

3. [Vercel](https://vercel.com) → **Add New Project** → import `finsight-ai`.
4. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Other (uses `vercel.json`)
   - Build/install: from `frontend/vercel.json` (`--legacy-peer-deps`)
5. Deploy → URL like `https://finsight-ai-xxx.vercel.app`.

6. **Custom domain:** Vercel → **Domains** → add `yourdomain.com` and `www.yourdomain.com`.

---

## 5. DNS (at your registrar / Cloudflare)

Example for **Cloudflare** DNS:

| Type | Name | Target |
|------|------|--------|
| CNAME | `www` | `cname.vercel-dns.com` (Vercel shows exact value) |
| CNAME | `@` or `api` | Render hostname for API |
| A / CNAME | apex `@` | Vercel apex docs (often `76.76.21.21` or ALIAS) |

Use the **exact** hostnames Vercel and Render give you — they differ per project.

After DNS propagates (minutes to hours):

- App: `https://www.yourdomain.com`
- API: `https://api.yourdomain.com/api/v1/health` → `{"status":"ok"}`

---

## 6. Post-deploy checklist

- [ ] Register → login works on production URL  
- [ ] Upload `fixtures/test-statement.csv`  
- [ ] Analysis + dashboard + chat  
- [ ] `CORS_ORIGINS` includes both `www` and apex if you use both  
- [ ] `backend/.env` never committed (only server env vars)

---

## Optional: Render Blueprint

Root file [`render.yaml`](render.yaml) can create the API service; set secrets in the Render UI after sync.

---

## Costs (rough)

| Service | Free tier |
|---------|-----------|
| Vercel (static) | Hobby OK for portfolio |
| Render API | Free web service (sleeps when idle — first request slow) |
| MongoDB Atlas | M0 free |
| Domain .com | ~$10–15/year |
| Anthropic | Pay only if not using mock |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error in browser | Add exact frontend URL to `CORS_ORIGINS` on Render, redeploy API |
| API calls wrong host | Fix `environment.prod.ts` → rebuild frontend on Vercel |
| 502 / slow first load | Render free tier cold start — wait ~30s or upgrade |
| Mongo connection failed | Atlas IP allowlist + correct `MONGO_URL` password encoding |

EOF