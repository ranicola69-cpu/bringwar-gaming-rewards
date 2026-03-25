import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../lib/auth.js";
import { nanoid } from "nanoid";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, referralCode } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({ error: "Username, email, and password are required" });
      return;
    }

    const existingEmail = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existingEmail.length > 0) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }

    const existingUsername = await db.select().from(usersTable).where(eq(usersTable.username, username));
    if (existingUsername.length > 0) {
      res.status(400).json({ error: "Username already taken" });
      return;
    }

    let referredBy: number | undefined;
    if (referralCode) {
      const [referrer] = await db.select().from(usersTable).where(eq(usersTable.referralCode, referralCode));
      if (referrer) referredBy = referrer.id;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newReferralCode = nanoid(8).toUpperCase();

    const [user] = await db.insert(usersTable).values({
      username,
      email,
      passwordHash,
      referralCode: newReferralCode,
      referredBy,
    }).returning();

    const token = signToken(user.id);
    const { passwordHash: _, ...safeUser } = user;

    res.json({ user: { ...safeUser, role: user.role }, token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken(user.id);
    const { passwordHash: _, ...safeUser } = user;

    res.json({ user: safeUser, token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Logged out" });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

export default router;
