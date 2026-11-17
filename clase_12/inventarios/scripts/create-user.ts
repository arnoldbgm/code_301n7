import { hash } from "bcryptjs";
import "dotenv/config";

import { UserRole } from "../src/generated/prisma/enums";
import { prisma } from "../src/lib/prisma";
import { credentialsSchema } from "../src/lib/validations/auth";

async function main() {
  const args = process.argv.slice(2);
  const isSuper = args.includes("--super");
  const [email, password, ...nameParts] = args.filter(
    (arg) => arg !== "--super",
  );
  const name = nameParts.join(" ").trim();

  if (!email || !password) {
    console.error(
      "Uso: npm run user:create -- <correo> <contraseña> [nombre] [--super]",
    );
    process.exitCode = 1;
    return;
  }

  const parsed = credentialsSchema.safeParse({ email, password });

  if (!parsed.success) {
    console.error(
      parsed.error.issues[0]?.message ?? "Correo o contraseña inválidos.",
    );
    process.exitCode = 1;
    return;
  }

  const normalizedEmail = parsed.data.email;
  const displayName = name || normalizedEmail.split("@")[0];
  const passwordHash = await hash(parsed.data.password, 10);

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      name: displayName,
      password: passwordHash,
      // Without --super an existing role is preserved (never downgrade).
      ...(isSuper ? { role: UserRole.SUPER_USUARIO } : {}),
    },
    create: {
      name: displayName,
      email: normalizedEmail,
      password: passwordHash,
      role: isSuper ? UserRole.SUPER_USUARIO : UserRole.USUARIO,
    },
  });

  console.log(
    `Usuario ${user.email} listo con rol ${user.role} (id ${user.id}).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
