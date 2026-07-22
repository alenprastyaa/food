import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("nashi_session")?.value;

  let session: { role?: string } | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      session = payload as { role?: string };
    } catch {
      session = null;
    }
  }

  // Protect dashboard
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    // Owner-only areas
    const ownerOnly = ["/dashboard/outlets", "/dashboard/menu", "/dashboard/cashiers", "/dashboard/qris", "/dashboard/owner"];
    if (session.role !== "OWNER" && ownerOnly.some((p) => pathname.startsWith(p))) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/login" && session) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
