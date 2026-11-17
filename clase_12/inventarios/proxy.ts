import { NextResponse, type NextRequest } from "next/server";

import { AUTH_TOKEN_COOKIE, verifyAuthToken } from "@/src/lib/jwt";
import { canAccessAdminPath, PRODUCTS_HOME } from "@/src/lib/roles";

/**
 * Protects `/admin/*` and enforces the role carried by the `auth_token` JWT:
 * - no/invalid token -> back to the login page;
 * - `USUARIO` outside `/admin/productos` -> redirected to that module;
 * - `SUPER_USUARIO` -> full access.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const payload = token ? await verifyAuthToken(token) : null;

  if (!payload) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.search = "";
    loginUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );

    return NextResponse.redirect(loginUrl);
  }

  if (!canAccessAdminPath(payload.role, request.nextUrl.pathname)) {
    const productsUrl = request.nextUrl.clone();
    productsUrl.pathname = PRODUCTS_HOME;
    productsUrl.search = "";

    return NextResponse.redirect(productsUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
