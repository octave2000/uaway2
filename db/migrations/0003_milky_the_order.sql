CREATE TABLE "admin_grants" (
	"user_id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"subject_id" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"payment_id" text NOT NULL,
	"debit" text NOT NULL,
	"credit" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_entries_key_unique" UNIQUE("key"),
	CONSTRAINT "ledger_positive" CHECK ("ledger_entries"."amount_minor" > 0),
	CONSTRAINT "ledger_balanced_accounts" CHECK ("ledger_entries"."debit" <> "ledger_entries"."credit")
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"href" text NOT NULL,
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "provider_events" (
	"id" text PRIMARY KEY NOT NULL,
	"checkout_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_tokens" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"reason" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"external_reference" text,
	"recorded_by" text,
	"reconciled_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refunds_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE "support_cases" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"booking_id" text,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"kind" text NOT NULL,
	"private" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'daraja';--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "inventory_held" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "fare_minor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "fee_minor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "boarded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "boarding_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "disputed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "verification_note" text;--> statement-breakpoint
ALTER TABLE "journeys" ADD COLUMN "pickup_instructions" text;--> statement-breakpoint
ALTER TABLE "journeys" ADD COLUMN "dropoff_instructions" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "amount_minor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "next_check_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "payout_requests" ADD COLUMN "external_reference" text;--> statement-breakpoint
ALTER TABLE "payout_requests" ADD COLUMN "recorded_by" text;--> statement-breakpoint
ALTER TABLE "payout_requests" ADD COLUMN "reconciled_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "suspended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "session_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_note" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "admin_totp_secret" text;--> statement-breakpoint
ALTER TABLE "admin_grants" ADD CONSTRAINT "admin_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox" ADD CONSTRAINT "outbox_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_tokens" ADD CONSTRAINT "recovery_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_cases" ADD CONSTRAINT "support_cases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_cases" ADD CONSTRAINT "support_cases_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
-- Legacy amounts were whole KES. Snapshot them without rewriting financial history.
UPDATE payments SET amount_minor = amount * 100;
--> statement-breakpoint
UPDATE bookings b SET fare_minor = COALESCE((SELECT p.amount * 100 FROM payments p WHERE p.booking_id = b.id ORDER BY p.created_at LIMIT 1), j.price_per_seat * b.seats_booked * 100), inventory_held = b.status IN ('confirmed', 'completed') FROM journeys j WHERE b.journey_id = j.id;
--> statement-breakpoint
-- Do not trust legacy self-editable admin roles. Administrators are explicitly provisioned.
UPDATE users SET default_role = 'passenger' WHERE default_role = 'super_admin';
--> statement-breakpoint
CREATE UNIQUE INDEX "booking_idempotency_idx" ON "bookings" USING btree ("client_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_active_idx" ON "bookings" USING btree ("client_id","journey_id") WHERE "bookings"."status" NOT IN ('cancelled', 'payment_failed');--> statement-breakpoint
CREATE INDEX "booking_journey_idx" ON "bookings" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "cars_owner_idx" ON "cars" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "journeys_search_idx" ON "journeys" USING btree ("status","departure_time");--> statement-breakpoint
CREATE INDEX "journeys_driver_idx" ON "journeys" USING btree ("driver_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_provider_idx" ON "payments" USING btree ("provider","provider_transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_reference_idx" ON "payments" USING btree ("provider","reference");--> statement-breakpoint
CREATE INDEX "payment_booking_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payout_active_idx" ON "payout_requests" USING btree ("payment_id") WHERE "payout_requests"."status" <> 'rejected';--> statement-breakpoint
CREATE UNIQUE INDEX "review_client_journey_idx" ON "reviews" USING btree ("client_id","journey_id");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "booking_capacity" CHECK ("bookings"."seats_booked" > 0 AND "bookings"."luggage_space" >= 0);--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "car_capacity" CHECK ("cars"."seats" > 0 AND "cars"."luggage_capacity" >= 0);--> statement-breakpoint
ALTER TABLE "journeys" ADD CONSTRAINT "journey_capacity" CHECK ("journeys"."seats_available" >= 0 AND "journeys"."luggage_capacity" >= 0);--> statement-breakpoint
ALTER TABLE "journeys" ADD CONSTRAINT "journey_price" CHECK ("journeys"."price_per_seat" >= 50);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payment_amount" CHECK ("payments"."amount" > 0 AND "payments"."amount_minor" >= 0);--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "review_rating" CHECK ("reviews"."rating" BETWEEN 1 AND 5);