import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@earnflow.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_USERNAME = "admin";

async function seedAdmin() {
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, ADMIN_EMAIL));
  if (existing.length > 0) {
    console.log("Admin already exists:", ADMIN_EMAIL);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const [admin] = await db.insert(usersTable).values({
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    passwordHash,
    role: "admin",
    referralCode: nanoid(8).toUpperCase(),
    pointsBalance: 0,
    totalEarned: 0,
  }).returning();

  console.log("Admin created successfully:");
  console.log(`  Email: ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  ID: ${admin.id}`);
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
