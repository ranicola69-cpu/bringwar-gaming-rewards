import { Router } from "express";
import { db } from "@workspace/db";
import { offersTable, completionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const offers = await db.select().from(offersTable).where(eq(offersTable.isActive, true)).orderBy(offersTable.createdAt);
    res.json(offers);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch offers" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { title, description, category, points, cashValue, difficulty, estimatedTime, instructions, imageUrl, isActive } = req.body;
    const [offer] = await db.insert(offersTable).values({
      title, description, category, points, cashValue, difficulty, estimatedTime, instructions, imageUrl, isActive: isActive ?? true,
    }).returning();
    res.json(offer);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create offer" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [offer] = await db.select().from(offersTable).where(eq(offersTable.id, id));
    if (!offer) { res.status(404).json({ error: "Offer not found" }); return; }
    res.json(offer);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch offer" });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, category, points, cashValue, difficulty, estimatedTime, instructions, imageUrl, isActive } = req.body;
    const [offer] = await db.update(offersTable).set({
      title, description, category, points, cashValue, difficulty, estimatedTime, instructions, imageUrl, isActive, updatedAt: new Date(),
    }).where(eq(offersTable.id, id)).returning();
    if (!offer) { res.status(404).json({ error: "Offer not found" }); return; }
    res.json(offer);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update offer" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(offersTable).where(eq(offersTable.id, id));
    res.json({ success: true, message: "Offer deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete offer" });
  }
});

router.post("/:id/complete", requireAuth, async (req, res) => {
  try {
    const offerId = parseInt(req.params.id);
    const user = (req as any).user;
    const { proof, notes } = req.body;

    const [offer] = await db.select().from(offersTable).where(eq(offersTable.id, offerId));
    if (!offer || !offer.isActive) {
      res.status(404).json({ error: "Offer not found or inactive" });
      return;
    }

    const existing = await db.select().from(completionsTable).where(
      and(eq(completionsTable.userId, user.id), eq(completionsTable.offerId, offerId), eq(completionsTable.status, "approved"))
    );
    if (existing.length > 0) {
      res.status(400).json({ error: "You have already completed this offer" });
      return;
    }

    const [completion] = await db.insert(completionsTable).values({
      userId: user.id, offerId, proof, notes, status: "pending",
    }).returning();

    res.json({ ...completion, offer, user: { id: user.id, username: user.username, email: user.email, role: user.role, pointsBalance: user.pointsBalance, totalEarned: user.totalEarned, referralCode: user.referralCode, createdAt: user.createdAt } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to submit completion" });
  }
});

export default router;
