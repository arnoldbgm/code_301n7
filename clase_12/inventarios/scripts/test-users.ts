import assert from "node:assert/strict";

import "dotenv/config";

import { UserRole } from "../src/generated/prisma/enums";
import { prisma } from "../src/lib/prisma";
import { findUserRoleByEmail, registerOAuthUser } from "../src/lib/users";

async function main() {
  const email = `oauth-${Date.now()}@example.com`;

  try {
    assert.equal(
      await findUserRoleByEmail(email),
      null,
      "an unknown email has no role yet",
    );

    assert.equal(
      await registerOAuthUser({ email, name: "OAuth Test" }),
      UserRole.USUARIO,
      "a new OAuth account is registered as USUARIO",
    );

    assert.equal(
      await findUserRoleByEmail(email),
      UserRole.USUARIO,
      "the OAuth account was persisted in the users table",
    );

    await prisma.user.update({
      where: { email },
      data: { role: UserRole.SUPER_USUARIO },
    });

    assert.equal(
      await registerOAuthUser({ email, name: "OAuth Test Renamed" }),
      UserRole.SUPER_USUARIO,
      "signing in again must not overwrite an existing role",
    );

    assert.equal(
      await registerOAuthUser({ email: null, name: "No Email" }),
      UserRole.USUARIO,
      "providers without email fall back to USUARIO",
    );

    console.log(
      "Users OK: OAuth accounts default to USUARIO and keep their role.",
    );
  } finally {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
