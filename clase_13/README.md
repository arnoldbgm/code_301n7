# Guia — Inventario con IA + Prisma + Neon PostgreSQL

<p align="center">
  <img src="https://cdn.simpleicons.org/nextdotjs/000000" alt="Next.js" height="80">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://cdn.simpleicons.org/typescript/3178C6" alt="TypeScript" height="80">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://cdn.simpleicons.org/prisma/2D3748" alt="Prisma" height="80">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://cdn.simpleicons.org/postman/FF6C37" alt="Postman" height="70">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://cdn.simpleicons.org/openai/412991" alt="IA" height="70">
</p>

Bienvenido a la clase donde dejamos de hacer codigo "de ejemplo" y empezamos a construir algo real usando **Inteligencia Artificial** como herramienta de desarrollo. No es trampa — es el futuro del software. Y vas a aprender a usarlo bien.

Esta clase tiene dos partes claras:
1. **Normalizacion** — entendemos POR QUE existen las bases de datos relacionales
2. **IA como copiloto** — usamos IA para generar schema, endpoints y logica, pero VOS entendes cada linea

---

## Bloque 1 — Normalizacion: de una tabla "plana" a 3 tablas relacionadas

### El problema

Imagina que tenes una tienda y tu "base de datos" es un Excel asi:

```
| ID | Producto      | Categoria  | Proveedor   | Precio | Stock |
|----|---------------|------------|-------------|--------|-------|
| 1  | Laptop HP     | Electronica| TechSupply  | 1200   | 15    |
| 2  | Mouse Logitech| Electronica| TechSupply  | 25     | 100   |
| 3  | Escritorio    | Muebles    | MueblesSA   | 350    | 8     |
| 4  | Silla Ergo    | Muebles    | MueblesSA   | 200    | 12    |
| 5  | Cable USB     | Electronica| TechSupply  | 5      | 500   |
```

**Problemas que ves inmediatamente:**
- "Electronica" esta repetida 3 veces
- "TechSupply" esta repetida 3 veces
- Si cambia el nombre del proveedor, tenes que cambiarlo en TODAS las filas
- Si un proveedor se borra, ¿que pasa con sus productos?
- Si queres agregar un telefono al proveedor, ¿donde lo pones?

Esto se llama **tabla no normalizada**. Funciona para algo chico, pero escala terriblemente mal.

### La solucion: Normalizacion

**Paso 1:** Extraemos las categorias a su propia tabla

```
CATEGORIAS
| ID | Nombre       |
|----|--------------|
| 1  | Electronica  |
| 2  | Muebles      |
```

**Paso 2:** Extraemos los proveedores a su propia tabla

```
PROVEEDORES
| ID | Nombre      | Email              | Telefono |
|----|-------------|--------------------|----------|
| 1  | TechSupply  | info@techsupply.com| 555-0101 |
| 2  | MueblesSA   |ventas@muebles.com  | 555-0202 |
```

**Paso 3:** En productos, reemplazamos los textos por IDs (Foreign Keys)

```
PRODUCTOS
| ID | Nombre         | Precio | Stock | CategoriaID | ProveedorID |
|----|----------------|--------|-------|-------------|-------------|
| 1  | Laptop HP      | 1200   | 15    | 1           | 1           |
| 2  | Mouse Logitech | 25     | 100   | 1           | 1           |
| 3  | Escritorio     | 350    | 8     | 2           | 2           |
| 4  | Silla Ergo     | 200    | 12    | 2           | 2           |
| 5  | Cable USB      | 5      | 500   | 1           | 1           |
```

**Beneficios:**
- Si cambia el nombre de "Electronica", lo cambias UNA vez
- Si borras un proveedor, podes decidir que pasa con sus productos (cascade)
- No hay datos repetidos
- Las relaciones son claras: cada producto "pertenece" a una categoria y tiene un proveedor

### Ejercicio rapido

Antes de seguir, escribi en papel (o en tu head) las respuestas:

1. ¿Cuantos productos tiene la categoria "Muebles"?
2. ¿Cual es el email del proveedor del producto "Laptop HP"?
3. ¿Que pasa si borro el proveedor "TechSupply"?

Si pudiste responder, entendiste la normalizacion. Si no, repasa las tablas.

---

## Bloque 2 — Setup del proyecto

### Crear el proyecto

```bash
npx create-next-app@latest inventario --typescript --tailwind --eslint --app --src-dir
```

```bash
cd inventario
```

### Instalar Prisma

```bash
npm install prisma --save-dev
npm install @prisma/client
```

### Inicializar Prisma

```bash
npx prisma init
```

Esto crea:
- `prisma/schema.prisma` — el archivo donde definimos nuestras tablas
- `.env` — con la variable `DATABASE_URL` (la vamos a cambiar)

### Crear cuenta en Neon (PostgreSQL en la nube)

1. Andá a [neon.tech](https://neon.tech) y crea una cuenta (gratis)
2. Crea un nuevo proyecto
3. Copia la **Connection string** — se ve algo asi:
   ```
   postgresql://neondb_owner:xxxxxxxxx@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Pegala en tu archivo `.env` reemplazando la `DATABASE_URL`:

```
DATABASE_URL="postgresql://neondb_owner:xxxxxxxxx@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

**IMPORTANTE:** Nunca subas tu `.env` a GitHub. Ya esta en `.gitignore` por defecto.

### Prisma Client singleton

Creamos un archivo que reutiliza la conexion en todo el proyecto:

```ts
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**¿Por que singleton?** Porque en desarrollo Next.js recarga el codigo frecuentemente. Sin esto, se crearian cientos de conexiones a la base de datos y Neon te bloquearia.

---

## Bloque 3 — Generar el Schema con IA

### La idea

En vez de escribir el schema manualmente, vamos a **describir lo que necesitamos en lenguaje natural** y dejar que la IA lo genere. Desues lo revisamos y ajustamos.

### Paso 1: Escribir los requisitos

Pensa en como le explicarias a alguien que no sabe programacion que necesitas:

> "Necesito un sistema de inventarios con:
> - Productos: nombre, descripcion, precio y stock
> - Categorias: nombre
> - Proveedores: nombre, email y telefono
> - Un producto tiene una sola categoria
> - Un producto tiene un solo proveedor
> - Si borro una categoria, los productos de esa categoria se quedan sin categoria
> - Si borro un proveedor, los productos de ese proveedor se quedan sin proveedor"

### Paso 2: Usar IA para generar el schema

Copiá el prompt de arriba y pegalo en tu IA favorita (ChatGPT, Claude, Copilot, etc). Pedile que lo genere como schema de Prisma.

**Prompt sugerido:**
```
Genera el schema de Prisma para un sistema de inventarios con estas entidades:
- Productos: nombre, descripcion, precio (decimal), stock (entero)
- Categorias: nombre
- Proveedores: nombre, email, telefono
Relaciones: un producto tiene una categoria (opcional) y un proveedor (opcional).
Si se borra la categoria o proveedor, el producto se queda sin esa referencia (SET NULL).
Usa PostgreSQL.
```

### Paso 3: Revisar lo que la IA genero

La IA deberia generarte algo como esto:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Categoria {
  id        Int         @id @default(autoincrement())
  nombre    String      @unique
  productos Producto[]
}

model Proveedor {
  id        Int         @id @default(autoincrement())
  nombre    String
  email     String      @unique
  telefono  String
  productos Producto[]
}

model Producto {
  id            Int         @id @default(autoincrement())
  nombre        String
  descripcion   String?
  precio        Decimal     @db.Decimal(10, 2)
  stock         Int         @default(0)
  categoriaId   Int?
  proveedorId   Int?
  categoria     Categoria?  @relation(fields: [categoriaId], references: [id], onDelete: SetNull)
  proveedor     Proveedor?  @relation(fields: [proveedorId], references: [id], onDelete: SetNull)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

### Paso 4: Copiar al schema y correr la migracion

Copia el codigo generado en `prisma/schema.prisma` y ejecuta:

```bash
npx prisma migrate dev --name crear_inventario
```

Si todo sale bien, veras:
```
Migration ... created and applied.
```

### Paso 5: Verificar en Neon

Andá a tu dashboard de Neon y refresca. Deberias ver las 3 tablas creadas con sus columnas y relaciones.

### Reto

Modifica el schema para agregar un campo `telefono` opcional a las Categorias. Corre una nueva migracion.

<details>
<summary>Ver solucion</summary>

Agrega en el model Categoria:

```prisma
model Categoria {
  id        Int         @id @default(autoincrement())
  nombre    String      @unique
  telefono  String?
  productos Producto[]
}
```

Corre:
```bash
npx prisma migrate dev --name agregar_telefono_categoria
```

</details>

---

## Bloque 4 — Generar Endpoints con IA

### La estructura

Cada entidad tiene un archivo `route.ts` dentro de `src/app/api/`:

```
src/app/api/
├── productos/route.ts
├── categorias/route.ts
└── proveedores/route.ts
```

Cada `route.ts` exporta funciones con el nombre del metodo HTTP: `GET`, `POST`, `PUT`, `DELETE`.

### Flujo por endpoint

1. **Vos escribis** el requisito en lenguaje natural
2. **La IA genera** el codigo
3. **Vos revisas** y entendes cada linea
4. **Copias** al archivo correspondiente
5. **Probás** en Postman

---

### Endpoint 1: GET /api/categorias — Listar todas las categorias

**Tu requisito:**
> "Quiero un endpoint GET que devuelva todas las categorias ordenadas por nombre ascendente. Si hay un error, devolver status 500 con el mensaje."

**Prompt para IA:**
```
Genera un endpoint GET con Next.js App Router que:
- Use Prisma para hacer findMany de la tabla Categoria
- Ordene por nombre ascendente
- Devuelva JSON con las categorias
- Maneje errores con try/catch
- Use NextResponse de next/server
```

**Codigo que deberias obtener:**

```ts
// src/app/api/categorias/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(categorias);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener categorias" },
      { status: 500 }
    );
  }
}
```

**Probalo en Postman:**
- Metodo: `GET`
- URL: `http://localhost:3000/api/categorias`
- Respuesta esperada: `[]` (array vacio, porque no hay datos aun)

---

### Endpoint 2: POST /api/categorias — Crear una categoria

**Tu requisito:**
> "Quiero un POST que reciba { nombre } en el body, valide que no este vacio, cree la categoria y la devuelva. Si el nombre ya existe, devolver 409 (conflict)."

**Prompt para IA:**
```
Genera un POST endpoint con Next.js App Router que:
- Reciba { nombre } del request body (await request.json())
- Valide que nombre no este vacio (si esta vacio, 400)
- Use prisma.categoria.create
- Si ya existe una con ese nombre (unique), devolver 409
- Devolver la categoria creada con status 201
- Manejar errores con try/catch
```

**Codigo que deberias obtener:**

```ts
// src/app/api/categorias/route.ts (agregar debajo del GET)

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre } = body;

    if (!nombre || nombre.trim() === "") {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    const existe = await prisma.categoria.findFirst({
      where: { nombre: nombre.trim() },
    });

    if (existe) {
      return NextResponse.json(
        { error: "Ya existe una categoria con ese nombre" },
        { status: 409 }
      );
    }

    const categoria = await prisma.categoria.create({
      data: { nombre: nombre.trim() },
    });

    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear categoria" },
      { status: 500 }
    );
  }
}
```

**Probalo en Postman:**
- Metodo: `POST`
- URL: `http://localhost:3000/api/categorias`
- Body → raw → JSON:
```json
{
  "nombre": "Electronica"
}
```
- Respuesta: la categoria creada con su `id`

---

### Endpoint 3: PUT /api/categorias/[id] — Actualizar una categoria

**Tu requisito:**
> "Quiero un PUT que reciba el id por URL y { nombre } en el body. Actualice el nombre y devuelva la categoria actualizada. Si no existe, 404."

**Prompt para IA:**
```
Genera un PUT endpoint dinamico con Next.js App Router:
- params es Promise (Next.js 16): const { id } = await params
- Reciba { nombre } del body
- Valide que nombre no este vacio
- Use prisma.categoria.update con where: { id: Number(id) }
- Si no existe (PrismaClientKnownRequestError P2025), devolver 404
- Devolver la categoria actualizada
```

**Codigo que deberias obtener:**

```ts
// src/app/api/categorias/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre } = body;

    if (!nombre || nombre.trim() === "") {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    const categoria = await prisma.categoria.update({
      where: { id: Number(id) },
      data: { nombre: nombre.trim() },
    });

    return NextResponse.json(categoria);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Categoria no encontrada" },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: "Error al actualizar categoria" },
      { status: 500 }
    );
  }
}
```

**Probalo en Postman:**
- Metodo: `PUT`
- URL: `http://localhost:3000/api/categorias/1`
- Body → raw → JSON:
```json
{
  "nombre": "Electronica y Computacion"
}
```

---

### Endpoint 4: DELETE /api/categorias/[id] — Eliminar una categoria

**Tu requisito:**
> "Quiero un DELETE que reciba el id por URL y elimine la categoria. Si no existe, 404. Devolver un mensaje de exito."

**Prompt para IA:**
```
Genera un DELETE endpoint dinamico con Next.js App Router:
- params es Promise (Next.js 16): const { id } = await params
- Use prisma.categoria.delete con where: { id: Number(id) }
- Si no existe (P2025), devolver 404
- Devolver { message: "Categoria eliminada" }
```

**Codigo que deberias obtener:**

```ts
// src/app/api/categorias/[id]/route.ts (agregar debajo del PUT)

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.categoria.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Categoria eliminada" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Categoria no encontrada" },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: "Error al eliminar categoria" },
      { status: 500 }
    );
  }
}
```

---

### Resumen de Categorias (completo)

```ts
// src/app/api/categorias/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(categorias);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener categorias" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre } = body;

    if (!nombre || nombre.trim() === "") {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    const existe = await prisma.categoria.findFirst({
      where: { nombre: nombre.trim() },
    });

    if (existe) {
      return NextResponse.json(
        { error: "Ya existe una categoria con ese nombre" },
        { status: 409 }
      );
    }

    const categoria = await prisma.categoria.create({
      data: { nombre: nombre.trim() },
    });

    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear categoria" },
      { status: 500 }
    );
  }
}
```

```ts
// src/app/api/categorias/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre } = body;

    if (!nombre || nombre.trim() === "") {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    const categoria = await prisma.categoria.update({
      where: { id: Number(id) },
      data: { nombre: nombre.trim() },
    });

    return NextResponse.json(categoria);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Categoria no encontrada" },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: "Error al actualizar categoria" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.categoria.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Categoria eliminada" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Categoria no encontrada" },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: "Error al eliminar categoria" },
      { status: 500 }
    );
  }
}
```

---

## Reto — Endpoints de Proveedores

Usa el mismo flujo: escribe el requisito, pide a la IA que lo genere, revisa, copia, prueba.

### Requisitos

**GET /api/proveedores**
> Devolver todos los proveedores ordenados por nombre. Incluir el conteo de productos de cada proveedor.

**POST /api/proveedores**
> Recibir { nombre, email, telefono }. Validar que todos los campos esten presentes. Validar que el email no este duplicado. Crear el proveedor.

**PUT /api/proveedores/[id]**
> Actualizar nombre, email y/o telefono. Si no existe, 404.

**DELETE /api/proveedores/[id]**
> Eliminar un proveedor. Si no existe, 404. Si tiene productos asociados, devolver 409 (conflict) y no permitir borrar.

<details>
<summary>Ver solucion — GET</summary>

```ts
// src/app/api/proveedores/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const proveedores = await prisma.proveedor.findMany({
      orderBy: { nombre: "asc" },
      include: {
        _count: { select: { productos: true } },
      },
    });
    return NextResponse.json(proveedores);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener proveedores" },
      { status: 500 }
    );
  }
}
```

</details>

<details>
<summary>Ver solucion — POST</summary>

```ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, email, telefono } = body;

    if (!nombre || !email || !telefono) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    const existe = await prisma.proveedor.findFirst({
      where: { email: email.trim() },
    });

    if (existe) {
      return NextResponse.json(
        { error: "Ya existe un proveedor con ese email" },
        { status: 409 }
      );
    }

    const proveedor = await prisma.proveedor.create({
      data: {
        nombre: nombre.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
      },
    });

    return NextResponse.json(proveedor, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear proveedor" },
      { status: 500 }
    );
  }
}
```

</details>

<details>
<summary>Ver solucion — PUT</summary>

```ts
// src/app/api/proveedores/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, email, telefono } = body;

    const data: { nombre?: string; email?: string; telefono?: string } = {};
    if (nombre) data.nombre = nombre.trim();
    if (email) data.email = email.trim();
    if (telefono) data.telefono = telefono.trim();

    const proveedor = await prisma.proveedor.update({
      where: { id: Number(id) },
      data,
    });

    return NextResponse.json(proveedor);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Proveedor no encontrado" },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: "Error al actualizar proveedor" },
      { status: 500 }
    );
  }
}
```

</details>

<details>
<summary>Ver solucion — DELETE</summary>

```ts
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const productos = await prisma.producto.findMany({
      where: { proveedorId: Number(id) },
    });

    if (productos.length > 0) {
      return NextResponse.json(
        {
          error: "No se puede eliminar: tiene productos asociados",
          productos: productos.length,
        },
        { status: 409 }
      );
    }

    await prisma.proveedor.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Proveedor eliminado" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Proveedor no encontrado" },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: "Error al eliminar proveedor" },
      { status: 500 }
    );
  }
}
```

</details>

---

## Reto — Endpoints de Productos

Estos son mas complejos porque involucran relaciones.

### Requisitos

**GET /api/productos**
> Devolver todos los productos con su categoria y proveedor (include). Ordenar por nombre. Si se pasa el query param `?categoriaId=X`, filtrar por esa categoria.

**POST /api/productos**
> Recibir { nombre, descripcion?, precio, stock, categoriaId?, proveedorId? }. Validar que nombre y precio esten presentes. Validar que precio sea mayor a 0. Validar que stock sea >= 0. Si se provee categoriaId, verificar que exista. Si se provee proveedorId, verificar que exista.

**PUT /api/productos/[id]**
> Actualizar cualquier campo. Mantener las mismas validaciones.

**DELETE /api/productos/[id]**
> Eliminar un producto. Si no existe, 404.

<details>
<summary>Ver solucion — GET</summary>

```ts
// src/app/api/productos/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoriaId = searchParams.get("categoriaId");

    const where: { categoriaId?: number } = {};
    if (categoriaId) {
      where.categoriaId = Number(categoriaId);
    }

    const productos = await prisma.producto.findMany({
      where,
      include: {
        categoria: true,
        proveedor: true,
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(productos);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}
```

</details>

<details>
<summary>Ver solucion — POST</summary>

```ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, precio, stock, categoriaId, proveedorId } = body;

    if (!nombre || nombre.trim() === "") {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    if (precio === undefined || precio <= 0) {
      return NextResponse.json(
        { error: "El precio debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (stock !== undefined && stock < 0) {
      return NextResponse.json(
        { error: "El stock no puede ser negativo" },
        { status: 400 }
      );
    }

    if (categoriaId) {
      const cat = await prisma.categoria.findUnique({
        where: { id: Number(categoriaId) },
      });
      if (!cat) {
        return NextResponse.json(
          { error: "Categoria no encontrada" },
          { status: 404 }
        );
      }
    }

    if (proveedorId) {
      const prov = await prisma.proveedor.findUnique({
        where: { id: Number(proveedorId) },
      });
      if (!prov) {
        return NextResponse.json(
          { error: "Proveedor no encontrado" },
          { status: 404 }
        );
      }
    }

    const producto = await prisma.producto.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        precio,
        stock: stock ?? 0,
        categoriaId: categoriaId ? Number(categoriaId) : null,
        proveedorId: proveedorId ? Number(proveedorId) : null,
      },
      include: {
        categoria: true,
        proveedor: true,
      },
    });

    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 }
    );
  }
}
```

</details>

<details>
<summary>Ver solucion — PUT</summary>

```ts
// src/app/api/productos/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, descripcion, precio, stock, categoriaId, proveedorId } = body;

    const data: Record<string, unknown> = {};

    if (nombre !== undefined) {
      if (nombre.trim() === "") {
        return NextResponse.json(
          { error: "El nombre no puede estar vacio" },
          { status: 400 }
        );
      }
      data.nombre = nombre.trim();
    }

    if (descripcion !== undefined) data.descripcion = descripcion?.trim() || null;

    if (precio !== undefined) {
      if (precio <= 0) {
        return NextResponse.json(
          { error: "El precio debe ser mayor a 0" },
          { status: 400 }
        );
      }
      data.precio = precio;
    }

    if (stock !== undefined) {
      if (stock < 0) {
        return NextResponse.json(
          { error: "El stock no puede ser negativo" },
          { status: 400 }
        );
      }
      data.stock = stock;
    }

    if (categoriaId !== undefined) {
      if (categoriaId !== null) {
        const cat = await prisma.categoria.findUnique({
          where: { id: Number(categoriaId) },
        });
        if (!cat) {
          return NextResponse.json(
            { error: "Categoria no encontrada" },
            { status: 404 }
          );
        }
      }
      data.categoriaId = categoriaId ? Number(categoriaId) : null;
    }

    if (proveedorId !== undefined) {
      if (proveedorId !== null) {
        const prov = await prisma.proveedor.findUnique({
          where: { id: Number(proveedorId) },
        });
        if (!prov) {
          return NextResponse.json(
            { error: "Proveedor no encontrado" },
            { status: 404 }
          );
        }
      }
      data.proveedorId = proveedorId ? Number(proveedorId) : null;
    }

    const producto = await prisma.producto.update({
      where: { id: Number(id) },
      data,
      include: {
        categoria: true,
        proveedor: true,
      },
    });

    return NextResponse.json(producto);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Producto no encontrado" },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: "Error al actualizar producto" },
      { status: 500 }
    );
  }
}
```

</details>

<details>
<summary>Ver solucion — DELETE</summary>

```ts
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.producto.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Producto eliminado" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Producto no encontrado" },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: "Error al eliminar producto" },
      { status: 500 }
    );
  }
}
```

</details>

---

## Bloque 5 — Prueba completa con Postman

### Orden de prueba

1. **Crear categorias:**
   - POST `/api/categorias` → crear "Electronica"
   - POST `/api/categorias` → crear "Muebles"
   - GET `/api/categorias` → ver las 2 categorias

2. **Crear proveedores:**
   - POST `/api/proveedores` → crear "TechSupply"
   - POST `/api/proveedores` → crear "MueblesSA"
   - GET `/api/proveedores` → ver los 2 proveedores

3. **Crear productos:**
   - POST `/api/productos` → crear "Laptop HP" con categoria 1 y proveedor 1
   - POST `/api/productos` → crear "Escritorio" con categoria 2 y proveedor 2
   - GET `/api/productos` → ver los productos con sus relaciones

4. **Actualizar:**
   - PUT `/api/categorias/1` → cambiar nombre a "Electronica y Computacion"
   - GET `/api/categorias` → verificar el cambio

5. **Eliminar:**
   - DELETE `/api/categorias/2` → eliminar "Muebles"
   - GET `/api/categorias` → verificar que solo queda 1

6. **Probar errores:**
   - POST `/api/categorias` con nombre duplicado → esperar 409
   - PUT `/api/categorias/999` → esperar 404
   - DELETE `/api/categorias/1` que tiene productos → verificar comportamiento

### Codigos de respuesta

| Codigo | Significado |
|--------|-------------|
| 200 | OK — exito |
| 201 | Created — recurso creado |
| 400 | Bad Request — datos invalidos |
| 404 | Not Found — no existe |
| 409 | Conflict — duplicado o relacion activa |
| 500 | Server Error — error interno |

---

## Bloque 6 — Resumen y Errores Comunes

### Lo que aprendiste

1. **Normalizacion** — separar datos repetidos en tablas propias con Foreign Keys
2. **Prisma schema** — definir modelos, relaciones y restricciones
3. **Migraciones** — sincronizar el schema con la base de datos
4. **API Routes** — endpoints GET, POST, PUT, DELETE con Next.js App Router
5. **IA como herramienta** — generar codigo revisado, no codigo ciego
6. **Postman** — probar cada endpoint antes de continuar

### Errores comunes

| Error | Causa | Solucion |
|-------|-------|----------|
| `P2025` | Registro no encontrado | Verificar que el ID exista antes de update/delete |
| `Unique constraint` | Dato duplicado | Usar `findFirst` antes de crear |
| `FOREIGN KEY constraint` | Referencia a ID inexistente | Validar que la FK exista antes de crear |
| `params is not ready` | No usar `await params` | Next.js 16 requiere `const { id } = await params` |
| `Too many connections` | multiples PrismaClient | Usar el singleton de `src/lib/prisma.ts` |
| `DATABASE_URL` invalida | Neon genera nueva URL | Copiar la URL actualizada desde Neon dashboard |

### La regla de oro con IA

> **La IA genera, VOS revisas.** Nunca copies codigo sin entenderlo. Si no sabes que hace una linea, pregunta. La IA es tu copiloto, no tu piloto automatico.

---

## Estructura final del proyecto

```
inventario/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── categorias/
│   │   │   │   ├── route.ts          (GET, POST)
│   │   │   │   └── [id]/route.ts     (PUT, DELETE)
│   │   │   ├── proveedores/
│   │   │   │   ├── route.ts          (GET, POST)
│   │   │   │   └── [id]/route.ts     (PUT, DELETE)
│   │   │   └── productos/
│   │   │       ├── route.ts          (GET, POST)
│   │   │       └── [id]/route.ts     (PUT, DELETE)
│   │   └── page.tsx
│   └── lib/
│       └── prisma.ts
├── .env
├── package.json
└── tsconfig.json
```
