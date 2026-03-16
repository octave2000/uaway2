import type { AdapterAccountType } from "@auth/core/adapters";
import { boolean, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  idPhoto: text("id_photo"),
  selfiePhoto: text("selfie_photo"),
  verified: boolean("verified").default(false),
  phone: text("phone"),
  defaultRole: text("default_role", { enum: ["passenger", "driver"] }),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    compositePk: primaryKey({
      columns: [table.identifier, table.token],
    }),
  }),
);

export const cars = pgTable("cars", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  driverId: text("driver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  plateNumber: text("plate_number").notNull(),
  photo: text("photo"),
  seats: integer("seats").notNull(),
  luggageCapacity: integer("luggage_capacity").notNull(),
  verified: boolean("verified").default(false),
  documentPhoto: text("document_photo"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const journeys = pgTable("journeys", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  driverId: text("driver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  carId: text("car_id")
    .notNull()
    .references(() => cars.id, { onDelete: "cascade" }),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  departureTime: timestamp("departure_time").notNull(),
  seatsAvailable: integer("seats_available").notNull(),
  luggageCapacity: integer("luggage_capacity").notNull(),
  pricePerSeat: integer("price_per_seat").notNull(),
  status: text("status", { enum: ["active", "ongoing", "completed", "cancelled"] }).default("active").notNull(),
  startRequestedByClientId: text("start_requested_by_client_id").references(() => users.id, { onDelete: "set null" }),
  startRequestedAt: timestamp("start_requested_at", { mode: "date" }),
  startedAt: timestamp("started_at", { mode: "date" }),
  endRequestedAt: timestamp("end_requested_at", { mode: "date" }),
  endConfirmedByClientId: text("end_confirmed_by_client_id").references(() => users.id, { onDelete: "set null" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  journeyId: text("journey_id")
    .notNull()
    .references(() => journeys.id, { onDelete: "cascade" }),
  seatsBooked: integer("seats_booked").notNull(),
  luggageSpace: integer("luggage_space").notNull(),
  bookingCode: text("booking_code").notNull(),
  status: text("status", {
    enum: ["payment_pending", "confirmed", "completed", "cancelled", "payment_failed"],
  }).default("payment_pending").notNull(),
  confirmedAt: timestamp("confirmed_at", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  bookingId: text("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  status: text("status", { enum: ["pending", "success", "failed", "refunded"] }).default("pending").notNull(),
  currency: text("currency").default("KES").notNull(),
  provider: text("provider").default("flutterwave").notNull(),
  paymentMethod: text("payment_method").default("mpesa").notNull(),
  phoneNumber: text("phone_number"),
  txRef: text("tx_ref"),
  providerTransactionId: text("provider_transaction_id"),
  providerStatus: text("provider_status"),
  checkoutUrl: text("checkout_url"),
  reference: text("reference"),
  paidAt: timestamp("paid_at", { mode: "date" }),
  verifiedAt: timestamp("verified_at", { mode: "date" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payoutRequests = pgTable("payout_requests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  paymentId: text("payment_id")
    .notNull()
    .references(() => payments.id, { onDelete: "cascade" }),
  bookingId: text("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  driverId: text("driver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientId: text("client_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  type: text("type", { enum: ["standard", "advance"] }).notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected", "paid"] }).default("pending").notNull(),
  note: text("note"),
  respondedAt: timestamp("responded_at", { mode: "date" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  journeyId: text("journey_id")
    .notNull()
    .references(() => journeys.id, { onDelete: "cascade" }),
  clientId: text("client_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  driverId: text("driver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;
