import { Router } from "express";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.get("/networks/config", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const uid = user.id;
    const email = encodeURIComponent(user.email);
    const username = encodeURIComponent(user.username);

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
      revu: {
        name: "Revenue Universe",
        type: "offwall",
        logo: "🌐",
        description: "Wide range of CPA offers & trials",
        avgPayout: "20–600 pts",
        configured: !!(process.env.REVU_PUB_ID),
        iframeUrl: process.env.REVU_PUB_ID
          ? `https://www.revenueuniverse.com/wall/${process.env.REVU_PUB_ID}?userid=${uid}`
          : undefined,
      },
      torox: {
        name: "Torox",
        type: "offwall",
        logo: "⚡",
        description: "High-converting offers and trials",
        avgPayout: "10–450 pts",
        configured: !!(process.env.TOROX_PUB_ID && process.env.TOROX_APP_ID),
        iframeUrl: process.env.TOROX_PUB_ID && process.env.TOROX_APP_ID
          ? `https://torox.io/ifr/show/${process.env.TOROX_PUB_ID}/${process.env.TOROX_APP_ID}/${uid}`
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
          ? `https://offers.cpx-research.com/index.php?app_id=${process.env.CPX_APP_ID}&ext_user_id=${uid}&username=${username}&email=${email}`
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
      theoremreach: {
        name: "Theorem Reach",
        type: "survey",
        logo: "📝",
        description: "Premium brand & consumer surveys",
        avgPayout: "40–800 pts",
        configured: !!(process.env.THEOREM_API_KEY),
        iframeUrl: process.env.THEOREM_API_KEY
          ? `https://surveys.theoremreach.com/router/start?api_key=${process.env.THEOREM_API_KEY}&user_id=${uid}`
          : undefined,
      },
      pollfish: {
        name: "Pollfish",
        type: "survey",
        logo: "🐟",
        description: "Short mobile-first surveys, pays daily",
        avgPayout: "20–300 pts",
        configured: !!(process.env.POLLFISH_API_KEY),
        iframeUrl: process.env.POLLFISH_API_KEY
          ? `https://wss.pollfish.com/v2/device/register/true?api_key=${process.env.POLLFISH_API_KEY}&debug=false&uid=${uid}`
          : undefined,
      },
    };

    res.json(networks);
  } catch (err) {
    console.error("Networks config error:", err);
    res.status(500).json({ error: "Failed to get network config" });
  }
});

router.get("/admin/network-setup", async (_req, res) => {
  const base = process.env.API_BASE_URL || "https://your-api-domain.com/api";
  res.json({
    postbackUrls: {
      offertoro: `${base}/postback/offertoro?userid={userid}&offerName={offer_name}&amount={amount}&transactionId={transaction_id}&hash={hash}`,
      cpx:       `${base}/postback/cpx?status={status}&trans_id={trans_id}&user_id={user_id}&amountLocal={amountLocal}&hash={hash}`,
      lootably:  `${base}/postback/lootably?userid={userid}&amount={amount}&offerid={offerid}&transid={transid}&signature={signature}`,
      adgate:    `${base}/postback/adgate?user_id={user_id}&reward={reward}&transaction_id={transaction_id}&signature={signature}`,
      bitlabs:   `${base}/postback/bitlabs?user_ref={user_ref}&reward={reward}&transaction_id={transaction_id}`,
      revu:      `${base}/postback/offertoro?userid={userid}&amount={amount}&transactionId={transaction_id}`,
      torox:     `${base}/postback/offertoro?userid={userid}&amount={amount}&transactionId={transaction_id}`,
    },
    envVarsNeeded: {
      offertoro:    ["OFFERTORO_PUB_ID", "OFFERTORO_APP_ID", "OFFERTORO_SECRET"],
      cpx:          ["CPX_APP_ID", "CPX_SECURE_HASH"],
      lootably:     ["LOOTABLY_PLACEMENT_ID", "LOOTABLY_SECRET"],
      adgate:       ["ADGATE_APP_ID", "ADGATE_SECRET"],
      bitlabs:      ["BITLABS_TOKEN"],
      revu:         ["REVU_PUB_ID"],
      torox:        ["TOROX_PUB_ID", "TOROX_APP_ID"],
      theoremreach: ["THEOREM_API_KEY"],
      pollfish:     ["POLLFISH_API_KEY"],
    },
  });
});

export default router;
