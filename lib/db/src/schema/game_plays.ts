import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const gameTypeEnum = pgEnum("game_type", ["loot_box", "spin_wheel", "streak_shield"]);

export const gamePlaysTable = pgTable("game_plays", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameType: gameTypeEnum("game_type").notNull(),
  pointsEarned: integer("points_earned").notNull(),
  tierLabel: text("tier_label").notNull(),
  playedAt: timestamp("played_at").notNull().defaultNow(),
});
