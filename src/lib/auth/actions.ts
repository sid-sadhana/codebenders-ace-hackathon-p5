"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { findUserByUsername, verifyCredentials } from "@/lib/db/users";
import { isDemoUsername } from "./demo-accounts";
import { homeFor, safeNext } from "./redirects";
import { createSession, destroySession } from "./session";
import { usernameSchema, type PublicUser } from "./types";

export type LoginError = "invalid" | "tooMany" | "unavailable";
export type LoginState = { error: LoginError | null };

const MAX_FAILURES = 5;
const WINDOW_MS = 10 * 60 * 1000;

// Per-instance only. Good enough to slow down guessing in a demo; a real
// deployment would keep this in a shared store.
const failures = new Map<string, { count: number; since: number }>();

function isLocked(username: string): boolean {
  const entry = failures.get(username);
  if (!entry) return false;
  if (Date.now() - entry.since > WINDOW_MS) {
    failures.delete(username);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

function recordFailure(username: string): void {
  const entry = failures.get(username);
  if (!entry || Date.now() - entry.since > WINDOW_MS) {
    failures.set(username, { count: 1, since: Date.now() });
  } else {
    entry.count += 1;
  }
}

const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1).max(200),
  next: z.string().max(500).optional(),
});

function readNext(formData: FormData): string | undefined {
  const next = formData.get("next");
  return typeof next === "string" && next.length > 0 ? next : undefined;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    next: readNext(formData),
  });
  if (!parsed.success) return { error: "invalid" };

  const { username, password, next } = parsed.data;
  if (isLocked(username)) return { error: "tooMany" };

  let user: PublicUser | null;
  try {
    user = await verifyCredentials(username, password);
  } catch {
    return { error: "unavailable" };
  }

  if (!user) {
    recordFailure(username);
    return { error: isLocked(username) ? "tooMany" : "invalid" };
  }

  failures.delete(username);
  await createSession(user);
  redirect(safeNext(next) ?? homeFor(user.role));
}

export async function demoLoginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = usernameSchema.safeParse(formData.get("username"));
  if (!parsed.success || !isDemoUsername(parsed.data)) return { error: "invalid" };

  let user: PublicUser | null;
  try {
    user = await findUserByUsername(parsed.data);
  } catch {
    return { error: "unavailable" };
  }
  if (!user) return { error: "unavailable" };

  await createSession(user);
  redirect(safeNext(readNext(formData)) ?? homeFor(user.role));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
