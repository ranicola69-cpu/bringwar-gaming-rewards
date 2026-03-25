import { Router } from "express";
import { requireAuth } from "../lib/auth.js";

const router = Router();

// Returns the iframe URLs for all configured networks, personalized to the user
router.get("/networks/config", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const uid = user.id;

    const networks: Record<string, {
      name: string;
      type: "survey" | "offwall";
      configured: boolean;
      iframeUrl?: string;
      logo: string;
      description: string;
      avgPayout: string;
    }> = {
      offertoro: {
        name: "OfferToro",
        type: "offwall",
        logo: "🎯",
        description: "Complete offers, watch videos, download apps",
        avgPayout: "10–500 pts",
        configured: !!(process.env.OFFERTORO_PUB_ID && process.env.OFFERTORO_APP_ID),
        iframeUrl: process.env.OFFERTORO_PUB_ID && process.env.OFFERTORO_APP_ID
          ? `https://www.offertoro.com/ifr/show/${process.env.OFFERTORO_PUB_ID}/${process.env.OFFERTORO_APP_ID}/${uid}/0`
          : undefined,
      },
      cpx: {
        name: "CPX Research",
        type: "survey",
        logo: "📊",
        description: "High-paying surveys from top brands",
        avgPayout: "50–500 pts",
        configured: !!(process.env.CPX_APP_ID),
        iframeUrl: process.env.CPX_APP_ID
          ? `https://offers.cpx-research.com/index.php?app_id=${process.env.CPX_APP_ID}&ext_user_id=${uid}&username=${user.username}&email=${encodeURIComponent(user.email)}`
          : undefined,
      },
      lootably: {
        name: "Lootably",
        type: "offwall",
        logo: "💎",
        description: "Gaming offers, app installs, and more",
        avgPayout: "20–300 pts",
        configured: !!(process.env.LOOTABLY_PLACEMENT_ID),
        iframeUrl: process.env.LOOTABLY_PLACEMENT_ID
          ? `https://wall.lootably.com/?placementID=${process.env.LOOTABLY_PLACEMENT_ID}&uid=${uid}`
          : undefined,
      },
      adgate: {
        name: "AdGate Media",
        type: "offwall",
        logo: "🏆",
        description: "Premium offers with instant rewards",
        avgPayout: "15–400 pts",
        configured: !!(process.env.ADGATE_APP_ID),
        iframeUrl: process.env.ADGATE_APP_ID
          ? `https://wall.adgaterewards.com/${process.env.ADGATE_APP_ID}/${uid}`
          : undefined,
      },
      bitlabs: {
        name: "BitLabs",
        type: "survey",
        logo: "🔬",
        description: "Academic & market research surveys",
        avgPayout: "30–600 pts",
        configured: !!(process.env.BITLABS_TOKEN),
        iframeUrl: process.env.BITLABS_TOKEN
          ? `https://web.bitlabs.ai?token=${process.env.BITLABS_TOKEN}&uid=${uid}`
          : undefined,
      },
    };

    res.json(networks);
  } catch (err) {
    console.error("Networks config error:", err);
    res.status(500).json({ error: "Failed to get network config" });
  }
});

// Admin: get postback URLs to configure with each network
router.get("/admin/network-setup", async (req, res) => {
  const base = process.env.API_BASE_URL || "https://your-api-domain.com/api";

  res.json({
    postbackUrls: {
      offertoro: `${base}/postback/offertoro?userid={userid}&offerName={offer_name}&amount={amount}&transactionId={transaction_id}&hash={hash}`,
      cpx: `${base}/postback/cpx?status={status}&trans_id={trans_id}&user_id={user_id}&amountLocal={amountLocal}&hash={hash}`,
      lootably: `${base}/postback/lootably?userid={userid}&amount={amount}&offerid={offerid}&transid={transid}&signature={signature}`,
      adgate: `${base}/postback/adgate?user_id={user_id}&reward={reward}&transaction_id={transaction_id}&signature={signature}`,
      bitlabs: `${base}/postback/bitlabs?user_ref={user_ref}&reward={reward}&transaction_id={transaction_id}`,
    },
    envVarsNeeded: {
      offertoro: ["OFFERTORO_PUB_ID", "OFFERTORO_APP_ID", "OFFERTORO_SECRET"],
      cpx: ["CPX_APP_ID", "CPX_SECURE_HASH"],
      lootably: ["LOOTABLY_PLACEMENT_ID", "LOOTABLY_SECRET"],
      adgate: ["ADGATE_APP_ID", "ADGATE_SECRET"],
      bitlabs: ["BITLABS_TOKEN"],
    },
    signupLinks: {
      offertoro: "https://www.offertoro.com/publishers",
      cpx: "https://publishers.cpx-research.com",
      lootably: "https://lootably.com/publishers",
      adgate: "https://adgatemedia.com/publishers",
      bitlabs: "https://bitlabs.ai",
    },
  });
});

export default router;
