import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { offersTable } from "./offers";

export const completionStatusEnum = pgEnum("completion_status", ["pending", "approved", "rejected"]);

export const completionsTable = pgTable("completions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  offerId: integer("offer_id").notNull().references(() => offersTable.id),
  status: completionStatusEnum("status").notNull().default("pending"),
  proof: text("proof"),
  notes: text("notes"),
  adminNotes: text("admin_notes"),
  pointsAwarded: integer("points_awarded"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCompletionSchema = createInsertSchema(completionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCompletion = z.infer<typeof insertCompletionSchema>;
export type Completion = typeof completionsTable.$inferSelect;
