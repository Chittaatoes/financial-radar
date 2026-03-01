# Financial Radar v1.0

## Overview
Financial Radar is a habit-driven personal finance web application. It helps users track assets (Cash, Bank, E-Wallet), manage income/expenses, set savings goals, and build financial discipline through subtle gamification (XP, Levels, Streaks, Finance Score).

**Positioning:** Calm Premium Habit-Based Finance System

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite 7 + Tailwind CSS 3 + Shadcn UI + Framer Motion
- **Backend:** Express.js 5 + TypeScript (serverless on Vercel via `serverless-http`)
- **Database:** PostgreSQL with Drizzle ORM (Supabase)
- **Auth:** Google OAuth2 (session-based, no JWT) with guest login support
- **Session Store:** PostgreSQL via `connect-pg-simple`
- **Charts:** Recharts
- **Routing:** Wouter
- **Animations:** Framer Motion
- **Package Manager:** npm (monorepo, root + frontend workspaces)

## Project Architecture
```
/
├── api/
│   └── index.ts                          # Serverless Express handler (Vercel function)
│
├── frontend/                             # React SPA (Vite)
│   ├── index.html                        # HTML entry point
│   ├── public/
│   │   ├── favicon.png
│   │   └── sounds/                       # Sound effect assets
│   ├── src/
│   │   ├── App.tsx                       # Auth-gated routing, onboarding flow
│   │   ├── main.tsx                      # React entry point
│   │   ├── index.css                     # Tailwind + theme CSS variables
│   │   ├── components/
│   │   │   ├── app-sidebar.tsx           # Desktop navigation sidebar
│   │   │   ├── mobile-nav.tsx            # Mobile bottom nav (5 tabs)
│   │   │   ├── mobile-fab.tsx            # Floating action button (income/expense/no-spend)
│   │   │   ├── add-action.tsx            # Shared add action logic
│   │   │   ├── add-action-desktop.tsx    # Desktop add action UI
│   │   │   ├── add-action-mobile.tsx     # Mobile add action UI
│   │   │   ├── setup-first-account-modal.tsx  # First-time account setup
│   │   │   ├── profile-author-footer.tsx # Author credit footer
│   │   │   ├── theme-provider.tsx        # Dark/light theme context
│   │   │   ├── theme-toggle.tsx          # Theme switch button
│   │   │   └── ui/                       # Shadcn UI components (40+ components)
│   │   │       ├── accordion.tsx
│   │   │       ├── alert-dialog.tsx
│   │   │       ├── avatar.tsx
│   │   │       ├── badge.tsx
│   │   │       ├── button.tsx
│   │   │       ├── calendar.tsx
│   │   │       ├── card.tsx
│   │   │       ├── chart.tsx
│   │   │       ├── currency-input.tsx    # IDR currency formatter input
│   │   │       ├── dialog.tsx
│   │   │       ├── drawer.tsx
│   │   │       ├── dropdown-menu.tsx
│   │   │       ├── form.tsx
│   │   │       ├── input.tsx
│   │   │       ├── progress.tsx
│   │   │       ├── select.tsx
│   │   │       ├── sheet.tsx
│   │   │       ├── sidebar.tsx
│   │   │       ├── skeleton.tsx
│   │   │       ├── tabs.tsx
│   │   │       ├── toast.tsx
│   │   │       ├── toaster.tsx
│   │   │       └── ... (more shadcn components)
│   │   ├── features/
│   │   │   ├── onboarding/
│   │   │   │   └── onboarding.tsx        # 3-slide onboarding flow + login
│   │   │   ├── score/
│   │   │   │   ├── score-page.tsx        # Full Finance Score page (diamond radar)
│   │   │   │   ├── score-ring.tsx        # Animated circular score ring
│   │   │   │   └── score-widget.tsx      # Compact dashboard score widget
│   │   │   └── gamification/
│   │   │       ├── xp-chip.tsx           # XP popup animation
│   │   │       ├── milestone-flame.tsx   # Streak flame (7 visual levels)
│   │   │       └── level-up-celebration.tsx  # Level up animation
│   │   ├── hooks/
│   │   │   ├── use-auth.ts              # Google Auth + guest login hook
│   │   │   ├── use-mobile.tsx           # Mobile viewport detection
│   │   │   ├── use-sound.ts            # Web Audio API sound effects
│   │   │   └── use-toast.ts            # Toast notification hook
│   │   ├── lib/
│   │   │   ├── api.ts                   # API_URL config (VITE_API_URL || "")
│   │   │   ├── queryClient.ts           # TanStack Query setup + apiRequest helper
│   │   │   ├── constants.ts             # XP thresholds, categories, formatters
│   │   │   ├── auth-utils.ts            # Auth error handling utilities
│   │   │   ├── i18n.tsx                 # Multi-language support (EN/ID)
│   │   │   └── utils.ts                # Tailwind cn() merge utility
│   │   └── pages/
│   │       ├── landing.tsx              # Landing page (unauthenticated)
│   │       ├── dashboard.tsx            # Main dashboard with score ring
│   │       ├── accounts.tsx             # Account CRUD (Cash/Bank/E-Wallet)
│   │       ├── transactions.tsx         # Transaction management + charts
│   │       ├── goals.tsx                # Smart Save savings goals
│   │       ├── debt-health.tsx          # Debt ratio analyzer (Level 5+)
│   │       ├── net-worth.tsx            # Net worth tracking (Level 7+)
│   │       ├── weekly-insight.tsx       # Weekly spending insight
│   │       ├── achievements.tsx         # Badge & achievement gallery
│   │       ├── profile.tsx              # User profile hub (mobile-first)
│   │       ├── admin.tsx                # Admin panel (admin role only)
│   │       └── not-found.tsx            # 404 page
│   ├── vite.config.ts                   # Vite build config + dev proxy (/api → :5001)
│   ├── tailwind.config.ts               # Tailwind theme config
│   ├── postcss.config.js                # PostCSS config
│   ├── components.json                  # Shadcn CLI config
│   ├── package.json                     # Frontend dependencies
│   └── .env.example                     # VITE_API_URL
│
├── backend/                             # Express API source code
│   ├── src/
│   │   ├── index.ts                     # Local dev entry point (app.listen on PORT)
│   │   ├── auth/
│   │   │   └── index.ts                 # Google OAuth2 + session setup + middleware
│   │   ├── routes/
│   │   │   └── index.ts                 # All API route handlers (~1650 lines)
│   │   ├── middleware/
│   │   │   └── logger.ts                # Request logging middleware
│   │   ├── storage.ts                   # Database access layer (Drizzle ORM)
│   │   └── db.ts                        # PostgreSQL connection pool (SSL in prod)
│   ├── tsconfig.json                    # Backend TypeScript config
│   ├── package.json                     # Backend dependencies (for reference)
│   └── .env.example                     # All backend env vars
│
├── shared/                              # Shared TypeScript types & Drizzle schemas
│   ├── schema.ts                        # All table definitions + Zod insert schemas
│   └── models/
│       └── auth.ts                      # Users + sessions table definitions
│
├── attached_assets/                     # User-uploaded assets (images, audio, text)
├── script/
│   └── build.ts                         # Replit deployment build script (esbuild)
│
├── vercel.json                          # Vercel routing + build config
├── drizzle.config.ts                    # Drizzle Kit config (schema push)
├── package.json                         # Root monorepo: scripts + all dependencies
├── tsconfig.json                        # Root TypeScript config
├── MASTER_DEPLOYMENT_GUIDE.txt          # Complete Vercel deployment guide
└── replit.md                            # This file
```

## Database Tables
- **users** — User accounts (id, email, firstName, lastName, profileImageUrl, role, isGuest)
- **sessions** — Express session store (auto-created by connect-pg-simple)
- **accounts** — Financial accounts (cash/bank/ewallet with balances)
- **transactions** — Income/expense/transfer records
- **goals** — Savings goals with target amount and deadline
- **liabilities** — Debt tracking (one_time or installment type)
- **user_profiles** — Gamification state (xp, level, streak, unlocked features, riskProfile, monthlyIncome, primaryGoal, habitType, focusAreas, scoreBonusToday, scoreBonusDate)
- **xp_logs** — XP gain history
- **streak_logs** — Daily streak activity log
- **badges** — 19 predefined badges across 4 categories
- **user_badges** — Tracks which badges each user has unlocked
- **daily_focus** — Daily missions (3 per day)
- **custom_categories** — User-defined transaction categories

## Key Features

### Core Finance
- Asset tracking with auto-balance updates on transactions
- Daily interaction system (transaction or "No Spending Today" = +5 XP)
- Transactions with date range filter + Spending Overview chart
- Dashboard Spending Insight with daily/weekly/monthly selector
- Masked amounts show "Rp..." format instead of dots
- Smart Save daily suggestion calculator
- Debt Health Analyzer with DSR-based cashflow pressure (Level 5+)
- Net Worth Tracking with asset vs liability breakdown (Level 7+)
- Weekly spending insight with category breakdown

### V1.0 Features
- **Onboarding Flow:** 3-slide questionnaire (primary goal, habit type, focus areas) → Google or Guest login
- **Guest Login:** Anonymous account with UUID, upgradeable to Google later
- **Finance Score:** 4-component scoring (spending 25pts, wealth 25pts, debt 20pts, consistency 15pts) with tiers (Bronze/Silver/Gold/Platinum/Diamond)
- **Mobile-First Layout:** Bottom nav (Dashboard, Transaksi, Goals, Rekening, Profile), centered FAB, Profile as mobile hub
- **Streak Milestone Flame:** 7 progressive visual levels at 3d, 7d, 30d, 90d, 180d, 365d
- **Framer Motion Animations:** Onboarding slides, score ring, FAB cascade, XP chip popup, level-up celebration

### Gamification
- XP/Level system with identity tiers (Financial Starter → Wealth Architect)
- Badge & Achievement system: 19 badges across 4 categories (starter, consistency, milestone, mastery)
- Streak system with weekly revives (3 revives per week)
- Daily Focus missions (3 per day, auto-checked)
- Score Bonus XP system with daily limits
- Sound effects with Web Audio API (toggle in Profile settings, persisted to localStorage)

## API Routes
- `/api/auth/*` — Authentication (login, callback, user, logout)
- `/api/profile` — User profile (XP, level, streak)
- `/api/dashboard` — Aggregated dashboard data
- `/api/accounts` — CRUD for financial accounts
- `/api/transactions` — CRUD for transactions + auto balance updates
- `/api/no-spending` — Record "no spending today" (+5 XP)
- `/api/goals` — CRUD for savings goals + deposit
- `/api/smart-save` — AI-like savings recommendation
- `/api/liabilities` — CRUD for debt records
- `/api/debt-health` — Debt ratio analysis (Level 5+)
- `/api/net-worth` — Net worth tracking (Level 7+)
- `/api/spending-insight` — Weekly/monthly spending breakdown
- `/api/streak/revive` — Use weekly revive for broken streak
- `/api/daily-focus` — Daily missions (3 per day)
- `/api/custom-categories` — User-defined categories
- `/api/guest-login` — Create guest account
- `/api/admin/*` — Admin-only routes (user management)

## Development Setup
- **Dev command:** `npm run dev` runs backend (port 5001) and frontend (port 5000) concurrently
- **Vite proxy:** Frontend proxies `/api` requests to backend at `http://localhost:5001`
- **Public port:** 5000 (Vite dev server, publicly accessible on Replit)
- **Frontend API URL:** Empty string (same-origin via Vite proxy in dev, same domain on Vercel)
- **Backend entry (dev):** `backend/src/index.ts` — Express with `app.listen()`
- **Backend entry (Vercel):** `api/index.ts` — Express wrapped with `serverless-http`, no `app.listen()`

## Deployment (Vercel — Single Project)
- **Single Vercel project** hosts both frontend (static) and backend (serverless)
- `api/index.ts` wraps Express with `serverless-http` — no `app.listen()`
- `vercel.json` routes `/api/*` to the serverless function, everything else to frontend SPA
- **No CORS needed** in production (frontend and API on same domain)
- **Env vars on Vercel:** `DATABASE_URL`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`, `NODE_ENV=production`
- **NOT needed on Vercel:** `FRONTEND_URL`, `VITE_API_URL`, `PORT` (same domain)
- See `MASTER_DEPLOYMENT_GUIDE.txt` for complete step-by-step

## Authentication
- **Google OAuth2:** Session-based (no JWT). Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`
- **Guest Login:** Creates anonymous user via `POST /api/guest-login`
- **Session Store:** PostgreSQL via `connect-pg-simple` (auto-creates `sessions` table)
- **Cookie Config (prod):** `secure: true`, `httpOnly: true`, `sameSite: "none"`
- **Logout:** `POST /api/auth/logout` (JSON) or `GET /api/logout` (redirect)

## Environment Variables
| Variable | Where | Description |
|---|---|---|
| `DATABASE_URL` | Backend + Vercel | Supabase PostgreSQL connection string |
| `SESSION_SECRET` | Backend + Vercel | Session cookie signing secret (32+ chars) |
| `GOOGLE_CLIENT_ID` | Backend + Vercel | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Backend + Vercel | Google OAuth client secret |
| `APP_URL` | Backend + Vercel | Public URL of the app (for OAuth redirect URI) |
| `NODE_ENV` | Vercel only | Set to `production` |
| `PORT` | Dev only | Backend port (default 5001 in dev) |
| `FRONTEND_URL` | Dev only (optional) | Frontend URL for redirects (not needed on Vercel) |
| `VITE_API_URL` | Dev only (optional) | Backend URL for frontend (not needed on Vercel) |
| `SUPER_ADMIN_EMAIL` | Optional | First user with this email gets admin role |

## i18n System
- `frontend/src/lib/i18n.tsx` — LanguageProvider context with `useLanguage()` hook
- Full translation dictionaries for English (`en`) and Indonesian (`id`)
- Language toggle in sidebar footer and mobile Profile page

## Design System
- Theme: Calm Premium Minimal
- Colors: Soft green primary (#3d9d5c), neutral beige backgrounds
- Typography: Plus Jakarta Sans (sans), Playfair Display (serif), JetBrains Mono (mono)
- Dark mode supported (class-based toggle)
- Shadcn UI components throughout (40+ components)
- Hover-elevate effects on interactive Card components
- Framer Motion for smooth transitions and micro-interactions

## User Preferences
- Indonesian Rupiah (IDR) currency format
- Indonesian target audience (20-35 age range)
- Default language: English (persisted to localStorage)
