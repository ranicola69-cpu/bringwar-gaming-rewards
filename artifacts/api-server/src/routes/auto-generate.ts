import { Router } from "express";
import OpenAI from "openai";
import { db } from "@workspace/db";
import { offersTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const CATEGORIES = ["survey", "game", "app", "shopping", "signup", "referral", "other"] as const;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

router.post("/generate-offers", requireAdmin, async (req, res) => {
  try {
    const { count = 10, category, focusArea } = req.body;
    const numOffers = Math.min(Math.max(1, Number(count)), 25);

    const categoryFilter = category && CATEGORIES.includes(category) ? `All offers should be in the "${category}" category.` : `Mix categories across: ${CATEGORIES.join(", ")}.`;
    const focusHint = focusArea ? `Focus area: ${focusArea}.` : "";

    const prompt = `You are generating realistic offer listings for a rewards/GPT (get-paid-to) platform called EarnFlow. Users complete these offers to earn points that can be redeemed for cash.

Generate ${numOffers} unique, realistic offers. ${categoryFilter} ${focusHint}

Each offer must be a real type of task users actually do on GPT sites (e.g., take a survey about consumer habits, download and play a mobile game to level 5, sign up for a streaming trial, complete a shopping cashback offer, install an app and open it 3 times, etc.).

Return ONLY a valid JSON array with no extra text. Each object must have:
- title: string (catchy, specific title)
- description: string (1-2 sentences, what the user gets)
- category: one of [survey, game, app, shopping, signup, referral, other]
- points: integer between 50 and 2500 (higher for harder tasks)
- cashValue: number (points / 100, so 100 points = $1.00)
- difficulty: one of [easy, medium, hard]
- estimatedTime: string (e.g., "5 minutes", "15-20 minutes", "1-2 hours")
- instructions: string (3-5 clear step-by-step instructions, use newlines between steps)
- isActive: true

Make the offers feel authentic and varied. Vary points/difficulty proportionally (easy surveys = 50-200 pts, game challenges = 200-1000 pts, shopping cashback = 500-2500 pts).`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0]?.message?.content ?? "[]";

    let parsed: any[];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    const inserted = [];
    for (const o of parsed) {
      try {
        const [offer] = await db.insert(offersTable).values({
          title: String(o.title),
          description: String(o.description),
          category: CATEGORIES.includes(o.category) ? o.category : "other",
          points: Math.round(Number(o.points) || 100),
          cashValue: Number(o.cashValue) || Number(o.points) / 100 || 1,
          difficulty: DIFFICULTIES.includes(o.difficulty) ? o.difficulty : "easy",
          estimatedTime: String(o.estimatedTime || "10 minutes"),
          instructions: String(o.instructions || "Complete the required steps."),
          imageUrl: o.imageUrl ?? null,
          isActive: true,
        }).returning();
        inserted.push(offer);
      } catch (insertErr) {
        // skip invalid offers
      }
    }

    res.json({ success: true, generated: inserted.length, offers: inserted });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to generate offers" });
  }
});

export default router;
