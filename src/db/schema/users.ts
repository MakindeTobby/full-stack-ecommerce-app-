import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 32 }).default("customer"),
  created_at: timestamp("created_at").defaultNow(),
});

export const verification_tokens = pgTable("verification_tokens", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  identifier: varchar("identifier", { length: 254 }).notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expires: timestamp("expires").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  label: varchar("label", { length: 64 }),
  full_name: varchar("full_name", { length: 255 }),
  phone: varchar("phone", { length: 32 }),
  street: text("street"),
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 128 }),
  postal_code: varchar("postal_code", { length: 32 }),
  country: varchar("country", { length: 128 }),
  created_at: timestamp("created_at").defaultNow(),
});
