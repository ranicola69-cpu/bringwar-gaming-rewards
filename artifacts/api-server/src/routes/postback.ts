import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, postbackLogsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

// Points multiplier: for every $1 the network pays us, users get 80 points (we keep the rest)
const NETWORK_POINT_RATE: Record<string, number> = {
  offertoro: 80,   // $1 = 80 pts (network pays us, we give 80% to user)
  cpx: 90,         // CPX surveys pay well, give 90%
  lootably: 80,
  adgate: 80,
  bitlabs: 90,
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
  // Prevent duplicate postbacks
  const existing = await db
    .select()
    .from(postbackLogsTable)
    .where(eq(postbackLogsTable.transactionId, transactionId));

  if (existing.length > 0) {
    return { duplicate: true };
  }

  // Credit points to user
  await db
    .update(usersTable)
    .set({
      pointsBalance: sql`${usersTable.pointsBalance} + ${points}`,
      totalEarned: sql`${usersTable.totalEarned} + ${points}`,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, userId));

  // Log the postback
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

// ─── OFFERTORO ─────────────────────────────────────────────────────────────
// GET /api/postback/offertoro?userid=123&offerName=Survey&amount=1.50&transactionId=abc&hash=xxx
router.get("/postback/offertoro", async (req, res) => {
  try {
    const { userid, offerName, amount, transactionId, hash } = req.query as Record<string, string>;
    const secret = process.env.OFFERTORO_SECRET || "";

    if (secret) {
      const expected = crypto.createHash("md5")
        .update(`${userid}${amount}${transactionId}${secret}`)
        .digest("hex");
      if (hash !== expected) {
        res.status(400).send("1"); // OfferToro expects "1" on error
        return;
      }
    }

    const userId = parseInt(userid);
    const revenueUsd = parseFloat(amount) || 0;
    const points = Math.round(revenueUsd * (NETWORK_POINT_RATE.offertoro));

    const result = await creditUser(userId, points, "offertoro", transactionId, req.query as any, revenueUsd, offerName);
    res.send(result.duplicate ? "1" : "1"); // OfferToro expects "1" on success
  } catch (err) {
    console.error("OfferToro postback error:", err);
    res.status(500).send("1");
  }
});

// ─── CPX RESEARCH ──────────────────────────────────────────────────────────
// GET /api/postback/cpx?status=1&trans_id=abc&user_id=123&amountLocal=150&hash=xxx
router.get("/postback/cpx", async (req, res) => {
  try {
    const { status, trans_id, user_id, amountLocal, hash } = req.query as Record<string, string>;

    if (status !== "1") {
      res.send("ok");
      return;
    }

    const appId = process.env.CPX_APP_ID || "";
    const secureHash = process.env.CPX_SECURE_HASH || "";

    if (secureHash && appId) {
      const expected = crypto.createHash("md5")
        .update(`${trans_id}-${secureHash}`)
        .digest("hex");
      if (hash !== expected) {
        res.status(400).send("hash_mismatch");
        return;
      }
    }

    const userId = parseInt(user_id);
    const revenueUsd = parseFloat(amountLocal) / 100 || 0; // CPX sends in cents
    const points = Math.round(parseInt(amountLocal) * (NETWORK_POINT_RATE.cpx / 100));

    await creditUser(userId, points, "cpx", trans_id, req.query as any, revenueUsd, "CPX Survey");
    res.send("ok");
  } catch (err) {
    console.error("CPX postback error:", err);
    res.status(500).send("error");
  }
});

// ─── LOOTABLY ──────────────────────────────────────────────────────────────
// GET /api/postback/lootably?userid=123&amount=100&offerid=abc&transid=xyz&signature=xxx
router.get("/postback/lootably", async (req, res) => {
  try {
    const { userid, amount, offerid, transid, signature } = req.query as Record<string, string>;
    const secret = process.env.LOOTABLY_SECRET || "";

    if (secret) {
      const expected = crypto.createHash("sha1")
        .update(userid + amount + secret)
        .digest("hex");
      if (signature !== expected) {
        res.status(400).json({ status: "error", message: "Invalid signature" });
        return;
      }
    }

    const userId = parseInt(userid);
    const points = parseInt(amount) || 0; // Lootably sends in your currency (points)
    const revenueUsd = points / 100;

    await creditUser(userId, Math.round(points * 0.8), "lootably", transid, req.query as any, revenueUsd, "Lootably Offer");
    res.json({ status: "1" });
  } catch (err) {
    console.error("Lootably postback error:", err);
    res.status(500).json({ status: "error" });
  }
});

// ─── ADGATE MEDIA ──────────────────────────────────────────────────────────
// GET /api/postback/adgate?user_id=123&reward=150&transaction_id=abc&signature=xxx
router.get("/postback/adgate", async (req, res) => {
  try {
    const { user_id, reward, transaction_id, signature } = req.query as Record<string, string>;
    const secret = process.env.ADGATE_SECRET || "";

    if (secret) {
      const expected = crypto.createHash("md5")
        .update(user_id + reward + secret)
        .digest("hex");
      if (signature !== expected) {
        res.status(400).send("0");
        return;
      }
    }

    const userId = parseInt(user_id);
    const points = parseInt(reward) || 0;
    const revenueUsd = points / 100;

    await creditUser(userId, Math.round(points * 0.8), "adgate", transaction_id, req.query as any, revenueUsd, "AdGate Offer");
    res.send("1");
  } catch (err) {
    console.error("AdGate postback error:", err);
    res.status(500).send("0");
  }
});

// ─── BITLABS ───────────────────────────────────────────────────────────────
// GET /api/postback/bitlabs?user_ref=123&reward=1.50&transaction_id=abc
router.get("/postback/bitlabs", async (req, res) => {
  try {
    const { user_ref, reward, transaction_id } = req.query as Record<string, string>;

    const userId = parseInt(user_ref);
    const revenueUsd = parseFloat(reward) || 0;
    const points = Math.round(revenueUsd * NETWORK_POINT_RATE.bitlabs);

    await creditUser(userId, points, "bitlabs", transaction_id, req.query as any, revenueUsd, "BitLabs Survey");
    res.send("ok");
  } catch (err) {
    console.error("BitLabs postback error:", err);
    res.status(500).send("error");
  }
});

// ─── ADMIN: View postback logs ──────────────────────────────────────────────
router.get("/admin/postback-logs", async (req, res) => {
  try {
    const logs = await db
      .select()
      .from(postbackLogsTable)
      .orderBy(db.sql`${postbackLogsTable.createdAt} DESC`)
      .limit(100);
    res.json(logs);
  } catch (err) {
    console.error("Postback logs error:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

export default router;
