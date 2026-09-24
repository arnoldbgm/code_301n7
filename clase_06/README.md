# useEffect + Fetch — Datos de verdad

> **Nivel:** Intermedio — asumimos que ya sabés componentes, props, useState, y React Router  
> **React 19 · Vite 6**  
> *"Hasta que no consumís una API, tu app es una mentira."*

---

## 📋 Qué vamos a ver

| # | Tema |
|---|------|
| 1 | Async / Fetch — lo mínimo para sobrevivir |
| 2 | `useEffect` — el ciclo de vida del componente |
| 3 | Consumir la API de Rick & Morty |
| 4 | Loading state — mientras llegan los datos |
| 5 | Manejo de errores — porque las APIs fallan |
| 6 | Refuerzo Router — detalle del personaje |
| 7 | 🏋️ Reto: buscador de personajes |

---
## ¿Qué es la sincronía?

La **sincronía** es una forma de ejecución donde las tareas se realizan una después de otra. Cada tarea debe finalizar antes de que comience la siguiente.

### Analogía del chef 🍕

Imagina que eres un chef y debes preparar una pizza.

1. Preparas la masa.
2. La metes al horno.
3. Te quedas esperando frente al horno hasta que termine de cocinarse.
4. Recién cuando la pizza está lista, continúas con otra tarea.

**Idea clave:** una tarea debe terminar para poder continuar con la siguiente.

---

## ¿Qué es la asincronía?

La **asincronía** es la capacidad de ejecutar una tarea que puede tardar tiempo sin detener el resto del programa. Mientras esa tarea se resuelve, el código puede seguir ejecutándose y, cuando finaliza, se procesa su resultado.

### Analogía del chef 🍕

Imagina nuevamente que eres un chef.

1. Preparas la pizza.
2. La metes al horno.
3. Mientras la pizza se cocina, preparas una ensalada o limpias la cocina.
4. Cuando el horno avisa que la pizza está lista, vuelves a ella y la sirves.

**Idea clave:** una tarea puede ejecutarse "por detrás" mientras seguimos realizando otras actividades.

---

## ¿Qué es una Promesa?

Una **Promesa (Promise)** es un objeto que representa el resultado futuro de una operación asíncrona.

### Analogía del chef 🍕

Cuando metes la pizza al horno, este te entrega un aviso:

> "Te avisaré cuando la pizza esté lista."

Ese aviso es la **Promesa**.

La promesa puede tener tres estados:

- **Pendiente (Pending):** la pizza aún se está cocinando.
- **Cumplida (Fulfilled):** la pizza está lista.
- **Rechazada (Rejected):** ocurrió un problema y la pizza se quemó.

**Idea clave:** una promesa es una garantía de que en el futuro obtendremos un resultado o un error.



# 1️⃣ Async / Fetch — sacando datos del mundo real

Antes de meterte en useEffect necesitás entender **cómo se piden datos en JavaScript**.

## `fetch()` — la función que habla con servidores

```js
const respuesta = await fetch('https://rickandmortyapi.com/api/character')
const datos = await respuesta.json()
console.log(datos)
```

`fetch` hace una solicitud HTTP. `await` frena la ejecución hasta que llega la respuesta. `respuesta.json()` convierte el JSON a un objeto de JavaScript.

## ¿Qué es `async`?

Si usás `await`, la función tiene que estar marcada como `async`:

```js
async function obtenerPersonajes() {
  const respuesta = await fetch('https://rickandmortyapi.com/api/character')
  const datos = await respuesta.json()
  return datos.results
}
```

> **Pista:** `async` le dice a JavaScript "esta función tiene código asincrónico". Sin eso, `await` no funciona.

## La regla de oro de async/await

| Concepto | Explicación |
|----------|-------------|
| **`async function`** | Declara que la función tiene código que espera |
| **`await`** | Pausa hasta que la promesa se resuelva |
| **`fetch(url)`** | Dispara una solicitud HTTP GET |
| **`respuesta.json()`** | Convierte la respuesta a objeto JS |

Tanto `fetch` como `respuesta.json()` devuelven una **Promise**. `await` "espera" a que se resuelvan.

```js
// Sin await → obtenés una Promise, no los datos
const resultado = fetch(url)        // ❌ Promise pendiente

// Con await → obtenés los datos
const resultado = await fetch(url)  // ✅ Response
```

Esto es todo lo que necesitás saber de async/await para salir andando. Ahora veamos cómo usarlo en React.

---

# 2️⃣ `useEffect` — reaccionando a lo que pasa

> [!TIP]
> `useEffect` permite ejecutar acciones después del renderizado del componente y reaccionar a cambios en su estado o propiedades.


## El problema

En el mundo de React, el render es **síncrono**. Pero pedir datos a una API es **asincrónico**. No podés poner un `await` adentro del componente:

```jsx
export default function Personajes() {
  const datos = await fetch(...) // ❌ ERROR — React no espera
  return (...)
}
```

Además, no querés pedir los datos **cada vez que el componente se renderiza**. Querés pedirlos **una vez**, cuando el componente aparece en pantalla.

Ahí entra `useEffect`.

## Cómo funciona

```jsx
import { useEffect } from 'react'

useEffect(() => {
  // ▶️ Esto se ejecuta DESPUÉS del render
  console.log('El componente se montó o se actualizó')
}, []) // ← array de dependencias
```

Tres partes:
1. **Una función** — el código que querés ejecutar (efecto secundario)
2. **Un array de dependencias** — controla CUÁNDO se ejecuta
3. **Se ejecuta DESPUÉS del render**, no durante

## Los dos casos que te importan

### Caso 1: `[]` — ejecutá esto UNA sola vez

```jsx
useEffect(() => {
  console.log('El componente apareció en pantalla')
}, [])
```

El array vacío se lee así: **"no dependés de nada"**. Como no depende de nada, React lo ejecuta una vez cuando el componente se monta y después **jamás lo vuelve a ejecutar**, sin importar cuántos re-renders haya.

> [!IMPORTANT]
> Pensalo así: `[]` es "ejecutame al inicio y no me vuelvas a molestar más".

### Caso 2: `[valor]` — ejecutá esto cuando `valor` cambie

```jsx
useEffect(() => {
  document.title = `Click ${contador}`
}, [contador])
```
> [!IMPORTANT]
> useEffect se ejecuta cada vez que el componente cambia de valor.
---

El caso que más te va a importar en esta guía es el primero: `[]`.

```jsx
import { useEffect, useState } from 'react'

export default function Mensaje() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    console.log('Componente montado — ejecuto efecto')
  }, []) // ← solo al montar

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

Probá:

| Acción | Consola |
|--------|---------|
| La app carga | `Componente montado — ejecuto efecto` |
| Click en "Mostrar" | **No pasa nada** — el efecto ya se ejecutó una vez |
| Click en "Ocultar" | **No pasa nada** |

---

# 3️⃣ Consumir la API de Rick & Morty

Ahora juntamos todo. Vamos a crear un componente que muestre personajes de Rick & Morty.

## Setup

Arrancá un proyecto nuevo:

```bash
pnpm create vite rick-morty-app --template react
cd rick-morty-app
pnpm add react-router-dom
pnpm run dev
```

## Primer intento: Personajes sin useEffect

Creá `src/pages/Personajes.jsx`:

```jsx
import { useState } from 'react'

export default function Personajes() {
  const [personajes, setPersonajes] = useState([])

  // ❌ Esto NO funciona — no podés poner async acá
  const respuesta = await fetch('https://rickandmortyapi.com/api/character')
  const datos = await respuesta.json()
  setPersonajes(datos.results)

  return (
    <ul>
      {personajes.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  )
}
```

Esto explota. No podés usar `await` en el cuerpo del componente.

## La solución correcta con useEffect

```jsx
import { useState, useEffect } from 'react'

export default function Personajes() {
  const [personajes, setPersonajes] = useState([])

  useEffect(() => {
    async function cargarPersonajes() {
      const respuesta = await fetch(
        'https://rickandmortyapi.com/api/character?page=1'
      )
      const datos = await respuesta.json()
      setPersonajes(datos.results)
    }

    cargarPersonajes()
  }, []) // ← solo al montar

  return (
    <div>
      {personajes.map(p => (
        <div key={p.id}>
          <img src={p.image} alt={p.name} width="100" />
          <p>{p.name} — {p.species}</p>
        </div>
      ))}
    </div>
  )
}
```

**Atención:** adentro del `useEffect` definimos una función `async` y la llamamos. No podemos hacer `useEffect(async () => ...)` porque `useEffect` espera que devuelvas una función de limpieza, no una Promise.

### Paso a paso

```
1. Componente se monta → useState → personajes = []
2. React renderiza: no muestra nada (array vacío)
3. useEffect se ejecuta → llama a cargarPersonajes()
4. fetch() sale a internet
5. Llega la respuesta → setPersonajes(datos.results)
6. React re-renderiza con los personajes
7. La pantalla se actualiza
```

> El `[]` vacío es CLAVE. Sin eso, el efecto se ejecutaría en cada render → pediría la API en loop infinito.

---

# 4️⃣ Loading State — mientras los datos viajan

Sin loading state, el usuario ve una pantalla en blanco hasta que llega la API. Feo.

Agregá un estado `loading` que arranque en `true` y pasá a `false` cuando terminen los datos:

```jsx
import { useState, useEffect } from 'react'

export default function Personajes() {
  const [personajes, setPersonajes] = useState([])
  const [loading, setLoading] = useState(true) // ← arranca cargando

  useEffect(() => {
    async function cargar() {
      const respuesta = await fetch(
        'https://rickandmortyapi.com/api/character?page=1'
      )
      const datos = await respuesta.json()
      setPersonajes(datos.results)
      setLoading(false) // ← ya está, dejá de cargar
    }

    cargar()
  }, [])

  // Si está cargando, mostrá esto y listo
  if (loading) return <p>Cargando personajes...</p>

  // Si no, mostrá los personajes
  return (
    <div>
      {personajes.map(p => (
        <div key={p.id}>
          <img src={p.image} alt={p.name} width="100" />
          <p>{p.name} — {p.species}</p>
        </div>
      ))}
    </div>
  )
}
```

Tres únicas líneas que importan:

```jsx
const [loading, setLoading] = useState(true)  // 1. arrancá cargando
setLoading(false)                               // 2. cuando llegaron los datos, cortá
if (loading) return <p>Cargando...</p>           // 3. mientras carga, mostrá esto
```

Después, cuando veas manejo de errores, vas a sumar `try/catch`. Pero la base es esta: un booleano que arranca en `true`, y cuando los datos llegan, pasa a `false`.

> **Regla de oro:** si consumís una API, SIEMPRE tené loading. El usuario no es adivino.

---

# 5️⃣ Manejo de errores — por si la API falla

A tu `cargar()` tenés que rodearlo con `try/catch` por si la red se cae o la URL está mal:

```jsx
useEffect(() => {
  async function cargar() {
    try {
      const respuesta = await fetch('https://rickandmortyapi.com/api/character?page=1')
      if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`)
      const datos = await respuesta.json()
      setPersonajes(datos.results)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false) // ← pase lo que pase, dejá de cargar
    }
  }

  cargar()
}, [])
```

Agregás un estado para el error:

```jsx
const [error, setError] = useState(null)
```

Y mostrás el error si existe:

```jsx
if (error) return <p>Error: {error}</p>
```

Sin `respuesta.ok`, si la API devuelve 404, tu código trata de convertir "404 Not Found" a JSON y rompe todo. Poné ese `throw` siempre.

### Para probar el error

Cambiá la URL por una que no exista y deberías ver tu mensaje de error en pantalla, no la consola rota.

---

# 6️⃣ Refuerzo Router — detalle del personaje

Ahora que tenemos la lista de personajes, vamos a crear una página de detalle para cada uno usando React Router.

## Setup del Router

Ya sabés cómo hacerlo del módulo anterior. En `main.jsx`:

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

En `App.jsx` configurás las rutas:

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

## Hacer que cada personaje sea un Link

Modificás la lista para que cada tarjeta navegue al detalle:

```jsx
import { Link } from 'react-router-dom'

// adentro del return, donde renderizás cada personaje:
<Link to={`/personaje/${p.id}`} key={p.id}>
  <img src={p.image} alt={p.name} />
  <p>{p.name} — {p.species}</p>
</Link>
```

## Página de detalle con useParams

Creás `src/pages/PersonajeDetalle.jsx`:

```jsx
import { useState, useEffect } from 'react'
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
        setError(null)
        const respuesta = await fetch(
          `https://rickandmortyapi.com/api/character/${id}`
        )
        if (!respuesta.ok) {
          throw new Error('Personaje no encontrado')
        }
        const datos = await respuesta.json()
        setPersonaje(datos)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    cargar()
  }, [id]) // ← importante: depende del id!

  if (loading) return <p>Cargando personaje...</p>
  if (error) return <p>Error: {error}</p>
  if (!personaje) return <p>Personaje no encontrado</p>

  return (
    <div>
      <Link to="/">← Volver al listado</Link>
      <div>
        <img src={personaje.image} alt={personaje.name} />
        <h1>{personaje.name}</h1>
        <p>Estado: {personaje.status}</p>
        <p>Especie: {personaje.species}</p>
        <p>Género: {personaje.gender}</p>
        <p>Origen: {personaje.origin.name}</p>
        <p>Ubicación: {personaje.location.name}</p>
      </div>
    </div>
  )
}
```

### ¿Por qué `[id]` en las dependencias?

Fijate que acá el `useEffect` tiene `[id]` en lugar de `[]`. ¿Por qué?

Si entrás directo a `/personaje/1`, useEffect se ejecuta una vez y trae al personaje 1. Perfecto. Pero si adentro de la página hay un link a `/personaje/2` y hacés click, el componente **no se desmonta** — solo cambia el `id`. Sin `[id]`, useEffect no se ejecutaría de nuevo y seguirías viendo al personaje 1.

Con `[id]`, cada vez que cambia el `id` en la URL, useEffect detecta el cambio y pide los datos del nuevo personaje.

| Array | Comportamiento |
|-------|----------------|
| `[]` | Se ejecuta una sola vez al montar |
| `[id]` | Se ejecuta al montar + cada vez que `id` cambia |
| Sin array | Se ejecuta en cada render |

---

# 7️⃣ 🏋️ Reto: buscador de personajes

Ahora te toca a vos. Vas a agregar un buscador a la lista de personajes.

## Consigna

Agregá un input de búsqueda que filtre personajes por nombre usando la API.

### Cómo funciona la API de búsqueda

```js
fetch('https://rickandmortyapi.com/api/character/?name=rick')
```

Devuelve los personajes cuyo nombre contiene "rick". Si no hay resultados, la API devuelve un error 404 (que manejás con `if (!respuesta.ok)`).

### Lo que ya funciona

- La lista de personajes con loading y error
- Los links al detalle con `useParams`
- La página de detalle individual

### Lo que tenés que hacer

1. Agregá un `input` de búsqueda
2. Guardá el texto en un estado `search`
3. Cuando el usuario escriba, usá `setTimeout` o mejor: esperá a que haga click en "Buscar"
4. Usá `useEffect` con dependencia `[search]` para pedir los datos filtrados
5. Mostrá loading + error + resultados

### Pistas

- Vas a necesitar un estado para el texto del input y otro para el texto "confirmado" (el que se manda a la API)
- O usá un botón "Buscar" que actualice el estado que está en las dependencias del useEffect
- Si no hay resultados (`datos.results` vacío o undefined), mostrá un mensaje

### Verificación

| Acción | Resultado |
|--------|-----------|
| Cargar la página | Muestra todos los personajes |
| Escribir "rick" y buscar | Muestra solo personajes con "rick" en el nombre |
| Escribir "zzzz" y buscar | Muestra "No se encontraron personajes" |
| Click en cualquier personaje | Navega a `/personaje/{id}` con el detalle |
| Click en "Volver al listado" | Vuelve a la lista (sin filtro) |

---

## 📚 Resumen rápido

| Concepto | Explicación |
|----------|-------------|
| **`fetch(url)`** | Dispara una solicitud HTTP GET |
| **`await`** | Espera a que una Promise se resuelva |
| **`async function`** | Declaración necesaria para usar `await` |
| **`useEffect(fn, [])`** | Ejecuta `fn` una vez al montar el componente |
| **`useEffect(fn, [x])`** | Ejecuta `fn` al montar + cada vez que `x` cambia |
| **Loading state** | Arrancá `loading` en `true`, pasalo a `false` al terminar |
| **Error state** | Atajá errores con `try/catch`, mostralos en la UI |
| **`respuesta.ok`** | Verificá que la respuesta HTTP sea exitosa |
| **`useParams()`** | Obtené parámetros de la URL para el detalle |
| **Dependencias** | Cada variable que usás adentro del efecto debería estar en el array |

---

> **Manos al código.** Tu app de React recién empieza a ser interesante cuando habla con el mundo real.
>
> *"useEffect es el puente entre el mundo declarativo de React y el mundo imperativo del navegador."*
