import { Router } from "express";
import { db } from "@workspace/db";
import { completionsTable, offersTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

router.get("/", requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const rows = await db.select({
      completion: completionsTable,
      offer: offersTable,
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
    .from(completionsTable)
    .leftJoin(offersTable, eq(completionsTable.offerId, offersTable.id))
    .leftJoin(usersTable, eq(completionsTable.userId, usersTable.id))
    .orderBy(sql`${completionsTable.createdAt} desc`);

    const filtered = status ? rows.filter(r => r.completion.status === status) : rows;
    res.json(filtered.map(r => ({ ...r.completion, offer: r.offer, user: r.user })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch completions" });
  }
});

router.post("/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [completion] = await db.select().from(completionsTable).where(eq(completionsTable.id, id));
    if (!completion) { res.status(404).json({ error: "Completion not found" }); return; }

    const [offer] = await db.select().from(offersTable).where(eq(offersTable.id, completion.offerId));
    const points = offer?.points ?? 0;

    const [updated] = await db.update(completionsTable).set({
      status: "approved", pointsAwarded: points, updatedAt: new Date(),
    }).where(eq(completionsTable.id, id)).returning();

    await db.update(usersTable).set({
      pointsBalance: sql`${usersTable.pointsBalance} + ${points}`,
      totalEarned: sql`${usersTable.totalEarned} + ${points}`,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, completion.userId));

    await db.update(offersTable).set({
      completionCount: sql`${offersTable.completionCount} + 1`,
    }).where(eq(offersTable.id, completion.offerId));

    res.json({ ...updated, offer });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to approve completion" });
  }
});

router.post("/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { reason } = req.body;
    const [updated] = await db.update(completionsTable).set({
      status: "rejected", adminNotes: reason, updatedAt: new Date(),
    }).where(eq(completionsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Completion not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to reject completion" });
  }
});

export default router;
