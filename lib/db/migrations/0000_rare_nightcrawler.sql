CREATE TYPE "public"."mission_status" AS ENUM('draft', 'simulated', 'planned');--> statement-breakpoint
CREATE TYPE "public"."mission_type" AS ENUM('CAPTURE', 'DEORBIT', 'NUDGE');--> statement-breakpoint
CREATE TYPE "public"."object_type" AS ENUM('DEBRIS', 'PAYLOAD', 'ROCKET BODY', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."rcs_size" AS ENUM('SMALL', 'MEDIUM', 'LARGE');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('WARNING', 'WATCH', 'ALERT');--> statement-breakpoint
CREATE TABLE "conjunction_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object1_id" uuid NOT NULL,
	"object2_id" uuid NOT NULL,
	"time_of_closest_approach" timestamp NOT NULL,
	"miss_distance_km" real NOT NULL,
	"relative_speed_kms" real,
	"collision_probability" real,
	"severity" "severity" NOT NULL,
	"is_resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "debris_objects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"norad_id" integer NOT NULL,
	"name" text NOT NULL,
	"international_designator" text,
	"tle_line1" text NOT NULL,
	"tle_line2" text NOT NULL,
	"object_type" "object_type" DEFAULT 'UNKNOWN',
	"country" text,
	"launch_date" date,
	"decay_date" date,
	"period_minutes" real,
	"inclination_deg" real,
	"apogee_km" integer,
	"perigee_km" integer,
	"rcs_size" "rcs_size",
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "debris_objects_norad_id_unique" UNIQUE("norad_id")
);
--> statement-breakpoint
CREATE TABLE "mission_simulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"target_norad_ids" integer[] NOT NULL,
	"mission_type" "mission_type" NOT NULL,
	"estimated_delta_v_ms" real,
	"estimated_duration_days" integer,
	"estimated_risk_reduction_pct" real,
	"ai_insights" text,
	"launch_window_start" timestamp,
	"launch_window_end" timestamp,
	"status" "mission_status" DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "risk_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debris_id" uuid NOT NULL,
	"risk_score" real NOT NULL,
	"risk_level" "risk_level" NOT NULL,
	"collision_probability" real,
	"closest_approach_km" real,
	"closest_approach_time" timestamp,
	"relative_velocity_kms" real,
	"nearby_object_count" integer DEFAULT 0,
	"assessed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"objects_fetched" integer,
	"objects_upserted" integer,
	"duration_ms" integer,
	"error" text,
	"synced_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "conjunction_events" ADD CONSTRAINT "conjunction_events_object1_id_debris_objects_id_fk" FOREIGN KEY ("object1_id") REFERENCES "public"."debris_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conjunction_events" ADD CONSTRAINT "conjunction_events_object2_id_debris_objects_id_fk" FOREIGN KEY ("object2_id") REFERENCES "public"."debris_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_debris_id_debris_objects_id_fk" FOREIGN KEY ("debris_id") REFERENCES "public"."debris_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conjunction_tca_idx" ON "conjunction_events" USING btree ("time_of_closest_approach");--> statement-breakpoint
CREATE INDEX "conjunction_severity_idx" ON "conjunction_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "debris_norad_idx" ON "debris_objects" USING btree ("norad_id");--> statement-breakpoint
CREATE INDEX "debris_type_idx" ON "debris_objects" USING btree ("object_type");--> statement-breakpoint
CREATE INDEX "risk_debris_idx" ON "risk_assessments" USING btree ("debris_id");--> statement-breakpoint
CREATE INDEX "risk_level_idx" ON "risk_assessments" USING btree ("risk_level");