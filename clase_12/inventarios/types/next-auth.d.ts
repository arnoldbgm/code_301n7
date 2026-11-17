import "next-auth";

import type { AuthRole } from "@/src/lib/roles";

declare module "next-auth" {
  interface User {
    /** Set by `authorizeCredentials`; read by `events.signIn` to sign the JWT. */
    role?: AuthRole;
  }
}
