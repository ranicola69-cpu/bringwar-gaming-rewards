import { Router } from "express";
import { db } from "@workspace/db";
import { withdrawalsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth.js";

const router = Router();

const POINTS_TO_CASH    = 0.01;         // 100 pts = $1.00
const MIN_WITHDRAWAL    = 1500;         // minimum 1,500 pts ($15)
const PROCESSING_FEE    = 100;          // 100 pts ($1.00) flat fee per withdrawal
const AUTO_APPROVE_MAX  = 500000;       // auto-approve all withdrawals (up to 5,000 pts)

router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    let rows;
    const selectFields = {
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
    };

    if (user.role === "admin") {
      rows = await db.select(selectFields)
        .from(withdrawalsTable)
        .leftJoin(usersTable, eq(withdrawalsTable.userId, usersTable.id))
        .orderBy(sql`${withdrawalsTable.createdAt} desc`);
    } else {
      rows = await db.select(selectFields)
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

    if (!paymentDetails?.trim()) {
      res.status(400).json({ error: "Payment details are required (e.g. your PayPal email)" });
      return;
    }

    if (points < MIN_WITHDRAWAL) {
      res.status(400).json({
        error: `Minimum withdrawal is ${MIN_WITHDRAWAL.toLocaleString()} pts ($${(MIN_WITHDRAWAL * POINTS_TO_CASH).toFixed(2)}). You also need ${PROCESSING_FEE} pts for the processing fee.`,
      });
      return;
    }

    const totalDeducted = points + PROCESSING_FEE;
    if (user.pointsBalance < totalDeducted) {
      res.status(400).json({
        error: `Insufficient balance. You need ${totalDeducted.toLocaleString()} pts (${points.toLocaleString()} + ${PROCESSING_FEE} fee). You have ${user.pointsBalance.toLocaleString()}.`,
      });
      return;
    }

    const cashAmount = points * POINTS_TO_CASH;

    // Deduct points + fee
    await db.update(usersTable).set({
      pointsBalance: sql`${usersTable.pointsBalance} - ${totalDeducted}`,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, user.id));

    // Auto-approve if below threshold
    const autoApprove = points <= AUTO_APPROVE_MAX;

    const [withdrawal] = await db.insert(withdrawalsTable).values({
      userId: user.id,
      points,
      cashAmount,
      method,
      paymentDetails,
      status: autoApprove ? "approved" : "pending",
    }).returning();

    res.json({
      ...withdrawal,
      processingFee: PROCESSING_FEE,
      autoApproved: autoApprove,
      user: {
        id: user.id, username: user.username, email: user.email, role: user.role,
        pointsBalance: user.pointsBalance - totalDeducted,
        totalEarned: user.totalEarned,
        referralCode: user.referralCode, createdAt: user.createdAt,
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to request withdrawal" });
  }
});

router.post("/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [updated] = await db.update(withdrawalsTable)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(withdrawalsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to approve" });
  }
});

router.post("/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { reason } = req.body;
    const [withdrawal] = await db.select().from(withdrawalsTable).where(eq(withdrawalsTable.id, id));
    if (!withdrawal) { res.status(404).json({ error: "Not found" }); return; }

    await db.update(withdrawalsTable).set({
      status: "rejected", adminNotes: reason, updatedAt: new Date(),
    }).where(eq(withdrawalsTable.id, id));

    // Refund points (but NOT the processing fee — fee is kept)
    await db.update(usersTable).set({
      pointsBalance: sql`${usersTable.pointsBalance} + ${withdrawal.points}`,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, withdrawal.userId));

    const [updated] = await db.select().from(withdrawalsTable).where(eq(withdrawalsTable.id, id));
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to reject" });
  }
});

// Expose the constants to the frontend
router.get("/config", async (_req, res) => {
  res.json({ minWithdrawal: MIN_WITHDRAWAL, processingFee: PROCESSING_FEE, pointsToCash: POINTS_TO_CASH });
});

export default router;
