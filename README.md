# Farmers App

A web app (works on laptop and mobile browsers, installable as a PWA) for farmers and buyers:

1. **AI disease scanner** — upload/photograph a crop, get an AI diagnosis with treatment guidance.
2. **Direct marketplace** — farmers list produce for sale, buyers browse and purchase directly.
3. **Login with email or phone number.**
4. **Real-time chat** between buyers and farmers.
5. **Notifications, guidelines, and a catalog/inventory** for farmers to manage listings.

## Stack

- **Backend**: Node.js + TypeScript + Express + Prisma (SQLite for local dev, swap to PostgreSQL for
  production by changing `provider` in `backend/prisma/schema.prisma` and `DATABASE_URL`).
- **Web**: Next.js (App Router) + TypeScript + Tailwind CSS. Responsive — same codebase serves laptop
  browsers and mobile browsers, and can be installed on a phone home screen (PWA).
- **Realtime**: Socket.io (added in the chat phase).
- **AI**: Anthropic API (vision) for the disease scanner (added in that phase).

> Native mobile (Flutter/React Native) wasn't used because this machine has no Flutter/Android/iOS SDKs
> installed, and iOS apps can't be built on Windows regardless. The Next.js app is responsive and
> installable, covering both laptop and mobile without a native toolchain. React Native can be added later
> against the same backend API if app-store distribution is needed.

## Project layout

```
farmers-app/
  backend/     Express API + Prisma schema/migrations
  web/         Next.js frontend
```

## Running locally

**Backend** (http://localhost:4000):

```bash
cd backend
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts   # loads starter guidelines content
npm run dev
```

To enable the AI disease scanner, put a real key in `backend/.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Without a key, the scanner endpoint returns a clear "not configured" error instead of failing silently —
every other feature works normally.

**Web** (http://localhost:3000):

```bash
cd web
npm install
npm run dev
```

## Features (all built and tested)

1. **AI disease scanner** (`/scanner`) — take/upload a crop photo, get an AI diagnosis (Claude Opus 5
   vision, structured output) with severity, symptoms, and treatment steps. Scan history is saved per user.
2. **Marketplace** (`/marketplace`, `/inventory`, `/orders`) — farmers list produce with quantity/price,
   buyers browse/search and order directly; inventory auto-decrements; farmers confirm/cancel/complete orders.
3. **Auth** (`/login`, `/register`) — email or phone number + password, JWT sessions, farmer/buyer roles.
4. **Chat** (`/messages`) — real-time messaging between a buyer and a farmer via Socket.io, tied to a
   listing conversation.
5. **Notifications** — bell icon with unread badge, real-time push on new orders, order status changes,
   and new messages.
6. **Guidelines** (`/guidelines`) — curated tips by category (getting started, crop health, selling, safety).

## Known limitations for a production deploy

- SQLite is for local dev only — swap `provider` to `"postgresql"` in `backend/prisma/schema.prisma` and
  set a real `DATABASE_URL` before deploying.
- Uploaded scan photos are stored on local disk (`backend/uploads/`) — move to S3/Cloudflare R2 for
  production so it survives redeploys and scales.
- No SMS/email delivery for notifications yet — they're in-app (bell + Socket.io) only.
