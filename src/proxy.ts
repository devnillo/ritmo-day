import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Redirecionamento otimista pela presença do cookie. NÃO é a barreira de segurança:
// cada página e ação valida a sessão no servidor (src/server/auth/session.ts).
const authPages = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const hasSession = Boolean(getSessionCookie(request, { cookiePrefix: "ritmo" }));
  const { pathname } = request.nextUrl;

  if (!hasSession && !authPages.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasSession && authPages.includes(pathname)) {
    return NextResponse.redirect(new URL("/today", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/onboarding/:path*",
    "/today/:path*",
    "/habits/:path*",
    "/routines/:path*",
    "/check-in/:path*",
    "/insights/:path*",
    "/settings/:path*",
  ],
};
