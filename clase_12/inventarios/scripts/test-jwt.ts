import assert from "node:assert/strict";

import "dotenv/config";

import { SignJWT } from "jose";

import { signAuthToken, verifyAuthToken } from "../src/lib/jwt";

async function main() {
  const token = await signAuthToken({
    id: "123456",
    name: "Ada Lovelace",
    email: "ada@example.com",
    image: "https://avatars.githubusercontent.com/u/123456",
    provider: "github",
    role: "SUPER_USUARIO",
  });

  assert.equal(token.split(".").length, 3, "the token must be a signed JWT");

  const payload = await verifyAuthToken(token);

  assert.ok(payload, "a token signed with JWT_SECRET must verify");
  assert.equal(payload.sub, "123456");
  assert.equal(payload.email, "ada@example.com");
  assert.equal(payload.provider, "github");
  assert.equal(payload.role, "SUPER_USUARIO");
  assert.ok(payload.exp > payload.iat, "the token must expire in the future");

  const tampered = `${token.slice(0, -2)}xx`;
  assert.equal(
    await verifyAuthToken(tampered),
    null,
    "a tampered token must be rejected",
  );

  assert.equal(await verifyAuthToken("not-a-jwt"), null);

  // Tokens issued before the `role` claim are rejected so a session can never
  // fall back to a guessed role.
  const secretValue = process.env.JWT_SECRET;
  assert.ok(secretValue, "JWT_SECRET must be defined to run this test");

  const secret = new TextEncoder().encode(secretValue);
  const legacyToken = await new SignJWT({ provider: "github" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject("123456")
    .setIssuer("inventarios")
    .setAudience("inventarios-web")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);

  assert.equal(
    await verifyAuthToken(legacyToken),
    null,
    "a token without role must be rejected",
  );

  console.log("JWT OK: role signed/verified, tampered and legacy rejected.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
