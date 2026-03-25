import { pgTable, text, serial, integer, timestamp, doublePrecision, boolean } from "drizzle-orm/pg-core";

export const postbackLogsTable = pgTable("postback_logs", {
  id: serial("id").primaryKey(),
  network: text("network").notNull(),
  userId: integer("user_id"),
  externalUserId: text("external_user_id"),
  transactionId: text("transaction_id").notNull(),
  offerName: text("offer_name"),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  revenueUsd: doublePrecision("revenue_usd").notNull().default(0),
  rawPayload: text("raw_payload"),
  isValid: boolean("is_valid").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PostbackLog = typeof postbackLogsTable.$inferSelect;
