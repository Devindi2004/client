import { NextResponse, type NextRequest } from "next/server";
import { canAccessRoute, getRoleRedirect } from "@/lib/auth/roles";
import type { AuthTokenPayload } from "@/types/auth";

const REFRESH_COOKIE_NAME = "dineflow_refresh";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyJwtForProxy(token);

  if (!payload) {
    return NextResponse.redirect(loginUrl);
  }

  if (!canAccessRoute(payload.role, request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL(getRoleRedirect(payload.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/kitchen/:path*"],
};

async function verifyJwtForProxy(token: string) {
  const [encodedHeader, encodedPayload, signature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !signature) {
    return null;
  }

  try {
    const secret = getProxyJwtSecret();
    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = await createHmacSignature(data, secret);

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as
      | (AuthTokenPayload & { exp?: number })
      | undefined;

    if (!payload?.sub || !payload.role) {
      return null;
    }

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function getProxyJwtSecret() {
  if (process.env.JWT_REFRESH_SECRET) {
    return process.env.JWT_REFRESH_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_REFRESH_SECRET is not configured.");
  }

  return "development-refresh-secret-change-before-production";
}

async function createHmacSignature(data: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));

  return base64UrlEncode(signature);
}

function base64UrlEncode(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  return atob(padded);
}
