import { sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { products } from "./catalog";
import { orders } from "./commerce";
import { users } from "./users";

export const coupons = pgTable("coupons", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  description: text("description"),
  discount_type: varchar("discount_type", { length: 32 }).notNull(),
  discount_value: numeric("discount_value", {
    precision: 12,
    scale: 2,
  }).notNull(),
  min_order_amount: numeric("min_order_amount", { precision: 12, scale: 2 }),
  max_redemptions: integer("max_redemptions"),
  per_customer_limit: integer("per_customer_limit").default(1),
  starts_at: timestamp("starts_at"),
  expires_at: timestamp("expires_at"),
  active: boolean("active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

export const coupon_redemptions = pgTable("coupon_redemptions", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  coupon_id: uuid("coupon_id")
    .references(() => coupons.id)
    .notNull(),
  user_id: uuid("user_id").references(() => users.id),
  order_id: uuid("order_id").references(() => orders.id),
  created_at: timestamp("created_at").defaultNow(),
});

export const flash_sales = pgTable("flash_sales", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  discount_type: text("discount_type").notNull(),
  discount_value: decimal("discount_value", {
    precision: 12,
    scale: 2,
  }).notNull(),
  starts_at: timestamp("starts_at").notNull(),
  ends_at: timestamp("ends_at").notNull(),
  priority: integer("priority").default(1),
  created_at: timestamp("created_at").defaultNow(),
});

export const flash_sale_products = pgTable("flash_sale_products", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  flash_sale_id: uuid("flash_sale_id")
    .references(() => flash_sales.id)
    .notNull(),
  product_id: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  override_discount_type: text("override_discount_type"),
  override_discount_value: numeric("override_discount_value", {
    precision: 12,
    scale: 2,
  }),
});

export const campaigns = pgTable("campaigns", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  type: varchar("type", { length: 32 }).notNull().default("popup"),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body"),
  media_url: text("media_url"),
  cta_label: varchar("cta_label", { length: 80 }),
  cta_url: text("cta_url"),
  audience: varchar("audience", { length: 32 }).notNull().default("all"),
  is_active: boolean("is_active").notNull().default(false),
  start_at: timestamp("start_at"),
  end_at: timestamp("end_at"),
  priority: integer("priority").notNull().default(1),
  trigger_delay_seconds: integer("trigger_delay_seconds").notNull().default(0),
  frequency_mode: varchar("frequency_mode", { length: 32 })
    .notNull()
    .default("once_per_session"),
  frequency_max_total: integer("frequency_max_total"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const campaign_impressions = pgTable("campaign_impressions", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  campaign_id: uuid("campaign_id")
    .references(() => campaigns.id)
    .notNull(),
  user_id: uuid("user_id").references(() => users.id),
  guest_key: varchar("guest_key", { length: 128 }),
  event: varchar("event", { length: 24 }).notNull().default("shown"),
  created_at: timestamp("created_at").defaultNow(),
});
