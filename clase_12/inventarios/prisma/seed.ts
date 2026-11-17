import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, UserRole } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined. Add it to your .env file.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function getAdminPasswordHash() {
  // The bcrypt hash is stored base64-encoded in .env because Next.js expands
  // the "$" characters of a raw hash.
  const encoded = process.env.ADMIN_PASSWORD_HASH_B64;

  if (!encoded) {
    throw new Error(
      'ADMIN_PASSWORD_HASH_B64 is not defined. Generate it with: npm run auth:hash -- "your-password"',
    );
  }

  const hash = Buffer.from(encoded, "base64").toString("utf8");

  if (!hash.startsWith("$2")) {
    throw new Error(
      "ADMIN_PASSWORD_HASH_B64 does not decode to a bcrypt hash.",
    );
  }

  return hash;
}

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@admin.com")
    .trim()
    .toLowerCase();
  const adminPassword = getAdminPasswordHash();

  // First (and only) super user. Every other account relies on the default
  // role defined in the schema: USUARIO.
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Administrador",
      password: adminPassword,
      role: UserRole.SUPER_USUARIO,
    },
    create: {
      name: "Administrador",
      email: adminEmail,
      password: adminPassword,
      role: UserRole.SUPER_USUARIO,
    },
  });

  await prisma.customer.upsert({
    where: { dni: "00000000" },
    update: {},
    create: {
      dni: "00000000",
      firstName: "Walk-in",
      lastName: "Customer",
      address: "N/A",
    },
  });

  console.log(
    `Seed completed. ${adminEmail} has role ${UserRole.SUPER_USUARIO}.`,
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
