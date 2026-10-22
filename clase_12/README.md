# Next.js + TypeScript — Tienda Virtual

> **Nivel:** Intermedio-alto — asumimos React (componentes, props, useState, useEffect, React Router)  
> **Next.js 16 · TypeScript 5 · Tailwind CSS v4 · FakeStore API**  
> *"React solo es frontend. Next.js es todo."*

---

## 📋 Qué vamos a ver

| # | Tema |
|---|------|
| 1 | TypeScript mínimo para sobrevivir |
| 2 | ¿Qué es Next.js y por qué existe? |
| 3 | create-next-app — tu primer proyecto |
| 4 | App Router — páginas y layouts |
| 5 | Server vs Client Components |
| 6 | Tipos para nuestra API |
| 7 | Home — listado de productos |
| 8 | Nosotros — ruta estática |
| 9 | Admin — panel de gestión |
| 10 | 🧠 Tu turno: mejoras |
| 11 | 🏋️ Desafío final |

---

# 1️⃣ TypeScript mínimo para sobrevivir

Si venís de JavaScript puro, TypeScript te va a parecer "más código". Y sí, lo es. Pero cada tipo que escribís es **documentación viva** que el editor lee y el compilador verifica.

## Tipos básicos

```ts
let nombre: string = 'Messi'
let edad: number = 38
let esCapitan: boolean = true
```

TypeScript infiere tipos automáticamente:

```ts
let nombre = 'Messi'  // TS sabe que es string
```

No hace falta anotar todo. El infiere solito.

## Arrays — cómo tiparlos

Los arrays se tipan con `tipo[]`. Se lee: "array de tipo".

```ts
let goles: number[] = [1, 2, 3]          // array de números
let jugadores: string[] = ['Messi', 'Di María']  // array de strings
let respuestas: boolean[] = [true, false, true]   // array de booleanos
```

También existe la sintaxis `Array<tipo>` (hacé lo mismo):

```ts
let goles: Array<number> = [1, 2, 3]
```

Pero la más común y legible es `tipo[]`. **Es lo mismo.**

### Array de objetos

```ts
interface Producto {
  id: number
  title: string
  price: number
}

let productos: Producto[] = [
  { id: 1, title: 'Remera', price: 25 },
  { id: 2, title: 'Jean', price: 45 },
]
```

`Producto[]` se lee como "un array de objetos que cumplen con la forma Producto".

**Solo `interface` para objetos.** Simple y consistente.

## Propiedades opcionales

```ts
interface Producto {
  id: number
  title: string
  description?: string  // puede venir o no
}
```

El `?` hace que la propiedad sea opcional.

## Tipos en funciones

```ts
function formatearPrecio(precio: number): string {
  return `$${precio.toFixed(2)}`
}
```

El tipo de retorno también se infiere, pero explicitarlo ayuda a leer.

## useState con TypeScript

```ts
const [contador, setContador] = useState(0)
// TS infiere: number

const [producto, setProducto] = useState<Producto | null>(null)
// Cuando arranca en null, hay que decirle el tipo
```

## Props en componentes

```tsx
interface Props {
  title: string
  price: number
  imagen: string
}

export default function ProductCard({ title, price, imagen }: Props) {
  return (
    <div>
      <img src={imagen} alt={title} />
      <h2>{title}</h2>
      <p>${price}</p>
    </div>
  )
}
```

## La regla de oro de TypeScript

> TypeScript no es para que la máquina entienda tu código. Es para que **vos** entiendas tu código dentro de 3 meses.

---

# 2️⃣ ¿Qué es Next.js y por qué existe?

## El problema con React puro (SPA)

React renderiza del lado del cliente. Esto significa:

1. El navegador descarga un HTML vacío
2. Descarga el JS
3. Ejecuta React
4. Recién AHORA se ve la página

**Problemas:**
- **SEO**: Google ve HTML vacío
- **Performance**: el usuario ve una pantalla en blanco mientras carga el JS
- **Data Fetching**: todo es useEffect + loading state

## La solución de Next.js

Next.js es un **framework de React** que agrega:

| Característica | SPA (React puro) | Next.js |
|---------------|------------------|---------|
| Renderizado | Solo cliente | Servidor + Cliente |
| SEO | Malo | Excelente |
| Routing | Librería externa | File-system routing |
| Data Fetching | useEffect | Server Components |
| Imágenes | img tag | Image (optimización automática) |

## App Router — la forma moderna

Desde Next.js 13, el **App Router** cambió la forma de pensar:

```
app/
  page.tsx          → /
  layout.tsx        → Layout raíz
  loading.tsx       → UI mientras carga
  error.tsx         → UI cuando falla
  nosotros/
    page.tsx        → /nosotros
  admin/
    page.tsx        → /admin
```

Cada carpeta es una ruta. Cada `page.tsx` es una pantalla.

---

# 3️⃣ create-next-app — Tienda Virtual

## Creamos el proyecto

```bash
pnpm create next-app@latest virtual-store --typescript --tailwind --app
```

O con npx:

```bash
npx create-next-app@latest virtual-store --ts --tailwind --app
```

Las flags:
- `--typescript` o `--ts`: proyecto con TypeScript
- `--tailwind`: incluye Tailwind CSS v4
- `--app`: usa App Router

## Estructura del proyecto

```
virtual-store/
  app/
    layout.tsx        ← Layout raíz (obligatorio)
    page.tsx          ← Página principal (/)
    globals.css       ← Estilos globales
  public/             ← Archivos estáticos
  package.json
  tsconfig.json       ← Config de TypeScript
  next.config.ts      ← Config de Next.js
```

## El layout raíz

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Virtual Store',
  description: 'Tu tienda online con Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  )
}
```

**Puntos clave:**
- `metadata` reemplaza al `<title>` y meta tags del HTML
- `children` es el contenido de la página actual
- El layout **envuelve** todas las páginas

## Limpieza inicial

Borrá todo el contenido de `app/page.tsx` y `app/globals.css`. Empezamos de cero.

```css
/* app/globals.css */
@import "tailwindcss";
```

---

# 4️⃣ App Router — páginas y layouts

## File-system routing

En Next.js no importás rutas en un router. **Creás archivos en carpetas.**

```
app/
  page.tsx          → /
  layout.tsx        → Layout raíz
  nosotros/
    page.tsx        → /nosotros
  admin/
    page.tsx        → /admin
```

Cada `page.tsx` es una ruta. Simple.

## Creamos las páginas vacías

```tsx
// app/nosotros/page.tsx
export default function NosotrosPage() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold">Nosotros</h1>
      <p className="mt-4 text-gray-600">Contenido próximamente...</p>
    </main>
  )
}
```

```tsx
// app/admin/page.tsx
export default function AdminPage() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold">Panel de Administración</h1>
      <p className="mt-4 text-gray-600">Contenido próximamente...</p>
    </main>
  )
}
```

## Navegación con Link

```tsx
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">
          Virtual Store
        </Link>
        <div className="flex gap-6">
          <Link href="/">Inicio</Link>
          <Link href="/nosotros">Nosotros</Link>
          <Link href="/admin">Admin</Link>
        </div>
      </div>
    </nav>
  )
}
```

## Incluimos la Navbar en el layout

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Virtual Store',
  description: 'Tu tienda online con Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <Navbar />
        <main className="max-w-6xl mx-auto p-6">
          {children}
        </main>
      </body>
    </html>
  )
}
```

---

# 5️⃣ Server vs Client Components

## El concepto que cambia todo

Por defecto, **TODOS los componentes en Next.js son Server Components**.

Esto significa:
- Renderizan en el servidor
- Pueden ser `async`
- No usan hooks, eventos, ni estado
- El HTML viaja al navegador listo

## Server Component (default)

```tsx
// app/page.tsx — ESTO ES UN SERVER COMPONENT
export default async function HomePage() {
  const productos = await obtenerProductos()

  return (
    <div>
      {productos.map(p => (
        <div key={p.id}>{p.title}</div>
      ))}
    </div>
  )
}
```

**Puede** usar `async/await`. No necesita `useEffect`.

## Client Component (cuando necesitás interactividad)

```tsx
'use client'

import { useState } from 'react'

export default function ContadorCarrito() {
  const [cantidad, setCantidad] = useState(0)

  return (
    <button onClick={() => setCantidad(c => c + 1)}>
      Carrito ({cantidad})
    </button>
  )
}
```

**Reglas del Client Component:**
- `'use client'` al inicio del archivo
- Puede usar hooks, eventos, estado
- **NO** puede ser `async`
- Se envía JS al navegador

## ¿Cuándo usar cada uno?

| Server Component | Client Component |
|-----------------|------------------|
| Traer datos de una API | Formularios |
| Renderizar listas | Botones, clicks |
| Contenido estático | useState, useEffect |
| SEO importante | Animaciones |
| Lo que NO necesita JS | Lo que SÍ necesita JS |

**Regla práctica:** empezá siempre como Server Component. Si necesitás un hook, recién ahí agregá `'use client'`.

---

# 6️⃣ Tipos y fetch para nuestra API

Vamos a usar la **FakeStore API**: `https://fakestoreapi.com/products`

Primero creamos una carpeta para los tipos que vamos a compartir:

```bash
mkdir types
```

```ts
// types/producto.ts
export interface Rating {
  rate: number
  count: number
}

export interface Producto {
  id: number
  title: string
  price: number
  description: string
  category: string
  image: string
  rating: Rating
}
```

> Los tipos van separados porque los vamos a usar en varias páginas (Home, Admin). La lógica de fetch, en cambio, va **directamente en cada página** — sin archivos intermedios.

---

# 7️⃣ Home — todo en una página

En Next.js, el Server Component puede ser `async` y hacer fetch directo. **No necesitás un archivo `lib` aparte ni `useEffect`.**

## app/page.tsx — archivo completo

Todo vive acá: tipos, fetch, componente, y la página.

```tsx
// app/page.tsx
import type { Producto } from '@/types/producto'

// ─── Fetch directo ───────────────────────
const API_URL = 'https://fakestoreapi.com/products'

async function obtenerProductos(): Promise<Producto[]> {
  const res = await fetch(API_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error('Error al obtener productos')
  return res.json()
}

// ─── Componente de tarjeta ───────────────
interface Props {
  producto: Producto
}

function ProductCard({ producto }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
      <div className="h-48 p-4 flex items-center justify-center">
        <img
          src={producto.image}
          alt={producto.title}
          className="h-full object-contain"
        />
      </div>
      <div className="p-4 border-t">
        <p className="text-xs text-gray-500 uppercase tracking-wider">
          {producto.category}
        </p>
        <h2 className="font-semibold mt-1 line-clamp-2">
          {producto.title}
        </h2>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xl font-bold text-blue-600">
            ${producto.price}
          </p>
          <p className="text-sm text-yellow-500">
            ⭐ {producto.rating.rate}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ────────────────────
export default async function HomePage() {
  const productos = await obtenerProductos()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Productos destacados</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {productos.map(producto => (
          <ProductCard key={producto.id} producto={producto} />
        ))}
      </div>
    </div>
  )
}
```

**Lo nuevo que ves acá:**
- `async function` en el Server Component — puede esperar datos
- `fetch` directo sin `useEffect`
- `ProductCard` es otro componente **en el mismo archivo**, no necesita exportarse porque lo usa solo esta página

Corré el proyecto:

```bash
pnpm dev
```

Abrí `http://localhost:3000`. Veinte productos en pantalla. **Sin useEffect, sin loading state, sin archivos auxiliares.** El servidor trajo los datos y mandó el HTML.

---

# 8️⃣ Nosotros — página estática

Esta página es **estática** (no necesita fetch). Sirve para explicar Server Components sin async.

```tsx
// app/nosotros/page.tsx
export default function NosotrosPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Sobre Nosotros</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-xl font-semibold mb-3">¿Qué es Virtual Store?</h2>
        <p className="text-gray-600 leading-relaxed">
          Virtual Store es un proyecto didáctico construido con Next.js y
          TypeScript para aprender desarrollo web full-stack moderno.
          Consumimos la API de FakeStore para simular una tienda online real.
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border mt-6">
        <h2 className="text-xl font-semibold mb-3">Tecnologías</h2>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <span className="text-blue-500">→</span>
            Next.js 16 — Framework de React con Server Components
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-500">→</span>
            TypeScript 5 — Tipado estático
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-500">→</span>
            Tailwind CSS v4 — Estilos utilitarios
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-500">→</span>
            FakeStore API — Datos de prueba
          </li>
        </ul>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border mt-6">
        <h2 className="text-xl font-semibold mb-3">El equipo</h2>
        <p className="text-gray-600 leading-relaxed">
          Este proyecto fue creado por el curso de React + Next.js.
          Cada estudiante construye su propia tienda virtual
          mientras aprende los fundamentos de Next.js.
        </p>
      </div>
    </div>
  )
}
```

**Demo para la clase:** esta página muestra que no todo necesita ser async. Los Server Components también sirven para contenido estático.

---

# 9️⃣ Admin — CRUD incompleto (Client Component)

El admin necesita interactividad: formularios, botones, estado. Acá entra `'use client'`.

La idea es tener un **CRUD incompleto**: mostramos los productos en una tabla y tenemos un formulario para agregar nuevos. Los datos nuevos viven en memoria local (state) porque en la próxima sesión migramos todo a **Prisma** con base de datos real.

## Página Admin

Un Server Component que trae los datos de la API y los pasa a un Client Component:

```tsx
// app/admin/page.tsx
import type { Producto } from '@/types/producto'

const API_URL = 'https://fakestoreapi.com/products'

async function obtenerProductos(): Promise<Producto[]> {
  const res = await fetch(API_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error('Error al obtener productos')
  return res.json()
}

import AdminClient from './AdminClient'

export default async function AdminPage() {
  const productos = await obtenerProductos()
  return <AdminClient productos={productos} />
}
```

## AdminClient — formulario + tabla

```tsx
// app/admin/AdminClient.tsx
'use client'

import { useState } from 'react'
import type { Producto } from '@/types/producto'

interface Props {
  productos: Producto[]
}

interface NuevoProducto {
  title: string
  price: string
  category: string
  image: string
}

export default function AdminClient({ productos }: Props) {
  const [lista, setLista] = useState<Producto[]>(productos)
  const [nuevo, setNuevo] = useState<NuevoProducto>({
    title: '',
    price: '',
    category: '',
    image: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNuevo({ ...nuevo, [e.target.name]: e.target.value })
  }

  function handleAgregar() {
    if (!nuevo.title || !nuevo.price) return

    const producto: Producto = {
      id: Date.now(),
      title: nuevo.title,
      price: Number(nuevo.price),
      category: nuevo.category || 'general',
      image: nuevo.image || 'https://via.placeholder.com/200',
      description: '',
      rating: { rate: 0, count: 0 },
    }

    setLista([producto, ...lista])
    setNuevo({ title: '', price: '', category: '', image: '' })
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>

      {/* Formulario para agregar */}
      <div className="bg-white rounded-xl border p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Agregar producto</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input
            name="title"
            placeholder="Nombre del producto"
            value={nuevo.title}
            onChange={handleChange}
            className="border rounded-lg p-3 text-sm"
          />
          <input
            name="price"
            placeholder="Precio"
            type="number"
            step="0.01"
            value={nuevo.price}
            onChange={handleChange}
            className="border rounded-lg p-3 text-sm"
          />
          <input
            name="category"
            placeholder="Categoría"
            value={nuevo.category}
            onChange={handleChange}
            className="border rounded-lg p-3 text-sm"
          />
          <input
            name="image"
            placeholder="URL de imagen"
            value={nuevo.image}
            onChange={handleChange}
            className="border rounded-lg p-3 text-sm"
          />
        </div>
        <button
          onClick={handleAgregar}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Agregar producto
        </button>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 text-left">Producto</th>
              <th className="p-3 text-left">Categoría</th>
              <th className="p-3 text-right">Precio</th>
              <th className="p-3 text-right">Rating</th>
              <th className="p-3 text-right">Stock</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(p => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-3 flex items-center gap-3">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-10 h-10 object-contain"
                  />
                  <span className="line-clamp-1">{p.title}</span>
                </td>
                <td className="p-3 text-gray-500">{p.category}</td>
                <td className="p-3 text-right font-medium">${p.price}</td>
                <td className="p-3 text-right text-yellow-500">⭐ {p.rating.rate}</td>
                <td className="p-3 text-right">{p.rating.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-400 mt-4 text-center">
        Los productos nuevos solo viven en memoria. En la próxima sesión los guardaremos con Prisma.
      </p>
    </div>
  )
}
```

**Demo para la clase:** mostramos cómo un Server Component (`admin/page.tsx`) trae los datos de la API y se los pasa a un Client Component (`AdminClient.tsx`) que maneja el formulario y el estado local. El CRUD queda incompleto a propósito — el INSERT solo funciona en memoria, no hay UPDATE ni DELETE. Eso lo resolvemos cuando llegue Prisma.

---

# 🧠 Tu turno: mejoras para la tienda

Elegí UNA (o más) de estas mejoras para implementar:

### Mejora 1 — loading.tsx para productos

Creá un archivo `app/loading.tsx` que muestre un skeleton mientras cargan los productos:

```tsx
export default function Loading() {
  return (
    <div className="grid grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border p-4 animate-pulse">
          <div className="h-40 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded mt-4" />
          <div className="h-6 bg-gray-200 rounded mt-2 w-1/2" />
        </div>
      ))}
    </div>
  )
}
```

### Mejora 2 — error.tsx

Creá `app/error.tsx` para mostrar un mensaje amigable si la API falla.

### Mejora 3 — Detalle de producto

Creá `app/productos/[id]/page.tsx` que muestre el detalle de un producto individual usando `obtenerProducto(id)`.

### Mejora 4 — NavLink activo

Modificá la Navbar para que la ruta activa tenga un estilo diferente. Necesitás `'use client'` y `usePathname()` de `next/navigation`.

---

# 🏋️ Desafío final

## Carrito de compras funcional

Agregá un carrito a la tienda:

1. Botón "Agregar al carrito" en cada ProductCard
2. Estado global del carrito con productos y cantidades
3. Vista del carrito en `/carrito`
4. Modal o página con resumen de la compra
5. Botón "Vaciar carrito"

### Pistas

- El carrito necesita estado compartido entre componentes. Podés usar **Context** (`React.createContext`) o pasar props entre componentes padres e hijos.
- El botón "Agregar" tiene que ser un Client Component (tiene onClick).
- La página del carrito puede ser Server Component que recibe datos del context... pero el context solo funciona en Client Components. **Tip:** toda la rama del carrito necesita `'use client'` desde un punto hacia abajo.

### Bonus track

- Persistir el carrito en `localStorage`
- Calcular el total con envío incluido
- Mostrar un badge con la cantidad de items en la Navbar

---

## 📚 Resumen

| Concepto | Server Component | Client Component |
|----------|:-:|:-:|
| Renderiza en | Servidor | Navegador |
| Puede ser async | Sí | No |
| useState / useEffect | No | Sí |
| Eventos (onClick) | No | Sí |
| 'use client' | No | Sí |
| Fetch de datos directo | Sí | No (usa hooks) |

**El cambio mental más grande:** en Next.js con App Router, **dejás de usar useEffect para traer datos**. Los Server Components hacen ese trabajo y mandan el HTML listo al navegador. Menos JS en el cliente, menos estados de carga, menos errores.
