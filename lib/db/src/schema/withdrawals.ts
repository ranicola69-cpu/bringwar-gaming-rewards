import { pgTable, serial, integer, text, timestamp, pgEnum, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const withdrawalMethodEnum = pgEnum("withdrawal_method", ["paypal", "venmo", "cashapp", "bank_transfer", "gift_card"]);
export const withdrawalStatusEnum = pgEnum("withdrawal_status", ["pending", "approved", "paid", "rejected"]);

export const withdrawalsTable = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  points: integer("points").notNull(),
  cashAmount: doublePrecision("cash_amount").notNull(),
  method: withdrawalMethodEnum("method").notNull(),
  paymentDetails: text("payment_details").notNull(),
  status: withdrawalStatusEnum("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWithdrawalSchema = createInsertSchema(withdrawalsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type Withdrawal = typeof withdrawalsTable.$inferSelect;
