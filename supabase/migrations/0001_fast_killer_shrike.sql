ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "addons_json" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "addons_signature" varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "addons_total" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "addons_json" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "addons_signature" varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "addons_total" numeric(12, 2) DEFAULT '0' NOT NULL;
