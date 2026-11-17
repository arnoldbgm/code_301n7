import { hash } from "bcryptjs";

import { UserRole } from "../generated/prisma/enums";
import { prisma } from "./prisma";
import { DEFAULT_AUTH_ROLE, type AuthRole } from "./roles";
import type { RegisterInput } from "./validations/auth";

type OAuthUser = {
  name?: string | null;
  email?: string | null;
};

/** Safe user shape returned by the register endpoint (never the hash). */
export type RegisteredUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  createdAt: Date;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Role stored for this email, or null when the account does not exist yet. */
export async function findUserRoleByEmail(
  email: string | null | undefined,
): Promise<AuthRole | null> {
  if (!email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: { role: true },
  });

  return user?.role ?? null;
}

/**
 * Registers (or refreshes) an OAuth account in `users` and returns its role.
 *
 * New accounts get the schema default (`USUARIO`); an existing role is never
 * overwritten, so a `SUPER_USUARIO` who signs in with GitHub keeps full access.
 * When the provider does not expose an email there is no unique key to store,
 * so the user simply gets `USUARIO` without a database row.
 */
export async function registerOAuthUser(
  user: OAuthUser,
): Promise<AuthRole> {
  if (!user.email) {
    return DEFAULT_AUTH_ROLE;
  }

  const email = normalizeEmail(user.email);
  const name = user.name?.trim() || email.split("@")[0] || email;

  const saved = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
    select: { role: true },
  });

  return saved.role;
}

/**
 * Creates an email/password account from the public registration form. The
 * password is hashed with bcrypt, and every self-registered account gets the
 * plain `USUARIO` role (never a role supplied by the client).
 */
export async function registerCredentialsUser(
  input: RegisterInput,
): Promise<RegisteredUser> {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: await hash(input.password, 10),
      role: UserRole.USUARIO,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}
