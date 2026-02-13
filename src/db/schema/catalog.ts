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

export const categories = pgTable("categories", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  name: varchar("name", { length: 128 }).notNull().unique(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  category_id: uuid("category_id").references(() => categories.id),
  name_en: text("name_en").notNull(),
  name_cn: text("name_cn"),
  description: text("description"),
  meta_title: varchar("meta_title", { length: 255 }),
  meta_description: text("meta_description"),
  base_price: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
  old_price: numeric("old_price", { precision: 12, scale: 2 }),
  sku: varchar("sku", { length: 128 }),
  barcode: varchar("barcode", { length: 128 }),
  weight_kg: numeric("weight_kg", { precision: 8, scale: 3 }),
  width_cm: numeric("width_cm", { precision: 8, scale: 2 }),
  height_cm: numeric("height_cm", { precision: 8, scale: 2 }),
  depth_cm: numeric("depth_cm", { precision: 8, scale: 2 }),
  published: boolean("published").default(false),
  publish_at: timestamp("publish_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const product_variants = pgTable("product_variants", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  product_id: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  sku: varchar("sku", { length: 128 }),
  barcode: varchar("barcode", { length: 128 }),
  attributes: text("attributes"),
  price: numeric("price", { precision: 12, scale: 2 }),
  stock: integer("stock").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const product_media = pgTable("product_media", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  product_id: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  url: text("url").notNull(),
  type: varchar("type", { length: 16 }).default("image"),
  position: integer("position").default(0),
  alt_text: varchar("alt_text", { length: 255 }),
  public_id: varchar("public_id", { length: 255 }),
});

export const bulk_pricing = pgTable("bulk_pricing", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  product_id: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  min_qty: integer("min_qty").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
});

export const tags = pgTable("tags", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
});

export const product_tags = pgTable("product_tags", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  product_id: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  tag_id: uuid("tag_id")
    .references(() => tags.id)
    .notNull(),
});

export const inventory_logs = pgTable("inventory_logs", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  variant_id: uuid("variant_id")
    .references(() => product_variants.id)
    .notNull(),
  change: integer("change").notNull(),
  reason: varchar("reason", { length: 255 }),
  reference: varchar("reference", { length: 128 }),
  created_at: timestamp("created_at").defaultNow(),
});
