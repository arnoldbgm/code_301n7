# React Router DOM — Navegación que fluye

> **Nivel:** Intermedio — asumimos que ya sabés componentes, props, useState, useEffect  
> **React 19 · Vite 6 · React Router v7**  
> *"Una SPA sin router es solo una página bonita."*

---

## 📋 Qué vamos a ver

| # | Tema |
|---|------|
| 1 | SPA vs Multi-page — por qué existe React Router |
| 2 | Creamos páginas simples |
| 3 | Instalación |
| 4 | Configuramos las rutas |
| 5 | Navegación con `<Link>` |
| 6 | Layout con Header y Footer |
| 7 | Página 404 |
| 8 | Rutas dinámicas con `useParams` |
| 9 | 🏋️ Reto: Luthier & Co. SPA |

---

# 1️⃣ SPA vs Multi-page — el problema que resuelve React Router

## Cómo funciona la web tradicional (multi-page)

```html
<!-- index.html -->
<a href="/acerca.html">Acerca</a>
```

Click → el navegador pide `acerca.html` al servidor → descarga HTML, CSS, JS → renderiza.

**Problema:** cada navegación es una recarga completa. La pantalla parpadea, perdés estado, el usuario espera.

## Cómo funciona una SPA (Single Page Application)

```jsx
<Link to="/acerca">Acerca</Link>
```

Click → React intercepta, cambia el componente, NO hay recarga. El estado se conserva, la transición es instantánea.

## React Router hace exactamente eso:

> **Mapea URLs a componentes.** Sin recargar la página.

```jsx
/           → <Home />
/catalogo   → <Catalogo />
/producto/3 → <Producto />
*           → <Error404 />
```

---

# 2️⃣ Creamos páginas simples

Primero creamos la carpeta `src/pages/` y tres componentes sin router todavía. Solo HTML.

#### `src/pages/Home.jsx`

```jsx
export default function Home() {
  return (
    <div>
      <h1>Bienvenidos a Luthier &amp; Co.</h1>
      <p>Expertos en instrumentos finos desde 1994.</p>
    </div>
  )
}
```

#### `src/pages/Contactanos.jsx`

```jsx
export default function Contactanos() {
  return (
    <div>
      <h1>Contacto</h1>
      <p>Calle Mayor 12, Madrid</p>
      <p>info@luthierandco.es</p>
    </div>
  )
}
```

#### `src/pages/Acerca.jsx`

```jsx
export default function Acerca() {
  return (
    <div>
      <h1>Acerca de nosotros</h1>
      <p>Artesanos apasionados por el sonido desde 1994.</p>
    </div>
  )
}
```

Por ahora son componentes aislados. No se renderizan solos — los tiene que llamar el router.

---

# 3️⃣ Instalación

```bash
pnpm add react-router-dom
```

React Router v7 ofrece dos formas de configurarlo. Arrancamos con la más clásica: **`<BrowserRouter>` + `<Routes>`**.

### main.jsx — el punto de entrada

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
```

`<BrowserRouter>` envuelve toda la app y **escucha cambios en la URL**. Sin él, React Router no funciona.

---

# 4️⃣ Configuramos las rutas

Ahora conectamos esas páginas con React Router. En `App.jsx` definimos **qué componente se muestra para cada URL**.

#### `src/App.jsx`

```jsx
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Contactanos from './pages/Contactanos'
import Acerca from './pages/Acerca'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/contacto" element={<Contactanos />} />
      <Route path="/acerca" element={<Acerca />} />
    </Routes>
  )
}
```

Cada `<Route>` tiene un `path` (la URL) y un `element` (el componente que se renderiza). React Router busca el primer `path` que coincida con la URL actual y renderiza su `element`.

Con `main.jsx` y `App.jsx` funcionando, probá:

| URL | Resultado |
|-----|-----------|
| `http://localhost:5173/` | Muestra Home |
| `http://localhost:5173/contacto` | Muestra Contactanos |
| `http://localhost:5173/acerca` | Muestra Acerca |
| `http://localhost:5173/cualquier-cosa` | Muestra página en blanco (no hay ruta para eso) |

> **Importante:** notá que `/cualquier-cosa` no muestra nada. Después vamos a solucionarlo con una página 404.

---

# 5️⃣ Navegación con `<Link>`

Las páginas ya renderizan según la URL, pero el usuario no puede navegar entre ellas. Nunca uses `<a href="...">` adentro de una SPA — **cada `<a>` recarga la página**. Usá `<Link>`:

#### Modificamos `src/pages/Home.jsx` para agregar links

```jsx
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div>
      <h1>Bienvenidos a Luthier &amp; Co.</h1>
      <p>Expertos en instrumentos finos desde 1994.</p>
      <nav>
        <Link to="/contacto">Contactanos</Link>
        <Link to="/acerca">Acerca de nosotros</Link>
      </nav>
    </div>
  )
}
```

Ahora hacé click en los links — la URL cambia y el contenido cambia **sin recargar la página**. El estado de React se conserva, la transición es instantánea.

| Componente | Qué hace |
|------------|----------|
| `<Link to="/ruta">` | Navega sin recargar |

---

# 6️⃣ Layout con Header y Footer

En una web de verdad, el **Header** (con los links de navegación) y el **Footer** aparecen en todas las páginas. Si los ponemos en cada componente, los repetimos todo el tiempo.

La solución: crear un **Layout** que los contenga una sola vez.

#### Primero creamos `src/components/Header.jsx`

Movemos los links acá:

```jsx
import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <nav>
      <Link to="/">Inicio</Link>
      <Link to="/contacto">Contacto</Link>
      <Link to="/acerca">Acerca</Link>
    </nav>
  )
}
```

#### Después `src/components/Footer.jsx`

```jsx
export default function Footer() {
  return (
    <footer>
      <p>© 2024 Luthier &amp; Co. — Hecho a mano con amor.</p>
    </footer>
  )
}
```

#### Ahora `src/pages/Layout.jsx`

Acá está la clave. El Layout no tiene contenido propio — solo estructura. Donde queremos que se renderice cada página hija, ponemos `<Outlet />`.

```jsx
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Layout() {
  return (
    <div>
      <Header />
      <main>
        <Outlet /> {/* ← acá se renderiza Home, Contactanos, o Acerca */}
      </main>
      <Footer />
    </div>
  )
}
```

#### Actualizamos `App.jsx`

Ahora envolvemos las rutas con el Layout:

```jsx
import { Routes, Route } from 'react-router-dom'
import Layout from './pages/Layout'
import Home from './pages/Home'
import Contactanos from './pages/Contactanos'
import Acerca from './pages/Acerca'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>        {/* ← sin path */}
        <Route path="/" element={<Home />} />
        <Route path="/contacto" element={<Contactanos />} />
        <Route path="/acerca" element={<Acerca />} />
      </Route>
    </Routes>
  )
}
```

Fíjate: `<Route element={<Layout />}>` sin `path` → no matchea ninguna URL, solo envuelve a sus hijos.

**Flujo visual:**

```
<Layout>
  <Header />          ← siempre visible
  <Outlet />          ← cambia según la URL
  <Footer />          ← siempre visible
</Layout>
```

**¿Por qué es mejor?** Sacamos los links de Home.jsx y los pusimos en el Header. Ahora aparecen en TODAS las páginas sin repetir código. Si agregamos una página nueva, solo creamos la ruta en App.jsx — Header y Footer ya están.

---

# 7️⃣ Página 404

Si el usuario entra a `/cualquier-cosa` (una ruta que no existe), React Router no matchea nada y no muestra contenido. Para eso existe la ruta **catch-all** `*`:

#### Creamos `src/pages/Error404.jsx`

```jsx
import { Link } from 'react-router-dom'

export default function Error404() {
  return (
    <div>
      <h1>404 — Página no encontrada</h1>
      <p>La ruta que buscás no existe.</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  )
}
```

#### Agregamos la ruta en `App.jsx`

```jsx
<Routes>
  <Route element={<Layout />}>
    <Route path="/" element={<Home />} />
    <Route path="/contacto" element={<Contactanos />} />
    <Route path="/acerca" element={<Acerca />} />
    <Route path="*" element={<Error404 />} />   {/* ← siempre al final */}
  </Route>
</Routes>
```

El `*` va **siempre al final**. React Router evalúa de arriba a abajo: si ninguna ruta coincidió, entra el `*`.

---

# 8️⃣ Rutas dinámicas con `useParams`

¿Y si queremos una página de detalle para cada producto, post, o perfil? No vamos a crear una ruta por cada uno. Usamos un **parámetro en la URL**.

Una ruta como:

```jsx
<Route path="/producto/:id" element={<Producto />} />
```

El `:id` es un parámetro. `/producto/3`, `/producto/7` y `/producto/999` todas usan el mismo componente `Producto`, pero con diferente `id`.

#### Ejemplo con datos simulados

```jsx
import { useParams, Link } from 'react-router-dom'

const guitarras = [
  { id: 1, nombre: 'Heritage Custom', marca: 'Luthier House', precio: 2450 },
  { id: 2, nombre: '1964 ES-335', marca: 'Gibson Vintage', precio: 8900 },
  { id: 3, nombre: 'OM-Series Artisan', marca: 'Luthier & Co.', precio: 3100 },
]

export default function Producto() {
  const { id } = useParams()
  const guitarra = guitarras.find(g => g.id === Number(id))

  if (!guitarra) {
    return <h2>Producto no encontrado</h2>
  }

  return (
    <div>
      <h1>{guitarra.nombre}</h1>
      <p>{guitarra.marca} — {guitarra.precio} €</p>
      <Link to="/catalogo">← Volver al catálogo</Link>
    </div>
  )
}
```

`useParams()` devuelve un objeto con todos los parámetros de la URL. `{ id }` extrae el valor de `:id`.

> **Importante:** si un producto no existe (ej: `/producto/999`), la ruta **sí existe** — el catch-all `*` no atrapa esto. Tenés que manejarlo vos dentro del componente con el `if (!guitarra)`.

El `Number(id)` convierte el string de la URL a número para comparar con los ids del arreglo.

---

# 9️⃣ 🏋️ Reto: Luthier & Co. SPA

Vas a construir una tienda de guitarras con React Router. Pero no todo de una — lo vamos a dividir en **5 mini-retos**. Cada uno suma UNA funcionalidad nueva. No pases al siguiente hasta que el anterior funcione.

> ⚠️ Todos los retos usan **Tailwind CSS v4 instalado como plugin de Vite**. Es la forma correcta para un proyecto profesional.

---

## 🏗️ Setup inicial (para TODOS los retos)

```bash
pnpm create vite luthier-spa --template react
cd luthier-spa
pnpm add react-router-dom
pnpm add -D tailwindcss @tailwindcss/vite
```

### Configurá Tailwind

En `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

En `src/index.css` (reemplazá el contenido):

```css
@import "tailwindcss";
```
<!-- Reemplazá `index.html` con esto (sin CDN, sin script de Tailwind): -->

<!-- ```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Luthier &amp; Co.</title>
    <link href="https://fonts.googleapis.com/css2?family=Literata:wght@400;600;700&family=Hanken+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
``` -->

Borrá los archivos default de Vite que no uses (`App.css`, etc.).

Arrancá el proyecto:

```bash
pnpm run dev
```

---

## 🥇 RETO 1: Navegación entre páginas

**Objetivo:** Crear una SPA con Layout, Landing y Catálogo, conectadas con React Router. Cada paso suma UN archivo y lo registra en el router.

---

### 📦 Paso 1: el esqueleto (Layout)

El Layout es el marco de toda la app. Usa Header + Footer y deja un espacio para que las rutas hijas se rendericen con `<Outlet>`.

**Archivos que creás:**

#### `src/components/Header.jsx`

```jsx
// import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-amber-50/80 backdrop-blur-md shadow-sm">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-20">
        <h1 className="text-2xl font-bold font-serif text-stone-800">
          Luthier &amp; Co.
        </h1>
        <div className="hidden md:flex items-center gap-6">
          {/* Inicio → Link a "/" */}
          {/* Catálogo → Link a "/catalogo" */}
        </div>
      </div>
    </nav>
  )
}
```

Ambos links tienen la misma clase: `"text-stone-800 hover:text-amber-700 transition-colors"`

#### `src/components/Footer.jsx`

```jsx
export default function Footer() {
  return (
    <footer className="w-full bg-stone-800 text-stone-300 py-12 mt-12">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-amber-200 text-lg font-serif font-bold mb-4">
            Luthier &amp; Co.
          </h3>
          <p className="text-sm text-stone-400">
            Dedicados a los músicos que buscan el alma en su sonido. Desde 1994.
          </p>
        </div>
        <div>
          <h4 className="text-amber-200 text-xs font-bold mb-4 tracking-widest uppercase">Tienda</h4>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-amber-200 cursor-pointer">Guitarras Eléctricas</li>
            <li className="hover:text-amber-200 cursor-pointer">Guitarras Acústicas</li>
            <li className="hover:text-amber-200 cursor-pointer">Bajos</li>
            <li className="hover:text-amber-200 cursor-pointer">Amplificadores</li>
          </ul>
        </div>
        <div>
          <h4 className="text-amber-200 text-xs font-bold mb-4 tracking-widest uppercase">Servicios</h4>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-amber-200 cursor-pointer">Taller de Luthier</li>
            <li className="hover:text-amber-200 cursor-pointer">Tasaciones Vintage</li>
            <li className="hover:text-amber-200 cursor-pointer">Custom Shop</li>
            <li className="hover:text-amber-200 cursor-pointer">Clínicas</li>
          </ul>
        </div>
        <div>
          <h4 className="text-amber-200 text-xs font-bold mb-4 tracking-widest uppercase">Contacto</h4>
          <ul className="space-y-2 text-sm">
            <li>Calle Mayor 12, Madrid</li>
            <li>info@luthierandco.es</li>
            <li>+34 912 345 678</li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
```

#### `src/pages/Layout.jsx`

Creá este archivo que usa Header y Footer, y deja un `<Outlet />` para las rutas hijas.

```jsx
// ¿Qué import de react-router-dom necesitás para que los hijos se rendericen acá?
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Layout() {
  return (
    <div className="bg-amber-50 text-stone-800 min-h-screen">
      <Header />
      <main className="pt-20">
        {/*
          Marcador donde se renderizan las rutas hijas.
          ¿Cómo se llama este componente de react-router-dom?
        */}
      </main>
      <Footer />
    </div>
  )
}
```

**Ahora registrás el Layout** en el router. Primero `main.jsx` con BrowserRouter, después `App.jsx` con la ruta de Layout.

#### `src/main.jsx`

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
```

#### `src/App.jsx`

```jsx
import { Routes, Route } from 'react-router-dom'
import Layout from './pages/Layout'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Próximamente: Home y Catalogo */}
      </Route>
    </Routes>
  )
}
```

#### ✅ Verificá este paso:

| Acción | Resultado |
|--------|-----------|
| Abrí la app (`pnpm run dev`) | Se ve el Header y Footer en la página |
| El `<main>` está vacío | Correcto — todavía no hay rutas hijas |

---

### 📦 Paso 2: la landing (Home)

Creá la página principal con el botón "VER CATÁLOGO" y registrala en el router.

**Creás:**

#### `src/pages/Home.jsx`

El HTML ya está armado. **Vos tenés que agregar el `import` de `Link` y el botón "VER CATÁLOGO".**

```jsx
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <h1 className="text-5xl font-bold font-serif text-stone-800 mb-4">
        Luthier &amp; Co.
      </h1>
      <p className="text-xl text-stone-600 max-w-lg mb-8">
        La excelencia de un instrumento hecho a mano.
      </p>
      {/* Acá va un Link a "/catalogo" con className y texto "VER CATÁLOGO" */}
    </div>
  )
}
```

**Actualizás** `App.jsx`: agregá `<Route path="/" element={<Home />} />` adentro del Layout.

#### ✅ Verificá este paso:

| Acción | Resultado |
|--------|-----------|
| Ir a `/` | Se ve la landing con "VER CATÁLOGO" |
| Click en "VER CATÁLOGO" | Navega a `/catalogo` (se ve solo Header + Footer, vacío — todavía no existe la ruta) |
| Click en "Inicio" del Header | Vuelve a `/` |
| Click en "Catálogo" del Header | También va a `/catalogo` (vacío) |

---

### 📦 Paso 3: el catálogo (Catalogo)

Creá la página de catálogo como placeholder y registrala.

**Creás:**

#### `src/pages/Catalogo.jsx`

Por ahora dejalo como placeholder. Lo vamos a completar en el Reto 3.

```jsx
export default function Catalogo() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold font-serif text-stone-800">
        Instrumentos de Boutique
      </h1>
      <p className="text-lg text-stone-600 mt-2">
        Acá van a ir las guitarras... pronto.
      </p>
    </div>
  )
}
```

**Actualizás** `App.jsx`: agregá `<Route path="/catalogo" element={<Catalogo />} />` adentro del Layout.

#### ✅ Verificá este paso:

| Acción | Resultado |
|--------|-----------|
| Ir a `/` | Se ve la landing |
| Click en "VER CATÁLOGO" | Navega a `/catalogo` sin recargar — se ve el placeholder |
| Click en "Inicio" del Header | Vuelve a `/` sin recargar |
| Click en "Catálogo" del Header | Va a `/catalogo` sin recargar |

---

## 🥈 RETO 2: Página 404

**Objetivo:** Si el usuario entra a una ruta que no existe, mostrar una página de error.

### Agregás la ruta en `App.jsx`

Acordate de importar `Error404` y agregar `<Route path="*" element={<Error404 />} />` como ULTIMA ruta, dentro del Layout.

### Creás `src/pages/Error404.jsx`

El HTML ya está armado. **Agregá el `import` de `Link` y usalo en el botón "Volver al inicio".**

```jsx
export default function Error404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <h1 className="text-7xl font-bold text-amber-700 mb-4">404</h1>
      <p className="text-xl text-stone-600 mb-8">Página no encontrada</p>
      {/* Acá va Link a "/" con className "text-amber-700 underline hover:text-amber-800 text-lg" */}
    </div>
  )
}
```

### ✅ Verificá que:

| Acción | Resultado |
|--------|-----------|
| Ir a `/cualquier-cosa` | Se ve "404 — Página no encontrada" |
| Click en "Volver al inicio" | Vuelve a `/` |
| Ir a `/` | Sigue funcionando la landing |

---

## 🥉 RETO 3: Catálogo con datos

**Objetivo:** Mostrar el listado de guitarras usando `.map()`.

### Te damos: `src/data/guitarras.js`

Creá la carpeta `src/data/` y copiá este archivo:

```js
export const guitarras = [
  {
    id: 1,
    nombre: 'Heritage Custom T-Style',
    marca: 'Luthier House',
    precio: 2450,
    categoria: 'Eléctricas',
    badge: 'Nuevo',
    imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQJkDpsxdk8f0uAJLG-5kNpVcuo4uoxxGOVkekQJpnrRnSOk19FzPuYwBHV3ROoJ7DY7GbHLVIJCabuhTzZwVCnIsNPiaGm0uzLFpOV4gQGA5qk4a4sEJlMk_0ZH5NE90BGaKDNQV6P8LYlKloyn37E2-eekuG7Rt6NNqoSUpbQF5AHKI1g6U_eVNhXgCjIJ5yAjimnR0fArFBL_C6rPCSpDWGe70WZCnoW3mWm25PlM0D4OIo3o_si89udSF2goRfoh3vaqkK-QIr',
    descripcion: 'Una obra maestra de la artesanía moderna con sonido cálido y sustain infinito.',
    specs: ['Cuerpo de Aliso seleccionado', 'Mástil de Arce', 'Pastillas Custom Shop Hand-Wound'],
  },
  {
    id: 2,
    nombre: '1964 Gibson ES-335',
    marca: 'Gibson Vintage',
    precio: 8900,
    categoria: 'Eléctricas',
    badge: 'Vintage',
    imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVFrIa3lYgsfx5MJWeDpuQG_OrmhISBVxf1y2NKuqmrGzkLFlhkM4uZU_AIMZ0UQxIJd4rvx8XaYE6fbD_whPskV_bxV4zDlIJE3vceL1vpUaSP6wGaygjhQT0uiYE0QOghsFqQY0rpmj2gywOimUFc6oH6K3fopvVXtRYmmgDmW0DmNHKNi3DivTq-An92eeurV5ZJ_zMdGZhev6VMvAaqy6YJ3R6FsdN1LHcpf41QoHgulzdgysJooNQ0bMW6_H4OWhc5b2t_iwW',
    descripcion: 'Semi-hollowbody icónica con sonido aterciopelado y laca nitrocelulósica original.',
    specs: ['Cuerpo semi-hueco de arce laminado', 'Mástil de caoba', 'Pastillas PAF humbucker originales'],
  },
  {
    id: 3,
    nombre: 'OM-Series Artisan',
    marca: 'Luthier & Co.',
    precio: 3100,
    categoria: 'Acústicas',
    badge: null,
    imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaBWMeIoSmMDT5-hXtZGCE_2Xy2xufaqU9k52a7VDs_FYLgCQHEVjBlfkNyoULTXtu--d3MLGgjX1ThhhJcGOXxvI_UoB_eHaJ-bl_dJTWa7nCZ3USEid6ZGvHxPGMnjcwcdLgO8iGbXs6K3oe-jWl8PV3TqEEfcCQywO3R0AGwhoDV3IHyvPX0xXsKBvYgPSL5gRAAooLK8dGIE8bDma5HSvklY1ksy_otCTRykSnCBLu8VgVu7t76oGuuiaYatqABZsOebt4DxE1',
    descripcion: 'Acústica artesanal con tapa de pícea maciza. Proyección y calidez inigualables.',
    specs: ['Tapa de Pícea maciza', 'Fondo y aros de Palosanto', 'Diapasón de Ébano'],
  },
  {
    id: 4,
    nombre: 'Black Beauty Custom',
    marca: 'Gibson',
    precio: 5200,
    categoria: 'Eléctricas',
    badge: null,
    imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPQI24Sx7EJM647ixIONGqQPR1bMk2cqZzcwSavyDdGOTdPfrFOQidmvZ4Gyi5bY0l1Rx4eeazoYliQnsDK8YnY82aJOYj77dawIqnCdrzkC1ldafBLu3lGJKJ1c_8AmsmtECYfsdMuN-unXFs6XwDBG5g9pE5ok49T4PZdkh3245xrbg2k980dgixTIzIvz9F6toQTAxLlx1a8w-AoRYDrv8nI7GnYuI4g4KESRZFWpyREaJNHjhmuAgMYf3_CmN7Pmrj7-cx6evx',
    descripcion: 'Les Paul Custom con hardware dorado. Graves profundos y agudos cristalinos.',
    specs: ['Cuerpo de Caoba con tapa de Arce', 'Mástil de Caoba', 'Pastillas 490R y 498T'],
  },
  {
    id: 5,
    nombre: 'Classical Concert 1A',
    marca: 'Ramirez Master',
    precio: 4750,
    categoria: 'Acústicas',
    badge: 'Edición Limitada',
    imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSALsM_K0U8GE5Kfvj_K9yfolvrNaCT825UWNvjn2K395zq6iWcIMZW4nt8tIjvyzc9v4FlE6Ml3bsRddhYk3AHd8OkUP7V_JWCHhXDGs1W76YwsAVfrRptOTW8O5Uxq7xMNa48zDBhhXzOYvUZxXE1SIHm0NqbZG2X3OGbg9J73IYltHQLN3ky80N4Dmi_ZbwL_1pmZ0W7NPzopP5rQG7sHHQ3FIoJb19tR63YkjntaD16Z97mp4ulne4OtCZfeZsVsFuNSqKP5FP',
    descripcion: 'Guitarra clásica de concierto con incrustaciones de nácar.',
    specs: ['Tapa de Pícea alemana', 'Fondo de Palosanto de India', 'Incrustaciones de nácar'],
  },
  {
    id: 6,
    nombre: 'Modern Eagle V',
    marca: 'PRS Guitars',
    precio: 4200,
    categoria: 'Eléctricas',
    badge: null,
    imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDg-Y69iHpewC1kCGi8Hs0PGe3-FTnNntaWNpI2xX2a_MOY7BPIVyc3N9YR5kYQfzBSj2uxKyriaTvU-tUC6aYCb7yfOTo-eQ0L0AHf3JtYWbd62J5HhvHTV2dnYJukCrguH6lmUIQOZ69xQSTfgsdRijo3tZ8csDn3Gzqk3-_a9P1ZgT0Lr61hozj_WZE1oCSLjgHSPGw4DupgTDxczm2uJdhVATTTGRo_7sWCnlhTQeZDgzlkqiLqaxtqhW7LRTuf_XUKGbYY8Mg1',
    descripcion: 'Arce quilted azul vibrante con pájaros incrustados en el diapasón.',
    specs: ['Tapa de Arce Quilted', 'Mástil de Caoba', 'Pastillas 58/15 LT'],
  },
  {
    id: 7,
    nombre: "Masterbuilt '57 S-Type",
    marca: 'Fender Custom Shop',
    precio: 6100,
    categoria: 'Eléctricas',
    badge: null,
    imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9fa80EEfG6OiK1cw2h_u1_ZEzJUwgNYt4Q2VLBCkPCgBhhejBjVGGjodYVn1F2O14oB2CfkvLEGZVoErC8D3_XvoGJkJ-gRC7M7wqgRPuBKz-y4f29QZeKre_Uz-C7AVl0FapugsDqz83IwjgfJUdyMf2tApOrRtwweTpxWUbpG6ggkvradfOz2ttBDXF-YMriLzm1dZOERraOjidT_pQrFK1Bl35vp4RV-HVqHxrUkS-3vIsAtlXgFGRGHu8iKxxs7MxIRx6Vhxq',
    descripcion: 'Reissue envejecido a mano. El sonido que definió el rock and roll.',
    specs: ['Cuerpo de Aliso', 'Mástil de Arce', 'Pastillas Custom Shop '60s Single-Coil'],
  },
  {
    id: 8,
    nombre: 'Pro Series 5-String Bass',
    marca: 'Warwick',
    precio: 2800,
    categoria: 'Bajos',
    badge: null,
    imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHFZdtSsOK5tPc2wnLzej6PR4h9S79CBm6eGaZ4i9-HUtxgcdMe1Qx7vGAdV-nhx7zoP2W8YdyH9JEdDe8jlwOH5Vi-gQsuhqj7m4xdDw4u4w_tejKWUK3EIyrJXq1UTDUxwQHSDv-Z4DY8vSOPsPXLlyHBh8vUpwhIOLg0g9-87X1S0KG3slVNS8YVplIoU1TvQrQdcO2M7yNvjujXUVynl_WWiu6Hoe-6D0FMJl3JVQSgIiIEMRBlF4iB1rOe79hLhahkBGvP0A0',
    descripcion: 'Bajo de 5 cuerdas con cuerpo de fresno. Definición y potencia.',
    specs: ['Cuerpo de Fresno', 'Diapasón de Wenge', 'Pastillas MEC Active/Passive'],
  },
  {
    id: 9,
    nombre: 'Royal Reverb Combo',
    marca: 'Luthier Amps',
    precio: 1890,
    categoria: 'Accesorios',
    badge: null,
    imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwRmp-gj1kGCFGxpPRly0Omld5QJSsVzwUbijBu4RlBxn6r3USUWNEB8IXPlqCuFvqHQQYbG4pOn8ZRZPLbyxvyXW8cuZ1HbzQaD6wsq7-qpi42Xuj8F-kh39Ulv9VbJSPS0CCDQUEdZeF5R2qiO7yfcksZy_mFaaB8cBdRLzcIybJd04l_1-JOITZKvS98cC1RIy7EkJRhIbLPuRlCqFw92MXeClRc-1i5kiCCDY51Eu9zfe-6_zLUAugOG3HRV5tcoM5zdG8Vtfd',
    descripcion: 'Amp valvular con reverberación. El sonido que soñás desde que agarraste una guitarra.',
    specs: ['Potencia de 40W', 'Altavoz Celestion Vintage 30', 'Reverb a válvula Accutronics'],
  },
  {
    id: 10,
    nombre: 'Deluxe Drive Bundle',
    marca: 'Custom Shop',
    precio: 450,
    categoria: 'Accesorios',
    badge: null,
    imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAa-dLEMee6noQztC_seRp6AOslmS1Hl0t8AuRdqXCmoiAqg0ZO6N1DhGODeSyCTJSpmZi_UsvejyDAAlyxVbCw-TbJmb8PK1ueb2sCojmuwRLfxKmlV-R53SfL4ymzblKFVPiWYTgu8eMlUftf24vIGpFmJSbKHK8ZjssNa8TuxVko625Qq25mUFpyuBFc6YFf5VA6BT91bSOqcqUA9MOoKmhX558KYavRxQTxnhPtGhmXSf_ojiOMdpbqKjpPKTs4LqkF0qAY1q8C',
    descripcion: 'Bundle de pedales boutique: overdrive, distorsión y boost.',
    specs: ['Overdrive analógico', 'Distorsión de alta ganancia', 'Boost conmutable'],
  },
  {
    id: 11,
    nombre: 'Grand Auditorium C12',
    marca: 'Taylor Guitars',
    precio: 3800,
    categoria: 'Acústicas',
    badge: null,
    imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVhOX0y77VUznbBZlqJz5HK3I260dV_EZUZAr-rqiBGcu48SqNVPnyB_l_eTNdgk_EHFmbM3u1xECPaOnJoygfe_HnEWCmOtNB-iAtNWNExZKTulg8iT8KB9TMHv1Y93C7dUkhWOl7RAXVJ_3L9mPVwXiEvj5xTlPbrLPZlGF0SMLo7ULVTNJgpxnkvd33tPtRbmlNevY8XO-3r0YzOEA0Ob1N6TlQntoNKlznTj9-Rt4xiy7EQWxKTuN01UaqwURM_Jg9gsT4ChUg',
    descripcion: 'Taylor Grand Auditorium. Versatilidad absoluta para cualquier estilo.',
    specs: ['Tapa de Pícea maciza', 'Fondo de Palosanto', 'Pastillas Expression System 2'],
  },
  {
    id: 12,
    nombre: 'Jazz Masterpiece Hollow',
    marca: "D'Angelico",
    precio: 3400,
    categoria: 'Eléctricas',
    badge: null,
    imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBtJy0IsawTAmUk4Y9ur4iX-pxNRApcbUP9mA4cw5huTotxKHmTjUnOmIyem51PHypeXlBH38MtDT5zNf3-7x8bZJeETfkcWScizXHWJZZV89juJZ6GuSGTu2-kVqMykNPKdsC7WfMfqnwoHc1tOu2TLNZm2Quuq3scqGKjUUJQzJblP5rOGOLrKMiCZqHNCPTCjM0vnWLV32pYpvGaW8IZd9mgZr1vsSlSyd_gknoO-WCzqvQWeLU_imgB_xDvDPR4lx_uo12aLz8',
    descripcion: 'Hollowbody de jazz con tapa de arce tallada. El estándar de oro.',
    specs: ['Cuerpo hueco de Arce tallado', 'Mástil de Arce', 'Pastillas Floating Mini-Humbucker'],
  },
]
```

### Te damos: `src/components/GuitarCard.jsx`

Este componente muestra la imagen, nombre, marca y precio de una guitarra. **Por ahora es un `<div>` — en el Reto 5 lo vamos a convertir en un `<Link>`.**

```jsx
export default function GuitarCard({ guitarra }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
        <img
          src={guitarra.imagen}
          alt={guitarra.nombre}
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
        />
        {guitarra.badge && (
          <span className="absolute top-3 left-3 bg-stone-800 text-amber-50 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest">
            {guitarra.badge}
          </span>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-lg font-bold text-stone-800 mb-1">
          {guitarra.nombre}
        </h3>
        <p className="text-base text-stone-600 mb-4">{guitarra.marca}</p>
        <span className="text-xl font-bold text-amber-700">
          {guitarra.precio.toLocaleString()} €
        </span>
      </div>
    </div>
  )
}
```

### Ahora escribís: `src/pages/Catalogo.jsx`

Importá el arreglo `guitarras` desde `'../data/guitarras'` y el componente `GuitarCard`. Usá `.map()` para renderizar una `GuitarCard` por cada guitarra del arreglo.

```jsx

<div className="max-w-6xl mx-auto px-6 py-16">
  <h1>Instrumentos de Boutique</h1>
  <p>Explora nuestra colección...</p>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
    // acá va tu .map()
  </div>
</div>
```

### ✅ Verificá que:

| Acción | Resultado |
|--------|-----------|
| Ir a `/catalogo` | Se ven 12 tarjetas de guitarra con imagen, nombre, marca y precio |
| Los badges "Nuevo", "Vintage", "Edición Limitada" | Se muestran solo en las guitarras que los tienen |
| Scrolleá | Las tarjetas están en un grid de 3 columnas |

---

## 🏅 RETO 4: Página de detalle (estática)

**Objetivo:** Crear una página que muestre el detalle completo de UNA guitarra (con datos fijos por ahora).

### Creás: `src/pages/Producto.jsx`

El HTML ya está armado con datos de prueba. **Vos tenés que importar `Link` y usarlo en "← Volver al catálogo".**

```jsx
export default function Producto() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      {/* Link a "/catalogo" con texto "← Volver al catálogo" */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-stone-100 rounded-xl overflow-hidden shadow-md">
          <img
            src="https://placehold.co/600x750/eee?text=Guitarra"
            alt="Foto de guitarra"
            className="w-full aspect-[4/5] object-cover"
          />
        </div>

        <div className="flex flex-col gap-6">
          <p className="text-sm text-amber-700 tracking-widest uppercase font-bold">
            Marca de prueba
          </p>
          <h1 className="text-3xl font-bold font-serif text-stone-800">
            Nombre del producto
          </h1>
          <p className="text-2xl font-bold text-amber-700">
            2.500 €
          </p>
          <p className="text-stone-600 leading-relaxed">
            Descripción del producto. Acá deberían aparecer los detalles de la guitarra seleccionada.
          </p>
          <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
            <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider mb-3">
              Especificaciones
            </h3>
            <ul className="flex flex-col gap-2">
              <li className="flex items-center gap-2 text-sm text-stone-700">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                Especificación 1
              </li>
              <li className="flex items-center gap-2 text-sm text-stone-700">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                Especificación 2
              </li>
              <li className="flex items-center gap-2 text-sm text-stone-700">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                Especificación 3
              </li>
            </ul>
          </div>
          <button className="bg-amber-700 text-amber-50 font-bold py-3 px-6 rounded-lg hover:bg-amber-800 transition-all active:scale-95">
            AÑADIR AL CARRITO
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Registrás la ruta en `App.jsx`

Acordate de importar `Producto` y agregar `<Route path="/producto" element={<Producto />} />` adentro del Layout, entre Catalogo y la ruta `*`.

### ✅ Verificá que:

| Acción | Resultado |
|--------|-----------|
| Ir a `/producto` | Se ve el detalle con datos de prueba (marca, nombre, precio, descripción) |
| Click en "← Volver al catálogo" | Navega a `/catalogo` |

---

## 🏆 RETO 5: Ruta dinámica con `useParams`

**Objetivo:** Que cada guitarra del catálogo tenga su propia página de detalle según su `id`.

Este reto conecta todo. Tocás tres archivos para que el catálogo y el detalle se comuniquen por la URL.

### 1. Cambiás la ruta en `App.jsx`

Cambiá `/producto` por `/producto/:id`. El `:id` es un parámetro — cualquier valor en la URL (3, 7, 999) cae en esta ruta.

### 2. Modificás `src/pages/Producto.jsx`

Ahora en vez de datos de prueba, usamos la guitarra que llega por la URL. Cambios:

1. En el `import` de `react-router-dom`, agregá `useParams`.
2. Importá `guitarras` desde `'../data/guitarras'`.
3. Reemplazá toda la función para que use `useParams` + `find`:

```jsx
import { useParams, Link } from 'react-router-dom'
import { guitarras } from '../data/guitarras'

export default function Producto() {
  const { id } = useParams()
  const guitarra = guitarras.find(g => g.id === Number(id))

  if (!guitarra) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-stone-800">Producto no encontrado</h2>
        <Link to="/catalogo" className="text-amber-700 underline mt-4 inline-block">
          ← Volver al catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      {/* ... mismo JSX que en Reto 4, pero reemplazando datos de prueba por {guitarra.marca}, {guitarra.nombre}, etc. */}
    </div>
  )
}
```

### 3. Conectás el catálogo al detalle: `src/components/GuitarCard.jsx`

En el Reto 3 creaste GuitarCard como un `<div>`. Ahora cada tarjeta debe navegar a su producto:

1. Importá `Link` al principio del archivo.
2. Envolvé TODO el contenido con `<Link to={`/producto/${guitarra.id}`}>`. Las clases del `<div>` pasan al `<Link>`.

### ✅ Verificá que:

| Acción | Resultado |
|--------|-----------|
| Ir a `/catalogo`, click en cualquier tarjeta | Lleva a `/producto/{id}` y muestra ESA guitarra |
| Ir directo a `/producto/5` | Muestra la "Classical Concert 1A" de Ramirez |
| Ir a `/producto/999` | Muestra "Producto no encontrado" con link al catálogo |
| Ir a `/cualquier-cosa` | Sigue funcionando la 404 del Reto 2 |

---

## 📚 Resumen rápido

| Concepto | Explicación |
|----------|-------------|
| **`<BrowserRouter>`** | Envuelve la app y escucha la URL |
| **`<Routes>`** | Busca el primer `<Route>` que coincida con la URL |
| **`<Route path="/" element={<X />} />`** | Si la URL es `/`, renderiza X |
| **`<Route element={<Layout />}>` + hijos** | Layout sin `path` envuelve hijos con `<Outlet />` |
| **`<Outlet />`** | Marcador donde se renderizan las rutas hijas |
| **`<Link to="...">`** | Navegación sin recarga |
| **`useParams()`** | Obtené parámetros de la URL (`:id`, etc.) |
| **`path="*"`** | Catch-all para rutas que no existen (404) |

---

> **Manos al código.** Cada reto suma UN concepto. No pases al siguiente hasta que el anterior funcione.
>
> *"Una SPA sin router es solo una página bonita. Con router, es una aplicación."*
