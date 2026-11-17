/**
 * Roles understood by the application. The values match the Prisma `UserRole`
 * enum (and the strings stored in the `user_role` Postgres type).
 */
export const AUTH_ROLES = ["SUPER_USUARIO", "USUARIO"] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

/** Least-privilege role, used when a role cannot be resolved. */
export const DEFAULT_AUTH_ROLE: AuthRole = "USUARIO";

/** Landing page for a plain `usuario`: the only module they can open. */
export const PRODUCTS_HOME = "/admin/productos";

export function isAuthRole(value: unknown): value is AuthRole {
  return (
    typeof value === "string" &&
    (AUTH_ROLES as readonly string[]).includes(value)
  );
}

/**
 * `SUPER_USUARIO` can open every `/admin/*` route; `USUARIO` is limited to the
 * products module (including its sub-routes).
 */
export function canAccessAdminPath(role: AuthRole, pathname: string): boolean {
  if (role === "SUPER_USUARIO") {
    return true;
  }

  return (
    pathname === PRODUCTS_HOME || pathname.startsWith(`${PRODUCTS_HOME}/`)
  );
}
