CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category_id" uuid;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'products_category_id_categories_id_fk'
	) THEN
		ALTER TABLE "products"
		ADD CONSTRAINT "products_category_id_categories_id_fk"
		FOREIGN KEY ("category_id")
		REFERENCES "public"."categories"("id")
		ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
