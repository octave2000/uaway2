import { sql } from "drizzle-orm";
import type { AdapterAccountType } from "@auth/core/adapters";
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }),
  image: text("image"),
  profilePhoto: text("profile_photo"),
  passwordHash: text("password_hash"),
  idPhoto: text("id_photo"),
  selfiePhoto: text("selfie_photo"),
  verified: boolean("verified").default(false),
  phone: text("phone"),
  suspended: boolean("suspended").default(false).notNull(),
  sessionVersion: integer("session_version").default(0).notNull(),
  verificationNote: text("verification_note"),
  adminTotpSecret: text("admin_totp_secret"),
  defaultRole: text("default_role", {
    enum: ["passenger", "driver", "super_admin"],
  }),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    compositePk: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
  }),
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (table) => ({
    compositePk: primaryKey({
      columns: [table.identifier, table.token],
    }),
  }),
);

export const cars = pgTable(
  "cars",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    driverId: text("driver_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    plateNumber: text("plate_number").notNull(),
    photo: text("photo"),
    seats: integer("seats").notNull(),
    luggageCapacity: integer("luggage_capacity").notNull(),
    verified: boolean("verified").default(false),
    documentPhoto: text("document_photo"),
    insuranceProvider: text("insurance_provider"),
    insuranceExpiry: timestamp("insurance_expiry", { withTimezone: true }),
    insuranceDocument: text("insurance_document"),
    insuranceVerifiedAt: timestamp("insurance_verified_at", { withTimezone: true }),
    insuranceVerificationNote: text("insurance_verification_note"),
    verificationNote: text("verification_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    check("car_capacity", sql`${t.seats} > 0 AND ${t.luggageCapacity} >= 0`),
    index("cars_owner_idx").on(t.driverId),
  ],
);

export const journeys = pgTable(
  "journeys",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    driverId: text("driver_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    carId: text("car_id")
      .notNull()
      .references(() => cars.id, { onDelete: "restrict" }),
    origin: text("origin").notNull(),
    destination: text("destination").notNull(),
    note: text("note"),
    pickupInstructions: text("pickup_instructions"),
    dropoffInstructions: text("dropoff_instructions"),
    departureTime: timestamp("departure_time", {
      withTimezone: true,
    }).notNull(),
    seatsAvailable: integer("seats_available").notNull(),
    luggageCapacity: integer("luggage_capacity").notNull(),
    pricePerSeat: integer("price_per_seat").notNull(),
    status: text("status", {
      enum: ["active", "ongoing", "completed", "cancelled"],
    })
      .default("active")
      .notNull(),
    startRequestedByClientId: text("start_requested_by_client_id").references(
      () => users.id,
      { onDelete: "set null" },
    ),
    startRequestedAt: timestamp("start_requested_at", {
      mode: "date",
      withTimezone: true,
    }),
    startedAt: timestamp("started_at", { mode: "date", withTimezone: true }),
    endRequestedAt: timestamp("end_requested_at", {
      mode: "date",
      withTimezone: true,
    }),
    endConfirmedByClientId: text("end_confirmed_by_client_id").references(
      () => users.id,
      { onDelete: "set null" },
    ),
    completedAt: timestamp("completed_at", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    check(
      "journey_capacity",
      sql`${t.seatsAvailable} >= 0 AND ${t.luggageCapacity} >= 0`,
    ),
    check("journey_price", sql`${t.pricePerSeat} >= 50`),
    index("journeys_search_idx").on(t.status, t.departureTime),
    index("journeys_driver_idx").on(t.driverId),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    journeyId: text("journey_id")
      .notNull()
      .references(() => journeys.id, { onDelete: "restrict" }),
    seatsBooked: integer("seats_booked").notNull(),
    luggageSpace: integer("luggage_space").notNull(),
    bookingCode: text("booking_code").notNull(),
    idempotencyKey: text("idempotency_key"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    inventoryHeld: boolean("inventory_held").default(false).notNull(),
    fareMinor: integer("fare_minor").default(0).notNull(),
    feeMinor: integer("fee_minor").default(0).notNull(),
    boardedAt: timestamp("boarded_at", { withTimezone: true }),
    boardingAttempts: integer("boarding_attempts").default(0).notNull(),
    disputedAt: timestamp("disputed_at", { withTimezone: true }),
    status: text("status", {
      enum: [
        "payment_pending",
        "confirmed",
        "completed",
        "cancelled",
        "payment_failed",
      ],
    })
      .default("payment_pending")
      .notNull(),
    confirmedAt: timestamp("confirmed_at", {
      mode: "date",
      withTimezone: true,
    }),
    completedAt: timestamp("completed_at", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex("booking_idempotency_idx").on(t.clientId, t.idempotencyKey),
    uniqueIndex("booking_active_idx")
      .on(t.clientId, t.journeyId)
      .where(sql`${t.status} NOT IN ('cancelled', 'payment_failed')`),
    check(
      "booking_capacity",
      sql`${t.seatsBooked} > 0 AND ${t.luggageSpace} >= 0`,
    ),
    index("booking_journey_idx").on(t.journeyId),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    amount: integer("amount").notNull(),
    amountMinor: integer("amount_minor").default(0).notNull(),
    nextCheckAt: timestamp("next_check_at", {
      withTimezone: true,
    }).defaultNow(),
    status: text("status", {
      enum: ["pending", "success", "failed", "refunded"],
    })
      .default("pending")
      .notNull(),
    currency: text("currency").default("KES").notNull(),
    provider: text("provider").default("daraja").notNull(),
    paymentMethod: text("payment_method").default("mpesa").notNull(),
    phoneNumber: text("phone_number"),
    txRef: text("tx_ref"),
    providerTransactionId: text("provider_transaction_id"),
    providerStatus: text("provider_status"),
    checkoutUrl: text("checkout_url"),
    reference: text("reference"),
    paidAt: timestamp("paid_at", { mode: "date", withTimezone: true }),
    verifiedAt: timestamp("verified_at", { mode: "date", withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex("payment_provider_idx").on(t.provider, t.providerTransactionId),
    uniqueIndex("payment_reference_idx").on(t.provider, t.reference),
    index("payment_booking_idx").on(t.bookingId),
    check("payment_amount", sql`${t.amount} > 0 AND ${t.amountMinor} >= 0`),
  ],
);

export const payoutRequests = pgTable(
  "payout_requests",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    paymentId: text("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "restrict" }),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    driverId: text("driver_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    clientId: text("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    amount: integer("amount").notNull(),
    type: text("type", { enum: ["standard", "advance"] }).notNull(),
    status: text("status", {
      enum: ["pending", "approved", "rejected", "paid"],
    })
      .default("pending")
      .notNull(),
    note: text("note"),
    externalReference: text("external_reference"),
    recordedBy: text("recorded_by"),
    reconciledBy: text("reconciled_by"),
    respondedAt: timestamp("responded_at", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex("payout_active_idx")
      .on(t.paymentId)
      .where(sql`${t.status} <> 'rejected'`),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    journeyId: text("journey_id")
      .notNull()
      .references(() => journeys.id, { onDelete: "restrict" }),
    clientId: text("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    driverId: text("driver_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    authorRole: text("author_role", { enum: ["passenger", "driver"] })
      .default("passenger")
      .notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex("review_client_journey_idx").on(t.clientId, t.journeyId, t.authorRole),
    check("review_rating", sql`${t.rating} BETWEEN 1 AND 5`),
  ],
);

export const trustedContacts = pgTable("trusted_contacts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("trusted_contact_owner_phone_idx").on(t.userId, t.phone)]);

export const tripShares = pgTable("trip_shares", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  bookingId: text("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("trip_shares_booking_idx").on(t.bookingId)]);

export const tripLocations = pgTable("trip_locations", {
  bookingId: text("booking_id").primaryKey().references(() => bookings.id, { onDelete: "cascade" }),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  accuracyMeters: integer("accuracy_meters"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
});

export const emergencyAlerts = pgTable("emergency_alerts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  bookingId: text("booking_id").notNull().references(() => bookings.id, { onDelete: "restrict" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  message: text("message").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  status: text("status", { enum: ["open", "acknowledged", "resolved"] }).default("open").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;

// Administrative permission is never derived from the user-editable interface mode.
export const adminGrants = pgTable("admin_grants", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const uploads = pgTable("uploads", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  kind: text("kind").notNull(),
  private: boolean("private").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const auditEvents = pgTable("audit_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  subjectId: text("subject_id").notNull(),
  details: jsonb("details")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const outbox = pgTable("outbox", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  href: text("href").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const providerEvents = pgTable("provider_events", {
  id: text("id").primaryKey(),
  checkoutId: text("checkout_id").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    key: text("key").notNull().unique(),
    paymentId: text("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "restrict" }),
    debit: text("debit").notNull(),
    credit: text("credit").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").default("KES").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check("ledger_positive", sql`${t.amountMinor} > 0`),
    check("ledger_balanced_accounts", sql`${t.debit} <> ${t.credit}`),
  ],
);
export const refunds = pgTable("refunds", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  paymentId: text("payment_id")
    .notNull()
    .unique()
    .references(() => payments.id, { onDelete: "restrict" }),
  reason: text("reason").notNull(),
  amountMinor: integer("amount_minor").notNull(),
  status: text("status", { enum: ["pending", "recorded", "settled"] })
    .default("pending")
    .notNull(),
  externalReference: text("external_reference"),
  recordedBy: text("recorded_by"),
  reconciledBy: text("reconciled_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const supportCases = pgTable("support_cases", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  bookingId: text("booking_id").references(() => bookings.id, {
    onDelete: "restrict",
  }),
  emergencyAlertId: text("emergency_alert_id").references(() => emergencyAlerts.id, { onDelete: "set null" }),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status", { enum: ["open", "resolved"] })
    .default("open")
    .notNull(),
  resolution: text("resolution"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});
export const recoveryTokens = pgTable("recovery_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
