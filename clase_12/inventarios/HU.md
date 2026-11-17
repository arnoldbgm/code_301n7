# HU — Sistema de ventas con emisión electrónica a SUNAT (Nubefact)

> **Proyecto:** inventarios — administración de ventas (Perú) que emite boletas y facturas electrónicas reales a través de la API de Nubefact.
>
> **Stack:** Next.js 16 (App Router + Turbopack) · React 19 · Prisma 7 (PostgreSQL en Neon) · HeroUI + Tailwind · Zod · API en español (`/api/clientes`, `/api/productos`, `/api/ventas`, `/api/consulta-documento`).

---

## Objetivo general

Registrar clientes, productos y ventas en una app de administración, y que cada venta genere un **comprobante de pago electrónico (CPE)** real: boleta o factura enviada a SUNAT vía Nubefact, con PDF/XML/CDR, estado de aceptación y comunicación de baja (anulación).

## Series y correlativos (regla de negocio)

| Tipo   | Serie | Primer correlativo |
| ------ | ----- | ------------------ |
| BOLETA | BBB1  | 6                  |
| FACTURA| FFF1  | 8                  |

- Definidos en `src/lib/validations/voucher.ts` (`DEFAULT_SERIES`, `SERIES_START_NUMBER`).
- El correlativo se calcula como *último número de la serie en la BD + 1* (si no hay ninguno, arranca en 6/8 según el tipo).
- Los vouchers anulados **conservan su número** (anulación suave) para nunca reutilizar correlativos: Nubefact rechaza una combinación serie + número repetida (error 23).

---

## Lo implementado

### Fase 1 — Modelo de datos ✅

- `prisma/schema.prisma`: `Customer` (DNI/RUC + razón social), `Product` (código único, precio **con IGV incluido**, stock entero, `isActive`, `imageUrl`), `Voucher`, `VoucherItem`.
- Dinero en `Decimal(12,2)`; stock y correlativos `Int`; único `(series, number)`.
- 5 migraciones aplicadas. `20261110031822_add_sunat_emission_fields` agregó los campos de emisión SUNAT y `20261112024041_add_product_image` agregó `imageUrl` a `Product` (ver fase 5).

### Fase 2 — API + UI local ✅

- CRUD completo: `/api/clientes`, `/api/productos` (GET/POST/PUT/DELETE + `?active=`), `/api/ventas` (GET/POST), `/api/ventas/[id]` (GET detalle / DELETE anulación).
- Validaciones Zod, errores uniformes (`ApiError` / `handleApiError`), IGV 18% incluido en precios: `subtotal = total/1.18` (ROUND_HALF_UP), `igv = total − subtotal`.
- Factura exige cliente con RUC (422 `FACTURA_REQUIRES_RUC_CUSTOMER`).
- Descuento de stock atómico (`updateMany` con condición `stock >= cantidad`), líneas duplicadas se fusionan.
- UI en español: `/admin/clientes`, `/admin/productos`, `/admin/ventas` (formularios y tablas HeroUI).
- Suite de humo `npm run test:api` (`scripts/test-api.mjs`): en fase 2 pasaba 21/21.

### Fase 3 — Emisión electrónica Nubefact/SUNAT ✅ (código completo)

1. **Cliente Nubefact** — `src/lib/nubefact.ts`
   - POST a `NUBEFACT_URL` con `Authorization: <token crudo>` (sin "Bearer") y `Content-Type: application/json`, timeout 30 s.
   - Operaciones: `generar_comprobante`, `consultar_comprobante`, `generar_anulacion`.
   - Errores `{"errors","codigo"}` → `ApiError` 502 `NUBEFACT_ERROR` (con el código Nubefact en `details`); 502 `NUBEFACT_UNREACHABLE` (sin red/timeout); 503 `NUBEFACT_NOT_CONFIGURED` si faltan variables.
   - `buildGenerarComprobantePayload`: items con `unidad_de_medida` "NIU", código/descripción del producto, `valor_unitario` (sin IGV), `precio_unitario` (con IGV), `subtotal/igv/total` por línea con la **misma fórmula que la ruta de ventas** (el manual exige que la suma de líneas coincida exactamente con los totales), `tipo_de_igv` 1, `anticipo_regularizacion` false; cabecera con `sunat_transaction` 1, `cliente_tipo_de_documento` "1"/"6", `fecha_de_emision` DD-MM-YYYY en hora de Lima, `moneda` 1 (soles), `porcentaje_de_igv` 18, `enviar_automaticamente_a_la_sunat` true.

2. **POST `/api/ventas`** — `app/api/ventas/route.ts`
   - Transacción BD: valida cliente (factura ⇒ RUC), valida y descuenta stock, fusiona líneas, calcula totales, asigna serie/correlativo y crea el voucher.
   - Después del insert: si `NUBEFACT_URL`/`NUBEFACT_TOKEN` están definidos, llama a `generar_comprobante` y persiste la respuesta (`sunatAccepted`, `sunatDescription`, `enlacePdf`, `enlaceXml`, `enlaceCdr`, `codigoHash`).
   - Si Nubefact falla: **roll back completo** (restaura stock, borra el voucher) y devuelve el error — la venta no queda a medias.
   - Sin credenciales configuradas, la venta se registra igualmente en modo local (sin emisión).

3. **DELETE `/api/ventas/[id]`** — anulación
   - Body opcional `{"motivo": "..."}` (default `"ERROR DEL SISTEMA"`, máx 100 caracteres).
   - Si el comprobante fue enviado a SUNAT: primero `generar_anulacion` (comunicación de baja) en Nubefact; si Nubefact falla, no toca nada local.
   - Anulación suave local: marca `annulledAt`, restaura stock en una transacción; 409 `VOUCHER_ALREADY_ANNULLED` si ya estaba anulada.

4. **GET `/api/ventas/[id]/sunat`** — `app/api/ventas/[id]/sunat/route.ts`
   - Refresca el estado del comprobante (`consultar_comprobante`) y persiste los últimos enlaces/estado.

5. **GET `/api/ventas`** excluye los vouchers anulados.

6. **DELETE `/api/productos/[id]`** — limpia los items de vouchers anulados (histórico) para que no bloqueen el borrado del producto; los vouchers activos siguen protegiéndolo (FK).

7. **UI actualizada**
   - `VentaForm.tsx`: totales calculados como espejo exacto de la API (merge de líneas + redondeo por línea); toast de éxito con estado SUNAT del comprobante emitido.
   - `VentasTable.tsx`: columna **SUNAT** (chip Aceptado / Rechazado / Local), botón **PDF**, modal de detalle con enlaces PDF/XML/CDR y totales, modal de anulación con motivo editable, botón "Actualizar estado SUNAT".

8. **Tests** — `scripts/test-api.mjs` actualizado: series `BBB1`/`FFF1`, correlativos ≥ 6/≥ 8, anuladas excluidas del listado, 409 al re-anular.

### Fase 4 — Consulta de DNI/RUC con Decolecta ✅

1. **Cliente Decolecta** — `src/lib/decolecta.ts`
   - GET `https://api.decolecta.com/v1/reniec/dni?numero=...` y `.../v1/sunat/ruc?numero=...` con `Authorization: Bearer <DECOLECTA_TOKEN>`, timeout 15 s.
   - Normaliza la respuesta snake_case a `documentType/number/firstName/lastName/fullName` (DNI) y `businessName/address/status/condition/district/province/department` (RUC).
   - Errores: 404 `DOCUMENT_NOT_FOUND`, 422 `DOCUMENT_INVALID` (RUC no válido), 429 `DECOLECTA_RATE_LIMIT`, 401 `DECOLECTA_UNAUTHORIZED` (token inválido o límite del plan), 502 `DECOLECTA_UNREACHABLE` / `DECOLECTA_ERROR` / `DECOLECTA_INVALID_RESPONSE`, 503 `DECOLECTA_NOT_CONFIGURED`.
2. **GET `/api/consulta-documento?tipo=DNI|RUC&numero=...`** — valida tipo y número (8/11 dígitos) con Zod (`src/lib/validations/document.ts`) y responde `{ data: ... }`. El token nunca llega al navegador.
3. **UI** — `ClienteForm.tsx`: botón **Consultar DNI/RUC** junto al número de documento. Con DNI rellena nombres/apellidos; con RUC rellena razón social y dirección. Toasts de éxito/error y validación local antes de llamar a la API. Los campos del formulario pasaron a ser controlados para permitir el autocompletado.

### Fase 5 — Imagen de producto con Cloudinary ✅

1. **Modelo de datos** — `Product.imageUrl String? @map("image_url") @db.VarChar(500)` (migración `20261112024041_add_product_image`). Solo se guarda el `secure_url` de Cloudinary; la validación Zod exige el prefijo `https://res.cloudinary.com/` y convierte la cadena vacía en `null`.
2. **Subida firmada** — `app/api/cloudinary/signature/route.ts` (`POST { paramsToSign }`): ordena los parámetros A–Z, los une como `clave=valor&...`, concatena `CLOUDINARY_API_SECRET` y devuelve `{ signature }` (SHA-1 hexadecimal). Responde 503 `CLOUDINARY_NOT_CONFIGURED` si falta el secreto y 400 `INVALID_SIGNATURE_REQUEST` si el body no trae un objeto. El secreto nunca llega al navegador.
3. **UI del formulario** — `ProductoForm.tsx` integra `CldUploadWidget` de `next-cloudinary` con `signatureEndpoint="/api/cloudinary/signature"`, carpeta `inventarios/productos`, un solo archivo, formatos PNG/JPG/JPEG/WEBP y máximo 5 MB. Muestra un `Avatar` de HeroUI con la imagen actual, botones **Subir/Cambiar imagen** y **Quitar**. Si faltan las variables públicas de Cloudinary, se muestra un aviso en lugar del botón.
4. **Tabla** — `ProductosTable.tsx` agrega la columna **Imagen** con un `Avatar` de HeroUI: imagen de Cloudinary o las iniciales del producto como fallback.
5. **Verificación** — firma del endpoint validada contra el SHA-1 calculado localmente, subida real a Cloudinary, alta/lectura/actualización/borrado de un producto de prueba con `imageUrl`, y destrucción del asset de prueba (`result: ok`).

### Fase 6 — Autenticación con GitHub (NextAuth v4) ✅

1. **Configuración** — `src/lib/auth.ts`: `GitHubProvider` con `GITHUB_ID`/`GITHUB_SECRET`, sesión **JWT**, `pages.signIn: "/"` y `NEXTAUTH_SECRET`.
2. **Route handler** — `app/api/auth/[...nextauth]/route.ts` exporta `GET` y `POST` desde `NextAuth(authOptions)`.
3. **Protección de rutas** — `proxy.ts` (el nuevo nombre de `middleware` en Next 16) usa `withAuth` con matcher `/admin/:path*`. Sin sesión redirige a `/?callbackUrl=...`; con sesión permite el acceso.
4. **UI de login** — botón **Iniciar sesión con GitHub** en `/` (`components/login/GithubLoginButton.tsx`), que llama a `signIn("github", { callbackUrl: "/admin/dashboard" })`. El sidebar de administración incluye **Cerrar sesión** (`components/admin/LogoutButton.tsx`, `signOut`).
5. **Datos del usuario** — `components/admin/UserCard.tsx` (server component) lee la sesión con `getServerSession(authOptions)` y muestra en el sidebar el avatar de GitHub, el nombre y el correo del usuario autenticado. La lectura de cookies vive dentro de un `<Suspense>` en `Sidebar.tsx`, tal como exige `cacheComponents` (las rutas `/admin/*` quedan como PPR y el bloque del usuario se transmite en cada request).
5. **Variables** — `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`.
6. **Verificación** — `/api/auth/providers` 200 con el proveedor GitHub; `/api/auth/csrf` 200; `/api/auth/signin/github` 302 a GitHub con `client_id` y `redirect_uri` correctos; GitHub acepta el callback (muestra su login, sin `redirect_uri_mismatch`); `/admin/dashboard` sin sesión responde 307 a `/?callbackUrl=%2Fadmin%2Fdashboard`; `/` renderiza el botón.

### Fase 7 — JWT propio en cookie tras el login de GitHub ✅

1. **Firma/verificación** — `src/lib/jwt.ts` usa `jose` (HS256) con `JWT_SECRET`:
   - `signAuthToken` emite un JWT de 7 días con los claims `sub` (id del usuario de GitHub), `name`, `email`, `picture` y `provider`, más `iss: "inventarios"` y `aud: "inventarios-web"`.
   - `verifyAuthToken` valida firma, algoritmo, emisor, audiencia y expiración; devuelve `null` con cualquier token inválido o adulterado (nunca lanza).
2. **Cookie** — `src/lib/auth-cookie.ts`: `setAuthCookie` guarda el JWT en la cookie `auth_token` con `httpOnly`, `secure` en producción, `sameSite: "lax"`, `path: "/"` y `maxAge` de 7 días. `clearAuthCookie` la elimina en el logout; `getAuthToken`/`getAuthPayload` la leen y verifican (base para proteger las rutas API en la siguiente fase).
3. **Enganche con NextAuth** — `src/lib/auth.ts`:
   - `events.signIn` se ejecuta dentro de `/api/auth/callback/github`, firma el JWT y escribe la cookie. Next 16 fusiona los `Set-Cookie` de `cookies()` con la respuesta 302 que devuelve NextAuth.
   - `events.signOut` borra `auth_token` junto con la sesión de NextAuth.
4. **Variables** — `JWT_SECRET` (distinta de `NEXTAUTH_SECRET`), agregada a `.env` y `.env.example`.
5. **Verificación** — `npm run test:jwt` firma, verifica y rechaza un token adulterado; una prueba HTTP contra un route handler temporal confirmó `Set-Cookie: auth_token=...` sobre un `302` con `HttpOnly; SameSite=lax; Max-Age=604800`, y el token se verificó con el secreto compartido.

> La cookie `auth_token` convive con la cookie de sesión de NextAuth (`next-auth.session-token`): la primera es el JWT propio de la aplicación.

### Fase 8 — Inicio de sesión con correo y contraseña ✅

1. **Proveedor de credenciales** — `src/lib/auth.ts` agrega `CredentialsProvider` (NextAuth v4); su `authorize` delega en `src/lib/credentials.ts`.
2. **Validación** — `src/lib/validations/auth.ts` (Zod): correo recortado y en minúsculas + contraseña de mínimo 8 caracteres.
3. **Cuenta admin** — `authorizeCredentials` compara el correo con `ADMIN_EMAIL` y la contraseña con un hash bcrypt (coste 10) `ADMIN_PASSWORD_HASH_B64`. El hash se guarda en base64 porque Next expande los `$` de los valores de `.env` y corrompería un hash bcrypt crudo. El correo se compara después de `bcrypt.compare` para no revelar por tiempos si existe.
4. **UI** — `components/login/Login.tsx` pasa a ser un client component controlado: valida campos, llama a `signIn("credentials", { redirect: false })`, muestra toasts de éxito/error y redirige a `/admin/dashboard` con `router.push` + `router.refresh`.
5. **JWT** — el login por credenciales dispara el mismo `events.signIn` de la fase 7: se guarda `auth_token` con `sub: "admin"` y `provider: "credentials"`. `events.signOut` la elimina.
6. **Cuenta demo** — `admin@admin.com` / `12345678` (hash generado con `npm run auth:hash -- "12345678"`).
7. **Verificación** — `npm run test:credentials` (acepta la cuenta de referencia, rechaza correo/clave incorrectos y correo inválido) ✅; el callback `/api/auth/callback/credentials` responde 200 con `next-auth.session-token` + `auth_token` (payload `sub: "admin"`, `provider: "credentials"`); con clave incorrecta responde 401 `CredentialsSignin` y **no** setea `auth_token`; `/admin/dashboard` responde 200 con la sesión.

### Fase 9 — Tabla de usuarios y roles (solo migración) ✅

1. **Modelo** — `prisma/schema.prisma`:
   - Enum `UserRole` mapeado a la BD en minúsculas: `SUPER_USUARIO` → `super_usuario`, `USUARIO` → `usuario` (tipo Postgres `user_role`).
   - Modelo `User` (tabla `users`): `id` UUID, `name` `VARCHAR(120)`, `email` `VARCHAR(120)` único, `password` `VARCHAR(255)` **nullable** (hash bcrypt; queda `null` para cuentas solo OAuth como GitHub), `role` con **default `USUARIO`** y timestamps `created_at`/`updated_at`.
2. **Migración** — `20261117025440_add_users_table`: crea el tipo `user_role`, la tabla `users` y el índice único `users_email_key`. El valor por defecto de `role` en la BD es `'usuario'`.
3. **Seed** — `prisma/seed.ts` hace upsert de `ADMIN_EMAIL` (`admin@admin.com`) decodificando el hash bcrypt de `ADMIN_PASSWORD_HASH_B64` y lo crea/actualiza con rol `SUPER_USUARIO`. Cualquier otro usuario (registro manual o login con otro método) que se inserte sin rol recibe `USUARIO` por el default del esquema.
4. **Verificación** — la fila `admin@admin.com` quedó con `role = SUPER_USUARIO`, nombre `Administrador` y hash bcrypt de 60 caracteres; un usuario temporal creado sin `role` recibió `USUARIO` (luego se eliminó). `npx prisma generate` regeneró el cliente con el modelo `User` y el enum `UserRole`.
5. **Alcance** — en esta fase solo se migró el esquema: el login sigue usando la cuenta de entorno (`src/lib/credentials.ts`). Conectar credenciales/GitHub a `users` queda para la siguiente fase.

### Fase 10 — Rol en el JWT y acceso por roles ✅

1. **Rol en el JWT** — `src/lib/jwt.ts` agrega el claim `role` (`SUPER_USUARIO` | `USUARIO`) a `AuthTokenUser`/`AuthTokenPayload`; `verifyAuthToken` rechaza tokens sin un rol válido, así que las sesiones emitidas antes de esta fase deben volver a iniciar sesión.
2. **Fuente del rol (BD)** — `src/lib/credentials.ts` ahora valida correo/contraseña contra la tabla `users` (hash bcrypt) y devuelve el rol de la fila. Si el correo no existe compara contra un hash dummy para que el tiempo de respuesta no revele si la cuenta existe.
3. **Registro OAuth** — `src/lib/users.ts` (`findUserRoleByEmail`, `registerOAuthUser`): al entrar con GitHub se crea/actualiza la fila por correo con el rol por defecto `USUARIO`; nunca se sobrescribe un rol existente. Si el proveedor no expone correo, el usuario recibe `USUARIO` sin fila.
4. **Proxy por rol** — `proxy.ts` reemplaza `withAuth` por la verificación propia del `auth_token` con `verifyAuthToken`: sin token válido → `/?callbackUrl=...`; `USUARIO` fuera de `/admin/productos` → 307 a `/admin/productos`; `SUPER_USUARIO` → acceso total. El matcher sigue siendo `/admin/:path*`.
5. **Sidebar** — `components/admin/SidebarMenu.tsx` (server component dentro de `<Suspense>`) lee el rol con `getAuthPayload()` y filtra el menú: `USUARIO` solo ve Productos.
6. **Utilidad** — `npm run user:create -- <correo> <contraseña> [nombre] [--super]` crea/actualiza una cuenta con hash bcrypt (por defecto `USUARIO`; `--super` para `SUPER_USUARIO`).
7. **Verificación** — `test:jwt` (rol firmado/verificado y token sin rol rechazado), `test:credentials` (admin `SUPER_USUARIO`, cuenta nueva `USUARIO`) y `test:users` (OAuth no degrada roles) ✅. Por HTTP: admin → JWT con `role: SUPER_USUARIO`, dashboard/clientes/productos 200 y menú completo; usuario de prueba → JWT con `role: USUARIO`, `/admin/dashboard` y `/admin/clientes` 307 a `/admin/productos`, productos 200 y menú solo con Productos; sin sesión → 307 a `/?callbackUrl=...`.

### Fase 11 — Vista y API de registro ✅

1. **Vista** — `app/register/page.tsx` reutiliza el layout de dos columnas del login y monta `components/register/Register.tsx`: nombre, correo, contraseña y confirmación de contraseña, con enlaces para volver a iniciar sesión.
2. **Validación** — `registerSchema` en `src/lib/validations/auth.ts`: nombre de 2–120 caracteres, correo válido de hasta 120 (recortado y en minúsculas), contraseña de 8–72 y confirmación idéntica; todos los mensajes en español.
3. **API** — `POST /api/auth/register` (`app/api/auth/register/route.ts`) valida con Zod, hashea la contraseña con bcrypt (coste 10) y crea la fila con rol `USUARIO`. La respuesta 201 selecciona solo `id`, `name`, `email`, `role` y `createdAt` (nunca el hash). Un correo repetido responde 409 `EMAIL_ALREADY_EXISTS` con `field: "email"`.
4. **UI/UX** — los errores del servidor se muestran en un toast (detalle en español); tras el 201 se inicia sesión automáticamente con `signIn("credentials")`, por lo que el proxy lleva al nuevo usuario a `/admin/productos`. Si el auto-login falla, la cuenta queda creada y se redirige al login.
5. **Verificación** — `npm run test:register` (hash bcrypt verificado, rol `USUARIO`, sin contraseña en la respuesta y duplicado rechazado) ✅. Por HTTP: `/register` responde 200 con los cuatro campos; alta válida 201; duplicado 409; contraseñas distintas, clave corta y correo inválido 400 con detalle en español; el login posterior responde 200 con JWT `role: USUARIO` y `/admin/dashboard` redirige a `/admin/productos`.

### Configuración

- `.env`: `DATABASE_URL` + `NUBEFACT_URL` + `NUBEFACT_TOKEN` (**credenciales reales de producción**) + `DECOLECTA_TOKEN` + `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` + `NEXT_PUBLIC_CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` (**credenciales reales de Cloudinary**) + `NEXTAUTH_URL` + `NEXTAUTH_SECRET` + `GITHUB_ID` + `GITHUB_SECRET` (**credenciales reales de GitHub OAuth**) + `JWT_SECRET` + `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH_B64`.
- `.env.example`: placeholders de las quince variables.
- GitHub OAuth App: la **Authorization callback URL** debe ser `http://localhost:3000/api/auth/callback/github` (en producción, la URL equivalente del dominio).

### Verificación actual

| Check                        | Estado                                     |
| ---------------------------- | ------------------------------------------ |
| Migración SUNAT aplicada     | ✅ `20261110031822_add_sunat_emission_fields` |
| Migración Cloudinary aplicada | ✅ `20261112024041_add_product_image`       |
| Migración usuarios aplicada  | ✅ `20261117025440_add_users_table`          |
| Seed admin                   | ✅ `admin@admin.com` con rol `SUPER_USUARIO`  |
| Rol por defecto de usuario   | ✅ `USUARIO` (`usuario` en la BD)            |
| Rol dentro del JWT           | ✅ `role` firmado en `auth_token`            |
| Acceso `SUPER_USUARIO`       | ✅ todos los módulos de `/admin`             |
| Acceso `USUARIO`             | ✅ solo `/admin/productos` (resto 307)       |
| Vista `/register`            | ✅ nombre, correo, contraseña y confirmación  |
| `npm run test:register`      | ✅ alta con bcrypt/rol `USUARIO`, duplicado rechazado |
| `npx prisma generate`        | ✅ y servidor dev reiniciado (puerto 3000)   |
| `npm run lint`               | ✅ sin errores                              |
| `npx tsc --noEmit`           | ✅ sin errores                              |
| Consulta DNI/RUC (Decolecta) | ✅ probada contra la API real (200/400/404/422) |
| Subida firmada a Cloudinary  | ✅ asset real subido y destruido (`signature` OK) |
| CRUD producto con `imageUrl` | ✅ probado contra la API y la BD real        |
| NextAuth GitHub (endpoints)  | ✅ providers/csrf 200 y authorize 302 a GitHub |
| Callback de GitHub OAuth     | ✅ aceptado por GitHub (`redirect_uri` válido) |
| Protección de `/admin`       | ✅ 307 a `/?callbackUrl=...` sin sesión      |
| Usuario en el sidebar        | ✅ avatar, nombre y correo con sesión válida |
| JWT propio (`auth_token`)    | ✅ HS256/7 días, `HttpOnly`, escrito en el 302 del callback |
| `npm run test:jwt`           | ✅ firma, verificación y rechazo de token adulterado/sin rol |
| Login correo/contraseña      | ✅ 200 + cookies; clave incorrecta 401 sin `auth_token` |
| `npm run test:credentials`   | ✅ admin aceptado como `SUPER_USUARIO`, cuenta nueva `USUARIO` |
| `npm run test:users`         | ✅ registro OAuth conserva el rol existente  |
| `npm run test:api` (fase 3)  | ⏳ **no ejecutado aún** (ver pendientes)     |

---

## Pendiente / por implementar

### Imprescindible (para cerrar la fase 3)

1. **Ejecutar la suite de humo con emisión real**: `npm run test:api` contra el servidor dev corriendo. Valida series/correlativos nuevos, emisión a Nubefact, anulación y comunicación de baja.
   ⚠️ **Emite comprobantes REALES ante SUNAT y consume correlativos de BBB1/FFF1.**
2. **Prueba end-to-end en la UI**: emitir una boleta y una factura desde `/admin/ventas`, confirmar chip "Aceptado", abrir el PDF (`enlace_pdf`) y anular una venta verificando la comunicación de baja y el stock restaurado.
3. **Limpiar datos de prueba antiguos en la BD** (decisión pendiente): vouchers con series viejas `B001`/`F001` (números 1–2), producto "Producto en uso" (bloqueado por FK de una boleta), clientes de prueba (DNI `00000000`, RUC `20512345678`). No bloquean el funcionamiento nuevo, pero conviene decidir si se borran o se dejan como histórico.
4. **Actualizar `README.md`**: series nuevas, variables `NUBEFACT_*`, endpoint nuevo `GET /api/ventas/[id]/sunat`, DELETE con `motivo` opcional y flujo de anulación/emisión.

### Backlog / mejoras opcionales

- **Recuperación del error 23 de Nubefact** ("este documento ya existe"): si Nubefact emitió pero la respuesta se perdió por timeout, hoy el roll back borra el voucher local y un reintento choca con el 23. Mejora: recuperar con `consultar_comprobante` o usar el campo `codigo_unico` del manual para idempotencia.
- **Operación `consultar_anulacion`** (operación 4 del manual) para hacer seguimiento del ticket de la comunicación de baja.
- **Notas de crédito/débito** (`tipo_de_comprobante` 3/4): el manual las soporta, la app no las implementa.
- **Boletas ≤ S/700 con cliente genérico "VARIOS"** (documento "-"): hoy toda venta exige cliente registrado.
- `enviar_automaticamente_al_cliente` (email del PDF al cliente) está en `false`.
- Warnings de accesibilidad del navegador (labels/`aria-label` en tablas e inputs) y "PressResponder without a pressable child" — no bloquean, quedan por pulir.
- **Proteger también las rutas API**: hoy solo se protege `/admin`; `/api/productos`, `/api/clientes`, `/api/ventas`, etc. siguen siendo accesibles sin sesión. La base ya existe: `getAuthPayload()` (`src/lib/auth-cookie.ts`) verifica el JWT `auth_token`; falta llamarlo en cada route handler y devolver `401` JSON.
- **Endurecer el registro**: hoy `/register` está abierto y crea cuentas `USUARIO` sin límite. Antes de producción conviene añadir rate limiting, verificación de correo y (opcionalmente) CAPTCHA. También se puede seguir usando `npm run user:create -- <correo> <contraseña> [nombre]` para altas administrativas.
- **Gestión de usuarios**: pantalla `/admin/usuarios` para listar cuentas y cambiar roles, restringida a `SUPER_USUARIO`.
- **Inicializar git + `.gitignore`**: el proyecto no está versionado. Importante **antes** de cualquier commit, porque `.env` contiene credenciales reales de Nubefact, Cloudinary y GitHub.

### Riesgos / consideraciones operativas

- Las credenciales de Nubefact son **de producción**: cada `POST /api/ventas` emite un CPE real ante SUNAT y consume correlativo.
- La API de Decolecta limita consultas por plan: responde **429** (rate limit temporal) y también **401** cuando se agota el cupo. La UI muestra el error y permite reintentar.
- Las imágenes se guardan en Cloudinary y solo la URL en la BD: borrar un producto **no** elimina el asset remoto (no hay limpieza de `public_id`).
- Las credenciales de GitHub OAuth son reales: no commitear `.env`; si cambia el dominio/puerto, actualizar `NEXTAUTH_URL` y la callback URL de la OAuth App.
- `JWT_SECRET` firma la cookie `auth_token`: no commitearlo, no reutilizar `NEXTAUTH_SECRET` y rotarlo invalida todos los JWT emitidos (los usuarios deben volver a iniciar sesión).
- El login por correo/contraseña valida contra la tabla `users` (el admin sembrado es `admin@admin.com` / `12345678` en este proyecto). Para cambiar la contraseña: `npm run auth:hash -- "nueva-clave"`, actualizar `ADMIN_PASSWORD_HASH_B64` y ejecutar `npm run db:seed` (el seed vuelve a guardar el hash del admin). Añadir rate limiting a `/api/auth/callback/credentials` antes de producción.
- El rol viaja firmado en `auth_token` y lo aplica `proxy.ts`: un `USUARIO` solo puede abrir `/admin/productos`; el resto de `/admin/*` responde 307 hacia Productos. El sidebar también se filtra con ese rol. Ojo: esto es control de **páginas**, no de la API (ver backlog).
- Solo se protegen las páginas `/admin`; las rutas API no validan sesión todavía (ver backlog).
- Siempre reiniciar `npm run dev` después de cambiar `.env` (las variables se leen al arrancar) y después de `npx prisma generate` (un cliente Prisma cacheado genera errores 500 con campos nuevos).
- El correlativo se asigna en la transacción local; mezclar manualmente números de la misma serie rompería la unicidad `(series, number)`.

---

## Cómo probar manualmente

1. `npm run dev` → http://localhost:3000 (ya corriendo).
2. En `/`, inicia sesión de dos formas: con **correo y contraseña** (`admin@admin.com` / `12345678`) o con **GitHub**. En ambos casos debes volver a `/admin/dashboard`, el sidebar debe mostrar la cuenta y, en DevTools → Application → Cookies, deben aparecer `next-auth.session-token` y `auth_token` (esta última `HttpOnly`, con el JWT firmado; incluye el claim `role`). Sin sesión, cualquier ruta `/admin/*` redirige al login. Con el admin (`SUPER_USUARIO`) ves todos los módulos; con una cuenta `USUARIO` (créala en `/register` o con `npm run user:create -- "correo" "clave" "Nombre"`) solo ves Productos y cualquier otra ruta `/admin/*` te devuelve a `/admin/productos`.
3. En `/admin/clientes`, escribir un DNI/RUC y pulsar **Consultar DNI/RUC**: los datos se autocompletan. Completar el resto (dirección en DNI, nombres en RUC) y guardar.
4. En `/admin/productos`, crear un producto y pulsar **Subir imagen**: elegir un archivo, confirmar la subida y guardar. La tabla debe mostrar el avatar con la imagen; **Editar** permite cambiarla o quitarla.
5. Crear un cliente con RUC (para factura) y un producto con stock suficiente.
6. Emitir una boleta y una factura desde `/admin/ventas`; revisar el chip SUNAT y el botón PDF.
7. Anular una venta con un motivo; verificar el stock restaurado y la comunicación de baja en Nubefact.
8. Usar **Cerrar sesión** en el sidebar y comprobar que `/admin/*` vuelve a redirigir al login.
9. Abrir `/register`, crear una cuenta con nombre, correo, contraseña y confirmación; debe iniciar sesión automáticamente y entrar directo a `/admin/productos` (rol `USUARIO`). Probar también una contraseña distinta en la confirmación y un correo ya registrado para ver los mensajes de error.

### Comandos útiles

| Comando                          | Descripción                                    |
| -------------------------------- | ---------------------------------------------- |
| `npm run dev`                    | Servidor de desarrollo (puerto 3000)            |
| `npm run db:migrate`             | `prisma migrate dev` + `generate`               |
| `npm run test:api`               | Suite de humo (**emite CPE reales**)           |
| `npm run test:jwt`               | Firma/verifica el JWT con `JWT_SECRET`          |
| `npm run test:credentials`       | Verifica el admin y una cuenta `USUARIO`       |
| `npm run test:users`             | Verifica el registro OAuth y sus roles          |
| `npm run test:register`          | Verifica el alta pública (bcrypt, rol, duplicado) |
| `npm run user:create -- correo clave [nombre]` | Crea/actualiza una cuenta `USUARIO` |
| `npm run auth:hash -- "clave"`   | Hash bcrypt base64 para `ADMIN_PASSWORD_HASH_B64` |
| `npm run lint` / `npx tsc --noEmit` | Calidad de código (ambos limpios)           |
