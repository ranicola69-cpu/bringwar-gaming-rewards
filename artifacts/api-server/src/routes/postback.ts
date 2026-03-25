import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, postbackLogsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

// Platform keeps 35% of all network revenue — users get 65 pts per $1
const NETWORK_POINT_RATE: Record<string, number> = {
  offertoro:    65,
  cpx:          65,
  lootably:     65,
  adgate:       65,
  bitlabs:      65,
  revu:         65,
  torox:        65,
  theoremreach: 65,
  pollfish:     65,
};

async function creditUser(
  userId: number,
  points: number,
  network: string,
  transactionId: string,
  payload: Record<string, string>,
  revenueUsd: number,
  offerName?: string
) {
  const existing = await db
    .select()
    .from(postbackLogsTable)
    .where(eq(postbackLogsTable.transactionId, transactionId));

  if (existing.length > 0) return { duplicate: true };

  await db
    .update(usersTable)
    .set({
      pointsBalance: sql`${usersTable.pointsBalance} + ${points}`,
      totalEarned:   sql`${usersTable.totalEarned} + ${points}`,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, userId));

  await db.insert(postbackLogsTable).values({
    network,
    userId,
    externalUserId: String(userId),
    transactionId,
    offerName: offerName || network + " offer",
    pointsAwarded: points,
    revenueUsd,
    rawPayload: JSON.stringify(payload),
    isValid: true,
  });

  return { credited: true, points };
}

// ─── OFFERTORO ────────────────────────────────────────────────────────────────
router.get("/postback/offertoro", async (req, res) => {
  try {
    const { userid, offerName, amount, transactionId, hash } = req.query as Record<string, string>;
    const secret = process.env.OFFERTORO_SECRET || "";
    if (secret) {
      const expected = crypto.createHash("md5").update(`${userid}${amount}${transactionId}${secret}`).digest("hex");
      if (hash !== expected) { res.status(400).send("1"); return; }
    }
    const revenueUsd = parseFloat(amount) || 0;
    const points = Math.round(revenueUsd * NETWORK_POINT_RATE.offertoro);
    await creditUser(parseInt(userid), points, "offertoro", transactionId, req.query as any, revenueUsd, offerName);
    res.send("1");
  } catch (err) { console.error("OfferToro postback:", err); res.status(500).send("1"); }
});

// ─── CPX RESEARCH ─────────────────────────────────────────────────────────────
router.get("/postback/cpx", async (req, res) => {
  try {
    const { status, trans_id, user_id, amountLocal, hash } = req.query as Record<string, string>;
    if (status !== "1") { res.send("ok"); return; }
    const secureHash = process.env.CPX_SECURE_HASH || "";
    if (secureHash) {
      const expected = crypto.createHash("md5").update(`${trans_id}-${secureHash}`).digest("hex");
      if (hash !== expected) { res.status(400).send("hash_mismatch"); return; }
    }
    const revenueUsd = parseFloat(amountLocal) / 100 || 0;
    const points = Math.round(revenueUsd * NETWORK_POINT_RATE.cpx);
    await creditUser(parseInt(user_id), points, "cpx", trans_id, req.query as any, revenueUsd, "CPX Survey");
    res.send("ok");
  } catch (err) { console.error("CPX postback:", err); res.status(500).send("error"); }
});

// ─── LOOTABLY ─────────────────────────────────────────────────────────────────
router.get("/postback/lootably", async (req, res) => {
  try {
    const { userid, amount, transid, signature } = req.query as Record<string, string>;
    const secret = process.env.LOOTABLY_SECRET || "";
    if (secret) {
      const expected = crypto.createHash("sha1").update(userid + amount + secret).digest("hex");
      if (signature !== expected) { res.status(400).json({ status: "error" }); return; }
    }
    const revenueUsd = parseFloat(amount) || 0;
    const points = Math.round(revenueUsd * NETWORK_POINT_RATE.lootably);
    await creditUser(parseInt(userid), points, "lootably", transid, req.query as any, revenueUsd, "Lootably Offer");
    res.json({ status: "1" });
  } catch (err) { console.error("Lootably postback:", err); res.status(500).json({ status: "error" }); }
});

// ─── ADGATE ───────────────────────────────────────────────────────────────────
router.get("/postback/adgate", async (req, res) => {
  try {
    const { user_id, reward, transaction_id, signature } = req.query as Record<string, string>;
    const secret = process.env.ADGATE_SECRET || "";
    if (secret) {
      const expected = crypto.createHash("md5").update(user_id + reward + secret).digest("hex");
      if (signature !== expected) { res.status(400).send("0"); return; }
    }
    const revenueUsd = parseFloat(reward) || 0;
    const points = Math.round(revenueUsd * NETWORK_POINT_RATE.adgate);
    await creditUser(parseInt(user_id), points, "adgate", transaction_id, req.query as any, revenueUsd, "AdGate Offer");
    res.send("1");
  } catch (err) { console.error("AdGate postback:", err); res.status(500).send("0"); }
});

// ─── BITLABS ──────────────────────────────────────────────────────────────────
router.get("/postback/bitlabs", async (req, res) => {
  try {
    const { user_ref, reward, transaction_id } = req.query as Record<string, string>;
    const revenueUsd = parseFloat(reward) || 0;
    const points = Math.round(revenueUsd * NETWORK_POINT_RATE.bitlabs);
    await creditUser(parseInt(user_ref), points, "bitlabs", transaction_id, req.query as any, revenueUsd, "BitLabs Survey");
    res.send("ok");
  } catch (err) { console.error("BitLabs postback:", err); res.status(500).send("error"); }
});

// ─── REVENUE UNIVERSE ─────────────────────────────────────────────────────────
router.get("/postback/revu", async (req, res) => {
  try {
    const { userid, amount, transactionId } = req.query as Record<string, string>;
    const revenueUsd = parseFloat(amount) || 0;
    const points = Math.round(revenueUsd * NETWORK_POINT_RATE.revu);
    await creditUser(parseInt(userid), points, "revu", transactionId, req.query as any, revenueUsd, "Revenue Universe Offer");
    res.send("1");
  } catch (err) { console.error("RevU postback:", err); res.status(500).send("1"); }
});

// ─── TOROX ────────────────────────────────────────────────────────────────────
router.get("/postback/torox", async (req, res) => {
  try {
    const { userid, amount, transactionId } = req.query as Record<string, string>;
    const revenueUsd = parseFloat(amount) || 0;
    const points = Math.round(revenueUsd * NETWORK_POINT_RATE.torox);
    await creditUser(parseInt(userid), points, "torox", transactionId, req.query as any, revenueUsd, "Torox Offer");
    res.send("1");
  } catch (err) { console.error("Torox postback:", err); res.status(500).send("1"); }
});

// ─── THEOREM REACH ────────────────────────────────────────────────────────────
router.get("/postback/theoremreach", async (req, res) => {
  try {
    const { user_id, reward, transaction_id } = req.query as Record<string, string>;
    const revenueUsd = parseFloat(reward) || 0;
    const points = Math.round(revenueUsd * NETWORK_POINT_RATE.theoremreach);
    await creditUser(parseInt(user_id), points, "theoremreach", transaction_id, req.query as any, revenueUsd, "Theorem Survey");
    res.send("ok");
  } catch (err) { console.error("TheoremReach postback:", err); res.status(500).send("error"); }
});

// ─── POLLFISH ─────────────────────────────────────────────────────────────────
router.get("/postback/pollfish", async (req, res) => {
  try {
    const { user_id, reward, transaction_id } = req.query as Record<string, string>;
    const revenueUsd = parseFloat(reward) || 0;
    const points = Math.round(revenueUsd * NETWORK_POINT_RATE.pollfish);
    await creditUser(parseInt(user_id), points, "pollfish", transaction_id, req.query as any, revenueUsd, "Pollfish Survey");
    res.send("ok");
  } catch (err) { console.error("Pollfish postback:", err); res.status(500).send("error"); }
});

// ─── Admin: postback logs ─────────────────────────────────────────────────────
router.get("/admin/postback-logs", async (_req, res) => {
  try {
    const logs = await db.select().from(postbackLogsTable)
      .orderBy(sql`${postbackLogsTable.createdAt} DESC`).limit(200);
    res.json(logs);
  } catch (err) { console.error("Postback logs:", err); res.status(500).json({ error: "Failed" }); }
});

export default router;
