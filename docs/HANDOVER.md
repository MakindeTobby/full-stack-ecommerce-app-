# Queen Beulah Handover Guide

## Codebase Shape
- `src/app`: Next.js routes (server + client UI).
- `src/components`: reusable UI and feature components.
- `src/lib`: business logic (queries, transactions, validation, pricing, mail).
- `src/db`: Drizzle setup and schema definitions.

## Database Schema Layout
The previous monolithic schema file was split into domain modules:
- `src/db/schema/catalog.ts`
  - categories, products, variants, media, tags, inventory logs
- `src/db/schema/users.ts`
  - users, verification tokens, addresses
- `src/db/schema/commerce.ts`
  - carts, cart items, orders, order items
- `src/db/schema/promotions.ts`
  - coupons, coupon redemptions, flash sales
- `src/db/schema/index.ts`
  - exports all tables
- `src/db/schema.ts`
  - compatibility barrel (`export * from "./schema"`)

## Conventions
- Keep route handlers thin (`src/app/api/*`).
- Put read operations in `src/lib/db/queries/*`.
- Put write/transaction logic in `src/lib/db/transactions/*`.
- Validate external input with zod schemas in `src/lib/validation/*`.
- Prefer server session as source of truth for auth ownership.

## Recommended Next Refactors
1. Split `src/lib/db/queries/product.ts` into:
   - `product.catalog.ts` (storefront queries)
   - `product.admin.ts` (admin queries)
2. Split `src/lib/db/transactions/products.ts` into:
   - `products.create.ts`
   - `products.update.ts`
   - `products.delete.ts`
3. Introduce shared API response helpers:
   - success/error payload builders
   - pagination serializer
4. Add `tests/e2e` for critical flows:
   - guest cart + merge
   - coupon enforcement
   - order creation/payment status
