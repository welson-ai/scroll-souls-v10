import { NextRequest, NextResponse } from "next/server"

const protectedRoutes = [
  "/home",
  "/check-in",
  "/journal",
  "/profile",
  "/mood-wall",
  "/organizations",
  "/therapist",
  "/analytics",
  "/leaderboard",
]

const publicRoutes = ["/", "/auth/login", "/auth/sign-up", "/auth/check-email"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authToken = request.cookies.get("auth_token")?.value

  // If trying to access a protected route without auth
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!authToken) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  // If logged in user tries to access auth pages, redirect to home
  if (publicRoutes.some((route) => pathname === route) && authToken && pathname !== "/") {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
