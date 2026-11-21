import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findUserById, toSessionUser } from "@/lib/db/users";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySession,
} from "./jwt";
import { homeFor, loginHref } from "./redirects";
import type { PublicUser, Role, SessionUser } from "./types";

/** Identity from the signed cookie only. Cheap: no database call. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
});

/** Full user from the database, for pages that need the profile. */
export const getSession = cache(async (): Promise<PublicUser | null> => {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  return findUserById(sessionUser.id);
});

export async function createSession(user: PublicUser): Promise<void> {
  const token = await signSession(toSessionUser(user));
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function requireRole(
  roles: readonly Role[],
  nextPath: string,
): Promise<PublicUser> {
  const user = await getSession();
  if (!user) redirect(loginHref(nextPath));
  if (!roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}
