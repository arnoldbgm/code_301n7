import { jwtVerify, SignJWT } from "jose";

import { isAuthRole, type AuthRole } from "./roles";

/** Name of the httpOnly cookie that stores our signed JWT. */
export const AUTH_TOKEN_COOKIE = "auth_token";

/** JWT lifespan (7 days), in seconds. */
export const AUTH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

const JWT_ALGORITHM = "HS256";
const JWT_ISSUER = "inventarios";
const JWT_AUDIENCE = "inventarios-web";

/** Data a user must have to receive a token (subset of the GitHub profile). */
export type AuthTokenUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  provider: string;
  role: AuthRole;
};

/** Claims stored inside the token. */
export type AuthTokenPayload = {
  sub: string;
  name: string | null;
  email: string | null;
  picture: string | null;
  provider: string;
  role: AuthRole;
  iat: number;
  exp: number;
};

function getSecretKey() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not defined. Add it to your .env file to sign auth tokens.",
    );
  }

  return new TextEncoder().encode(secret);
}

/** Signs an HS256 JWT for the given user. */
export async function signAuthToken(user: AuthTokenUser): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    name: user.name ?? null,
    email: user.email ?? null,
    picture: user.image ?? null,
    provider: user.provider,
    role: user.role,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM, typ: "JWT" })
    .setSubject(user.id)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + AUTH_TOKEN_MAX_AGE)
    .sign(getSecretKey());
}

/** Verifies the signature, issuer, audience and expiration of a token. */
export async function verifyAuthToken(
  token: string,
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    // Tokens issued before the role claim existed are rejected on purpose: the
    // role drives access control, so a session without it must sign in again.
    if (typeof payload.sub !== "string" || !isAuthRole(payload.role)) {
      return null;
    }

    return {
      sub: payload.sub,
      name: typeof payload.name === "string" ? payload.name : null,
      email: typeof payload.email === "string" ? payload.email : null,
      picture: typeof payload.picture === "string" ? payload.picture : null,
      provider: typeof payload.provider === "string" ? payload.provider : "",
      role: payload.role,
      iat: payload.iat ?? 0,
      exp: payload.exp ?? 0,
    };
  } catch {
    // Invalid signature, expired token, malformed JWT, etc.
    return null;
  }
}
