# useEffect + Fetch — v2.0 · De cero a la API real

> **Nivel:** Intermedio — assumimos que ya sabés componentes, props, `useState` y React Router
> **Stack:** React 19 · Vite 6
> **API de la clase:** [rickandmortyapi.com](https://rickandmortyapi.com)
> *"Hasta que no consumís una API, tu app es una mentira."*

---

## 🚀 Camino rápido (si tenés que republished algo, esto es lo único que necesitás)

1. Abrí la consola del navegador (F12) y pegá `await fetch('https://rickandmortyapi.com/api/character')` — mirá qué te devuelve la API.
2. Meté ese `fetch` en una `async function` y mirá la forma del JSON: `info` + `results`.
3. Pasá esa función a un `useEffect(() => { ... }, [])` adentro de un componente.
4. Guardá el resultado con `setEstado(...)` y observá el re-render.
5. Sumá `loading` y `error`. Listo, consumís una API.

Si eso te cerró, el resto de la guía es para entender **por qué** funciona así y no de otra manera.

---

## 📋 Qué vamos a ver

| # | Tema | Responde a |
|---|------|------------|
| 0 | Punto de partida — qué ya sabés | ¿Dónde estoy? |
| 1 | Qué es una API (y qué te devuelve) | ¿Qué estoy pidiendo? |
| 2 | `fetch` + `async`/`await` desde cero | ¿Cómo pido datos? |
| 3 | El problema: `await` en el cuerpo del componente | ¿Por qué explota? |
| 4 | `useEffect` — cuándo corre y por qué | ¿Dónde va mi código? |
| 5 | 🧪 **Laboratorio 1** — `Usuarios` (mecánica pura) | ¿Funciona el flujo? |
| 6 | 🧪 **Laboratorio 2** — API de Rick & Morty | ¿Funciona con datos reales? |
| 7 | Loading state | ¿Qué ve el usuario mientras espera? |
| 8 | Errores — `try`/`catch`/`finally` | ¿Y si la API falla? |
| 9 | De `[]` a `[id]` + limpieza (cleanup) | ¿Cuándo repito la petición? |
| 10 | 🏋️ Reto — buscador de personajes | ¿Lo puedo hacer solo? |
| 11 | Errores que vas a cometer (y cómo evitarlos) | ¿Por qué mi app pide la API 400 veces? |

---

# 0️⃣ Punto de partida

Antes de escribir una línea, sepamos qué parte ya tenés instalada:

| Ya sabés | Falta aprender |
|-----------|----------------|
| Un componente es una función que devuelve JSX | Cómo pedir datos **fuera** del render |
| `useState` guarda un valor y dispara re-render | Dónde se escribe el código que "no es render" |
| `fetch` devuelve una `Promise` | Por qué React no espera esa `Promise` |
| `map` para listas | Cuándo pedir los datos y cuándo no |

La clase es una sola idea grande, expresada en tres pasos:

```
useEffect  =  "cuándo"
async/await =  "cómo espero"
useState    =  "dónde guardo lo que llegó"
```

Si_INTERNALIZÁS esos tres, entendés el 90% de React que se usa en el mundo real.

---

# 1️⃣ Qué es una API

Una **API** es una función que vive en otro servidor. No la tenés escrita vos: la escribieron otros y vos la *consumís* (la llamás) esperando que te devuelva datos.

Ejemplo real: cuando entrás a Instagram, la app no tiene las fotos guardadas en el teléfono — le pide a una API "pasame los posts de este usuario" y los dibuja.

## La API que vamos a usar

Rick and Morty API — pública, sin clave, sin registro:

```text
https://rickandmortyapi.com/api/character
```

## ¿Qué me devuelve? Mirá la respuesta cruda

Antes de escribir React, entendé la forma del dato. Abrí la consola del navegador (F12) y pegá:

```js
await fetch('https://rickandmortyapi.com/api/character').then(r => r.json())
```

Vas a ver un objeto con **dos claves**:

```json
{
  "info": { "count": 826, "pages": 42, "next": "https://rickandmortyapi.com/api/character?page=2", "prev": null },
  "results": [
    {
      "id": 1,
      "name": "Rick Sanchez",
      "status": "Alive",
      "species": "Human",
      "image": "https://rickandmortyapi.com/api/character/avatar/1.jpeg",
      "origin": { "name": "Earth (Replacement Dimension)", "url": "..." },
      "location": { "name": "Earth (Replacement Dimension)", "url": "..." },
      "episode": ["...urls..."]
    }
  ]
}
```

## Lectura rápida del JSON

| Dato | Cómo se accede | Ejemplo |
|------|----------------|---------|
| Lista de personajes | `datos.results` | `[{...}, {...}]` |
| Total de personajes | `datos.info.count` | `826` |
| Páginas totales | `datos.info.pages` | `42` |
| URL de la página siguiente | `datos.info.next` | `?page=2` |
| Nombre del origen | `personaje.origin.name` | ojo: es un **objeto**, no un string |
| Imagen | `personaje.image` | URL de un `.jpeg` |

> ⚠️ **La trampa clásica:** `origin` y `location` son objetos anidados. `p.origin` te da `{ name, url }`, no un texto. Por eso es `p.origin.name`.

## Endpoints que nos importan

| Quiero… | Endpoint |
|---------|----------|
| La primera página de personajes | `/api/character` |
| La página 3 | `/api/character?page=3` |
| Un personaje puntual | `/api/character/7` |
| Buscar por nombre | `/api/character/?name=rick` |
| Los capítulos de un personaje | `/api/character/1` → campo `episode` |

> 💡 Fijate el patrón: `/api/{recurso}`, `/api/{recurso}/{id}`, `/api/{recurso}?filtro=valor`. Casi todas las APIs REST del mundo siguen esta convención.

---

# 2️⃣ `fetch` + `async`/`await` desde cero

## `fetch` = "mandá un mensaje a un servidor"

```js
const respuesta = await fetch('https://rickandmortyapi.com/api/character')
```

`await` frena la ejecución **hasta que llegue la respuesta**. Cuando llega, `respuesta` es un objeto `Response` — que todavía **no** contiene los datos.

## `respuesta.json()` = "traducí la respuesta a JavaScript"

```js
const datos = await respuesta.json()
```

Ahí recién tenés el objeto que podés mostrar. **Son dos esperas distintas:**

```
await fetch(url)   →  esperar el paquete de red
await .json()      →  esperar que se parseé el cuerpo
```

## El camino más corto: `async function` + `return`

```js
async function obtenerPersonajes() {
  const respuesta = await fetch('https://rickandmortyapi.com/api/character')
  const datos = await respuesta.json()
  return datos.results // ← devuelvo solo lo que me interesa
}

const personajes = await obtenerPersonajes()
```

## Tabla de conceptos (memorizá esta, la vas a usar siempre)

| Concepto | Qué es realmente |
|----------|------------------|
| `async function` | Declara que la función tiene código que **espera** |
| `await` | Pausa la ejecución hasta que la `Promise` se resuelva |
| `fetch(url)` | Dispara una solicitud HTTP GET → devuelve `Promise<Response>` |
| `respuesta.ok` | `true` si el.status HTTP es 2xx |
| `respuesta.json()` | Lee el cuerpo y lo parsea → devuelve `Promise<objeto>` |

## Por qué `await` y no `.then()`

Las dos formas sirven. `.then()` encadena Promises; `async/await` es el mismo resultado escrito en orden de lectura. Mirá la diferencia:

```js
// Estilo Promises
fetch(url)
  .then(r => r.json())
  .then(datos => setPersonajes(datos.results))
  .catch(err => setError(err))

// Estilo async/await — misma cosa, se lee de arriba abajo
try {
  const r = await fetch(url)
  const datos = await r.json()
  setPersonajes(datos.results)
} catch (err) {
  setError(err)
}
```

En la clase vamos con `async/await`. Si entendés por qué NO usás `await` adentro de un componente, ya entendés el 60% de los bugs de `useEffect` que vas a ver en tu carrera.

---

# 3️⃣ El problema: `await` en el cuerpo del componente

Primer intento, y el error que casi todos cometen una vez:

```jsx
import { useState } from 'react'

export default function Personajes() {
  const [personajes, setPersonajes] = useState([])

  // ❌ ERROR — React no espera
  const respuesta = await fetch('https://rickandmortyapi.com/api/character')
  const datos = await respuesta.json()
  setPersonajes(datos.results)

  return <ul>{personajes.map(p => <li key={p.id}>{p.name}</li>)}</ul>
}
```

La consola te va a decir algo como `SyntaxError: 'await' is only allowed in async functions...` o, peor, `Uncaught SyntaxError: await is only valid in async functions`. **Espera — ¿por qué?**

## Por qué no funciona: el componente tiene que ser SINCRÓNICO

Cuando React renderiza tu componente, espera una sola cosa: **el JSX**. Nada más.

```
React llama a tu componente
        ↓
tu componente corre de arriba abajo, SIN PAUSAS
        ↓
tiene que devolver JSX. Ya. Ahora.
```

Un `await` rompe ese contrato: le dice a JavaScript "pausá la ejecución hasta que vuelva la red". React no puede devolver "todavía no, estoy esperando" — necesita JSX **sincrónico**. No hay return tipo `undefined` que signifique "esperando".

**Y hay una segunda razón, más subtil: el render se repite.** El cuerpo de un componente no se ejecuta una vez — se ejecuta en cada render. Si la petición estuviera ahí, cada `setPersonajes` dispararía un render nuevo → que dispararía otra petición → que dispararía otro render. **Loop infinito de requests.**

## Entonces, ¿dónde va la petición?

A un lugar que React ejecuta **una sola vez, después de pintar**: `useEffect`.

```
Componente
    ↓
useEffect            ← el código que NO es render
    ↓
async / await
    ↓
Petición a la API
    ↓
Respuesta
    ↓
setPersonajes()      ← dispara re-render
    ↓
React vuelve a renderizar
    ↓
Mostrar personajes   ← el render ya tenía los datos esta vez
```

Leés ese flujo y entendiste el corazón del módulo.

---

# 4️⃣ `useEffect` — la pieza que falta

## Qué es

```jsx
import { useEffect } from 'react'

useEffect(() => {
  // ▶️ se ejecuta DESPUÉS del render, en un momento aparte
}, []) // ← array de dependencias
```

Tres partes y nada más:

1. **Una función** — el efecto secundario (pedir datos, suscribirse a eventos, timers).
2. **Un array de dependencias** — controla **cuándo** corre.
3. **Nunca corre durante el render** — corre *después*.

> Piénsalo así: el render **describe** lo que se ve; el efecto **actúa** sobre el mundo exterior. `useState` describes, `useEffect` actúa.

## El array de dependencias: los tres casos

| Array | Comportamiento | Cuándo lo uso |
|-------|----------------|---------------|
| `[]` | 1 vez al montar el componente. Jamás más. | Cargar datos iniciales |
| `[id]` | Al montar + cada vez que `id` cambia | Datos que dependen de la URL o de un prop |
| Sin array | En **cada** render | Casi nunca. Olvidate por ahora. |

> `[]` se lee como: **"no dependo de nada, así que corré una vez y no me jodas más"**.

Comprobación honesta, con este componente:

```jsx
import { useEffect, useState } from 'react'

export default function Mensaje() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    console.log('Montado — ejecuto el efecto')
  }, [])

  return (
    <div>
      <button onClick={() => setVisible(!visible)}>
        {visible ? 'Ocultar' : 'Mostrar'}
      </button>
      {visible && <p>Hola 👋</p>}
    </div>
  )
}
```

| Acción | Consola |
|--------|---------|
| Carga la app | `Montado — ejecuto el efecto` |
| Click en "Mostrar" | Nada — el efecto ya corrió |
| Click en "Ocultar" | Nada |

¿Querés ver el efecto corriendo en cada render? Borralle las comas al final y mirá la consola: cada click suma una línea. Eso es exactamente el bug que vas a evitar en el Laboratorio 2.

## ⚠️ La trampa de `StrictMode`

`main.jsx` de Vite viene con `<StrictMode>`. En desarrollo, React **monta, desmonta y vuelve a montar** cada componente a propósito, para que detectes efectos mal escritos. Vas a ver **2 requests a la API** en la consola.

**No es un bug de tu código.** Es React diciéndote: "si tu efecto no sobrevive a un montaje doble, tenés un problema". Por eso más abajo vemos el patrón de limpieza (`AbortController`).

---

# 5️⃣ 🧪 Laboratorio 1 — la mecánica pura (`Usuarios`)

Este primer laboratorio usa una API con datos planos, sin imágenes ni paginación, para que el foco sea **100% la mecánica**: `useState` + `useEffect` + `async/await` + `[]`.

> **API:** `https://jsonplaceholder.typicode.com/users` (devuelve 10 usuarios falsos)

### Requerimientos

1. Usá `useState` para guardar la información obtenida de la API.
2. Usá `useEffect` para realizar la petición cuando el componente se cargue inicialmente.
3. La petición debe realizarse con `async` y `await`.
4. Mostrá en pantalla **nombre**, **correo electrónico** y **teléfono** de cada usuario.
5. Mientras se realiza la petición, mostrá `Cargando usuarios...`.
6. Si ocurre un error, mostrá `Ocurrió un error al obtener los usuarios.`

### Condición importante

La petición debe ejecutarse **únicamente al cargar el componente**:

```jsx
useEffect(() => {
  // ...
}, [])
```

### Setup

```bash
pnpm create vite useeffect-lab --template react
cd useeffect-lab
pnpm run dev
```

### Estructura de la respuesta

Cada usuario viene así (sacá la forma con `console.log(datos[0])`):

| Campo | Ejemplo |
|-------|---------|
| `name` | `Leanne Graham` |
| `email` | `Sincere@april.biz` |
| `phone` | `1-770-736-8031 x56442` |

### Solución (intentá antes, después compará)

```jsx
import { useEffect, useState } from 'react'

const URL_USUARIOS = 'https://jsonplaceholder.typicode.com/users'

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargarUsuarios() {
      try {
        const respuesta = await fetch(URL_USUARIOS)
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)
        const datos = await respuesta.json()
        setUsuarios(datos)
      } catch (err) {
        console.error(err)
        setError('Ocurrió un error al obtener los usuarios.')
      } finally {
        setLoading(false)
      }
    }

    cargarUsuarios()
  }, []) // ← solo al montar

  if (loading) return <p>Cargando usuarios...</p>
  if (error) return <p>{error}</p>

  return (
    <ul>
      {usuarios.map((u) => (
        <li key={u.id}>
          <strong>{u.name}</strong> — {u.email} — {u.phone}
        </li>
      ))}
    </ul>
  )
}
```

Anatomía, línea por línea:

| Línea | Rol |
|-------|-----|
| `const [usuarios, setUsuarios] = useState([])` | El destino de los datos |
| `const [loading, setLoading] = useState(true)` | Arrancamos cargando (siempre) |
| `async function cargarUsuarios()` | La función `async` vive **adentro** del efecto |
| `if (!respuesta.ok) throw` | Un 404 no es un error de red: lo forzamos |
| `setUsuarios(datos)` | El lado de React: re-render |
| `finally { setLoading(false) }` | Pase lo que pase, salimos de "cargando" |
| `}, [])` | Una sola vez |

### Verificación

| Acción | Resultado esperado |
|--------|--------------------|
| Carga la app | `Cargando usuarios...` y después 10 usuarios |
| Revisá la pestaña Network | 1 request a `jsonplaceholder.typicode.com/users` |
| Rompé la URL a propósito | `Ocurrió un error al obtener los usuarios.` (no pantalla en blanco) |
| Activá Slow 3G en Network | El loading se ve el tiempo suficiente para entenderlo |

### 🧠 Pregunta de reflexión

> **¿Por qué la petición a la API debe realizarse dentro de `useEffect` y no directamente en el cuerpo del componente?**

*(Responde antes de seguir. La respuesta está en la sección 11.)*

---

# 6️⃣ 🧪 Laboratorio 2 — la API de Rick & Morty

Misma mecánica, API real, datos más ricos. Si el Laboratorio 1 te salió, este te sale solo.

### Requerimientos

1. Creá `src/pages/Personajes.jsx`.
2. `useState` para `personajes`, `loading` y `error`.
3. `useEffect` con `[]` para pedir los datos al montar.
4. Endpoint: `https://rickandmortyapi.com/api/character`.
5. Mostrá por personaje: **imagen** (`image`), **nombre** (`name`), **especie** (`species`) y **estado** (`status`).
6. Mientras carga: `Cargando personajes...`.
7. Si falla: `Ocurrió un error al obtener los personajes.`

### Solución

```jsx
import { useEffect, useState } from 'react'

const API = 'https://rickandmortyapi.com/api/character'

export default function Personajes() {
  const [personajes, setPersonajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      try {
        const respuesta = await fetch(API)
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)
        const datos = await respuesta.json()
        setPersonajes(datos.results) // ← ojo: .results, no el objeto entero
      } catch (err) {
        console.error(err)
        setError('Ocurrió un error al obtener los personajes.')
      } finally {
        setLoading(false)
      }
    }

    cargar()
  }, [])

  if (loading) return <p>Cargando personajes...</p>
  if (error) return <p>{error}</p>

  return (
    <div>
      {personajes.map((p) => (
        <article key={p.id}>
          <img src={p.image} alt={p.name} width={120} />
          <h2>{p.name}</h2>
          <p>
            {p.species} — {p.status}
          </p>
          <p>Origen: {p.origin.name}</p>
        </article>
      ))}
    </div>
  )
}
```

### Diferencias con el Laboratorio 1

| | Laboratorio 1 | Laboratorio 2 |
|---|---------------|---------------|
| Datos | `datos` (ya era el array) | `datos.results` (hay que bajar un nivel) |
| Imagen | No | `p.image` — un `<img>` por personaje |
| Datos anidados | No | `p.origin.name` |
| `key` | `u.id` | `p.id` |

### Paso a paso — qué pasa en el reloj

```
t=0ms     React monta Personajes
          useState → personajes=[], loading=true, error=null
          → render: ve loading=true → muestra "Cargando personajes..."

t=1ms     React YA pintó la pantalla → ahora corre el useEffect
          → llama a cargar() → fetch() sale a la red

t=350ms   Llega la respuesta → datos.results tiene 20 personajes
          → setPersonajes(...) → setLoading(false)

t=351ms   React re-renderiza con los datos
          → ve loading=false → mapea los 20 personajes
```

Fijate el detalle del paso 2: **el efecto corre después de que la pantalla ya se pintó**. Por eso el `loading` existe — durante esa ventana el usuario ve algo.

### ⚠️ Sobre `key`

```jsx
{personajes.map((p) => <article key={p.id}>)}   // ✅ id único y estable
{personajes.map((p, i) => <article key={i}>)}   // ⚠️ funciona, pero si reordenás la lista React reutiliza el nodo equivocado
```

`key` no es un detalle cosmético: es **cómo React sabe qué elemento del DOM corresponde a qué dato**. Sin `key` (o con el índice) React adivina, y adivinar sale caro.

---

# 7️⃣ Loading state — el usuario no es adivino

Sin `loading`, el usuario ve una pantalla vacía y piensa que tu app está rota. Es la diferencia entre una app amateur y una app profesional.

## Las tres líneas que importan

```jsx
const [loading, setLoading] = useState(true) // 1. arrancá cargando
setLoading(false)                             // 2. cuando llegaron los datos, cortá
if (loading) return <p>Cargando...</p>         // 3. mientras carga, mostrá esto
```

Y el refinamiento importante: poné el `setLoading(false)` en un **`finally`**, no después del `setEstado`. Si la petición falla, también hay que salir de "cargando" — si no, el usuario queda mirando un spinner eterno.

```jsx
try {
  // ...
} catch (err) {
  setError('...')
} finally {
  setLoading(false) // ← pase lo que pase
}
```

> **Regla de oro:** si consumís una API, SIEMPRE loading + error. Sin excusas.

---

# 8️⃣ Manejo de errores — las APIs fallan

## El flujo completo y definitivo

```jsx
useEffect(() => {
  async function cargar() {
    try {
      const respuesta = await fetch(API)
      if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}`)
      }
      const datos = await respuesta.json()
      setPersonajes(datos.results)
    } catch (err) {
      console.error(err) // vos lo ves en la consola...
      setError('Ocurrió un error al obtener los personajes.') // ...el usuario ve esto
    } finally {
      setLoading(false)
    }
  }

  cargar()
}, [])
```

## Por qué `if (!respuesta.ok) throw` es obligatorio

`fetch` **no falla cuando el servidor falla**. Es la sorpresa más traicionera de la API web:

| Situación | `fetch` | `respuesta.ok` | `respuesta.json()` |
|-----------|---------|----------------|--------------------|
| 200 OK | resuelve | `true` | devuelve el objeto |
| 404 Not Found | **resuelve igual** | `false` | revienta al parsear `"Not Found"` |
| Servidor caído | rechaza (ahí sí, `catch`) | — | — |

Traducción: un 404 te llega como una promesa **resuelta** con `ok === false`. Si no lo chequeás, tu código intenta convertir el texto `"Not Found"` a JSON y te explota con un error que no dice nada útil. El `throw` manual convierte el error HTTP en un error de JavaScript que sí podés manejar.

## Los 3 estados de una pantalla con datos

Casi toda vista que consume una API tiene exactamente estos tres casos, siempre en este orden de chequeo:

```jsx
if (loading) return <p>Cargando...</p>   // 1. todavía no hay nada que mostrar
if (error) return <p>{error}</p>         // 2. no vamos a tener nada que mostrar
return <div>{/* 3. los datos */}</div>  // 3. acá sí
```

Si invertís el orden, vas a mostrar "Cargando..." sobre un error, o un error sobre datos válidos. El orden **corta con `return`**, así que cada `if` descarta lo que viene abajo.

## Cómo probar que el error anda

| Prueba | Cómo | Resultado esperado |
|--------|------|--------------------|
| URL rota | `https://rickandmortyapi.com/api/personajes` (typo) | Mensaje de error, no pantalla en blanco |
| Red caída | DevTools → Network → Offline | Mensaje de error |
| Servidor caído | Buscá un endpoint inexistente | Mensaje de error |

---

# 9️⃣ De `[]` a `[id]` — y qué hacer con la limpieza

## `[id]`: cuando la petición depende de algo

Mirá este detalle, porque es donde se juega el multitasking mental:

```jsx
useEffect(() => {
  async function cargar() {
    const respuesta = await fetch(`https://rickandmortyapi.com/api/character/${id}`)
    const datos = await respuesta.json()
    setPersonaje(datos)
  }
  cargar()
}, [id]) // ← y NO []
```

| Array | Comportamiento |
|-------|----------------|
| `[]` | 1 vez al montar, aunque cambie el `id` |
| `[id]` | Al montar **+** cada vez que `id` cambia |
| Sin array | En cada render |

**Escenario concreto:** si el componente tiene un link a `/personaje/2` y hacés click, el componente **no se desmonta** — solo cambia el `id`. Con `[]` seguirías viendo al personaje 1 en la pantalla nueva. Con `[id]`, React ve el cambio y vuelve a pedir.

> **Regla mental:** todo lo que leas *adentro* del efecto y venga de afuera del efecto (props, `useParams`, `useSearchParams`, otro estado) tiene que estar en el array. Si te olvidás de algo, React te avisa con un warning en la consola — **leelo, no lo ignores**.

## Limpieza (cleanup): cancelar el request

¿Y si el usuario navega rápido a otro personaje mientras el primero todavía está en vuelo? Cuando llegue, va a pisar el estado del personaje nuevo. Hoy se nota poco; en una app real es un bug fantasma.

La solución: `useEffect` puede devolver una función de limpieza, y React la ejecuta antes de volver a correr el efecto o al desmontar.

```jsx
useEffect(() => {
  const controlador = new AbortController() // el "teléfono" de la petición

  async function cargar() {
    try {
      const respuesta = await fetch(`https://rickandmortyapi.com/api/character/${id}`, {
        signal: controlador.signal, // ← la señal de cancelación
      })
      const datos = await respuesta.json()
      setPersonaje(datos)
    } catch (err) {
      if (err.name !== 'AbortError') setError('Ocurrió un error.')
    } finally {
      setLoading(false)
    }
  }

  cargar()

  return () => controlador.abort() // ← React ejecuta esto al desmontar/cambiar id
}, [id])
```

Qué significa, en español:

| Pieza | Significado |
|-------|-------------|
| `new AbortController()` | Un objeto que puede "cortar" la petición |
| `signal: ...` | Se lo pasamos a `fetch` para que quede atado a ese corte |
| `return () => controlador.abort()` | "Cuando este efecto muera o se repita, cortá la petición vieja" |
| `err.name === 'AbortError'` | Cancelamos **a propósito**: no es un error para mostrarle al usuario |

En `StrictMode` (desarrollo) esto importa doble: montás, se limpia, remontás. Con `AbortController` queda limpio. Sin él, quedan requests alambrados.

**Alternativa más simple** si no querés `AbortController` — la bandera `ignore`:

```jsx
useEffect(() => {
  let ignore = false

  async function cargar() {
    const datos = await (await fetch(API)).json()
    if (!ignore) setPersonajes(datos.results) // ¿sigo vigente? escribo o no
  }
  cargar()

  return () => {
    ignore = true // ya no me importan los datos que lleguen
  }
}, [])
```

Mismo concepto: "si ya no me necesitan, no escribas nada".

## El detalle con Router

Ya lo conocés del módulo anterior. Setup en `main.jsx`:

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

`App.jsx`:

```jsx
import { Routes, Route } from 'react-router-dom'
import Personajes from './pages/Personajes'
import PersonajeDetalle from './pages/PersonajeDetalle'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Personajes />} />
      <Route path="/personaje/:id" element={<PersonajeDetalle />} />
      <Route path="*" element={<h2>404 — Página no encontrada</h2>} />
    </Routes>
  )
}
```

Cada tarjeta de la lista se vuelve un `Link`:

```jsx
<Link to={`/personaje/${p.id}`} key={p.id}>
  <img src={p.image} alt={p.name} />
  <p>{p.name}</p>
</Link>
```

Y el detalle, con `useParams` + `[id]` + los 3 estados:

```jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

export default function PersonajeDetalle() {
  const { id } = useParams()
  const [personaje, setPersonaje] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true)
        setError(null) // ← limpiamos el error anterior
        const respuesta = await fetch(`https://rickandmortyapi.com/api/character/${id}`)
        if (!respuesta.ok) throw new Error('Personaje no encontrado')
        setPersonaje(await respuesta.json())
      } catch (err) {
        setError('Ocurrió un error al obtener el personaje.')
      } finally {
        setLoading(false)
      }
    }

    cargar()
  }, [id]) // ← depende del id: navegá a otro y se recarga

  if (loading) return <p>Cargando personaje...</p>
  if (error) return <p>{error}</p>

  return (
    <div>
      <Link to="/">← Volver al listado</Link>
      <img src={personaje.image} alt={personaje.name} />
      <h1>{personaje.name}</h1>
      <p>Estado: {personaje.status}</p>
      <p>Especie: {personaje.species}</p>
      <p>Género: {personaje.gender}</p>
      <p>Origen: {personaje.origin.name}</p>
      <p>Ubicación: {personaje.location.name}</p>
    </div>
  )
}
```

> Notá el `setLoading(true)` y `setError(null)` **adentro** del efecto. Sin el `setLoading(true)` inicial, navegás de un personaje lento a uno rápido y ves el viejo hasta que llega el nuevo. Ese par de líneas se llama **"petición con estado"** y es un hábito que te va a servir siempre.

---

# 🔟 🏋️ Reto — buscador de personajes

Ahora te toca a vos. Todo lo que necesitás ya lo viste.

## Consigna

Agregá un buscador por nombre **usando la API** (no filtrando en el cliente).

## Endpoint de búsqueda

```js
fetch('https://rickandmortyapi.com/api/character/?name=rick')
```

Devuelve los personajes cuyo nombre contiene `rick`. **Si no hay resultados, la API devuelve 404** — por eso el `if (!respuesta.ok)` no es opcional acá, es el caso de uso principal.

## Lo que ya tenés armado

- Lista con `loading` + `error` + 3 estados
- Links al detalle con `useParams`
- Página de detalle con `[id]`

## Lo que tenés que hacer

1. `input` de búsqueda con su estado (`search`).
2. Un botón "Buscar" que actualice un estado `nombreBuscado`.
3. `useEffect` con dependencia `[nombreBuscado]` (no `[search]`) que pida a la API.
4. `loading` + `error` + resultados.
5. Mensaje "No se encontraron personajes" cuando no hay resultados.

> 💡 **Por qué un estado `nombreBuscado` separado de `search`:** si el `useEffect` dependiera de `search`, cada tecla que el usuario escriba dispararía una petición. Con un botón, controlás vos cuándo se manda a la red. Es la diferencia entre una app educada y una app que bombardea al servidor.
>
> (En una app real se resuelve con un `setTimeout` de 300 ms o con un hook `useDebounce`, pero eso es otro día.)

## Verificación

| Acción | Resultado esperado |
|--------|--------------------|
| Carga la página | Muestra todos los personajes |
| Escribís "rick" y presionás Buscar | Solo personajes con "rick" en el nombre |
| Escribís "zzzz" y Buscar | "No se encontraron personajes" (no una pantalla vacía) |
| Click en un personaje | Navega a `/personaje/{id}` con el detalle |
| Volver al listado | Vuelve a la lista **sin filtro** |
| Escribís "rick" y click en otro personaje, volvés | El filtro se conserva (o se limpia, según tu decisión — pero tiene que ser una decisión, no un accidente) |

---

# 1️⃣1️⃣ Errores que vas a cometer (todos)

Guardá esta tabla. Es el acelerador de aprendizaje: cada fila es un bug que TODOS cometen una vez.

| Síntoma | Causa | Arreglo |
|---------|-------|---------|
| `Maximum update depth exceeded` / la app se congela | `useEffect` **sin array** de dependencias | Agregá `[]` (o las deps reales) |
| Pide la API infinitas veces | `useEffect` depende de un objeto/array recreado en cada render | Dependí de valores primitivos |
| `SyntaxError: await is only valid in async functions` | `await` en el cuerpo del componente | Metelo en `useEffect` + `async function` |
| `respuesta.json is not a function` / error raro al parsear | No chequeaste `respuesta.ok` y el cuerpo no era JSON | `if (!respuesta.ok) throw new Error(...)` |
| Pantalla en blanco eterna | Falta el `setLoading(false)` en el `finally` | `finally { setLoading(false) }` |
| `datos.map is not a function` | Te saltaste un nivel (`results`) | Revisá la forma del JSON con `console.log` |
| "Warning: Each child in a list should have a unique key" | Te olvidaste el `key` en el `map` | `key={p.id}` |
| React 19: "Warning: An update to X inside a test was not wrapped in act(...)" / datos que llegan tarde al desmontar | Falta limpieza | `return () => controlador.abort()` o bandera `ignore` |
| El warning de dependencias de React | Falta una variable en el array | Leé el warning: te dice cuál falta |
| Se ve el personaje anterior un instante | No reseteás el loading al cambiar de `id` | `setLoading(true)` al inicio del efecto |

---

# ❓ Preguntas de reflexión (con respuesta)

Leé la pregunta, respondé en voz alta, después leé la respuesta.

### 1. ¿Por qué la petición va dentro de `useEffect` y no en el cuerpo del componente?

**Porque el cuerpo de un componente tiene que devolver JSX de forma síncrona, y una petición HTTP es asíncrona por definición.** `await` rompería ese contrato y React no tiene forma de decir "todavía no, sigo esperando". Además, el cuerpo del componente se re-ejecuta en **cada** render: pedir datos ahí significa pedir datos cada vez que cambia cualquier estado → loop infinito.

`useEffect` te da exactamente lo que necesitás: **un lugar para código asíncrono, con control explícito de cuántas veces corre**.

### 2. ¿Cuál es la diferencia entre `[]` y `[id]`?

`[]` = "no dependo de nada, corré una vez al montar". `[id]` = "dependo del `id`: corré al montar y cada vez que el `id` cambie". El array **declarás tus dependencias**, y eso es toda la promesa de `useEffect`.

### 3. ¿Por qué `fetch` no falla cuando la API devuelve 404?

Porque `fetch` solo rechaza cuando **no hubo respuesta** (no hay red, el servidor está caído). Un 404 **es** una respuesta válida — lo que falla es el código HTTP. Por eso hay que mirar `respuesta.ok` a mano y lanzar el error con `throw`.

### 4. ¿Puedo poner `async` directo en el `useEffect`?

```jsx
useEffect(async () => { ... }, []) // ❌ y React te lo va a avisar
```

`useEffect` espera que la función devuelva **una función de limpieza o nada**. Si le devolvés una `Promise`, React la trata como si fuera la función de limpieza y revienta. Solución: definí una `async function` **adentro** del efecto y llamala.

### 5. ¿Siempre necesito `useEffect` para traer datos?

No. React tiene una regla de oro: **si podés derivar el dato de otro estado o prop, derivá — no busques.** `useEffect` es para sincronizar con el mundo **exterior** (red, timers, eventos, subscriptions, APIs del navegador). Filtrar una lista que ya tenés en estado **no** necesita un efecto:

```jsx
// ❌ un efecto para filtrar algo que ya tenés
useEffect(() => {
  setVisibles(personajes.filter((p) => p.name.includes(search)))
}, [personajes, search])

// ✅ derivación directa, cero efectos
const visibles = personajes.filter((p) => p.name.includes(search))
```

---

## 📚 Resumen rápido

| Concepto | Qué es |
|----------|--------|
| **API** | Función en otro servidor que te devuelve datos |
| **`fetch(url)`** | Pide datos por HTTP → `Promise<Response>` |
| **`respuesta.json()`** | Convierte el cuerpo a objeto → `Promise<objeto>` |
| **`respuesta.ok`** | `true` si el status es 2xx — chequealo siempre |
| **`async` / `await`** | Espera una Promise sin caer en `.then()` anidados |
| **`useEffect(fn, [])`** | Corre `fn` una vez al montar el componente |
| **`useEffect(fn, [x])`** | Corre al montar + cada vez que `x` cambia |
| **`return () => ...`** | Limpieza: se ejecuta al desmontar o antes del siguiente efecto |
| **Loading state** | `useState(true)` → `false` en el `finally` |
| **Error state** | `try`/`catch` + `setError` con un mensaje para el usuario |
| **Los 3 estados** | `loading` → `error` → datos, siempre en ese orden |
| **`key={id}`** | Cómo React sabe qué nodo del DOM es cuál dato |

---

## ✅ Checklist — ¿terminaste la clase?

- [ ] Consumí una API a mano desde la consola y leí la forma del JSON
- [ ] Explico con mis palabras por qué `await` no puede ir en el cuerpo del componente
- [ ] Tengo un componente con `useState` + `useEffect(..., [])` + `async/await` que muestra datos
- [ ] Tengo `loading`, `error` y los 3 estados en ese orden
- [ ] Entiendo la diferencia entre `[]` y `[id]` y sé cuándo usar cada uno
- [ ] Sé por qué existe el `if (!respuesta.ok) throw`
- [ ] Completé el buscador del reto
- [ ] Sé qué pasa si saco el array de dependencias (loop infinito)

---

> **Manos al código.** Tu app dejó de ser una mentira el día que le habla a un servidor de verdad.
>
> *"useEffect es el puente entre el mundo declarativo de React y el mundo imperativo del navegador."*
