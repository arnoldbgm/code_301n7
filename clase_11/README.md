# Supabase + React — CRUD de Equipos y Jugadores

> **Nivel:** Intermedio — asumimos useState, useEffect, props, eventos
> **React 19 · Vite 8 · Supabase js v2**
> *"El frontend sin datos es solo un decorado."*

---

## 📋 Qué vamos a ver

| # | Tema |
|---|------|
| 1 | ⚡ Referencia rápida: así se consulta Supabase |
| 2 | Conectamos React con Supabase |
| 3 | SELECT — Mostrar equipos |
| 4 | INSERT — Agregar equipo |
| 5 | UPDATE — Editar equipo |
| 6 | DELETE — Eliminar equipo |
| 7 | 🧠 Tu turno: CRUD de Jugadores |
| 8 | 🏋️ Desafío final |

---

## 1️⃣ ⚡ Referencia rápida: así se consulta Supabase

Toda consulta devuelve `{ data, error }`. Siempre.

### SELECT — Traer datos

```js
let { data, error } = await supabase.from('equipos').select('*')
// data → array de equipos
// error → null si todo bien
```

### SELECT con filtro

```js
let { data, error } = await supabase
  .from('equipos')
  .select('*')
  .eq('grupo', 'A')
```

### INSERT — Crear registro

```js
let { data, error } = await supabase
  .from('equipos')
  .insert({ nombre: 'Argentina', grupo: 'A' })
```

### UPDATE — Actualizar registro

```js
let { data, error } = await supabase
  .from('equipos')
  .update({ nombre: 'Argentina Actualizado' })
  .eq('id', 1)

// ⚠️ SIN .eq() actualiza TODOS los registros
```

### DELETE — Eliminar registro

```js
let { data, error } = await supabase
  .from('equipos')
  .delete()
  .eq('id', 1)
```

### JOIN — Traer datos relacionados

```js
let { data, error } = await supabase
  .from('partidos')
  .select(`
    id, goles_local, goles_visitante, fase,
    local:equipos!local_id(nombre),
    visitante:equipos!visitante_id(nombre)
  `)
// data[0].local.nombre → 'Argentina'
```

### Filtros más comunes

| Método | SQL equivalente | Ejemplo |
|--------|----------------|---------|
| `.eq('col', val)` | `WHERE col = val` | `.eq('grupo', 'A')` |
| `.neq('col', val)` | `WHERE col != val` | `.neq('grupo', 'B')` |
| `.gt('col', val)` | `WHERE col > val` | `.gt('goles', 0)` |
| `.lt('col', val)` | `WHERE col < val` | `.lt('goles', 5)` |
| `.gte('col', val)` | `WHERE col >= val` | `.gte('edad', 18)` |
| `.lte('col', val)` | `WHERE col <= val` | `.lte('edad', 30)` |
| `.ilike('col', '%val%')` | `WHERE col ILIKE '%val%'` | `.ilike('nombre', '%arg%')` |
| `.in('col', arr)` | `WHERE col IN (...)` | `.in('grupo', ['A','B'])` |
| `.order('col', { ascending: true })` | `ORDER BY col ASC` | `.order('nombre')` |
| `.limit(n)` | `LIMIT n` | `.limit(10)` |

> Podés **encadenar** métodos: `.select('*').eq('grupo', 'A').order('nombre').limit(5)`

---

## 2️⃣ Conectamos React con Supabase

### El proyecto que te damos

Ya tenés instalado:
- React 19 + Vite 8 + React Router v7
- `@supabase/supabase-js`
- 6 páginas creadas como archivos vacíos

Tu trabajo: conectar cada página a Supabase. Vos decidís cómo se ve.

### Paso 1: Variables de entorno

Creá `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

Ambas las sacás de Supabase → Project Settings → API.

### Paso 2: Crear el cliente Supabase

`src/lib/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

Este archivo lo vas a importar en cada página que necesite datos.

---

## 3️⃣ SELECT — Mostrar equipos

`src/pages/Equipos.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Equipos() {
  const [equipos, setEquipos] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    cargarEquipos()
  }, [])

  async function cargarEquipos() {
    let { data, error } = await supabase.from('equipos').select('*')

    if (error) {
      setError(error.message)
    } else {
      setEquipos(data)
    }
  }

  if (error) return <p>Error: {error}</p>

  return (
    <div>
      <h1>Equipos</h1>
      <pre>{JSON.stringify(equipos, null, 2)}</pre>
    </div>
  )
}
```

> Probá primero con `<pre>` para ver que los datos llegan. Después reemplazalo por el HTML que quieras.

### ¿Qué pasó acá?

1. `useEffect` vacío → se ejecuta una vez al montar el componente
2. `cargarEquipos()` llama a `supabase.from('equipos').select('*')`
3. Si hay error, lo mostramos. Si no, guardamos los datos en `equipos`
4. Renderizamos con `<pre>` para debug rápido

Este es el **patrón base** que vamos a repetir en cada operación.

---

## 4️⃣ INSERT — Agregar equipo

Agregamos un formulario para crear equipos.

```jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Equipos() {
  const [equipos, setEquipos] = useState([])
  const [nombre, setNombre] = useState('')
  const [grupo, setGrupo] = useState('')

  useEffect(() => {
    cargarEquipos()
  }, [])

  async function cargarEquipos() {
    let { data, error } = await supabase.from('equipos').select('*')
    if (!error) setEquipos(data)
  }

  async function agregarEquipo(e) {
    e.preventDefault()

    let { error } = await supabase
      .from('equipos')
      .insert({ nombre, grupo })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      setNombre('')
      setGrupo('')
      cargarEquipos()
    }
  }

  return (
    <div>
      <h1>Equipos</h1>

      <form onSubmit={agregarEquipo}>
        <input
          placeholder="Nombre del equipo"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
        />
        <input
          placeholder="Grupo (A, B, C...)"
          value={grupo}
          onChange={e => setGrupo(e.target.value)}
          required
        />
        <button type="submit">Agregar</button>
      </form>

      <ul>
        {equipos.map(eq => (
          <li key={eq.id}>
            {eq.nombre} — Grupo {eq.grupo}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Puntos clave

- El formulario usa `onSubmit` → prevenimos el refresh con `e.preventDefault()`
- `insert({ nombre, grupo })` — las keys tienen que coincidir con los nombres de columna en Supabase
- Después de insertar, llamamos `cargarEquipos()` para refrescar la lista
- Los inputs no tienen estilos — es intencional. Dales el diseño que quieras.

---

## 5️⃣ UPDATE — Editar equipo

Agregamos estado para controlar qué equipo se está editando:

```jsx
const [editandoId, setEditandoId] = useState(null)
const [editNombre, setEditNombre] = useState('')
const [editGrupo, setEditGrupo] = useState('')
```

Funciones para iniciar y guardar edición:

```jsx
function iniciarEdicion(equipo) {
  setEditandoId(equipo.id)
  setEditNombre(equipo.nombre)
  setEditGrupo(equipo.grupo)
}

async function guardarEdicion(id) {
  let { error } = await supabase
    .from('equipos')
    .update({ nombre: editNombre, grupo: editGrupo })
    .eq('id', id)

  if (!error) {
    setEditandoId(null)
    cargarEquipos()
  }
}
```

En el JSX, cuando el id coincide con `editandoId`, mostramos inputs en vez del texto:

```jsx
<ul>
  {equipos.map(eq => (
    <li key={eq.id}>
      {editandoId === eq.id ? (
        <>
          <input value={editNombre} onChange={e => setEditNombre(e.target.value)} />
          <input value={editGrupo} onChange={e => setEditGrupo(e.target.value)} />
          <button onClick={() => guardarEdicion(eq.id)}>Guardar</button>
          <button onClick={() => setEditandoId(null)}>Cancelar</button>
        </>
      ) : (
        <>
          {eq.nombre} — Grupo {eq.grupo}
          <button onClick={() => iniciarEdicion(eq)}>✏️</button>
        </>
      )}
    </li>
  ))}
</ul>
```

> ⚠️ **NUNCA** uses `.update()` sin `.eq()` — actualizaría TODOS los registros.

---

## 6️⃣ DELETE — Eliminar equipo

```jsx
async function eliminarEquipo(id) {
  let confirmar = confirm('¿Eliminar este equipo?')
  if (!confirmar) return

  let { error } = await supabase
    .from('equipos')
    .delete()
    .eq('id', id)

  if (!error) cargarEquipos()
}
```

En el JSX, un botón más:

```jsx
<button onClick={() => eliminarEquipo(eq.id)}>🗑️</button>
```

> El `confirm()` es rápido y funciona. Si querés algo más lindo, implementá tu propio modal.

---

## 7️⃣ 🧠 Tu turno: CRUD de Jugadores

La tabla `jugadores` tiene:

| Columna | Tipo |
|---------|------|
| id | int8 (PK) |
| nombre | text |
| edad | int2 |
| posicion | text |
| equipo_id | int8 (FK → equipos.id) |

Aplicá el mismo patrón que con equipos:

1. **SELECT** — mostrar jugadores (incluí el nombre del equipo con JOIN)
2. **INSERT** — formulario para crear jugador (con un `<select>` de equipos)
3. **UPDATE** — editar jugador
4. **DELETE** — eliminar jugador

Ayuda para el JOIN:

```js
let { data } = await supabase
  .from('jugadores')
  .select('*, equipo:equipos(nombre)')
// data → { id, nombre, edad, posicion, equipo_id, equipo: { nombre: 'Argentina' } }
```

---

## 8️⃣ 🏋️ Desafío final

Construí una página que muestre:

- Un listado de equipos con su **cantidad de jugadores**
- Cada equipo debe expandirse para mostrar los jugadores

Pista: necesitás dos queries o un JOIN con count.

```js
let { data } = await supabase
  .from('jugadores')
  .select('equipo_id, count:equipo_id.count()')
```

> Esto ya es un paso hacia las agregaciones, que vamos a profundizar en la guía 02.
