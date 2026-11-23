# FinSight AI 🧠💰

> AI-powered personal financial health & loan readiness analyzer — built with NestJS, Angular 20, MongoDB, and Claude AI.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com)
[![Angular](https://img.shields.io/badge/Angular_20-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.io)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Claude AI](https://img.shields.io/badge/Claude_AI-D97757?style=flat&logo=anthropic&logoColor=white)](https://anthropic.com)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)

---

## What is FinSight AI?

FinSight AI lets anyone upload their bank statement (CSV) and instantly receive:

- 📊 **Spending breakdown** — categorized by AI (food, rent, utilities, entertainment, EMIs)
- 💳 **Income & cash flow analysis** — monthly income stability score
- 🏦 **Loan Readiness Score (0–100)** — AI-computed eligibility indicator based purely on bank statement data (no credit bureau needed — mirrors the BSA/surrogate lending model used in real MSME lending)
- 🤖 **AI Financial Advisor Chat** — ask Claude anything about your own finances in natural language
- 📈 **Trend dashboard** — 6-month income vs expense trend charts

**Why this is different from "yet another AI demo":** The loan readiness model is based on the same signals used in real production lending systems — income regularity, average balance, bounce rate, obligation-to-income ratio, and spending volatility. This is not a toy — it's a distilled version of actual BSA (Bank Statement Analysis) logic.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | NestJS (Fastify adapter) |
| Language | TypeScript |
| AI Engine | Anthropic Claude (claude-sonnet-4-6) |
| Primary DB | MongoDB (Mongoose) |
| Cache | Redis (planned; not wired in current code) |
| Authentication | JWT (HS256 via `JWT_SECRET`) |
| File Processing | CSV parser + pdf-parse |
| Frontend Framework | Angular 20 (standalone components) |
| UI Styling | Tailwind CSS |
| Charts | Chart.js + ng2-charts |
| HTTP Client | Angular HttpClient |
| State Management | RxJS BehaviorSubject |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Angular 20 Frontend                   │
│  Upload → Dashboard → Analysis Report → AI Chat         │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST (JWT)
┌──────────────────────▼──────────────────────────────────┐
│               NestJS Backend (Fastify)                   │
│                                                          │
│  AuthModule → StatementModule → AnalysisModule           │
│  ChatModule → DashboardModule                            │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ MongoDB  │  │  Redis   │  │  Claude AI (Anthropic)│  │
│  │(Mongoose)│  │  Cache   │  │  claude-sonnet-4-6   │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Features

### 1. Bank Statement Upload & Parsing
- Upload CSV bank statements (standard format: Date, Description, Debit, Credit, Balance)
- Automatic transaction parsing and normalization
- Duplicate detection via checksum

### 2. AI-Powered Spending Categorization
- Claude AI classifies each transaction into categories: Food, Rent, EMI/Loan, Utilities, Entertainment, Salary, Transfer, Other
- Merchant name normalization (e.g. "SWIGGY*ORDER" → "Swiggy")

### 3. Loan Readiness Score
- **0–100 score** computed from 6 factors:
  - Income regularity (salary credits consistent month over month)
  - Average end-of-month balance
  - Obligation-to-Income ratio (EMIs / income)
  - Spending volatility (standard deviation of monthly spend)
  - Bounce/return transactions (NSF/insufficient fund markers)
  - Savings rate (income - expenses / income)
- Full explanation of each factor provided by Claude

### 4. AI Financial Chat (RAG over personal data)
- Chat with Claude using your own financial data as context
- Retrieval-Augmented Generation: your transaction summary + analysis is injected into every message
- Example questions:
  - "Can I afford a ₹5L loan with ₹8K monthly EMI?"
  - "Where am I spending the most unnecessarily?"
  - "What should I do to improve my loan eligibility?"

### 5. Dashboard
- 6-month income vs expense bar chart
- Spending category donut chart
- Loan readiness score gauge
- Top 5 spending merchants
- Monthly savings trend line chart

---

## Project Structure

```
finsight-ai/
├── backend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── dto/
│   │   │   │   └── schemas/user.schema.ts
│   │   │   ├── statement/
│   │   │   │   ├── statement.module.ts
│   │   │   │   ├── statement.controller.ts
│   │   │   │   ├── statement.service.ts
│   │   │   │   ├── csv.parser.ts
│   │   │   │   └── schemas/
│   │   │   ├── analysis/
│   │   │   │   ├── analysis.module.ts
│   │   │   │   ├── analysis.controller.ts
│   │   │   │   ├── analysis.service.ts
│   │   │   │   └── schemas/analysis.schema.ts
│   │   │   ├── chat/
│   │   │   │   ├── chat.module.ts
│   │   │   │   ├── chat.controller.ts
│   │   │   │   ├── chat.service.ts
│   │   │   │   └── schemas/conversation.schema.ts
│   │   │   └── dashboard/
│   │   │       ├── dashboard.module.ts
│   │   │       ├── dashboard.controller.ts
│   │   │       └── dashboard.service.ts
│   │   └── common/
│   │       ├── decorators/current-user.decorator.ts
│   │       ├── guards/jwt-auth.guard.ts
│   │       └── filters/http-exception.filter.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── main.ts
    │   ├── styles.css
    │   └── app/
    │       ├── app.config.ts
    │       ├── app.routes.ts
    │       ├── core/
    │       │   ├── services/
    │       │   ├── guards/
    │       │   └── interceptors/
    │       ├── pages/
    │       │   ├── login/
    │       │   ├── register/
    │       │   ├── dashboard/
    │       │   ├── upload/
    │       │   ├── analysis/
    │       │   └── chat/
    │       └── shared/
    │           └── components/navbar/
    ├── package.json
    ├── tailwind.config.js
    └── angular.json
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB 6+ (local, Docker, or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com)) — required for AI analysis and chat

Redis is listed in the roadmap but **not required** to run the app today.

### Secrets and API keys

All sensitive configuration lives in **`backend/.env`** (create from [`backend/.env.example`](backend/.env.example)). **Do not commit `.env`** — it is listed in [`.gitignore`](.gitignore).

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `MONGO_URL` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Signs login tokens (use 64+ random characters; never share) |
| `ANTHROPIC_API_KEY` | **Yes** for real Claude | Omit when using mock mode (below) |
| `AI_PROVIDER` | No | `mock` = free local analysis/chat from your CSV; `anthropic` (default) = Claude |
| `MOCK_CLAUDE` | No | `true` = same as `AI_PROVIDER=mock` |
| `PORT` | No | API port (default `3000`) |
| `JWT_EXPIRES_IN` | No | Token lifetime (default `7d`) |
| `REDIS_HOST` / `REDIS_PORT` | No | Reserved for future caching; **unused in code** |

The frontend has **no API keys** — it calls the backend at `http://localhost:3000/api/v1` via [`frontend/src/environments/environment.ts`](frontend/src/environments/environment.ts).

Sample bank statement for testing: [`fixtures/test-statement.csv`](fixtures/test-statement.csv).

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set MONGO_URL, JWT_SECRET, ANTHROPIC_API_KEY
npm run start:dev
```

### Frontend Setup

```bash
cd frontend
npm install --legacy-peer-deps
npm start
# Opens at http://localhost:4200
```

### Environment Variables (reference)

See [`backend/.env.example`](backend/.env.example) for the full template and inline comments.

---

## API Documentation

Once the backend is running, Swagger docs are available at:
```
http://localhost:3000/api/docs
```

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login, get JWT |
| POST | /statement/upload | Upload CSV bank statement |
| GET | /statement/:id | Get parsed statement |
| POST | /analysis/run/:statementId | Trigger AI analysis |
| GET | /analysis/:statementId | Get analysis report |
| POST | /chat/message | Send message to AI advisor |
| GET | /chat/history | Get conversation history |
| GET | /dashboard/summary | Get dashboard data |

---

## Key Technical Decisions

### Why Claude AI over OpenAI?
Anthropic's Claude has superior instruction-following for structured JSON output and a 200K context window — critical for injecting full bank statement data into the analysis prompt without chunking.

### Why BSA-based loan scoring?
Traditional credit score APIs (Experian, CIBIL) cost ₹30–100 per pull and require bureau integrations. BSA-based scoring is free (uses the user's own data), faster (real-time), and actually more accurate for thin-credit-file users — which is the MSME lending problem I worked on at FlexiLoans.

### Why Redis for analysis caching? (roadmap)
AI analysis via Claude costs money per token and takes 3–8 seconds. The README and dependencies mention Redis for a future 24h analysis cache; **this is not implemented yet** — results are stored in MongoDB only.

### Why Fastify over Express?
~20-30% better throughput for the same code, better TypeScript support, and schema-based serialization. This is the same Fastify adapter used in the FlexiLoans production NestJS monorepo.

---

## Roadmap

- [ ] PDF bank statement parsing (pdf-parse)
- [ ] Multi-statement comparison (track progress over 6 months)
- [ ] Loan product recommendations (partner API integration)
- [ ] WhatsApp bot interface (Twilio)
- [ ] Export analysis as PDF report
- [ ] Mobile app (Angular + Capacitor)

---

## Author

**Pramod Ponnoju** — Full-Stack Software Engineer  
Built on production fintech experience from FlexiLoans' MSME lending platform.

[LinkedIn](https://linkedin.com/in/pramod-ponnoju-27246713i) · [GitHub](https://github.com/pramod-ponnoju)
