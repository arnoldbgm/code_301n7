import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";

import { clearAuthCookie, setAuthCookie } from "./auth-cookie";
import { authorizeCredentials } from "./credentials";
import { DEFAULT_AUTH_ROLE } from "./roles";
import { findUserRoleByEmail, registerOAuthUser } from "./users";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Correo y contraseña",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: (credentials) => authorizeCredentials(credentials),
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  events: {
    // Runs inside the `/api/auth/callback/github` route handler, so the
    // `cookies()` write is merged into the response that redirects to /admin.
    async signIn({ user, account }) {
      const provider = account?.provider ?? "github";

      // Credentials logins already resolved the role from `users`; OAuth
      // logins are registered (or refreshed) here with the default USUARIO.
      const role =
        user.role ??
        (provider === "credentials"
          ? ((await findUserRoleByEmail(user.email)) ?? DEFAULT_AUTH_ROLE)
          : await registerOAuthUser({ name: user.name, email: user.email }));

      await setAuthCookie({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        provider,
        role,
      });
    },
    async signOut() {
      await clearAuthCookie();
    },
  },
};
