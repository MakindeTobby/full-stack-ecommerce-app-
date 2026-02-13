CREATE TABLE "campaigns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(160) NOT NULL,
  "type" varchar(32) DEFAULT 'popup' NOT NULL,
  "title" varchar(200) NOT NULL,
  "body" text,
  "media_url" text,
  "cta_label" varchar(80),
  "cta_url" text,
  "audience" varchar(32) DEFAULT 'all' NOT NULL,
  "is_active" boolean DEFAULT false NOT NULL,
  "start_at" timestamp,
  "end_at" timestamp,
  "priority" integer DEFAULT 1 NOT NULL,
  "frequency_mode" varchar(32) DEFAULT 'once_per_session' NOT NULL,
  "frequency_max_total" integer,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE "campaign_impressions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" uuid NOT NULL,
  "user_id" uuid,
  "guest_key" varchar(128),
  "event" varchar(24) DEFAULT 'shown' NOT NULL,
  "created_at" timestamp DEFAULT now()
);

ALTER TABLE "campaign_impressions"
  ADD CONSTRAINT "campaign_impressions_campaign_id_campaigns_id_fk"
  FOREIGN KEY ("campaign_id")
  REFERENCES "public"."campaigns"("id")
  ON DELETE cascade
  ON UPDATE no action;

ALTER TABLE "campaign_impressions"
  ADD CONSTRAINT "campaign_impressions_user_id_users_id_fk"
  FOREIGN KEY ("user_id")
  REFERENCES "public"."users"("id")
  ON DELETE set null
  ON UPDATE no action;

CREATE INDEX "campaigns_active_idx"
  ON "campaigns" ("is_active", "start_at", "end_at", "priority");

CREATE INDEX "campaign_impressions_campaign_idx"
  ON "campaign_impressions" ("campaign_id", "event", "created_at");

CREATE INDEX "campaign_impressions_actor_idx"
  ON "campaign_impressions" ("user_id", "guest_key", "created_at");
