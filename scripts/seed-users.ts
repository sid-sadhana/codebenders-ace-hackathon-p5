import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import { seedUsers } from "../src/lib/auth/demo-accounts";

// The shared demo password is read from the local env file and never
// committed. Only its bcrypt hash is stored in the database.
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "";

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "claim_whats_yours";
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add it to .env.local (see .env.example).");
  }
  if (DEMO_PASSWORD.length < 8) {
    throw new Error("SEED_DEMO_PASSWORD is missing or shorter than 8 characters.");
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();

  try {
    const users = client.db(dbName).collection("users");
    await users.createIndex({ username: 1 }, { unique: true });

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const now = new Date();

    for (const user of seedUsers) {
      await users.updateOne(
        { username: user.username },
        {
          $set: { ...user, passwordHash, updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true },
      );
      console.log(`  ✓ ${user.username.padEnd(12)} ${user.role}`);
    }

    console.log(`Seeded ${seedUsers.length} demo users into "${dbName}".`);
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error("Seeding failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
