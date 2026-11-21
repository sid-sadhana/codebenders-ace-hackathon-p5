import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is missing. Add it to .env.local (see .env.example)."),
  MONGODB_DB: z.string().min(1).default("claim_whats_yours"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET is missing or shorter than 32 characters. Generate one with: openssl rand -base64 32"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

/**
 * Reads and validates server environment variables on first use.
 * Errors list the variable names only, never their values.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse({
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB || undefined,
    AUTH_SECRET: process.env.AUTH_SECRET,
  });
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => `- ${issue.message}`);
    throw new Error(`Invalid server environment:\n${problems.join("\n")}`);
  }
  cached = parsed.data;
  return cached;
}
