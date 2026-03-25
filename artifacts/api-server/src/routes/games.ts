import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, gamePlaysTable } from "@workspace/db";
import { eq, and, gte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

// ─── Loot Box ─────────────────────────────────────────────────────────────────
const LOOT_TIERS = [
  { label: "Common",    emoji: "📦", pts: 10,  weight: 40 },
  { label: "Uncommon",  emoji: "🟢", pts: 25,  weight: 25 },
  { label: "Rare",      emoji: "🔵", pts: 75,  weight: 18 },
  { label: "Epic",      emoji: "🟣", pts: 150, weight: 12 },
  { label: "Legendary", emoji: "🟡", pts: 350, weight: 4  },
  { label: "JACKPOT",   emoji: "💎", pts: 750, weight: 1  },
];

function weightedRandom(items: typeof LOOT_TIERS) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[0];
}

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

router.get("/games/loot-box/status", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const [play] = await db
    .select()
    .from(gamePlaysTable)
    .where(
      and(
        eq(gamePlaysTable.userId, user.id),
        eq(gamePlaysTable.gameType, "loot_box"),
        gte(gamePlaysTable.playedAt, todayStart())
      )
    )
    .limit(1);

  res.json({
    canPlay: !play,
    lastWin: play ? { pts: play.pointsEarned, tier: play.tierLabel } : null,
    tiers: LOOT_TIERS.map(t => ({ label: t.label, emoji: t.emoji, pts: t.pts })),
    resetsAt: new Date(todayStart().getTime() + 86400000),
  });
});

router.post("/games/loot-box/open", requireAuth, async (req, res) => {
  const user = (req as any).user;

  const [alreadyPlayed] = await db
    .select()
    .from(gamePlaysTable)
    .where(
      and(
        eq(gamePlaysTable.userId, user.id),
        eq(gamePlaysTable.gameType, "loot_box"),
        gte(gamePlaysTable.playedAt, todayStart())
      )
    )
    .limit(1);

  if (alreadyPlayed) {
    res.status(400).json({ error: "Already opened today. Come back tomorrow!" });
    return;
  }

  const tier = weightedRandom(LOOT_TIERS);

  await db.insert(gamePlaysTable).values({
    userId: user.id,
    gameType: "loot_box",
    pointsEarned: tier.pts,
    tierLabel: `${tier.emoji} ${tier.label}`,
  });

  await db.update(usersTable)
    .set({
      pointsBalance: sql`${usersTable.pointsBalance} + ${tier.pts}`,
      totalEarned: sql`${usersTable.totalEarned} + ${tier.pts}`,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, user.id));

  res.json({ pts: tier.pts, tier: `${tier.emoji} ${tier.label}`, label: tier.label });
});

// ─── Spin Wheel ───────────────────────────────────────────────────────────────
const WHEEL_SEGMENTS = [
  { label: "10 pts",  pts: 10,  color: "#ef4444" },
  { label: "25 pts",  pts: 25,  color: "#f97316" },
  { label: "50 pts",  pts: 50,  color: "#eab308" },
  { label: "5 pts",   pts: 5,   color: "#22c55e" },
  { label: "100 pts", pts: 100, color: "#3b82f6" },
  { label: "15 pts",  pts: 15,  color: "#a855f7" },
  { label: "200 pts", pts: 200, color: "#ec4899" },
  { label: "75 pts",  pts: 75,  color: "#14b8a6" },
];

router.get("/games/spin-wheel/status", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const [play] = await db
    .select()
    .from(gamePlaysTable)
    .where(
      and(
        eq(gamePlaysTable.userId, user.id),
        eq(gamePlaysTable.gameType, "spin_wheel"),
        gte(gamePlaysTable.playedAt, todayStart())
      )
    )
    .limit(1);

  res.json({
    canSpin: !play,
    lastWin: play ? { pts: play.pointsEarned, label: play.tierLabel } : null,
    segments: WHEEL_SEGMENTS,
    resetsAt: new Date(todayStart().getTime() + 86400000),
  });
});

router.post("/games/spin-wheel/spin", requireAuth, async (req, res) => {
  const user = (req as any).user;

  const [alreadyPlayed] = await db
    .select()
    .from(gamePlaysTable)
    .where(
      and(
        eq(gamePlaysTable.userId, user.id),
        eq(gamePlaysTable.gameType, "spin_wheel"),
        gte(gamePlaysTable.playedAt, todayStart())
      )
    )
    .limit(1);

  if (alreadyPlayed) {
    res.status(400).json({ error: "Already spun today. Come back tomorrow!" });
    return;
  }

  // Weighted: lower pts = higher chance
  const weights = [35, 25, 15, 40, 8, 30, 4, 12];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  let chosenIndex = 0;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) { chosenIndex = i; break; }
  }
  const seg = WHEEL_SEGMENTS[chosenIndex];

  await db.insert(gamePlaysTable).values({
    userId: user.id,
    gameType: "spin_wheel",
    pointsEarned: seg.pts,
    tierLabel: seg.label,
  });

  await db.update(usersTable)
    .set({
      pointsBalance: sql`${usersTable.pointsBalance} + ${seg.pts}`,
      totalEarned: sql`${usersTable.totalEarned} + ${seg.pts}`,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, user.id));

  res.json({ pts: seg.pts, label: seg.label, segmentIndex: chosenIndex });
});

export default router;
