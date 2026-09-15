import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_COOKIE_OPTS } from "@/lib/sessionCookie";

export function proxy(req: NextRequest) {
  if (req.cookies.get(SESSION_COOKIE)) return NextResponse.next();

  const res = NextResponse.next();
  res.cookies.set(SESSION_COOKIE, crypto.randomUUID(), SESSION_COOKIE_OPTS);
  return res;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
