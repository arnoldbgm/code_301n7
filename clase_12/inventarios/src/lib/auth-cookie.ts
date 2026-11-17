import { cookies } from "next/headers";

import {
  AUTH_TOKEN_COOKIE,
  AUTH_TOKEN_MAX_AGE,
  signAuthToken,
  verifyAuthToken,
  type AuthTokenPayload,
  type AuthTokenUser,
} from "./jwt";

/**
 * Signs a JWT for the user and stores it in an httpOnly cookie.
 * Only callable from a Route Handler or a Server Action.
 */
export async function setAuthCookie(user: AuthTokenUser): Promise<string> {
  const token = await signAuthToken(user);
  const cookieStore = await cookies();

  cookieStore.set(AUTH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_TOKEN_MAX_AGE,
  });

  return token;
}

/** Removes the auth cookie (used on sign out). */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_TOKEN_COOKIE);
}

/** Returns the raw JWT from the request cookies, if present. */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();

  return cookieStore.get(AUTH_TOKEN_COOKIE)?.value ?? null;
}

/** Reads and verifies the JWT of the current request. null if absent/invalid. */
export async function getAuthPayload(): Promise<AuthTokenPayload | null> {
  const token = await getAuthToken();

  return token ? verifyAuthToken(token) : null;
}
