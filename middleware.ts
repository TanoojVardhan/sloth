import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("session_id")
  const { pathname } = request.nextUrl

  // Check if the user is authenticated
  const isAuthenticated = !!sessionCookie

  // Define public routes that don't require authentication
  const isPublicRoute = pathname === "/" || pathname === "/login" || pathname === "/signup"

  // Redirect to login if accessing protected route without authentication
  if (!isAuthenticated && !isPublicRoute) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(pathname))
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if accessing login/signup while authenticated
  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
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
