# CRUD con MockAPI — Guía paso a paso · Crear, editar, actualizar y eliminar recursos desde React

> **Nivel:** Intermedio — partimos de lo que ya trabajamos: `useState`, `useEffect`, `fetch` con `async`/`await` y manejo de `loading`/`error`.
> **Stack:** React 19 · Vite 6
> **API de la clase:** la que creamos nosotros en [mockapi.io](https://mockapi.io/projects)
> *"Leer datos es mirar. Crear, editar y borrar es tocar."*

---

## 🚀 Antes de empezar: qué vamos a construir

La meta de esta práctica es construir un CRUD completo y entender qué ocurre en cada paso.

Vamos a trabajar siempre en este orden:

1. Crear nuestra API en MockAPI.
2. Probar la API manualmente con `fetch` y **`async`/`await`**.
3. Separar las peticiones HTTP en `api/productos.js`.
4. Construir el `GET` para listar productos.
5. Construir el `POST` para crear productos.
6. Construir el `DELETE` para eliminar productos.
7. Construir el `PUT` para editar productos.
8. Agregar mensajes de carga, éxito y error.
9. Resolver un pequeño reto para comprobar que entendimos.

> 🎯 **Forma de trabajo de la clase:** primero entendemos la petición, después escribimos el código y finalmente verificamos el resultado. No copies solamente el código: después de cada paso, comprobá qué cambió en la aplicación y en MockAPI.

Si eso te cerró, el resto de la guía es para entender **por qué** se arma así y no de otra manera.

---

## 📋 Qué vamos a ver

| # | Tema | Responde a |
|---|------|------------|
| 0 | Punto de partida — qué ya sabes | ¿Dónde estoy? |
| 1 | CRUD y verbos HTTP | ¿Qué le pido al servidor? |
| 2 | Crear tu API en MockAPI | ¿Dónde viven mis datos? |
| 3 | Probar la API a mano | ¿Funciona antes de tocar React? |
| 4 | Setup del proyecto y estructura | ¿Cómo ordeno el código? |
| 5 | 🧪 **Laboratorio 1** — `GET`: listar productos | ¿Veo lo que hay? |
| 6 | 🧪 **Laboratorio 2** — `POST`: crear con el formulario | ¿Cómo agrego uno nuevo? |
| 7 | 🧪 **Laboratorio 3** — `DELETE`: eliminar | ¿Cómo borro uno? |
| 8 | 🧪 **Laboratorio 4** — `PUT`: editar | ¿Cómo modifico uno existente? |
| 9 | Feedback al usuario | ¿Qué ve mientras guarda o si falla? |
| 10 | 🏋️ Reto — buscador y contador | ¿Lo puedo hacer solo? |
| 11 | Errores que vas a cometer (y cómo evitarlos) | ¿Por qué mi lista no se actualiza? |

---

# 0️⃣ Punto de partida

Antes de escribir una línea, sepamos qué parte ya tienes instalada:

| Ya sabes | Falta aprender |
|-----------|----------------|
| `fetch` con `GET` para traer datos | `fetch` con `POST`, `PUT` y `DELETE` para **modificar** datos |
| `useEffect` pide datos al montar | Qué código va en el efecto y cuál en un **evento** (un click, un submit) |
| `useState` guarda lo que llegó | Cómo guardar lo que el usuario **escribe** en un formulario |
| `loading` y `error` al cargar | `loading` y `error` al **guardar** |

La clase pasada pedíamos datos cuando el componente aparecía. Hoy hay un cambio importante:

```
GET     →  lo disparás con useEffect   (cuando el componente aparece)
POST    →  lo disparás con un evento   (cuando el usuario envía el formulario)
PUT     →  lo disparás con un evento   (cuando el usuario guarda la edición)
DELETE  →  lo disparás con un evento   (cuando el usuario hace click en eliminar)
```

Si internalizás esa diferencia, entendés el 90% de esta clase.

> 📌 **Regla de sintaxis para esta guía:** todas las peticiones asíncronas se escribirán con `async`/`await`. No utilizaremos `.then()` en los ejemplos ni mezclaremos ambos estilos. La idea es que el código mantenga la misma estructura que venimos trabajando en clase.

---

# 1️⃣ CRUD y verbos HTTP

**CRUD** son las cuatro cosas que se pueden hacer con cualquier dato: **C**reate, **R**ead, **U**pdate, **D**elete. Cada una tiene un verbo HTTP:

| Operación | Verbo HTTP | Endpoint | ¿Lleva body? | Qué hace |
|-----------|------------|----------|--------------|----------|
| Create | `POST` | `/productos` | ✅ sí (JSON) | Crea un producto nuevo. El servidor le asigna el `id` |
| Read | `GET` | `/productos` | ❌ no | Devuelve la lista completa |
| Read | `GET` | `/productos/7` | ❌ no | Devuelve un producto puntual |
| Update | `PUT` | `/productos/7` | ✅ sí (JSON) | Reemplaza los datos del producto 7 |
| Delete | `DELETE` | `/productos/7` | ❌ no | Elimina el producto 7 |

> 💡 Fijate el patrón: **la URL dice sobre qué recurso trabajás, el verbo dice qué hazs con él.** `/productos/7` con `GET` lo mira, con `PUT` lo cambia, con `DELETE` lo borra. Es la misma URL.

## Qué es el body y por qué hay que convertirlo

Cuando mves datos (`POST` y `PUT`), viajan en el **body** de la petición, escritos como texto JSON. Y el servidor necesita saber que ese texto es JSON:

```js
fetch(url, {
  method: 'POST',                                  // 1. el verbo
  headers: { 'Content-Type': 'application/json' }, // 2. "te mando JSON"
  body: JSON.stringify({ nombre: 'Mouse' }),       // 3. el objeto convertido a texto
})
```

| Pieza | Para qué sirve |
|-------|----------------|
| `method` | Si no lo pons, `fetch` hace `GET` |
| `headers` | Le avisa al servidor el formato del body |
| `JSON.stringify(...)` | Convierte un objeto de JavaScript a texto JSON. `fetch` **no** lo hace solo |

> ⚠️ **La trampa clásica:** olvidarte el `Content-Type` o el `JSON.stringify`. La petición "funciona" (no da error) pero el registro se crea **vacío**. Es el bug número 1 de esta clase.

---

# 2️⃣ Crear tu API en MockAPI

Hasta ahora consumíamos APIs de otros. Hoy **armamos la nuestra**, y cada alumno tiene su propia copia: nadie pisa los datos de nadie.

> ℹ️ **MockAPI** es una herramienta pensada para prototipos y aprendizaje: define cómo es un recurso y te genera una API REST completa, con `GET`, `POST`, `PUT` y `DELETE`, sin que escribas backend.
>
> ⚠️ La interfaz de MockAPI puede cambiar con el tiempo. Si un botón no está exactamente donde dice la guía, buscá el equivalente. Además, el **plan gratuito tiene un límite de proyectos y recursos** (al momento de escribir esta guía: **1 proyecto y 2 recursos**). Verificalo en tu cuenta: si ya tienes otros proyectos, vas a tener que borrar uno.

## Paso 1 — Crear la cuenta

Entrá a [mockapi.io](https://mockapi.io) y registrate con tu correo (o con el método que te ofrezca la página).

## Paso 2 — Crear el proyecto

1. Andá a [mockapi.io/projects](https://mockapi.io/projects).
2. Click en **New Project**.
3. Completá:

| Campo | Qué poner |
|-------|-----------|
| Project name | `tienda-clase` |
| API prefix | Dejá el que viene por defecto (`/api/v1`) |

4. Click en **Create**.

## Paso 3 — Crear el recurso `productos`

1. Dentro del proyecto, click en **New Resource**.
2. Nombre del recurso: **`productos`** — en minúsculas y en plural. Ese nombre pasa a formar parte de la URL, así que `productos` y `producto` son endpoints distintos.

## Paso 4 — Definir los campos

Un **recurso** tiene un esquema: la lista de campos que va a tener cada producto. Dejá estos:

| Campo | Tipo | Ejemplo |
|-------|------|---------|
| `id` | (lo pone MockAPI solo) | `"1"` |
| `nombre` | String | `Teclado mecánico` |
| `precio` | Number | `149.9` |
| `descripcion` | String | `Switches rojos, 60%` |
| `imagen` | String (una URL) | `https://picsum.photos/300/200` |

> 💡 MockAPI también ofrece generadores de datos de ejemplo para cada campo, así que al crear el recurso puede llenarlo con registros falsos. Podés dejarlos para tener datos de arranque o borrarlos después con `DELETE`: va a ser tu primera práctica.

> ⚠️ **Ojo con el `id`:** MockAPI lo devuelve como **string** (`"1"`, no `1`). Lo vas a ver cuando lo recorras con `map`.

## Paso 5 — Copiar tu URL

En la página del proyecto vas a ver la **URL base** de tu API, algo así:

```text
https://TU_ID.mockapi.io/api/v1
```

Tu endpoint de productos es esa base más el nombre del recurso:

```text
https://TU_ID.mockapi.io/api/v1/productos
```

Pegala en una pestaña nueva del navegador. Si ves un JSON con una lista (aunque sea vacía, `[]`), tu API está viva.

> ✅ **Checkpoint:** guarda tu URL en un lugar seguro. Se usa en todo lo que viene.

---

# 3️⃣ Probar la API a mano

Igual que la clase pasada: **antes de escribir React, entendé cómo responde el servidor.** Abrí la consola del navegador (F12) y ve probando una por una. Reemplazá `TU_ID` por el tuyo.

## `GET` — leer

```js
const URL = 'https://TU_ID.mockapi.io/api/v1/productos'

const respuesta = await fetch(URL)
const datos = await respuesta.json()

console.log(datos)
```

### ¿Qué hicimos?

1. `fetch(URL)` realiza la petición `GET`.
2. `await` espera a que el servidor responda.
3. `respuesta.json()` convierte la respuesta a un objeto/arreglo de JavaScript.
4. Guardamos ese resultado en `datos`.

> 📌 **Importante:** en esta guía trabajaremos únicamente con `async`/`await`. No usaremos `.then()`. Queremos mantener la misma forma de trabajo que venimos utilizando en clase.

Devuelve un arreglo (puede estar vacío o con datos de ejemplo).

## `POST` — crear

```js
const respuesta = await fetch(URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre: 'Mouse gamer',
    precio: 59.9,
    descripcion: 'Inalámbrico, 16000 DPI',
    imagen: 'https://picsum.photos/300/200',
  }),
})

const productoCreado = await respuesta.json()

console.log(productoCreado)
```

### Paso a paso

1. `method: 'POST'` indica que queremos **crear** un producto.
2. `headers` indica que estamos enviando información en formato JSON.
3. `JSON.stringify(...)` convierte nuestro objeto de JavaScript en texto JSON.
4. `await fetch(...)` espera la respuesta del servidor.
5. `await respuesta.json()` convierte la respuesta en un objeto de JavaScript.
6. `productoCreado` contiene el producto creado, incluido su `id`.

La respuesta es **el producto creado, ya con su `id`**. Volvé a hacer el `GET` y vas a verlo en la lista.

## `PUT` — editar

Usá el `id` que te devolvió el `POST` (acá, `"51"` es un ejemplo):

```js
const respuesta = await fetch(`${URL}/51`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre: 'Mouse gamer PRO',
    precio: 79.9,
    descripcion: 'Inalámbrico, 26000 DPI',
    imagen: 'https://picsum.photos/300/200',
  }),
})

const productoActualizado = await respuesta.json()

console.log(productoActualizado)
```

### Paso a paso

1. Agregamos el `id` a la URL: `` `${URL}/51` ``.
2. Usamos `method: 'PUT'` porque queremos modificar un producto existente.
3. Enviamos los datos en el `body`.
4. Esperamos la respuesta con `await`.
5. Convertimos la respuesta con `await respuesta.json()`.

> 💡 Fijate que la URL lleva el `id` (`/productos/51`) y que mandamos **todos** los campos. `PUT` está pensado para reemplazar el recurso completo.

## `DELETE` — eliminar

```js
const respuesta = await fetch(`${URL}/51`, {
  method: 'DELETE',
})

const productoEliminado = await respuesta.json()

console.log(productoEliminado)
```

### Paso a paso

1. La URL identifica qué producto queremos eliminar.
2. `method: 'DELETE'` indica la operación.
3. No necesitamos enviar `body`.
4. Esperamos la respuesta con `await`.
5. Convertimos la respuesta con `await respuesta.json()`.

Devuelve el producto que acabás de borrar. Hacé otro `GET` y comprobá que ya no está.

## Tabla de lo que acabás de ver

| Operación | Método | URL | Body | Respuesta |
|-----------|--------|-----|------|-----------|
| Listar | `GET` | `/productos` | — | Arreglo de productos |
| Crear | `POST` | `/productos` | JSON | El producto creado (con `id`) |
| Editar | `PUT` | `/productos/:id` | JSON | El producto actualizado |
| Eliminar | `DELETE` | `/productos/:id` | — | El producto eliminado |

> ✅ **Checkpoint:** si hiciste las cuatro operaciones desde la consola, ya sabes el 70% de la clase. React es solo ponerle una interfaz.

---

# 4️⃣ Setup del proyecto y estructura

```bash
pnpm create vite productos-crud --template react
cd productos-crud
pnpm install
pnpm run dev
```

Vamos a ordenar el código en **tres capas**. No es capricho: cada archivo tiene una sola responsabilidad.

```
src/
├── api/
│   └── productos.js          ← habla con el servidor (fetch). Nada de React acá
├── components/
│   ├── ProductoForm.jsx      ← el formulario (crear y editar)
│   └── ProductoLista.jsx     ← la lista de productos
├── App.jsx                   ← el estado y la lógica: conecta todo
└── main.jsx
```

| Capa | Responsabilidad | Por qué separarla |
|------|-----------------|-------------------|
| `api/productos.js` | Las 4 peticiones HTTP | Si cambia la URL o la API, tocas **un** archivo |
| `components/` | Mostrar cosas y recibir clicks | Los componentes no saben de `fetch` |
| `App.jsx` | Estado + qué pasa en cada evento | Un único lugar con la "verdad" |

### Antes de programar: entendamos el recorrido

Cuando el usuario realiza una acción, piensa siempre en esta secuencia:

```text
Usuario
   ↓
Evento (submit / click)
   ↓
Función async
   ↓
función de API
   ↓
fetch + await
   ↓
Servidor / MockAPI
   ↓
respuesta
   ↓
actualizamos el estado
   ↓
React vuelve a renderizar
```

Esta secuencia será nuestro mapa durante toda la práctica. Si algo no funciona, podemos preguntar: **¿en qué paso se quedó?**

## La capa de API: `src/api/productos.js`

Escribila completa ahora. Es corta y la vamos a usar en los cuatro laboratorios:

```js
const API_URL = 'https://TU_ID.mockapi.io/api/v1/productos' // ← pon la tuya

// Función auxiliar: hace la petición, chequea el status y devuelve el JSON
async function pedir(url, opciones = {}) {
  const respuesta = await fetch(url, opciones)
  if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`)
  return respuesta.json()
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export function obtenerProductos(signal) {
  return pedir(API_URL, { signal })
}

export function crearProducto(datos) {
  return pedir(API_URL, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(datos),
  })
}

export function actualizarProducto(id, datos) {
  return pedir(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(datos),
  })
}

export function eliminarProducto(id) {
  return pedir(`${API_URL}/${id}`, { method: 'DELETE' })
}
```

Anatomía:

| Pieza | Rol |
|-------|-----|
| `pedir(url, opciones)` | Centraliza el `if (!respuesta.ok) throw` para no repetirlo 4 veces |
| `export function ...` | Cada operación es una función con nombre claro |
| `signal` en `obtenerProductos` | Para poder cancelar la petición (lo vimos en la clase pasada) |
| `${API_URL}/${id}` | `PUT` y `DELETE` siempre llevan el `id` en la URL |

> 💡 Es la misma idea de la clase pasada (`if (!respuesta.ok) throw`), pero movida a un solo lugar.

---

# 5️⃣ 🧪 Laboratorio 1 — `GET`: listar productos

Primero la mitad que ya conocés: cargar y mostrar. Sin esto no hay forma de ver los efectos de las demás operaciones.

### Requerimientos

1. Guardá los productos en un estado con `useState`.
2. Pedí los productos con `useEffect` al cargar la página.
3. Mostrá `Cargando productos...` mientras espera.
4. Si falla, mostrá `Ocurrió un error al obtener los productos.`
5. Si no hay productos, mostrá `Todavía no hay productos. Creá el primero con el formulario.`

#### ¿Qué estamos haciendo?

Primero crearemos un componente que solo tenga una responsabilidad: **recibir productos y mostrarlos**. No hará peticiones HTTP.

## `src/components/ProductoLista.jsx`

```jsx
export default function ProductoLista({ productos }) {
  if (productos.length === 0) {
    return <p>Todavía no hay productos. Creá el primero con el formulario.</p>
  }

  return (
    <ul>
      {productos.map((p) => (
        <li key={p.id}>
          {p.imagen && <img src={p.imagen} alt={p.nombre} width="120" />}
          <h3>{p.nombre}</h3>
          <p>S/ {p.precio}</p>
          <p>{p.descripcion}</p>
        </li>
      ))}
    </ul>
  )
}
```

### `src/App.jsx` (versión inicial, solo `GET`)

```jsx
import { useEffect, useState } from 'react'
import { obtenerProductos } from './api/productos'
import ProductoLista from './components/ProductoLista'

export default function App() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controlador = new AbortController()

    async function cargar() {
      try {
        setError(null)
        const datos = await obtenerProductos(controlador.signal)
        setProductos(datos)
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err)
          setError('Ocurrió un error al obtener los productos.')
        }
      } finally {
        setLoading(false)
      }
    }

    cargar()
    return () => controlador.abort()
  }, [])

  return (
    <main>
      <h1>Productos</h1>

      <h2>Lista de productos</h2>
      {loading && <p>Cargando productos...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && <ProductoLista productos={productos} />}
    </main>
  )
}
```

> ⚠️ **Un cambio respecto a la clase pasada.** Antes usábamos `if (loading) return ...` para cortar el render. Acá **no podemos**: el formulario que vamos a agregar tiene que estar visible siempre, incluso mientras carga o si hay error. Por eso los tres estados ahora se resuelven **dentro** del JSX, solo en la zona de la lista. La regla sigue siendo la misma: `loading` → `error` → datos.

### ✅ Verificación

| Acción | Resultado esperado |
|--------|--------------------|
| Carga la página | Aparece `Cargando productos...` y luego la lista |
| Cambiás la URL por una rota | Mensaje de error, no pantalla en blanco |
| Borrás todos los productos en MockAPI y recargás | `Todavía no hay productos...` |

---

# 6️⃣ 🧪 Laboratorio 2 — `POST`: crear con el formulario

Ahora sí, escribir datos.

## Primero: qué es un formulario controlado

En un formulario **controlado**, React es dueño de lo que se escribe en cada `input`:

```
El usuario escribe una letra
        ↓
onChange se dispara
        ↓
actualizamos el estado con setForm(...)
        ↓
React re-renderiza
        ↓
el input muestra el valor del estado (value={form.nombre})
```

Si pons `value` sin `onChange`, el input queda **congelado**: no te deja escribir. Siempre van los dos juntos.

### ¿Qué estamos haciendo?

Ahora construiremos un formulario controlado. El estado `form` representará exactamente lo que el usuario está escribiendo.

## `src/components/ProductoForm.jsx` (versión solo para crear)

```jsx
import { useState } from 'react'

const FORM_VACIO = { nombre: '', precio: '', descripcion: '', imagen: '' }

export default function ProductoForm({ onGuardar, guardando }) {
  const [form, setForm] = useState(FORM_VACIO)

  // Un solo handler para todos los inputs, usando el atributo "name"
  function handleChange(e) {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  async function handleSubmit(e) {
    e.preventDefault() // ← evita que el navegador recargue la página

    const datos = {
      nombre: form.nombre.trim(),
      precio: Number(form.precio), // ← el input da texto; la API espera número
      descripcion: form.descripcion.trim(),
      imagen: form.imagen.trim(),
    }

    const ok = await onGuardar(datos)
    if (ok) setForm(FORM_VACIO) // ← limpiamos solo si se guardó bien
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Nuevo producto</h2>

      <input
        name="nombre"
        placeholder="Nombre"
        value={form.nombre}
        onChange={handleChange}
        required
      />
      <input
        name="precio"
        type="number"
        min="0"
        step="0.01"
        placeholder="Precio"
        value={form.precio}
        onChange={handleChange}
        required
      />
      <input
        name="descripcion"
        placeholder="Descripción"
        value={form.descripcion}
        onChange={handleChange}
      />
      <input
        name="imagen"
        placeholder="URL de la imagen"
        value={form.imagen}
        onChange={handleChange}
      />

      <button type="submit" disabled={guardando}>
        {guardando ? 'Guardando...' : 'Guardar producto'}
      </button>
    </form>
  )
}
```

Anatomía:

| Pieza | Rol |
|-------|-----|
| `useState(FORM_VACIO)` | Un solo objeto guarda los 4 campos |
| `[name]: value` | Actualiza el campo cuyo `name` coincide con el input que cambió |
| `e.preventDefault()` | Sin esto, el submit recarga la página y perdés todo |
| `Number(form.precio)` | Los `input` siempre entregan **texto**, aun siendo `type="number"` |
| `disabled={guardando}` | Evita que un doble click cree **dos** productos |
| `required` | Validación mínima gratis del navegador |

## Conectar el formulario en `App.jsx`

Agregamos dos cosas: un estado para el feedback y una función que **crea y vuelve a pedir la lista**.

### La clave: cómo refrescamos la lista

Después de un `POST`, el servidor ya tiene el producto nuevo, pero **nuestro estado `productos` no se enteró**. Hay que volver a pedir la lista. Para eso usamos un truco simple que ya conocés de la clase pasada: una **dependencia** en el efecto.

```jsx
const [version, setVersion] = useState(0)   // un contador que sirve de "señal"

useEffect(() => {
  // ... pedir productos ...
}, [version])                               // ← cada vez que version cambia, se vuelve a pedir

// Para refrescar la lista:
setVersion((v) => v + 1)
```

> 💡 **Traducción:** `version` no guarda nada importante. Es un timbre. Cada vez que lo tocas (`setVersion`), el efecto se entera, vuelve a correr y trae la lista actualizada. Es exactamente `[id]` de la clase anterior: "dependo de esto, corré cuando cambie".

### `App.jsx` actualizado

```jsx
import { useEffect, useState } from 'react'
import { obtenerProductos, crearProducto } from './api/productos'
import ProductoForm from './components/ProductoForm'
import ProductoLista from './components/ProductoLista'

export default function App() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)        // error al CARGAR la lista
  const [errorAccion, setErrorAccion] = useState(null) // error al GUARDAR/ELIMINAR
  const [guardando, setGuardando] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const controlador = new AbortController()

    async function cargar() {
      try {
        setError(null)
        const datos = await obtenerProductos(controlador.signal)
        setProductos(datos)
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err)
          setError('Ocurrió un error al obtener los productos.')
        }
      } finally {
        setLoading(false)
      }
    }

    cargar()
    return () => controlador.abort()
  }, [version])

  // Devuelve true si se guardó bien, false si falló
  async function guardarProducto(datos) {
    try {
      setGuardando(true)
      setErrorAccion(null)
      await crearProducto(datos)
      setVersion((v) => v + 1) // ← refrescamos la lista
      return true
    } catch (err) {
      console.error(err)
      setErrorAccion('No se pudo guardar el producto.')
      return false
    } finally {
      setGuardando(false)
    }
  }

  return (
    <main>
      <h1>Productos</h1>

      <ProductoForm onGuardar={guardarProducto} guardando={guardando} />
      {errorAccion && <p role="alert">{errorAccion}</p>}

      <h2>Lista de productos</h2>
      {loading && <p>Cargando productos...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && <ProductoLista productos={productos} />}
    </main>
  )
}
```

> 💡 **Mirá lo que NO hay:** el `POST` no está en un `useEffect`. Está en una función (`guardarProducto`) que dispara un **evento** (el submit). Esa es la diferencia central de la clase: el efecto es para sincronizar al montar o cuando algo cambia; las **acciones del usuario** van en handlers.

> 💡 `loading` solo es `true` en la primera carga. Cuando refrescás con `setVersion`, la lista no desaparece ni parpadea: se actualiza en silencio.

### ✅ Verificación

| Acción | Resultado esperado |
|--------|--------------------|
| Completás el formulario y presionás Guardar | El botón dice `Guardando...` y el producto aparece abajo |
| Revisás tu panel de MockAPI | El producto está guardado ahí |
| Después de guardar | El formulario queda vacío |
| Dejás el nombre vacío | El navegador no deja enviar (`required`) |
| Cambiás la URL por una rota y guardas | `No se pudo guardar el producto.` y el formulario **conserva** lo escrito |
| Recargás la página | El producto sigue ahí (los datos viven en el servidor, no en React) |

---

# 7️⃣ 🧪 Laboratorio 3 — `DELETE`: eliminar

El más corto de los cuatro: no lleva body ni formulario. Solo necesita el `id`.

### Paso 1 — Agregar la función en `App.jsx`

Importá `eliminarProducto` y agrega:

```jsx
async function borrarProducto(id) {
  const confirmado = window.confirm('¿Seguro que quieres eliminar este producto?')
  if (!confirmado) return

  try {
    setErrorAccion(null)
    await eliminarProducto(id)
    setVersion((v) => v + 1) // ← refrescamos la lista
  } catch (err) {
    console.error(err)
    setErrorAccion('No se pudo eliminar el producto.')
  }
}
```

### Paso 2 — Pasarla a la lista

```jsx
<ProductoLista productos={productos} onEliminar={borrarProducto} />
```

### Paso 3 — Agregar el botón en `ProductoLista.jsx`

```jsx
export default function ProductoLista({ productos, onEliminar }) {
  // ... (igual que antes)
  return (
    <ul>
      {productos.map((p) => (
        <li key={p.id}>
          {p.imagen && <img src={p.imagen} alt={p.nombre} width="120" />}
          <h3>{p.nombre}</h3>
          <p>S/ {p.precio}</p>
          <p>{p.descripcion}</p>

          <button onClick={() => onEliminar(p.id)}>Eliminar</button>
        </li>
      ))}
    </ul>
  )
}
```

### ⚠️ La trampa del `onClick`

```jsx
<button onClick={onEliminar(p.id)}>Eliminar</button>     // ❌ se ejecuta al RENDERIZAR
<button onClick={() => onEliminar(p.id)}>Eliminar</button> // ✅ se ejecuta al hacer CLICK
```

Sin la flecha `() =>`, estás **llamando** a la función durante el render, no pasándosela al botón. Resultado: se intentan borrar todos los productos apenas cargás la página.

### ✅ Verificación

| Acción | Resultado esperado |
|--------|--------------------|
| Click en Eliminar | Aparece el cuadro de confirmación |
| Cancelás | No pasa nada |
| Aceptás | El producto desaparece de la lista |
| Revisás MockAPI | Ya no está en el servidor |
| Eliminás todos | `Todavía no hay productos...` |

---

# 8️⃣ 🧪 Laboratorio 4 — `PUT`: editar

Para editar **reutilizamos el mismo formulario**. No creamos uno nuevo: el mismo componente sirve para dos cosas según si le pasamos un producto o no.

## La idea

```
Click en "Editar" en un producto
        ↓
App guarda ese producto en el estado "editando"
        ↓
El formulario recibe ese producto y se llena con sus datos
        ↓
El usuario cambia lo que quiera y guarda
        ↓
Como hay un producto en "editando" → se hace PUT (no POST)
        ↓
Se refresca la lista y "editando" vuelve a null
```

El estado `editando` cumple dos roles a la vez: **guarda qué producto se edita** y **decide si el formulario hace `POST` o `PUT`**.

## Paso 1 — Estado y lógica en `App.jsx`

Importá `actualizarProducto` y agrega el estado:

```jsx
const [editando, setEditando] = useState(null) // null = estamos creando
```

Reemplazá `guardarProducto` por esta versión, que decide qué hacer:

```jsx
async function guardarProducto(datos) {
  try {
    setGuardando(true)
    setErrorAccion(null)

    if (editando) {
      await actualizarProducto(editando.id, datos) // PUT
      setEditando(null)
    } else {
      await crearProducto(datos)                   // POST
    }

    setVersion((v) => v + 1)
    return true
  } catch (err) {
    console.error(err)
    setErrorAccion('No se pudo guardar el producto.')
    return false
  } finally {
    setGuardando(false)
  }
}
```

Y ajusta `borrarProducto` para que, si borras justo el producto que estabas editando, el formulario se limpie:

```jsx
await eliminarProducto(id)
if (editando?.id === id) setEditando(null)
setVersion((v) => v + 1)
```

## Paso 2 — Pasarle el producto al formulario, con `key`

```jsx
<ProductoForm
  key={editando?.id ?? 'nuevo'}
  productoEditando={editando}
  onGuardar={guardarProducto}
  onCancelar={() => setEditando(null)}
  guardando={guardando}
/>

<ProductoLista
  productos={productos}
  onEditar={setEditando}
  onEliminar={borrarProducto}
/>
```

### 🔑 Por qué el `key` en el formulario

Esta es la pieza más sutil de la clase. El formulario guarda sus datos en su propio `useState`, que **solo mira el valor inicial una vez**. Si después le llega otro producto por props, el estado no se entera y los inputs siguen mostrando lo viejo.

Cuando cambia el `key`, React **destruye el componente y crea uno nuevo desde cero**, con el estado inicial recalculado. Entonces:

| Situación | `key` | Qué pasa |
|-----------|-------|----------|
| Creando | `'nuevo'` | Formulario vacío |
| Click en Editar del producto 7 | `'7'` | Se crea un formulario nuevo, ya relleno |
| Click en Editar del producto 9 | `'9'` | Otro formulario nuevo, relleno con el 9 |
| Guardás o cancelás | `'nuevo'` | Vuelve al formulario vacío |

> 💡 Es la alternativa **sin `useEffect`**. Podrías usar un efecto para copiar el producto a los inputs, pero sería exactamente el error del que hablamos la clase pasada: usar un efecto para derivar algo que React ya sabe resolver solo.

## Paso 3 — Adaptar `ProductoForm.jsx`

```jsx
import { useState } from 'react'

const FORM_VACIO = { nombre: '', precio: '', descripcion: '', imagen: '' }

// Convierte un producto de la API en valores para los inputs
function desdeProducto(p) {
  return {
    nombre: p.nombre ?? '',
    precio: String(p.precio ?? ''), // los inputs trabajan con texto
    descripcion: p.descripcion ?? '',
    imagen: p.imagen ?? '',
  }
}

export default function ProductoForm({ productoEditando, onGuardar, onCancelar, guardando }) {
  const [form, setForm] = useState(
    productoEditando ? desdeProducto(productoEditando) : FORM_VACIO
  )

  function handleChange(e) {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const datos = {
      nombre: form.nombre.trim(),
      precio: Number(form.precio),
      descripcion: form.descripcion.trim(),
      imagen: form.imagen.trim(),
    }

    const ok = await onGuardar(datos)
    // Si estábamos CREANDO, limpiamos. Si estábamos EDITANDO, App cambia el key y se reinicia solo.
    if (ok && !productoEditando) setForm(FORM_VACIO)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{productoEditando ? 'Editar producto' : 'Nuevo producto'}</h2>

      {/* ... los mismos 4 inputs de antes ... */}

      <button type="submit" disabled={guardando}>
        {guardando
          ? 'Guardando...'
          : productoEditando
            ? 'Guardar cambios'
            : 'Guardar producto'}
      </button>

      {productoEditando && (
        <button type="button" onClick={onCancelar}>
          Cancelar edición
        </button>
      )}
    </form>
  )
}
```

> ⚠️ **Fijate el `type="button"`** del botón de cancelar. Dentro de un `<form>`, un botón sin `type` es `submit` por defecto: tocar "Cancelar" enviaría el formulario.

## Paso 4 — Botón Editar en `ProductoLista.jsx`

```jsx
export default function ProductoLista({ productos, onEditar, onEliminar }) {
  // ...
  <button onClick={() => onEditar(p)}>Editar</button>
  <button onClick={() => onEliminar(p.id)}>Eliminar</button>
}
```

Notá que `onEditar` recibe **el producto completo** (`p`), no solo el id: el formulario necesita todos sus datos para rellenarse.

### ✅ Verificación

| Acción | Resultado esperado |
|--------|--------------------|
| Click en Editar | El formulario se llena con los datos del producto y el título cambia a `Editar producto` |
| Cambiás el precio y guardas | La lista muestra el precio nuevo; el formulario vuelve a vacío |
| Revisás MockAPI | El cambio quedó guardado, y **no** se creó un producto duplicado |
| Click en Editar y luego Cancelar edición | El formulario vuelve a vacío, sin tocar nada en el servidor |
| Editás el producto A y, sin guardar, hazs click en Editar del producto B | El formulario muestra los datos de B |

---

# 9️⃣ Feedback al usuario — el usuario no es adivino (parte 2)

La clase pasada dijimos: *si consumís una API, SIEMPRE loading + error.* Hoy se suma una segunda regla:

> **Regla de oro 2:** si **modificás** datos, el usuario tiene que saber (1) que algo está pasando, (2) si salió bien y (3) si salió mal.

Mirá qué cubrimos en la guía y con qué herramienta:

| Momento | Qué ve el usuario | Dónde está en el código |
|---------|-------------------|-------------------------|
| Cargando la lista | `Cargando productos...` | `loading` |
| Falla la carga | `Ocurrió un error...` | `error` |
| Guardando | Botón `Guardando...` y deshabilitado | `guardando` |
| Falla el guardado | `No se pudo guardar...` | `errorAccion` |
| Falla el borrado | `No se pudo eliminar...` | `errorAccion` |
| Salió bien | La lista cambia | `setVersion` → `GET` |

## Por qué dos estados de error distintos

| Estado | Cuándo | Qué hace con la pantalla |
|--------|--------|--------------------------|
| `error` | Falló **cargar** la lista | Reemplaza la zona de la lista (no hay nada que mostrar) |
| `errorAccion` | Falló **guardar o eliminar** | Aparece un aviso, pero la lista y el formulario **siguen ahí** |

Si usaras un único `error`, un borrado fallido haría desaparecer toda la lista. El usuario perdería lo que ya tenía por un problema pasajero.

## Por qué el formulario no se limpia si falla

```jsx
const ok = await onGuardar(datos)
if (ok) setForm(FORM_VACIO)
```

Si la red falla y limpiaste el formulario, el usuario **perdió todo lo que escribió** y tiene que empezar de cero. Si solo limpias cuando fue bien, puede reintentar con un click.

---

# 🔟 🏋️ Reto — buscador y contador

Ahora te toca a vos. Todo lo que necesitás ya lo viste.

## Consigna

Agregá encima de la lista:

1. Un `input` de búsqueda que **filtre por nombre mientras escribes**.
2. Un contador: `Mostrando X de Y productos`.
3. El mensaje `No se encontraron productos` cuando el filtro no devuelve nada (distinto del mensaje de lista vacía).

## Pistas

> 💡 **Esta vez el filtro se hace en el cliente, no en la API.** Los productos ya están en el estado; no hace falta pedir nada nuevo. Si te lo estás imaginando con `useEffect` y otro `useState`, vuelve a leer la pregunta de reflexión 5 de la clase pasada: **si puedes derivar el dato, derivá, no busques.**

```jsx
// Una pista, no la solución:
const visibles = productos.filter((p) => /* ... */)
```

> ⚠️ Pensá qué pasa con mayúsculas y minúsculas. ¿Encontrás "Mouse" si escribes "mouse"?

## Verificación

| Acción | Resultado esperado |
|--------|--------------------|
| Carga la página | `Mostrando 12 de 12 productos` (o los que tengas) |
| Escribís "mouse" | Solo aparecen los que contienen "mouse", sin importar mayúsculas |
| Escribís "zzzz" | `No se encontraron productos` |
| Borrás el texto | Vuelve la lista completa |
| Creás un producto con el filtro activo | El contador se actualiza solo |
| Eliminás un producto con el filtro activo | El filtro se mantiene y el contador baja |

**Bonus (opcional):** mostrá un mensaje `Producto guardado ✅` durante unos segundos después de crear o editar.

---

# 1️⃣1️⃣ Errores que vas a cometer (todos)

Guardá esta tabla. Cada fila es un bug que TODOS cometen una vez.

| Síntoma | Causa | Arreglo |
|---------|-------|---------|
| El producto se crea **vacío** (campos `null` o sin valores) | Falta `Content-Type: application/json` o falta `JSON.stringify` | Revisá los `headers` y el `body` |
| El servidor guarda `[object Object]` | Pasaste el objeto al `body` sin convertirlo | `body: JSON.stringify(datos)` |
| Crear funciona pero la lista **no se actualiza** | No volviste a pedir los datos después del `POST` | `setVersion((v) => v + 1)` |
| El `PUT` da 404 o crea otro registro | Falta el `id` en la URL | `` `${API_URL}/${id}` `` |
| Error 404 en **todas** las peticiones | URL mal copiada o recurso mal escrito (`producto` vs `productos`) | Pegá la URL en el navegador y comprobá que responde |
| El precio sale como `"25"` (con comillas) | Los `input` entregan texto | `Number(form.precio)` |
| No puedes escribir en el `input` | Pusiste `value` sin `onChange` | Siempre van los dos juntos |
| La página se recarga al enviar | Falta `e.preventDefault()` | Agregalo al inicio de `handleSubmit` |
| Se borran todos los productos al cargar | `onClick={onEliminar(p.id)}` sin flecha | `onClick={() => onEliminar(p.id)}` |
| Se crean **dos** productos con un click | Falta bloquear el botón mientras guarda | `disabled={guardando}` |
| `Cancelar` envía el formulario | El botón no tiene `type="button"` | `type="button"` |
| Al darle Editar, el formulario sigue vacío | Falta el `key` en `<ProductoForm />` | `key={editando?.id ?? 'nuevo'}` |
| `Warning: changing an uncontrolled input to controlled` | El valor inicial del input es `undefined` | Inicializá con `''` o usá `?? ''` |
| `fetch` no falla aunque la API devuelva 404 | `fetch` solo rechaza si no hay respuesta | `if (!respuesta.ok) throw` (ya está en `pedir`) |
| La lista se actualiza pero el cambio **no está** en MockAPI | Estabas modificando solo el estado de React | Los datos reales viven en el servidor: haz la petición |

---

# ❓ Preguntas de reflexión (con respuesta)

Leé la pregunta, respondé en voz alta, después leé la respuesta.

### 1. ¿Por qué el `POST` no va en un `useEffect` y el `GET` sí?

**Porque son cosas de naturaleza distinta.** El `GET` es *sincronizar*: "al aparecer, traeme lo que hay". Es el trabajo de un efecto. El `POST` es una *acción del usuario*: pasa porque alguien hizo click, no porque el componente se montó. Las acciones van en **handlers de eventos**. Si pusieras un `POST` en un efecto, se enviaría solo, sin que nadie lo pida.

### 2. ¿Cuál es la diferencia entre `POST` y `PUT`?

`POST` **crea** un recurso nuevo, y el `id` lo asigna el servidor, por eso va a `/productos` sin id. `PUT` **reemplaza** un recurso que ya existe, por eso va a `/productos/7` con el id. Misma forma de mandar los datos, intención distinta.

### 3. ¿Por qué volvemos a pedir la lista con `GET` en vez de agregar el producto al estado a mano?

Porque así lo que ves es **lo que realmente hay en el servidor**: con su `id` real, sin desfases, y con cualquier cambio que haya hecho otra persona. Es más simple y más seguro. El costo es una petición extra. Existe la alternativa de actualizar el estado local directamente (se llama *actualización optimista* y se siente más rápida), pero obliga a manejar qué hacer si el servidor falla. Para empezar, volver a pedir es lo correcto.

### 4. ¿Para qué sirve `e.preventDefault()`?

Un `<form>` tiene un comportamiento por defecto del navegador: al enviarse, recarga la página. Eso destruiría todo el estado de React. `preventDefault()` cancela ese comportamiento para que el envío lo maneje tu código.

### 5. ¿Por qué `key` en el formulario y no un `useEffect` que copie los datos?

`useState(valorInicial)` solo usa el valor inicial **la primera vez**. Cuando cambia el `key`, React crea el componente de nuevo, y con él, un estado inicial nuevo. Es más simple, no tiene un render intermedio con datos viejos, y respeta la regla de oro: **no uses un efecto para algo que React resuelve solo.**

---

## 📚 Resumen rápido

| Concepto | Qué es |
|----------|--------|
| **CRUD** | Create, Read, Update, Delete: las 4 operaciones sobre datos |
| **`GET`** | Leer. No lleva body. Va en `useEffect` |
| **`POST`** | Crear. Lleva body. `/recurso` |
| **`PUT`** | Editar. Lleva body. `/recurso/:id` |
| **`DELETE`** | Eliminar. No lleva body. `/recurso/:id` |
| **`method`** | Si no lo pons, `fetch` hace `GET` |
| **`Content-Type`** | `application/json`: le avisa al servidor qué formato mves |
| **`JSON.stringify`** | Convierte el objeto a texto. `fetch` no lo hace solo |
| **Formulario controlado** | `value` + `onChange`: React es dueño del input |
| **`e.preventDefault()`** | Evita que el submit recargue la página |
| **Handler vs efecto** | Acción del usuario → handler. Sincronizar → efecto |
| **`setVersion`** | Una "señal" que, como dependencia, vuelve a lanzar el `GET` |
| **`key`** | Cambiarlo reinicia el componente con estado nuevo |
| **`guardando`** | Bloquea el botón y evita envíos dobles |

---

## ✅ Checklist — ¿terminaste la clase?

- [ ] Creé mi proyecto y mi recurso `productos` en MockAPI
- [ ] Probé `GET`, `POST`, `PUT` y `DELETE` a mano desde la consola
- [ ] Tengo `api/productos.js` con las 4 funciones
- [ ] La lista carga con `useEffect` y maneja `loading`, `error` y lista vacía
- [ ] Puedo **crear** un producto desde el formulario y aparece abajo
- [ ] Puedo **eliminar** un producto, con confirmación
- [ ] Puedo **editar** un producto reutilizando el mismo formulario
- [ ] Explico con mis palabras por qué `POST` va en un handler y no en un `useEffect`
- [ ] Explico por qué el formulario lleva `key`
- [ ] Completé el reto del buscador y el contador

---

> **Manos al código.** Tu app dejó de ser un visor el día que aprendió a escribir en el servidor.
>
> *"Un CRUD completo es la primera vez que tu interfaz y tus datos hablan en las dos direcciones."*
