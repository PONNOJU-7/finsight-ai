# FinSight AI — LinkedIn & GitHub Copy

---

## GitHub Repository Description (one line, goes in the About box)

> AI-powered bank statement analyzer — upload CSV, get loan readiness score, spending breakdown & AI financial advisor chat. Built with NestJS, Angular 20, MongoDB & Claude AI.

## GitHub Topics (add these tags)
```
nestjs angular typescript mongodb claude-ai anthropic fintech loan-eligibility
bank-statement-analysis financial-health jwt rest-api tailwindcss chart-js rxjs
```

---

## GitHub README Badges (already in README.md)
Copy the badge line from README.md into the top of your repo.

---

## LinkedIn Post (post this when you publish the project)

---

🚀 **Just shipped my biggest side project: FinSight AI**

I've been working in fintech at FlexiLoans building MSME lending journeys — and one thing I kept thinking was: *why do people have no visibility into their own loan eligibility before they apply?*

So I built **FinSight AI** — an AI-powered personal financial health analyzer.

Here's what it does:

📊 Upload your bank statement (CSV)
🧠 Claude AI reads every transaction and categorizes spending, identifies income patterns, and detects financial risks
🏦 Generates a **Loan Readiness Score (0–100)** based on the same signals real lenders use — income regularity, obligation-to-income ratio, savings rate, spending volatility, and balance behavior
💬 You can then **chat with your finances** — ask "Can I afford a ₹5L loan?" or "Where am I overspending?" and Claude answers using your actual numbers

The loan scoring model is based on **BSA (Bank Statement Analysis)** — the same methodology used in surrogate/alternative lending for thin-credit-file borrowers. Not a toy — it's real fintech logic.

**Tech stack:**
→ NestJS (Fastify) + MongoDB — backend (Redis analysis cache on roadmap)
→ Angular 20 (standalone) + Tailwind + Chart.js — frontend
→ Anthropic Claude claude-sonnet-4-6 — AI engine
→ JWT auth, Swagger docs, CSV parser with flexible column mapping

**What made it non-trivial:**
- The Claude prompt engineering for structured JSON output from raw transaction data
- CSV column detection that handles 6+ different bank statement formats
- RAG pattern: injecting the user's own financial summary into every Claude message as context
- The loan readiness score uses 6 weighted factors — not just a single number

GitHub link in comments. Happy to discuss the architecture or the BSA scoring model. 🏗️

#fintech #ai #claude #nestjs #angular #sideproject #opentowork

---

## LinkedIn Featured Section Description
(Add this as a "Featured" link on your profile pointing to the GitHub repo)

**FinSight AI — AI-Powered Financial Health Analyzer**
Built a production-grade full-stack application that analyzes bank statements using Claude AI to generate a Loan Readiness Score, spending breakdown, and an interactive AI financial advisor chat. Stack: NestJS, Angular 20, MongoDB, Anthropic Claude. Based on real BSA (Bank Statement Analysis) methodology used in MSME lending.

---

## LinkedIn Project Section (Add to "Projects" on your profile)

**Project Name:** FinSight AI

**Description:**
AI-powered personal financial health and loan readiness analyzer. Upload a CSV bank statement → Claude AI categorizes every transaction, computes a Loan Readiness Score (0–100) using 6 BSA-based signals (income regularity, obligation-to-income ratio, savings rate, spending volatility, bounce rate, average balance), and provides an interactive AI financial advisor chat powered by Retrieval-Augmented Generation (RAG) over the user's own financial data.

Built on production fintech experience from FlexiLoans' MSME lending platform — the scoring model mirrors real Bank Statement Analysis (BSA) logic used in surrogate lending for thin-credit-file borrowers.

**Tech:** NestJS · Angular 20 · MongoDB · Anthropic Claude · TypeScript · Tailwind CSS · Chart.js · JWT · Swagger *(Redis caching planned)*

---

## Interview Talking Points for This Project

When asked "tell me about a project you've built":

"I built FinSight AI — an AI-powered bank statement analyzer. The core idea came from my work at FlexiLoans where I shipped the BSA counterparty declaration feature — I realized regular people have no visibility into how lenders actually assess their finances.

The interesting parts technically:
1. **Prompt engineering for structured output** — I had to engineer a Claude prompt that reliably returns valid JSON with categorized spending, monthly data, and a 6-factor loan readiness score from raw transaction data. I added JSON extraction fallback for cases where Claude wraps the output in markdown.

2. **RAG for the chat** — Every chat message injects a compressed financial summary (income, expenses, savings rate, top categories) as context into Claude's system message. This means Claude always answers with the user's actual numbers, not generic advice.

3. **Flexible CSV parser** — Bank statement CSVs have no standard format. I built a parser that searches the first 5 rows for a header row, then uses fuzzy column matching (includes 'date', includes 'narration' OR 'description' OR 'particulars') to find the right columns without hardcoding column positions — including guarding against false matches like treating the Description column as Credit.

4. **Loan scoring model** — 6 weighted factors summing to 100: income regularity (20), average balance (20), obligation-to-income ratio (20), spending volatility (20), bounce rate (10), savings rate (10). The weights are based on the actual BSA criteria I've seen in production lending systems."
