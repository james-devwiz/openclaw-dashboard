// Security middleware — headers, auth, rate limiting

import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"

const API_TOKEN = process.env.DASHBOARD_API_TOKEN || ""

// Paths exempt from bearer token auth
const AUTH_EXEMPT = ["/api/health"]

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "0",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://media.licdn.com",
    "connect-src 'self'",
    "font-src 'self'",
  ].join("; "),
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApiRoute = pathname.startsWith("/api")

  // Rate limit API routes
  if (isApiRoute) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "127.0.0.1"
    const { limited, retryAfter } = checkRateLimit(ip, request.method)

    if (limited) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests" }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            ...SECURITY_HEADERS,
          },
        }
      )
    }
  }

  // Bearer token auth for API routes
  if (isApiRoute && API_TOKEN) {
    const isExempt = AUTH_EXEMPT.some((p) => pathname === p)
    if (!isExempt) {
      const authHeader = request.headers.get("authorization")
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : ""

      if (token !== API_TOKEN) {
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
          }
        )
      }
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|icon.svg).*)",
  ],
}
