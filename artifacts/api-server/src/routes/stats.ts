import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, offersTable, completionsTable, withdrawalsTable } from "@workspace/db";
import { eq, count, sum } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

router.get("/", requireAdmin, async (_req, res) => {
  try {
    const [userCount] = await db.select({ count: count() }).from(usersTable);
    const [offerCount] = await db.select({ count: count() }).from(offersTable);
    const [completionCount] = await db.select({ count: count() }).from(completionsTable);
    const [pendingCompletionCount] = await db.select({ count: count() }).from(completionsTable).where(eq(completionsTable.status, "pending"));
    const [totalPointsAwarded] = await db.select({ total: sum(completionsTable.pointsAwarded) }).from(completionsTable).where(eq(completionsTable.status, "approved"));
    const [withdrawalCount] = await db.select({ count: count() }).from(withdrawalsTable);
    const [pendingWithdrawalCount] = await db.select({ count: count() }).from(withdrawalsTable).where(eq(withdrawalsTable.status, "pending"));
    const [totalCashPaid] = await db.select({ total: sum(withdrawalsTable.cashAmount) }).from(withdrawalsTable).where(eq(withdrawalsTable.status, "paid"));

    res.json({
      totalUsers: userCount.count,
      totalOffers: offerCount.count,
      totalCompletions: completionCount.count,
      pendingCompletions: pendingCompletionCount.count,
      totalPointsAwarded: Number(totalPointsAwarded.total ?? 0),
      totalWithdrawals: withdrawalCount.count,
      pendingWithdrawals: pendingWithdrawalCount.count,
      totalCashPaid: Number(totalCashPaid.total ?? 0),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
