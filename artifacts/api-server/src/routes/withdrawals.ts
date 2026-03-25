import { Router } from "express";
import { db } from "@workspace/db";
import { withdrawalsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth.js";

const router = Router();

const POINTS_TO_CASH = 0.01;
const MIN_WITHDRAWAL_POINTS = 500;

router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    let rows;
    if (user.role === "admin") {
      rows = await db.select({
        withdrawal: withdrawalsTable,
        user: {
          id: usersTable.id,
          username: usersTable.username,
          email: usersTable.email,
          role: usersTable.role,
          pointsBalance: usersTable.pointsBalance,
          totalEarned: usersTable.totalEarned,
          referralCode: usersTable.referralCode,
          createdAt: usersTable.createdAt,
        },
      })
      .from(withdrawalsTable)
      .leftJoin(usersTable, eq(withdrawalsTable.userId, usersTable.id))
      .orderBy(sql`${withdrawalsTable.createdAt} desc`);
    } else {
      rows = await db.select({
        withdrawal: withdrawalsTable,
        user: {
          id: usersTable.id,
          username: usersTable.username,
          email: usersTable.email,
          role: usersTable.role,
          pointsBalance: usersTable.pointsBalance,
          totalEarned: usersTable.totalEarned,
          referralCode: usersTable.referralCode,
          createdAt: usersTable.createdAt,
        },
      })
      .from(withdrawalsTable)
      .leftJoin(usersTable, eq(withdrawalsTable.userId, usersTable.id))
      .where(eq(withdrawalsTable.userId, user.id))
      .orderBy(sql`${withdrawalsTable.createdAt} desc`);
    }
    res.json(rows.map(r => ({ ...r.withdrawal, user: r.user })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch withdrawals" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { points, method, paymentDetails } = req.body;

    if (points < MIN_WITHDRAWAL_POINTS) {
      res.status(400).json({ error: `Minimum withdrawal is ${MIN_WITHDRAWAL_POINTS} points ($${(MIN_WITHDRAWAL_POINTS * POINTS_TO_CASH).toFixed(2)})` });
      return;
    }

    if (user.pointsBalance < points) {
      res.status(400).json({ error: "Insufficient points balance" });
      return;
    }

    const cashAmount = points * POINTS_TO_CASH;

    await db.update(usersTable).set({
      pointsBalance: sql`${usersTable.pointsBalance} - ${points}`,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, user.id));

    const [withdrawal] = await db.insert(withdrawalsTable).values({
      userId: user.id, points, cashAmount, method, paymentDetails, status: "pending",
    }).returning();

    res.json({ ...withdrawal, user: { id: user.id, username: user.username, email: user.email, role: user.role, pointsBalance: user.pointsBalance - points, totalEarned: user.totalEarned, referralCode: user.referralCode, createdAt: user.createdAt } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to request withdrawal" });
  }
});

router.post("/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [updated] = await db.update(withdrawalsTable).set({
      status: "approved", updatedAt: new Date(),
    }).where(eq(withdrawalsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Withdrawal not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to approve withdrawal" });
  }
});

router.post("/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { reason } = req.body;
    const [withdrawal] = await db.select().from(withdrawalsTable).where(eq(withdrawalsTable.id, id));
    if (!withdrawal) { res.status(404).json({ error: "Withdrawal not found" }); return; }

    await db.update(withdrawalsTable).set({
      status: "rejected", adminNotes: reason, updatedAt: new Date(),
    }).where(eq(withdrawalsTable.id, id));

    await db.update(usersTable).set({
      pointsBalance: sql`${usersTable.pointsBalance} + ${withdrawal.points}`,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, withdrawal.userId));

    const [updated] = await db.select().from(withdrawalsTable).where(eq(withdrawalsTable.id, id));
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to reject withdrawal" });
  }
});

export default router;
