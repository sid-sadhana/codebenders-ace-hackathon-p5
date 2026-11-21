import { STAFF_ROLES, type Role } from "./types";

/**
 * Only same-site relative paths are allowed as a post-login destination.
 * Rejects absolute URLs, protocol-relative "//host" and backslash tricks.
 */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || typeof next !== "string") return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return null;
  }
  if (next === "/login" || next.startsWith("/login?") || next.startsWith("/login/")) {
    return null;
  }
  return next;
}

export function homeFor(role: Role): string {
  return STAFF_ROLES.includes(role) ? "/admin/schemes" : "/check";
}

export function loginHref(nextPath: string): string {
  const safe = safeNext(nextPath);
  return safe ? `/login?next=${encodeURIComponent(safe)}` : "/login";
}
