import assert from "node:assert/strict";

import { compare } from "bcryptjs";
import "dotenv/config";

import { UserRole } from "../src/generated/prisma/enums";
import { prisma } from "../src/lib/prisma";
import { registerCredentialsUser } from "../src/lib/users";
import { registerSchema } from "../src/lib/validations/auth";

const email = `test-register-${Date.now()}@example.com`;
const input = {
  name: "  Ana Torres  ",
  email: `  ${email.toUpperCase()} `,
  password: "clave12345",
  confirmPassword: "clave12345",
};

async function main() {
  try {
    const mismatched = registerSchema.safeParse({
      ...input,
      confirmPassword: "otra-clave",
    });

    assert.equal(
      mismatched.success,
      false,
      "different passwords must fail validation",
    );

    if (!mismatched.success) {
      assert.ok(
        mismatched.error.issues.some(
          (issue) => issue.path[0] === "confirmPassword",
        ),
        "the mismatch is reported on the confirmation field",
      );
    }

    const parsed = registerSchema.parse(input);

    assert.equal(parsed.name, "Ana Torres", "the name is trimmed");
    assert.equal(parsed.email, email, "the email is trimmed and lowercased");

    const created = await registerCredentialsUser(parsed);

    assert.equal(created.email, email);
    assert.equal(
      created.role,
      UserRole.USUARIO,
      "self-registered accounts are plain users",
    );
    assert.equal(
      "password" in created,
      false,
      "the returned user never includes the hash",
    );

    const stored = await prisma.user.findUnique({ where: { email } });
    const storedHash = stored?.password ?? "";

    assert.ok(storedHash.startsWith("$2"), "the password is stored as bcrypt");
    assert.notEqual(storedHash, parsed.password, "the plain password is not stored");
    assert.equal(
      await compare(parsed.password, storedHash),
      true,
      "the stored hash matches the submitted password",
    );

    await assert.rejects(
      () => registerCredentialsUser(parsed),
      (error: unknown) => (error as { code?: string }).code === "P2002",
      "the unique email index rejects a duplicate registration",
    );

    console.log(
      "Register OK: bcrypt hash, USUARIO role and duplicate rejection.",
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
