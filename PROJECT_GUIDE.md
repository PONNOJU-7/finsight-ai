# FinSight AI — Project Guide

---

## What is FinSight AI?

Most people have no idea if they're eligible for a loan until they apply and get rejected — which hurts their credit score. Banks use your bank statement to assess you, but you never get to see that analysis yourself.

**FinSight AI fixes that.**

Upload your bank statement CSV → Claude AI reads every transaction → you get a complete financial health report in seconds — the same analysis a lender would do, but in your hands before you apply.

---

## What It Does

### 1. Loan Readiness Score (0–100)
A score computed from 6 signals that real lenders actually use:

| Signal | Weight | What it measures |
|---|---|---|
| Income Regularity | 20 pts | How consistent are your salary/business credits month over month? |
| Average Balance | 20 pts | How healthy is your account balance relative to income? |
| Obligation-to-Income Ratio | 20 pts | What % of income goes to EMIs and loan repayments? (below 40% is good) |
| Spending Volatility | 20 pts | How stable is your monthly spend? Erratic spending = lower score |
| Bounce Rate | 10 pts | Any returned/bounced transactions? Each one reduces the score |
| Savings Rate | 10 pts | What % of income do you save? Above 20% is excellent |

### 2. AI Spending Analysis
- Every transaction categorized by Claude AI: Food, Rent, EMI, Utilities, Entertainment, Shopping, Travel, Healthcare
- Month-by-month income vs expense breakdown with charts
- Top merchants by spend
- 6-month savings trend

### 3. AI Financial Advisor Chat
Chat with Claude using your actual financial data as context. Ask it anything:
- *"Can I afford a ₹5 lakh loan with ₹8,000 monthly EMI?"*
- *"Where am I spending the most unnecessarily?"*
- *"What do I need to fix to improve my loan eligibility?"*
- *"How does my savings rate compare to what's recommended?"*

Claude answers using **your real numbers** — not generic financial advice.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | NestJS (Fastify adapter) |
| Language | TypeScript |
| AI Engine | Anthropic Claude (claude-sonnet-4-6) |
| Primary Database | MongoDB (Mongoose) |
| Cache | Redis (planned; not used in current code) |
| Authentication | JWT (bcrypt password hashing) |
| File Processing | CSV parser with flexible column detection |
| Frontend Framework | Angular 20 (standalone components) |
| UI Styling | Tailwind CSS |
| Charts | Chart.js + ng2-charts |
| API Docs | Swagger / OpenAPI |

---

## Project Structure

```
finsight-ai/
├── backend/                        ← NestJS API
│   ├── src/
│   │   ├── main.ts                 ← App bootstrap (Fastify + Swagger)
│   │   ├── app.module.ts           ← Root module
│   │   ├── modules/
│   │   │   ├── auth/               ← Register, Login, JWT
│   │   │   ├── statement/          ← CSV upload + parsing
│   │   │   ├── analysis/           ← Claude AI analysis engine
│   │   │   ├── chat/               ← AI advisor chat (RAG)
│   │   │   └── dashboard/          ← Aggregated summary API
│   │   └── common/
│   │       ├── guards/             ← JWT auth guard
│   │       ├── decorators/         ← @CurrentUser()
│   │       └── filters/            ← Global exception filter
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                       ← Angular 20 app
    ├── src/
    │   ├── main.ts
    │   ├── styles.css              ← Tailwind CSS
    │   └── app/
    │       ├── app.config.ts       ← Providers (router, HTTP, animations)
    │       ├── app.routes.ts       ← Lazy-loaded routes
    │       ├── core/
    │       │   ├── services/       ← AuthService, ApiService
    │       │   ├── guards/         ← authGuard (route protection)
    │       │   └── interceptors/   ← JWT token injection
    │       ├── pages/
    │       │   ├── login/          ← Login page
    │       │   ├── register/       ← Register page
    │       │   ├── dashboard/      ← Home dashboard + statement list
    │       │   ├── upload/         ← Drag & drop CSV upload
    │       │   ├── analysis/       ← AI report + charts
    │       │   └── chat/           ← AI financial advisor chat
    │       └── shared/
    │           └── components/navbar/
    ├── package.json
    └── tailwind.config.js
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Login, get JWT |
| POST | `/api/v1/statement/upload` | Upload CSV bank statement |
| GET | `/api/v1/statement` | List all your statements |
| GET | `/api/v1/statement/:id` | Get statement + transactions |
| DELETE | `/api/v1/statement/:id` | Delete a statement |
| POST | `/api/v1/analysis/run/:statementId` | Trigger Claude AI analysis |
| GET | `/api/v1/analysis/:statementId` | Get analysis results |
| POST | `/api/v1/chat/message` | Send message to AI advisor |
| GET | `/api/v1/chat/history` | Get conversation history |
| DELETE | `/api/v1/chat/history` | Clear conversation |
| GET | `/api/v1/dashboard/summary` | Get full dashboard data |

Full interactive docs at: **http://localhost:3000/api/docs**

---
---

# Running Locally

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 20+ | `node --version` |
| npm | 9+ | `npm --version` |
| MongoDB | 6+ | `mongosh --version` or Docker `mongo:6` |
| Anthropic API key | — | [console.anthropic.com](https://console.anthropic.com) |

Redis is **not required** for the current codebase.

---

## Configuration (API keys & secrets)

Copy [`backend/.env.example`](backend/.env.example) to `backend/.env`. **Never commit `.env`.**

| Variable | Required? | Notes |
|---|---|---|
| `MONGO_URL` | Yes | e.g. `mongodb://localhost:27017/finsight` |
| `JWT_SECRET` | Yes | Long random string (64+ chars) for signing JWTs |
| `ANTHROPIC_API_KEY` | Only for real Claude | Not needed if `AI_PROVIDER=mock` |
| `AI_PROVIDER` / `MOCK_CLAUDE` | No | `mock` or `MOCK_CLAUDE=true` — free demo from CSV (no Anthropic) |
| `PORT`, `JWT_EXPIRES_IN` | No | Defaults: `3000`, `7d` |
| `REDIS_*` | No | Unused today |

---

## Step 1 — Install MongoDB

```bash
# Mac (Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Verify
mongosh --eval "db.runCommand({ ping: 1 })"
# Expected output: { ok: 1 }
```

---

## Step 2 — Set up the Backend

```bash
cd finsight-ai/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env`: at minimum `MONGO_URL` and `JWT_SECRET`. For **no Anthropic account**, use `AI_PROVIDER=mock` (see `backend/.env.example`). For real AI, set `AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`.

**Anthropic API key:** [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key → paste as `ANTHROPIC_API_KEY` in `.env`.

```bash
# Start the backend in dev mode (auto-reloads on file changes)
npm run start:dev
```

You should see:
```
FinSight AI backend running on http://localhost:3000/api/docs
```

---

## Step 3 — Set up the Frontend

Open a **new terminal tab**:

```bash
cd finsight-ai/frontend

# Install dependencies
npm install --legacy-peer-deps

# Start the dev server
npm start
```

You should see:
```
Local:   http://localhost:4200/
```

---

## Step 4 — Open the App

Go to **[http://localhost:4200](http://localhost:4200)**

1. Click **Sign up** → create an account
2. You land on the Dashboard
3. Click **Upload Statement** → upload a CSV bank statement
4. AI analysis runs automatically (5–10 seconds)
5. View your Loan Readiness Score, charts, and spending breakdown
6. Click **Chat** to ask the AI advisor questions about your finances

---

## Don't Have a Bank Statement CSV?

Use [`fixtures/test-statement.csv`](fixtures/test-statement.csv) in the repo, or save this as `test-statement.csv` and upload it:

```csv
Date,Description,Debit,Credit,Balance
01/06/2025,Opening Balance,,,50000.00
02/06/2025,SALARY CREDIT JUNE,,85000.00,135000.00
03/06/2025,RENT PAYMENT JUNE,25000.00,,110000.00
05/06/2025,SWIGGY ORDER,450.00,,109550.00
07/06/2025,AMAZON PURCHASE,1200.00,,108350.00
10/06/2025,EMI HDFC PERSONAL LOAN,8500.00,,99850.00
12/06/2025,ELECTRICITY BILL TPDDL,1800.00,,98050.00
15/06/2025,SWIGGY ORDER,380.00,,97670.00
18/06/2025,UBER RIDES,250.00,,97420.00
20/06/2025,NETFLIX SUBSCRIPTION,649.00,,96771.00
22/06/2025,DMART GROCERY,3200.00,,93571.00
25/06/2025,ZOMATO ORDER,520.00,,93051.00
28/06/2025,MUTUAL FUND SIP,10000.00,,83051.00
01/07/2025,SALARY CREDIT JULY,,85000.00,168051.00
03/07/2025,RENT PAYMENT JULY,25000.00,,143051.00
05/07/2025,SWIGGY ORDER,600.00,,142451.00
08/07/2025,AMAZON PURCHASE,2400.00,,140051.00
10/07/2025,EMI HDFC PERSONAL LOAN,8500.00,,131551.00
14/07/2025,ELECTRICITY BILL,1950.00,,129601.00
18/07/2025,OLA CABS,320.00,,129281.00
22/07/2025,DMART GROCERY,2800.00,,126481.00
28/07/2025,MUTUAL FUND SIP,10000.00,,116481.00
01/08/2025,SALARY CREDIT AUGUST,,85000.00,201481.00
03/08/2025,RENT PAYMENT AUGUST,25000.00,,176481.00
```

---

## URLs at a Glance

| What | URL |
|---|---|
| Frontend App | http://localhost:4200 |
| Backend API | http://localhost:3000/api/v1 |
| Swagger Docs | http://localhost:3000/api/docs |
| MongoDB | localhost:27017 |
| Sample CSV | `fixtures/test-statement.csv` |

---

## Troubleshooting

**`npm install` fails with peer dependency errors**
```bash
npm install --legacy-peer-deps
```

**MongoDB connection refused**
```bash
brew services restart mongodb-community
```

**Port 3000 already in use**
```bash
lsof -ti:3000 | xargs kill -9
npm run start:dev
```

**Angular won't start — port 4200 in use**
```bash
npm start -- --port 4201
```

**Claude API returns error**
- Check your `ANTHROPIC_API_KEY` in `.env` is correct and has credits
- Verify at [console.anthropic.com](https://console.anthropic.com)
