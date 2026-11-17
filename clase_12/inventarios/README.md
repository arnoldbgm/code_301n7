This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Project commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run db:migrate` | Create/apply dev migrations and regenerate the Prisma client |
| `npm run db:seed` | Seed the database |
| `npm run test:api` | Smoke test the API endpoints (requires `npm run dev` running) |
| `npm run test:jwt` | Sign/verify a JWT with `JWT_SECRET` (no server needed) |
| `npm run test:credentials` | Check the seeded admin and a temporary `USUARIO` account |
| `npm run test:users` | Check OAuth registration and role preservation |
| `npm run test:register` | Check public registration (bcrypt, role, duplicate email) |
| `npm run user:create -- "email" "password" [name] [--super]` | Create/update an account with a bcrypt password |
| `npm run auth:hash -- "password"` | Generate the base64 bcrypt value for `ADMIN_PASSWORD_HASH_B64` |

## Authentication (NextAuth + JWT)

- Two sign-in methods via NextAuth v4 (`/api/auth/[...nextauth]`):
  - **GitHub OAuth**: the account is registered/refreshed in `users` with the
    default `USUARIO` role (an existing role is never overwritten).
  - **Email + password**: validated against the `users` table with bcrypt. The
    seeded admin is `admin@admin.com` / `12345678`.
  `/admin/*` is protected by `proxy.ts`.
- On a successful login (either method), a **second** signed JWT (`jose`, HS256,
  7 days) is written to the httpOnly `auth_token` cookie. It carries `sub`, `name`,
  `email`, `picture`, `provider` and `role`. It is issued from `events.signIn` in
  `src/lib/auth.ts` and removed on sign out.
- **Role-based access** (`src/lib/roles.ts` + `proxy.ts`):
  - `SUPER_USUARIO`: every `/admin/*` module.
  - `USUARIO`: only `/admin/productos`; any other `/admin/*` route redirects there.
  - No/invalid token: redirect to `/?callbackUrl=...`.
  - The sidebar (`SidebarMenu`) shows only the modules allowed by the role.
  Tokens issued before the `role` claim are rejected, so users sign in again.
- `src/lib/auth-cookie.ts` exposes `getAuthPayload()` to read and verify that cookie from
  route handlers and server components.
- Requires `JWT_SECRET` (independent from `NEXTAUTH_SECRET`), `ADMIN_EMAIL` and
  `ADMIN_PASSWORD_HASH_B64` (consumed by `db:seed`); see `.env.example`.

## Registration

- `/register` (`components/register/Register.tsx`) asks for **name, email, password
  and password confirmation**.
- `POST /api/auth/register` validates the payload with `registerSchema`, hashes the
  password with bcrypt (cost 10) and creates the account with the `USUARIO` role.
  The response never includes the hash, and a repeated email returns
  `409 EMAIL_ALREADY_EXISTS`.
- After a successful registration the form signs the user in automatically; the proxy
  then sends the new `USUARIO` to `/admin/productos`.

## Users and roles

`prisma/schema.prisma` defines the `User` model (`users` table):

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `name` | varchar(120) | Display name |
| `email` | varchar(120) | Unique, used as login identifier |
| `password` | varchar(255), nullable | bcrypt hash; `null` for OAuth-only accounts |
| `role` | `user_role` | `super_usuario` or `usuario`; defaults to `usuario` |
| `created_at` / `updated_at` | timestamp | |

`npm run db:seed` upserts `admin@admin.com` as `SUPER_USUARIO` using `ADMIN_EMAIL`
and `ADMIN_PASSWORD_HASH_B64`. Any other account created at `/register`, with
`npm run user:create -- "email" "password" "Name"`, or through another login method
gets the default `USUARIO` role. Add `--super` to the command to create another
`SUPER_USUARIO`; roles can also be changed in the database (`npm run db:studio`).

## API endpoints

### `/api/clientes`

- `GET` - list customers
- `POST` - create customer (`documentType` `DNI`/`RUC`, `businessName` required for `RUC`)
- `GET|PUT|DELETE /api/clientes/[id]`

### `/api/productos`

- `GET` - list products (`?active=true|false` filters by status)
- `POST` - create product (`code` unique, `price` includes IGV, integer `stock`)
- `GET|PUT|DELETE /api/productos/[id]`

### `/api/ventas`

- `GET` - list vouchers with customer and items
- `POST` - issue a voucher. Validates stock, decrements it atomically, computes
  subtotal/IGV(18%)/total, and assigns `series`-`number` (B001/F001).
  A `FACTURA` requires a customer with `RUC`.
- `GET /api/ventas/[id]` - voucher detail (includes customer address)
- `DELETE /api/ventas/[id]` - annul voucher and restore product stock
