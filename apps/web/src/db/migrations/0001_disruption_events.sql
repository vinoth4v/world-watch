CREATE TABLE "disruption_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dedupe_key" text NOT NULL,
	"category" text NOT NULL,
	"subtype" text NOT NULL,
	"severity" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"region" text,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"geometry_precision" text DEFAULT 'point' NOT NULL,
	"first_seen" timestamp with time zone NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"confidence" text NOT NULL,
	"sources" jsonb NOT NULL,
	CONSTRAINT "disruption_events_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"tier" integer,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"region" text
);
--> statement-breakpoint
CREATE TABLE "feed_ingestions" (
	"source" text PRIMARY KEY NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"last_success_at" timestamp with time zone,
	"last_error" text,
	"event_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "disruption_events_category_idx" ON "disruption_events" USING btree ("category");
--> statement-breakpoint
CREATE INDEX "disruption_events_status_idx" ON "disruption_events" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "disruption_events_first_seen_idx" ON "disruption_events" USING btree ("first_seen");
--> statement-breakpoint
CREATE INDEX "sites_kind_idx" ON "sites" USING btree ("kind");
