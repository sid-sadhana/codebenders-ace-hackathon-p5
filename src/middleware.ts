import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/jwt";
import { homeFor, safeNext } from "@/lib/auth/redirects";
import { STAFF_ROLES } from "@/lib/auth/types";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const user = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    if (!user) return NextResponse.next();
    const next = safeNext(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next ?? homeFor(user.role), request.url));
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && !STAFF_ROLES.includes(user.role)) {
    return NextResponse.redirect(new URL(homeFor(user.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*"],
};
