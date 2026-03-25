import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, dailyRewardsTable, gamePlaysTable } from "@workspace/db";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

const STREAK_REWARDS  = [10, 15, 20, 30, 40, 50, 100];
const SHIELD_COST     = 50; // pts to buy a streak shield

function getStreakPoints(day: number) {
  return STREAK_REWARDS[Math.min(day - 1, STREAK_REWARDS.length - 1)];
}

function todayStart() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}

// ─── Status ──────────────────────────────────────────────────────────────────
router.get("/daily-reward/status", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const [lastClaim] = await db.select().from(dailyRewardsTable)
      .where(eq(dailyRewardsTable.userId, user.id))
      .orderBy(desc(dailyRewardsTable.claimedAt)).limit(1);

    const now = new Date();
    const today = todayStart();
    const yesterday = new Date(today.getTime() - 86400000);

    let canClaim = true;
    let currentStreak = 1;
    let nextPoints = STREAK_REWARDS[0];

    if (lastClaim) {
      const lastDay = new Date(lastClaim.claimedAt);
      const lastDayStart = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate());

      if (lastDayStart >= today) {
        canClaim = false;
        currentStreak = lastClaim.streakDay;
        nextPoints = getStreakPoints(currentStreak < 7 ? currentStreak + 1 : 7);
      } else if (lastDayStart >= yesterday) {
        currentStreak = lastClaim.streakDay < 7 ? lastClaim.streakDay + 1 : 1;
        nextPoints = getStreakPoints(currentStreak);
      } else {
        currentStreak = 1;
        nextPoints = STREAK_REWARDS[0];
      }
    }

    // Check if shield is active (purchased in last 48h and not yet used)
    const shieldCutoff = new Date(Date.now() - 48 * 3600000);
    const [shield] = await db.select().from(gamePlaysTable)
      .where(and(
        eq(gamePlaysTable.userId, user.id),
        eq(gamePlaysTable.gameType, "streak_shield"),
        gte(gamePlaysTable.playedAt, shieldCutoff)
      )).limit(1);

    res.json({
      canClaim,
      currentStreak,
      nextPoints,
      nextClaimAt: lastClaim ? new Date(new Date(lastClaim.claimedAt).setHours(24, 0, 0, 0)) : null,
      schedule: STREAK_REWARDS.map((pts, i) => ({ day: i + 1, points: pts })),
      shieldActive: !!shield,
      shieldCost: SHIELD_COST,
    });
  } catch (err) {
    console.error("Daily reward status:", err);
    res.status(500).json({ error: "Failed to get status" });
  }
});

// ─── Claim ────────────────────────────────────────────────────────────────────
router.post("/daily-reward/claim", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const [lastClaim] = await db.select().from(dailyRewardsTable)
      .where(eq(dailyRewardsTable.userId, user.id))
      .orderBy(desc(dailyRewardsTable.claimedAt)).limit(1);

    const today = todayStart();
    const yesterday = new Date(today.getTime() - 86400000);

    if (lastClaim) {
      const lastDay = new Date(lastClaim.claimedAt);
      const lastDayStart = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate());
      if (lastDayStart >= today) {
        res.status(400).json({ error: "Already claimed today" }); return;
      }
    }

    let newStreak = 1;
    if (lastClaim) {
      const lastDay = new Date(lastClaim.claimedAt);
      const lastDayStart = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate());
      if (lastDayStart >= yesterday) {
        newStreak = lastClaim.streakDay < 7 ? lastClaim.streakDay + 1 : 1;
      } else {
        // Check if a streak shield is active — if so, preserve streak
        const shieldCutoff = new Date(Date.now() - 48 * 3600000);
        const [shield] = await db.select().from(gamePlaysTable)
          .where(and(
            eq(gamePlaysTable.userId, user.id),
            eq(gamePlaysTable.gameType, "streak_shield"),
            gte(gamePlaysTable.playedAt, shieldCutoff)
          )).limit(1);

        if (shield) {
          newStreak = lastClaim.streakDay; // preserve streak
          // Delete the shield so it's consumed
          await db.delete(gamePlaysTable).where(eq(gamePlaysTable.id, shield.id));
        }
        // else streak resets to 1 (already set above)
      }
    }

    const points = getStreakPoints(newStreak);

    await db.insert(dailyRewardsTable).values({ userId: user.id, streakDay: newStreak, pointsEarned: points });

    await db.update(usersTable).set({
      pointsBalance: sql`${usersTable.pointsBalance} + ${points}`,
      totalEarned:   sql`${usersTable.totalEarned} + ${points}`,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, user.id));

    res.json({ success: true, points, streakDay: newStreak });
  } catch (err) {
    console.error("Daily reward claim:", err);
    res.status(500).json({ error: "Failed to claim" });
  }
});

// ─── Buy Streak Shield ────────────────────────────────────────────────────────
router.post("/daily-reward/shield", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    if (user.pointsBalance < SHIELD_COST) {
      res.status(400).json({ error: `Need ${SHIELD_COST} pts to buy a Streak Shield` }); return;
    }

    // Already have a shield?
    const shieldCutoff = new Date(Date.now() - 48 * 3600000);
    const [existing] = await db.select().from(gamePlaysTable)
      .where(and(
        eq(gamePlaysTable.userId, user.id),
        eq(gamePlaysTable.gameType, "streak_shield"),
        gte(gamePlaysTable.playedAt, shieldCutoff)
      )).limit(1);

    if (existing) {
      res.status(400).json({ error: "You already have an active Streak Shield" }); return;
    }

    await db.update(usersTable).set({
      pointsBalance: sql`${usersTable.pointsBalance} - ${SHIELD_COST}`,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, user.id));

    await db.insert(gamePlaysTable).values({
      userId: user.id,
      gameType: "streak_shield",
      pointsEarned: -SHIELD_COST,
      tierLabel: "🛡️ Streak Shield",
    });

    res.json({ success: true, cost: SHIELD_COST });
  } catch (err) {
    console.error("Shield purchase:", err);
    res.status(500).json({ error: "Failed to purchase shield" });
  }
});

// ─── Referral stats ───────────────────────────────────────────────────────────
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
    console.error("Referral stats:", err);
    res.status(500).json({ error: "Failed to get referral stats" });
  }
});

export default router;
