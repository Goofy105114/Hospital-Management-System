import { NextRequest, NextResponse } from "next/server";

interface JWTPayload {
  sub?: string;
  role?: string;
  name?: string;
  email?: string;
  exp?: number;
}

function parseTokenRole(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr =
      typeof atob === "function"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf-8");
    const payload: JWTPayload = JSON.parse(jsonStr);
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null; // Expired
    }
    return payload.role || null;
  } catch {
    return null;
  }
}

const PUBLIC_AUTH_PATHS = [
  "/admin/login",
  "/admin/register",
  "/doctor/login",
  "/doctor/register",
  "/receptionist/login",
  "/receptionist/register",
  "/patient/login",
  "/patient/register",
];

const ROLE_PREFIX_MAP: Record<string, string[]> = {
  "/admin": ["ADMIN", "SUPER_ADMIN", "MANAGEMENT"],
  "/doctor": ["DOCTOR", "ADMIN", "SUPER_ADMIN"],
  "/receptionist": ["RECEPTIONIST", "ADMIN", "SUPER_ADMIN"],
  "/patient": ["PATIENT", "ADMIN", "SUPER_ADMIN"],
  "/pharmacist": ["PHARMACIST", "ADMIN", "SUPER_ADMIN"],
  "/pharmacy": ["PHARMACIST", "ADMIN", "SUPER_ADMIN"],
  "/nurse": ["NURSE", "ADMIN", "SUPER_ADMIN"],
  "/billing-staff": ["BILLING_STAFF", "ADMIN", "SUPER_ADMIN"],
  "/inventory-manager": ["INVENTORY_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "/lab": ["LAB_TECH", "RADIOLOGIST", "ADMIN", "SUPER_ADMIN"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public auth paths through immediately
  if (PUBLIC_AUTH_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 2. Identify required roles for this prefix
  const matchedPrefix = Object.keys(ROLE_PREFIX_MAP).find((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!matchedPrefix) {
    return NextResponse.next();
  }

  const allowedRoles = ROLE_PREFIX_MAP[matchedPrefix];

  // 3. Resolve user role from testing headers, token cookie, or activeRole cookie
  const mockRole = request.headers.get("x-mock-role");
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;
  const cookieToken = request.cookies.get("accessToken")?.value;
  const token = bearerToken || cookieToken;
  const tokenRole = token ? parseTokenRole(token) : null;
  const activeRoleCookie = request.cookies.get("activeRole")?.value;

  const effectiveRole = mockRole || tokenRole || activeRoleCookie;

  // 4. If completely unauthenticated, redirect to relevant login
  if (!effectiveRole) {
    let redirectPath = "/login";
    if (pathname.startsWith("/admin")) redirectPath = "/admin/login";
    else if (pathname.startsWith("/doctor")) redirectPath = "/doctor/login";
    else if (pathname.startsWith("/receptionist")) redirectPath = "/receptionist/login";
    else if (pathname.startsWith("/patient")) redirectPath = "/patient/login";

    const url = request.nextUrl.clone();
    url.pathname = redirectPath;
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // 5. If role does not match allowed roles for this path, block/redirect to their home
  if (!allowedRoles.includes(effectiveRole)) {
    const roleHomes: Record<string, string> = {
      DOCTOR: "/doctor",
      RECEPTIONIST: "/receptionist",
      ADMIN: "/admin",
      SUPER_ADMIN: "/admin",
      MANAGEMENT: "/admin",
      PHARMACIST: "/pharmacist",
      NURSE: "/nurse",
      BILLING_STAFF: "/billing-staff",
      INVENTORY_MANAGER: "/inventory-manager",
      LAB_TECH: "/lab",
      RADIOLOGIST: "/lab",
      PATIENT: "/patient",
    };

    const targetHome = roleHomes[effectiveRole] || "/login";
    const url = request.nextUrl.clone();
    url.pathname = targetHome;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/doctor/:path*",
    "/receptionist/:path*",
    "/patient/:path*",
    "/pharmacist/:path*",
    "/pharmacy/:path*",
    "/nurse/:path*",
    "/billing-staff/:path*",
    "/inventory-manager/:path*",
    "/lab/:path*",
  ],
};
