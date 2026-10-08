# SQL + SUPABASE

<table>
  <tr>
    <td>
      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm21zwv1tLGwjUbU-jMafDw4LHLtCmZ3am23KG4_t4MyjB0c6hMYkblk7U&s=10" width="200" height="200" />
    </td>
    <td>
      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJ4rkkWSQ4can76poMeZmqnQ4D4R6Q609-XS0eVZiMng&s=10" width="200" height="200" />
    </td>
  </tr>
</table>

## Objetivo

Comprender cómo se almacenan, relacionan y consultan los datos en una base de datos relacional usando PostgreSQL dentro de Supabase. Todo con la copa del mundo como cancha.

---

## 1. Introducción a las Bases de Datos

### ¿Qué es una base de datos?

Es un lugar donde guardamos información de forma **organizada y permanente** para poder consultarla después.

### Diferencia entre Excel y una base de datos

| Excel | Base de datos |
|---|---|
| Una persona edita a la vez | Miles pueden consultar y escribir al mismo tiempo |
| Se rompe si crece mucho | Agarra millones de filas sin chistar |
| No valida tipos de datos | Cada columna sabe qué tipo de dato recibe |
| No hay relaciones fuertes entre archivos | Las tablas se conectan por claves foráneas |

### Conceptos clave

- **Tabla**: como una hoja de Excel, pero con reglas estrictas
- **Fila (registro)**: un renglón en la tabla, representa una entidad (un equipo, un jugador)
- **Columna (campo)**: un atributo de esa entidad (nombre, edad, dorsal)
- **Primary Key**: una columna (o combo) que identifica **de forma única** cada fila
- **Relación**: cuando dos tablas se conectan a través de una Foreign Key

> Una base de datos bien diseñada evita datos repetidos y mantiene la información consistente.

<img height="550" alt="image" src="https://github.com/user-attachments/assets/89f5e591-a9b7-4fc4-9fa4-1c3752f64756" />

---

## 2. CREATE TABLE — Crear tablas

### Explicación

`CREATE TABLE` es el comando que define la estructura de una tabla. Le decimos qué columnas va a tener y de qué tipo es cada una.

**Tipos de datos básicos en PostgreSQL:**

| Tipo | Sirve para | Ejemplo |
|---|---|---|
| `SERIAL` | Entero que se autoincrementa — ideal para IDs | `1, 2, 3...` |
| `INTEGER` | Números enteros | `23`, `-5`, `0` |
| `NUMERIC(5,2)` | Números con decimales | `9.99`, `1450.50` |
| `TEXT` | Texto largo | `'Argentina'` |
| `VARCHAR(50)` | Texto con límite de caracteres | `'Messi'` |
| `BOOLEAN` | Verdadero / Falso | `TRUE`, `FALSE` |
| `TIMESTAMP` | Fecha y hora | `'2026-06-21 15:00:00'` |

La **Primary Key** es única por fila. Con `SERIAL`, PostgreSQL se encarga de asignar el número automáticamente.

---

### Demo del profe: Crear la tabla `equipos`

```sql
CREATE TABLE equipos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    confederacion VARCHAR(20) NOT NULL,
    grupo CHAR(1),
    ranking_fifa INTEGER,
    clasificado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT NOW()
);
```

**Qué pasó acá:**
- `id SERIAL PRIMARY KEY` → se autoincrementa solo
- `NOT NULL` → esa columna no puede estar vacía
- `DEFAULT` → si no pasamos un valor, usa ese
- `CHAR(1)` → exactamente un carácter ('A', 'B', 'C'...)

---

### Reto para el alumno: Crear `jugadores`

Creá una tabla `jugadores` con esta estructura:

| Columna | Tipo | Detalle |
|---|---|---|
| id | SERIAL | Primary Key |
| nombre | VARCHAR(100) | NOT NULL |
| posicion | VARCHAR(20) | Ej: 'ARQ', 'DEF', 'MED', 'DEL' |
| dorsal | INTEGER | NOT NULL |
| activo | BOOLEAN | DEFAULT TRUE |
| fecha_nacimiento | DATE | |

Escribí el `CREATE TABLE` y ejecutalo. Por ahora la tabla queda vacía — en la siguiente sección la llenamos.

---

## 3. INSERT — Insertar datos

### Explicación

`INSERT` agrega filas nuevas a una tabla. Hay que decirle en qué columna va cada valor.

```sql
INSERT INTO tabla (columna1, columna2)
VALUES (valor1, valor2);
```

Si no mencionamos una columna, PostgreSQL pone el valor por defecto (`DEFAULT`) o `NULL`.

---

### Demo del profe: Insertar equipos

```sql
INSERT INTO equipos (nombre, confederacion, grupo, ranking_fifa)
VALUES
    ('Argentina', 'CONMEBOL', 'C', 1),
    ('Brasil', 'CONMEBOL', 'F', 5),
    ('España', 'UEFA', 'B', 8),
    ('Japón', 'AFC', 'E', 18),
    ('Marruecos', 'CAF', 'F', 13);
```

No hace falta pasar `id` porque `SERIAL` lo genera solo. Tampoco `clasificado` ni `fecha_creacion` porque tienen `DEFAULT`.

---

### Reto para el alumno: Insertar jugadores

Insertá al menos 5 jugadores con nombre, posición, dorsal y fecha de nacimiento.

Ejemplo:

```sql
INSERT INTO jugadores (nombre, posicion, dorsal, fecha_nacimiento)
VALUES ('Lionel Messi', 'DEL', 10, '1987-06-24');
```

Completá con los demás. No hace falta pasar `activo` porque `DEFAULT` lo pone en `TRUE`.

---

## 4. SELECT — Consultar datos

### Explicación

`SELECT` trae datos guardados. Podés pedir todas las columnas o solo algunas.

```sql
-- Todas las columnas
SELECT * FROM tabla;

-- Columnas específicas
SELECT columna1, columna2 FROM tabla;
```

---

### Demo del profe: Consultar equipos

```sql
-- Todos los equipos con todos sus datos
SELECT * FROM equipos;

-- Solo nombres y ranking
SELECT nombre, ranking_fifa FROM equipos;

-- Nombres con un alias más legible
SELECT nombre AS equipo, ranking_fifa AS ranking FROM equipos;
```

---

### Reto para el alumno: Consultar jugadores

1. Mostrar todos los jugadores con todas las columnas
2. Mostrar solo nombre, posición y dorsal
3. Mostrar nombre y fecha de nacimiento, renombrando la fecha como "nacimiento"

---

## 5. UPDATE — Actualizar datos

### Explicación

`UPDATE` modifica filas existentes. **Siempre** con `WHERE`, o se actualiza toda la tabla.

```sql
UPDATE tabla
SET columna1 = nuevo_valor
WHERE condicion;
```

---

### Demo del profe: Actualizar equipos

```sql
-- Argentina ganó el mundial, ranking #1
UPDATE equipos
SET ranking_fifa = 1
WHERE nombre = 'Argentina';

-- Subirle el ranking 3 puestos a todos los del grupo C
UPDATE equipos
SET ranking_fifa = ranking_fifa - 3
WHERE grupo = 'C';

-- Verificamos los cambios
SELECT nombre, ranking_fifa FROM equipos;
```

---

### Reto para el alumno: Actualizar jugadores

1. Cambiar el dorsal de un jugador
2. Marcar a un jugador como lesionado (`activo = FALSE`)
3. Actualizar la posición de un jugador (ej: de 'MED' a 'DEL')
4. Verificar los cambios con `SELECT`

---

## 6. DELETE — Eliminar datos

### Explicación

`DELETE` borra filas. **Siempre** con `WHERE`, o se borra toda la tabla.

```sql
DELETE FROM tabla WHERE condicion;
```

---

### Demo del profe: Eliminar equipos

```sql
-- Borrar un equipo específico
DELETE FROM equipos WHERE nombre = 'Marruecos';

-- Borrar equipos no clasificados (probemos)
DELETE FROM equipos WHERE clasificado = FALSE;

-- Verificamos
SELECT * FROM equipos;
```

⚠️ **NUNCA** ejecutes `DELETE FROM tabla;` sin WHERE — te cargás todo.

> **Aviso para la clase:** si borran Marruecos (`DELETE FROM equipos WHERE nombre = 'Marruecos'`), la sección 9 va a fallar al insertar partidos porque `local_id = 5` o `visitante_id = 5` ya no existen. Pueden skipear este DELETE o volver a insertar Marruecos después.

---

### Reto para el alumno: Eliminar jugadores

1. Borrar un jugador que se quedó fuera de la convocatoria
2. Verificar con `SELECT * FROM jugadores`

---

## 7. WHERE, ORDER BY, LIMIT — Filtrar y ordenar

### Explicación

`WHERE` filtra filas, `ORDER BY` las ordena, `LIMIT` corta la cantidad.

| Comando | Qué hace |
|---|---|
| `WHERE condicion` | Solo trae filas que cumplan la condición |
| `AND` | Las dos condiciones deben cumplirse |
| `OR` | Al menos una debe cumplirse |
| `ORDER BY columna ASC/DESC` | Ordena ascendente o descendente |
| `LIMIT n` | Trae solo n filas |

---

### Demo del profe: Filtrar equipos

```sql
-- Equipos de CONMEBOL
SELECT * FROM equipos WHERE confederacion = 'CONMEBOL';

-- Equipos del grupo F
SELECT * FROM equipos WHERE grupo = 'F';

-- Equipos de CONMEBOL del grupo F (AND)
SELECT * FROM equipos
WHERE confederacion = 'CONMEBOL'
AND grupo = 'F';

-- Equipos de UEFA o CAF (OR)
SELECT * FROM equipos
WHERE confederacion = 'UEFA'
OR confederacion = 'CAF';

-- Top 3 mejores ranking
SELECT nombre, ranking_fifa FROM equipos
ORDER BY ranking_fifa ASC
LIMIT 3;

-- Equipos ordenados por grupo y ranking
SELECT nombre, grupo, ranking_fifa FROM equipos
ORDER BY grupo ASC, ranking_fifa ASC;
```

---

### Reto para el alumno: Filtrar jugadores

1. Todos los delanteros (`'DEL'`)
2. Todos los arqueros (`'ARQ'`)
3. Jugadores con dorsal par (usá `dorsal % 2 = 0`)
4. Jugadores que sean defensas (`'DEF'`) **O** mediocampistas (`'MED'`)
5. Los 3 jugadores más jóvenes (ordená por `fecha_nacimiento DESC`)
6. El jugador con el dorsal más bajo (`ORDER BY dorsal ASC LIMIT 1`)

---

## 8. Funciones Básicas

### Explicación

Estas funciones **resumen** datos de una columna:

| Función | Qué devuelve |
|---|---|
| `COUNT(*)` | Cantidad de filas |
| `SUM(columna)` | Suma total |
| `AVG(columna)` | Promedio |
| `MIN(columna)` | Valor mínimo |
| `MAX(columna)` | Valor máximo |

Siempre se usan con `SELECT` y suelen combinarse con `GROUP BY` para agrupar.

---

### Demo del profe: Estadísticas de equipos

```sql
-- Cuántos equipos hay
SELECT COUNT(*) AS cantidad_equipos FROM equipos;

-- Cuántos equipos por confederación
SELECT confederacion, COUNT(*) AS cantidad
FROM equipos
GROUP BY confederacion;

-- Ranking promedio por confederación
SELECT confederacion, AVG(ranking_fifa) AS ranking_promedio
FROM equipos
GROUP BY confederacion;

-- Mejor y peor ranking
SELECT MIN(ranking_fifa) AS mejor_ranking FROM equipos;

-- Suma de rankings
SELECT SUM(ranking_fifa) FROM equipos;
```

---

### Reto para el alumno: Estadísticas de jugadores

1. ¿Cuántos jugadores hay en total?
2. ¿Cuántos jugadores hay por posición?
3. ¿Cuál es el dorsal más alto y el más bajo?

---

## 9. Foreign Keys — Relacionar tablas

### Explicación

Hasta ahora cada tabla vive sola. Pero en la realidad los datos se conectan: un equipo tiene muchos jugadores, un jugador pertenece a un equipo.

Una **Foreign Key (FK)** es una columna que apunta a la Primary Key de otra tabla. Su función es **garantizar que el valor exista** en la tabla referenciada.

```sql
columna INTEGER REFERENCES otra_tabla(columna)
```

---

### Demo del profe: Crear `partidos` con FK

Cada partido tiene un equipo local y un visitante. Ambos deben existir en `equipos`.

```sql
CREATE TABLE partidos (
    id SERIAL PRIMARY KEY,
    local_id INTEGER NOT NULL REFERENCES equipos(id),
    visitante_id INTEGER NOT NULL REFERENCES equipos(id),
    goles_local INTEGER DEFAULT 0,
    goles_visitante INTEGER DEFAULT 0,
    fase VARCHAR(30) NOT NULL,
    fecha TIMESTAMP
);
```

Insertemos partidos:

```sql
INSERT INTO partidos (local_id, visitante_id, goles_local, goles_visitante, fase, fecha)
VALUES
    (1, 3, 2, 1, 'Grupo C', '2026-06-15 16:00:00'),
    (2, 5, 3, 0, 'Grupo F', '2026-06-16 13:00:00'),
    (3, 4, 1, 1, 'Grupo B', '2026-06-17 19:00:00'),
    (5, 2, 0, 4, 'Grupo F', '2026-06-20 16:00:00'),
    (1, 4, 3, 0, 'Grupo C', '2026-06-22 16:00:00');
```

Verifiquemos:

```sql
SELECT * FROM partidos;
```

Probá la FK:

```sql
-- Esto debería dar error (no existe equipo con id = 99)
INSERT INTO partidos (local_id, visitante_id, goles_local, goles_visitante, fase)
VALUES (99, 1, 0, 0, 'Prueba');
```

---

### Reto para el alumno: Crear `goles` con FK

Creá una tabla `goles` que registre cada gol del mundial:

| Columna | Tipo | Detalle |
|---|---|---|
| id | SERIAL | Primary Key |
| partido_id | INTEGER | FK a `partidos(id)` |
| jugador_id | INTEGER | FK a `jugadores(id)` |
| minuto | INTEGER | Minuto del gol |
| es_penal | BOOLEAN | DEFAULT FALSE |

1. Escribí el `CREATE TABLE` con las Foreign Keys
2. Insertá al menos 6 goles repartidos en distintos partidos
3. Verificá con `SELECT * FROM goles`

---

## 10. JOIN

### Explicación

El JOIN resuelve un problema: los datos están en tablas separadas, pero **necesitamos verlos juntos**.

`INNER JOIN` combina filas de dos tablas donde la condición se cumple.

```sql
SELECT columnas
FROM tabla_a
INNER JOIN tabla_b ON tabla_a.id = tabla_b.foreign_key;
```

---

### Demo del profe: Partidos con nombres de equipos

Sin JOIN, `local_id = 1` no me dice nada. Necesito el nombre.

```sql
-- Partidos con nombre del local
SELECT
    p.id,
    e.nombre AS equipo_local,
    p.goles_local,
    p.goles_visitante,
    p.fase
FROM partidos p
INNER JOIN equipos e ON p.local_id = e.id;
```

Ahora con ambos equipos:

```sql
SELECT
    p.id,
    l.nombre AS local,
    p.goles_local,
    v.nombre AS visitante,
    p.goles_visitante,
    p.fase,
    p.fecha
FROM partidos p
INNER JOIN equipos l ON p.local_id = l.id
INNER JOIN equipos v ON p.visitante_id = v.id;
```

Más filtros:

```sql
-- Todos los partidos de Argentina
SELECT
    l.nombre AS local,
    p.goles_local,
    v.nombre AS visitante,
    p.goles_visitante,
    p.fase
FROM partidos p
INNER JOIN equipos l ON p.local_id = l.id
INNER JOIN equipos v ON p.visitante_id = v.id
WHERE l.nombre = 'Argentina' OR v.nombre = 'Argentina';
```

---

### Reto para el alumno: Goles con nombres

1. Mostrar todos los goles con el nombre del jugador y el minuto
2. Mostrar los goles con el nombre del jugador **y** contra qué equipo jugaba
   (pista: necesitás join contra `jugadores`, `partidos` y `equipos`)
3. Top 3 goleadores del torneo (contar cuántos goles hizo cada jugador, ordenar DESC, limitar a 3)
4. Mostrar todos los goles de penal (`es_penal = TRUE`) con nombre del jugador

---

## 11. Ejercicio Integrador — El Fixture del Mundial

Ahora combinan todo. Diseñen, creen y consulten su propio esquema.

### Parte A — Modelar (CREATE)

Crear una tabla `posiciones_por_grupo`:

| Columna | Tipo | Detalle |
|---|---|---|
| id | SERIAL | Primary Key |
| equipo_id | INTEGER | FK a `equipos(id)` |
| grupo | CHAR(1) | |
| pj | INTEGER | Partidos jugados |
| pg | INTEGER | Partidos ganados |
| pe | INTEGER | Partidos empatados |
| pp | INTEGER | Partidos perdidos |
| gf | INTEGER | Goles a favor |
| gc | INTEGER | Goles en contra |
| puntos | INTEGER | |

### Parte B — Poblar (INSERT)

Insertá datos para un grupo completo (4 equipos y sus partidos).

### Parte C — Consultas (SELECT)

Respondé con SQL:

1. Tabla de posiciones del Grupo C ordenada por puntos DESC
2. Todos los partidos que terminaron en empate
3. Goleador del torneo (jugador con más goles)
4. Equipo que más goles hizo como local
5. Promedio de goles por partido
6. Jugadores que NO hicieron goles (pista: `LEFT JOIN` + `WHERE ... IS NULL`)

---

## Cierre

Todo esto lo corriste en **Supabase**, que usa **PostgreSQL** bajo el capó. PostgreSQL es uno de los motores de base de datos más potentes del mundo y es gratis.

En la **Clase 2** vamos a conectar esta base de datos desde una app en React. Desde el frontend vamos a hacer consultas, inserts y más usando las APIs que Supabase nos da.

**Cosas que aprendiste hoy:**
- Qué es una base de datos relacional y cómo se diferencia de Excel
- Crear tablas con tipos de datos y Primary Keys
- CRUD completo: INSERT, SELECT, UPDATE, DELETE
- Filtrar con WHERE, AND, OR, ORDER BY, LIMIT
- Funciones de agregado: COUNT, SUM, AVG, MIN, MAX
- Foreign Keys para relacionar tablas
- INNER JOIN para cruzar tablas

Todo aplicado a un mundial. Porque aprender SQL con ejemplos de jugadores y goles es más divertido que con "clientes" y "pedidos".