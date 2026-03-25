import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, offersTable, completionsTable, withdrawalsTable, postbackLogsTable, gamePlaysTable } from "@workspace/db";
import { eq, count, sum, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

router.get("/", requireAdmin, async (_req, res) => {
  try {
    const [userCount]              = await db.select({ count: count() }).from(usersTable);
    const [offerCount]             = await db.select({ count: count() }).from(offersTable);
    const [completionCount]        = await db.select({ count: count() }).from(completionsTable);
    const [pendingCompletionCount] = await db.select({ count: count() }).from(completionsTable).where(eq(completionsTable.status, "pending"));
    const [totalPointsAwarded]     = await db.select({ total: sum(completionsTable.pointsAwarded) }).from(completionsTable).where(eq(completionsTable.status, "approved"));
    const [withdrawalCount]        = await db.select({ count: count() }).from(withdrawalsTable);
    const [pendingWithdrawalCount] = await db.select({ count: count() }).from(withdrawalsTable).where(eq(withdrawalsTable.status, "pending"));
    const [totalCashPaid]          = await db.select({ total: sum(withdrawalsTable.cashAmount) }).from(withdrawalsTable).where(eq(withdrawalsTable.status, "paid"));
    const [approvedCashPaid]       = await db.select({ total: sum(withdrawalsTable.cashAmount) }).from(withdrawalsTable).where(eq(withdrawalsTable.status, "approved"));

    // Revenue tracking from postback logs
    const [grossRevenue]  = await db.select({ total: sum(postbackLogsTable.revenueUsd) }).from(postbackLogsTable);
    const [postbackCount] = await db.select({ count: count() }).from(postbackLogsTable);

    // Game plays (bonus revenue metric)
    const [gamePlays] = await db.select({ count: count() }).from(gamePlaysTable);

    // Total pts paid out to users via withdrawals (approved + paid)
    const totalPaidOut = Number(totalCashPaid.total ?? 0) + Number(approvedCashPaid.total ?? 0);
    const totalRevenue = Number(grossRevenue.total ?? 0);
    const netProfit    = totalRevenue - totalPaidOut;
    const margin       = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

    // Total fees collected from withdrawals (100 pts = $1 per withdrawal)
    const [feeRevenue] = await db.select({ count: count() }).from(withdrawalsTable).where(
      sql`status IN ('approved','paid')`
    );
    const totalFeeRevenue = Number(feeRevenue.count) * 1.00; // $1 fee per approved withdrawal

    res.json({
      totalUsers: userCount.count,
      totalOffers: offerCount.count,
      totalCompletions: completionCount.count,
      pendingCompletions: pendingCompletionCount.count,
      totalPointsAwarded: Number(totalPointsAwarded.total ?? 0),
      totalWithdrawals: withdrawalCount.count,
      pendingWithdrawals: pendingWithdrawalCount.count,
      totalCashPaid: totalPaidOut,
      // Revenue & profit
      grossRevenueUsd: totalRevenue,
      totalPaidOutUsd: totalPaidOut,
      feeRevenueUsd: totalFeeRevenue,
      netProfitUsd: netProfit + totalFeeRevenue,
      profitMarginPct: margin,
      postbackCount: postbackCount.count,
      gamePlaysCount: gamePlays.count,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
