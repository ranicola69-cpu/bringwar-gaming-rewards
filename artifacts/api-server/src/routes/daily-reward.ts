import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, dailyRewardsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

const STREAK_REWARDS = [10, 15, 20, 30, 40, 50, 100]; // pts per day 1-7

function getStreakPoints(streakDay: number): number {
  const idx = Math.min(streakDay - 1, STREAK_REWARDS.length - 1);
  return STREAK_REWARDS[idx];
}

router.get("/daily-reward/status", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const [lastClaim] = await db
      .select()
      .from(dailyRewardsTable)
      .where(eq(dailyRewardsTable.userId, user.id))
      .orderBy(desc(dailyRewardsTable.claimedAt))
      .limit(1);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);

    let canClaim = true;
    let currentStreak = 1;
    let nextPoints = STREAK_REWARDS[0];

    if (lastClaim) {
      const lastDate = new Date(lastClaim.claimedAt);
      const lastDayStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

      if (lastDayStart >= todayStart) {
        // Already claimed today
        canClaim = false;
        currentStreak = lastClaim.streakDay;
        const nextDay = currentStreak < 7 ? currentStreak + 1 : 7;
        nextPoints = getStreakPoints(nextDay);
      } else if (lastDayStart >= yesterdayStart) {
        // Claimed yesterday — streak continues
        currentStreak = lastClaim.streakDay < 7 ? lastClaim.streakDay + 1 : 1;
        nextPoints = getStreakPoints(currentStreak);
      } else {
        // Streak broken
        currentStreak = 1;
        nextPoints = STREAK_REWARDS[0];
      }
    }

    const nextClaimAt = lastClaim
      ? new Date(new Date(lastClaim.claimedAt).setHours(24, 0, 0, 0))
      : null;

    res.json({
      canClaim,
      currentStreak,
      nextPoints,
      nextClaimAt,
      schedule: STREAK_REWARDS.map((pts, i) => ({ day: i + 1, points: pts })),
    });
  } catch (err) {
    console.error("Daily reward status error:", err);
    res.status(500).json({ error: "Failed to get status" });
  }
});

router.post("/daily-reward/claim", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const [lastClaim] = await db
      .select()
      .from(dailyRewardsTable)
      .where(eq(dailyRewardsTable.userId, user.id))
      .orderBy(desc(dailyRewardsTable.claimedAt))
      .limit(1);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);

    if (lastClaim) {
      const lastDate = new Date(lastClaim.claimedAt);
      const lastDayStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

      if (lastDayStart >= todayStart) {
        res.status(400).json({ error: "Already claimed today" });
        return;
      }
    }

    let newStreak = 1;
    if (lastClaim) {
      const lastDate = new Date(lastClaim.claimedAt);
      const lastDayStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
      if (lastDayStart >= yesterdayStart) {
        newStreak = lastClaim.streakDay < 7 ? lastClaim.streakDay + 1 : 1;
      }
    }

    const points = getStreakPoints(newStreak);

    await db.insert(dailyRewardsTable).values({
      userId: user.id,
      streakDay: newStreak,
      pointsEarned: points,
    });

    await db.update(usersTable)
      .set({
        pointsBalance: sql`${usersTable.pointsBalance} + ${points}`,
        totalEarned: sql`${usersTable.totalEarned} + ${points}`,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id));

    res.json({ success: true, points, streakDay: newStreak });
  } catch (err) {
    console.error("Daily reward claim error:", err);
    res.status(500).json({ error: "Failed to claim" });
  }
});

// Referral stats
router.get("/referral/stats", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const referrals = await db
      .select({ id: usersTable.id, username: usersTable.username, createdAt: usersTable.createdAt })
      .from(usersTable)
      .where(eq(usersTable.referredBy, user.id));

    res.json({
      referralCode: user.referralCode,
      referralUrl: `${process.env.APP_URL || "https://bringwar.app"}/register?ref=${user.referralCode}`,
      totalReferrals: referrals.length,
      referrals,
      bonusPerReferral: 250,
    });
  } catch (err) {
    console.error("Referral stats error:", err);
    res.status(500).json({ error: "Failed to get referral stats" });
  }
});

export default router;
