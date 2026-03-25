import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoryEnum = pgEnum("offer_category", ["survey", "game", "app", "shopping", "signup", "referral", "other"]);
export const difficultyEnum = pgEnum("offer_difficulty", ["easy", "medium", "hard"]);

export const offersTable = pgTable("offers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: categoryEnum("category").notNull(),
  points: integer("points").notNull(),
  cashValue: doublePrecision("cash_value").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  estimatedTime: text("estimated_time").notNull(),
  instructions: text("instructions").notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  completionCount: integer("completion_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOfferSchema = createInsertSchema(offersTable).omit({ id: true, createdAt: true, updatedAt: true, completionCount: true });
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offersTable.$inferSelect;
