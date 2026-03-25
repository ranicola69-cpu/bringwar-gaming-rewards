import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const dailyRewardsTable = pgTable("daily_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  streakDay: integer("streak_day").notNull().default(1),
  pointsEarned: integer("points_earned").notNull(),
  claimedAt: timestamp("claimed_at").notNull().defaultNow(),
});

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull(),
  referredId: integer("referred_id").notNull(),
  bonusPoints: integer("bonus_points").notNull().default(250),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DailyReward = typeof dailyRewardsTable.$inferSelect;
export type Referral = typeof referralsTable.$inferSelect;
