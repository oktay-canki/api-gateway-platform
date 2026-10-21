import { NextRequest, NextResponse } from "next/server";

import { AUTH_TOKEN_NAME } from "@/lib/auth-constants";

const publicRoutes = ["/auth/login", "/auth/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has(AUTH_TOKEN_NAME);
  const isPublicRoute = publicRoutes.includes(pathname);

  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - Next.js internals
     * - API routes
     * - static files
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
