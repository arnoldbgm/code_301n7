import assert from "node:assert/strict";

import { hash } from "bcryptjs";
import "dotenv/config";

import { authorizeCredentials } from "../src/lib/credentials";
import { UserRole } from "../src/generated/prisma/enums";
import { prisma } from "../src/lib/prisma";

const TEST_PASSWORD = "clave-de-prueba-123";

async function main() {
  const testEmail = `test-credentials-${Date.now()}@example.com`;

  try {
    const user = await authorizeCredentials({
      email: "admin@admin.com",
      password: "12345678",
    });

    assert.ok(user, "the reference credentials must be accepted");
    assert.equal(user.email, "admin@admin.com");
    assert.equal(
      user.role,
      UserRole.SUPER_USUARIO,
      "the seeded admin must be a super user",
    );

    const normalized = await authorizeCredentials({
      email: "  ADMIN@Admin.com ",
      password: "12345678",
    });

    assert.ok(normalized, "email is trimmed and compared case-insensitively");

    assert.equal(
      await authorizeCredentials({
        email: "admin@admin.com",
        password: "wrong-password",
      }),
      null,
      "a wrong password must be rejected",
    );

    assert.equal(
      await authorizeCredentials({
        email: "otro@admin.com",
        password: "12345678",
      }),
      null,
      "a wrong email must be rejected",
    );

    assert.equal(
      await authorizeCredentials({
        email: "no-es-correo",
        password: "12345678",
      }),
      null,
      "an invalid email must be rejected",
    );

    await prisma.user.create({
      data: {
        name: "Usuario de prueba",
        email: testEmail,
        password: await hash(TEST_PASSWORD, 10),
      },
    });

    const plainUser = await authorizeCredentials({
      email: testEmail,
      password: TEST_PASSWORD,
    });

    assert.ok(plainUser, "a user created in the table can sign in");
    assert.equal(
      plainUser.role,
      UserRole.USUARIO,
      "new accounts default to the plain user role",
    );

    console.log(
      "Credentials OK: admin is SUPER_USUARIO, new accounts are USUARIO.",
    );
  } finally {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
