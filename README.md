# Queen Beulah Commerce

Production-style ecommerce platform built with Next.js App Router, PostgreSQL, Drizzle ORM, and NextAuth.

This project was built as a portfolio-grade full-stack commerce application with a strong focus on:
- real business flows (guest cart, checkout, coupons, flash sales, order lifecycle)
- admin operations (catalog, promotions, reviews, analytics)
- secure API behavior (ownership checks, server-side auth enforcement)
- product readiness (pagination, notifications, payment callbacks, moderation workflows)

## Highlights

- Customer storefront:
  - products, categories, search, and pagination
  - product variants with stock checks
  - rich product descriptions
  - live product presence (`"X people are viewing this"`)
  - reviews with verified-purchase gating

- Cart and checkout:
  - guest cart + merge-on-login flow
  - coupon application and redemption constraints
  - flash sale pricing support
  - Paystack payment initialization/callback/webhook integration

- Orders:
  - order creation and item snapshots
  - payment status updates
  - order status transitions (`pending -> processing -> shipped -> delivered/cancelled`)
  - customer/admin timeline history
  - SSE live order updates

- Admin:
  - products, variants, media management
  - categories, coupons, flash sales
  - campaign manager (banner/popup scheduling + caps + delay)
  - review moderation queue
  - analytics dashboard + CSV exports

- Notifications:
  - magic link/auth mail flow
  - order created / payment confirmed / status changed emails

## Tech Stack

- Framework: `Next.js 16` (App Router)
- Language: `TypeScript`
- DB: `PostgreSQL`
- ORM: `Drizzle ORM` + `drizzle-kit`
- Auth: `NextAuth`
- Validation: `Zod`
- Styling/UI: `Tailwind CSS`, custom UI components
- Realtime:
  - `SSE` for order updates
  - lightweight in-memory product presence counter
- Payments: `Paystack`
- Email: `Nodemailer`

## Project Structure

- `src/app`: routes, pages, API handlers
- `src/db/schema`: database schema modules
- `src/lib/db/queries`: read/query layer
- `src/lib/db/transactions`: transactional business logic
- `src/lib/validation`: Zod schemas
- `src/components`: reusable UI and client logic
- `migrations`: SQL migrations

## Getting Started

### 1) Install dependencies

```bash
pnpm install
```

### 2) Configure environment variables

Create `.env` and set at least:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/queen_beulah

NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

PAYSTACK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_WEBHOOK_SECRET=sk_test_...   # optional fallback uses PAYSTACK_SECRET_KEY

SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM="Queen Beulah <no-reply@yourdomain.com>"
```

If using Cloudinary uploads:

```bash
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 3) Run migrations

```bash
pnpm db:migrate
```

### 4) Start dev server

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Useful Scripts

```bash
pnpm dev
pnpm build
pnpm start

pnpm lint
pnpm format

pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
pnpm db:status
pnpm db:seed
```

## Payment (Paystack) Endpoints

- Initialize: `POST /api/payments/paystack/initialize`
- Callback: `GET /api/payments/paystack/callback`
- Webhook: `POST /api/payments/paystack/webhook`

For local webhook testing, expose your app with a tunnel and point Paystack callback/webhook URLs to that public URL.

## Portfolio Notes

This repository demonstrates:
- end-to-end feature ownership (DB -> API -> UI)
- business logic correctness and edge-case handling
- security hardening for common ecommerce APIs
- iterative product refinement across UX, admin tooling, and observability

## Screenshots (Template)

Add your screenshots here before sharing the project publicly.

### Storefront

- Home / Product grid  
  `![Storefront Home](./docs/screenshots/storefront-home.png)`
- Product details (variants + rich description + reviews)  
  `![Product Details](./docs/screenshots/product-details.png)`
- Cart + coupon  
  `![Cart](./docs/screenshots/cart-coupon.png)`
- Checkout + payment redirect  
  `![Checkout](./docs/screenshots/checkout.png)`

### Customer Account

- Orders list  
  `![Orders](./docs/screenshots/orders-list.png)`
- Order details + timeline  
  `![Order Timeline](./docs/screenshots/order-timeline.png)`

### Admin

- Analytics dashboard  
  `![Admin Analytics](./docs/screenshots/admin-analytics.png)`
- Product editor (variants + media + description preview)  
  `![Admin Product Edit](./docs/screenshots/admin-product-edit.png)`
- Promotions/campaigns  
  `![Admin Campaigns](./docs/screenshots/admin-campaigns.png)`
- Review moderation  
  `![Admin Reviews](./docs/screenshots/admin-reviews.png)`

### Optional Demo Assets

- GIF: add-to-cart to checkout flow
- GIF: admin status update and customer timeline update
- GIF: campaign popup/banner behavior

---

If you want a walkthrough of key files or architecture decisions, see `docs/` or request a deep-dive section.
