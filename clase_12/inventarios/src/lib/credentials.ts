import { compare } from "bcryptjs";

import { prisma } from "./prisma";
import type { AuthRole } from "./roles";
import { credentialsSchema } from "./validations/auth";

/** Profile returned to NextAuth when a user signs in with email/password. */
export type CredentialsUser = {
  id: string;
  name: string;
  email: string;
  image: null;
  role: AuthRole;
};

/**
 * Valid bcrypt hash (for a random, unused password) compared against when the
 * email does not exist, so a failed login takes the same time either way.
 */
const DUMMY_PASSWORD_HASH =
  "$2b$10$d1.1HjEqPVmYYAcY/9FkIe7VAQn/Dh8bBQvsMMzSw.Ctp92J.S.we";

/**
 * Validates email/password against the `users` table. The role stored in that
 * row is what ends up in the JWT. Returns null when the credentials are wrong.
 */
export async function authorizeCredentials(
  input: unknown,
): Promise<CredentialsUser | null> {
  const parsed = credentialsSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = await compare(
    password,
    user?.password ?? DUMMY_PASSWORD_HASH,
  );

  // OAuth-only accounts have no password hash and cannot use this form.
  if (!user?.password || !passwordMatches) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: null,
    role: user.role,
  };
}
