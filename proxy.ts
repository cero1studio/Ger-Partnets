import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get("ger_token")?.value
  const session = token ? verifyToken(token) : null

  // ── Rutas públicas ─────────────────────────────────────────
  if (pathname === "/" || pathname === "/registro") {
    // Si ya está autenticado, redirigir al panel correspondiente
    if (session) {
      return NextResponse.redirect(
        new URL(session.role === "admin" ? "/admin" : "/dashboard", req.url)
      )
    }
    return NextResponse.next()
  }

  // ── Rutas del panel de aliados ─────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    if (session.role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url))
    }
    return NextResponse.next()
  }

  // ── Rutas del panel admin ──────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/registro", "/dashboard/:path*", "/admin/:path*"],
}
