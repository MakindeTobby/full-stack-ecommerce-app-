import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { product_variants, products } from "./catalog";
import { addresses, users } from "./users";

export const carts = pgTable("carts", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  user_id: uuid("user_id").references(() => users.id),
  session_token: varchar("session_token", { length: 255 }),
  coupon_code: varchar("coupon_code", { length: 64 }).default(""),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const cart_items = pgTable("cart_items", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  cart_id: uuid("cart_id")
    .references(() => carts.id)
    .notNull(),
  product_id: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  variant_id: uuid("variant_id").references(() => product_variants.id),
  name_snapshot: text("name_snapshot"),
  sku: varchar("sku", { length: 128 }),
  quantity: integer("quantity").notNull().default(1),
  unit_price: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  address_id: uuid("address_id").references(() => addresses.id),
  total_amount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("NGN"),
  status: varchar("status", { length: 32 }).default("pending"),
  payment_status: varchar("payment_status", { length: 32 }).default("unpaid"),
  shipping_provider: varchar("shipping_provider", { length: 128 }),
  shipping_tracking: varchar("shipping_tracking", { length: 128 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const order_items = pgTable("order_items", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  order_id: uuid("order_id")
    .references(() => orders.id)
    .notNull(),
  product_id: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  variant_id: uuid("variant_id").references(() => product_variants.id),
  quantity: integer("quantity").notNull(),
  unit_price: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  name_snapshot: text("name_snapshot"),
  sku_snapshot: varchar("sku_snapshot", { length: 128 }),
  created_at: timestamp("created_at").defaultNow(),
});

export const order_status_history = pgTable("order_status_history", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  order_id: uuid("order_id")
    .references(() => orders.id)
    .notNull(),
  from_status: varchar("from_status", { length: 32 }),
  to_status: varchar("to_status", { length: 32 }).notNull(),
  actor: varchar("actor", { length: 32 }).default("system"),
  changed_by_user_id: uuid("changed_by_user_id").references(() => users.id),
  note: text("note"),
  created_at: timestamp("created_at").defaultNow(),
});

export const product_reviews = pgTable("product_reviews", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  product_id: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  order_id: uuid("order_id").references(() => orders.id),
  rating: integer("rating").notNull(),
  title: varchar("title", { length: 160 }),
  body: text("body"),
  status: varchar("status", { length: 24 }).notNull().default("pending"),
  is_verified_purchase: boolean("is_verified_purchase")
    .notNull()
    .default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
