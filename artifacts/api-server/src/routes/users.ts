import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, completionsTable, offersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin, requireAuth } from "../lib/auth.js";

const router = Router();

router.get("/", requireAdmin, async (_req, res) => {
  try {
    const users = await db.select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      pointsBalance: usersTable.pointsBalance,
      totalEarned: usersTable.totalEarned,
      referralCode: usersTable.referralCode,
      createdAt: usersTable.createdAt,
    }).from(usersTable).orderBy(usersTable.createdAt);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/:id/completions", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db.select({
      completion: completionsTable,
      offer: offersTable,
    })
    .from(completionsTable)
    .leftJoin(offersTable, eq(completionsTable.offerId, offersTable.id))
    .where(eq(completionsTable.userId, id))
    .orderBy(completionsTable.createdAt);

    res.json(rows.map(r => ({ ...r.completion, offer: r.offer })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch completions" });
  }
});

export default router;
