import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // For Firebase Auth, we need to check for the Firebase auth cookie
  // or session cookie instead of using Next Auth's getToken
  const authCookie = request.cookies.get('firebase-auth-token')?.value;
  
  // For development/testing, also check for a mock auth cookie
  const mockAuthEnabled = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";
  const mockAuthCookie = request.cookies.get('mock-auth-token')?.value;
  
  // Check if the user is authenticated with either real or mock auth
  const isAuthenticated = !!authCookie || (mockAuthEnabled && !!mockAuthCookie);

  // If already authenticated and trying to access login/signup, redirect to dashboard
  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    // For debugging
    console.log("Middleware: Authenticated user accessing login/signup, redirecting to dashboard");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow all other requests
  return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
