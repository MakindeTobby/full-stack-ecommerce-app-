CREATE TABLE IF NOT EXISTS "order_status_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "from_status" varchar(32),
  "to_status" varchar(32) NOT NULL,
  "actor" varchar(32) DEFAULT 'system',
  "changed_by_user_id" uuid,
  "note" text,
  "created_at" timestamp DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'order_status_history_order_id_orders_id_fk'
  ) THEN
    ALTER TABLE "order_status_history"
      ADD CONSTRAINT "order_status_history_order_id_orders_id_fk"
      FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'order_status_history_changed_by_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "order_status_history"
      ADD CONSTRAINT "order_status_history_changed_by_user_id_users_id_fk"
      FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;
