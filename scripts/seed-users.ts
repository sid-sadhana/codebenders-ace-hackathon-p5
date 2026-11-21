import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import { seedUsers } from "../src/lib/auth/demo-accounts";

// Passwords never live in the repo. Each account's password is built from
// SEED_PASSWORD_TEMPLATE in the local env file, where {username} is replaced
// by the account's username. Only bcrypt hashes are stored in the database.
function passwordFor(template: string, username: string): string {
  return template.replaceAll("{username}", username);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "claim_whats_yours";
  const template = process.env.SEED_PASSWORD_TEMPLATE;

  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add it to .env.local (see .env.example).");
  }
  if (!template || !template.includes("{username}") || template.length < 12) {
    throw new Error(
      "SEED_PASSWORD_TEMPLATE is missing or invalid. It must contain {username} and be at least 12 characters.",
    );
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();

  try {
    const users = client.db(dbName).collection("users");
    await users.createIndex({ username: 1 }, { unique: true });
    const now = new Date();

    for (const user of seedUsers) {
      const passwordHash = await bcrypt.hash(passwordFor(template, user.username), 10);
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
