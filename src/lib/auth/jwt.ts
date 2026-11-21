import { SignJWT, jwtVerify } from "jose";
import { sessionUserSchema, type SessionUser } from "./types";

// Edge-safe: used by middleware, so no database or Node-only imports here.

export const SESSION_COOKIE = "cwy_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or shorter than 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser): Promise<string> {
  const { id, ...claims } = user;
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    const parsed = sessionUserSchema.safeParse({ ...payload, id: payload.sub });
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
