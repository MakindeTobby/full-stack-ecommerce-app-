CREATE TABLE "product_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "order_id" uuid,
  "rating" integer NOT NULL,
  "title" varchar(160),
  "body" text,
  "status" varchar(24) DEFAULT 'pending' NOT NULL,
  "is_verified_purchase" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

ALTER TABLE "product_reviews"
  ADD CONSTRAINT "product_reviews_product_id_products_id_fk"
  FOREIGN KEY ("product_id")
  REFERENCES "public"."products"("id")
  ON DELETE cascade
  ON UPDATE no action;

ALTER TABLE "product_reviews"
  ADD CONSTRAINT "product_reviews_user_id_users_id_fk"
  FOREIGN KEY ("user_id")
  REFERENCES "public"."users"("id")
  ON DELETE cascade
  ON UPDATE no action;

ALTER TABLE "product_reviews"
  ADD CONSTRAINT "product_reviews_order_id_orders_id_fk"
  FOREIGN KEY ("order_id")
  REFERENCES "public"."orders"("id")
  ON DELETE set null
  ON UPDATE no action;

CREATE UNIQUE INDEX "product_reviews_user_product_unique_idx"
  ON "product_reviews" ("user_id", "product_id");

CREATE INDEX "product_reviews_product_status_idx"
  ON "product_reviews" ("product_id", "status", "created_at");
