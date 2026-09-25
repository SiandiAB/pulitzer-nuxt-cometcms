# Premios Pulitzer — Explorador de datos (Nuxt + CometCMS)

**Sitio publicado:** https://pulitzer-prizes-nuxt.netlify.app

**Proyecto 1 / Tarea 3** — EIF-511 Arquitectura de Información
**Estudiante:** Siandi Araya Bello — 118870991

Sitio construido con **Nuxt 4** que permite navegar, buscar y paginar un
dataset de los **Premios Pulitzer** (categorías de Letras y Teatro,
1917–2024). El contenido (categorías y premios) ya no vive dentro del
proyecto: se administra en un espacio propio del CMS headless **CometCMS**
(http://cms-una.gt.tc) y la aplicación lo consume en tiempo de ejecución a
través de su API REST.

## El dataset

- Dataset completo de referencia: [`data/pulitzer.csv`](data/pulitzer.csv) —
  582 registros, 7 categorías (Ficción, Teatro, Historia, Biografía o
  Autobiografía, Memorias, No Ficción General, Poesía), años 1917–2024.
  Origen: [github.com/terrykimura/pulitzer](https://github.com/terrykimura/pulitzer)
  (a su vez extraído de la API oficial de [pulitzer.org](https://www.pulitzer.org)).
- Para la Tarea 3 se incorporó a CometCMS una **muestra representativa**
  (no el dataset completo) generada con
  [`scripts/preparar-datos-cometcms.mjs`](scripts/preparar-datos-cometcms.mjs):
  - [`data/categorias.csv`](data/categorias.csv) — las 7 categorías completas.
  - [`data/muestra-premios.csv`](data/muestra-premios.csv) — 38 premios,
    con al menos una categoría por década disponible, suficientes para
    probar cada página del sitio (listados, filtros, detalle, navegación
    anterior/siguiente).

> **Estado del contenido (verificación 2026-09-24):** en el workspace de
> CometCMS hay **10 premios publicados** (7 de 2024 + 3 de 2008, en todas
> las categorías) y las 7 categorías. El resto de la muestra quedó como
> pendiente de cargar/publicar en el CMS; el sitio funciona completo con
> los datos que haya publicados.

## Modelo de contenido en CometCMS

El curso asigna un **workspace propio** por estudiante (no se elige el
nombre): el de este proyecto es `premios-pulitzer`, visible en
`https://cms-una.gt.tc/admin/api-explorer`. Dentro de ese workspace se
crearon dos content types, enlazados por una relación (llave foránea).
Cada entrada tiene además un **Title** y un **Slug** que CometCMS agrega
automáticamente a todo content type (no hace falta declararlos como campo).

**`pulitzer-categorias`**

| Campo | Tipo | Notas |
| --- | --- | --- |
| Title | (automático) | El nombre de la categoría, p. ej. "Ficción". |
| Slug | (automático, manual) | `ficcion`, `teatro`, `historia`, `biografia`, `memorias`, `no-ficcion-general`, `poesia` — coincide con las rutas `/categorias/[categoria]`. |
| `division` | select | Opciones: `Letras`, `Teatro`. Requerido. |
| `descripcion` | textarea | Requerido. |

**`pulitzer-premios`**

| Campo | Tipo | Notas |
| --- | --- | --- |
| Title | (automático) | El nombre de la obra, p. ej. "King: A Life". |
| Slug | (automático, manual) | El `codigo` del CSV original (p. ej. `biografia-2024`) — coincide con la ruta `/premios/[codigo]`. |
| `autor` | text | Requerido. |
| `year` | number | Requerido. |
| `decada` | number | Requerido (p. ej. `2020`); se usa para filtrar por década. |
| `categoria` | relation | Target: `pulitzer-categorias`, no múltiple. **Llave foránea.** |

Cada entrada debe quedar en estado **Published** (no `draft`).

### Sin token de API

En el espacio del curso, las cuentas de estudiante **no tienen acceso a
"Access Tokens"** ni a marcar un content type como Private (esas opciones
no aparecen en el panel). El `API Explorer` del propio CometCMS lo
confirma: *"Public reads work without authorization and return public
content only"*. Por eso `NUXT_COMET_API_TOKEN` queda **vacío**: la ruta de
servidor (`server/api/comet/[...path].ts`) sólo agrega el encabezado
`Authorization` cuando ese valor no está vacío, así que el mismo código
serviría sin cambios si en el futuro el workspace pasara a ser privado.

## Cargar el contenido de muestra

A mano, desde el panel de CometCMS (**New entry** en cada content type):
7 categorías + al menos un premio por categoría. Los valores completos
(listos para copiar/pegar) están en `data/categorias.csv` y
`data/muestra-premios.csv`, generados con
[`scripts/preparar-datos-cometcms.mjs`](scripts/preparar-datos-cometcms.mjs).

`scripts/importar-cometcms.mjs` (carga por API en vez de a mano) **no se
pudo usar** en este workspace: requiere un token con permiso
`content.create`, y las cuentas de estudiante no pueden generar tokens
aquí. Se deja en el repositorio como referencia por si el profesor
habilita esa opción.

## Arquitectura: cómo la app consume CometCMS

- `nuxt.config.ts` declara `runtimeConfig.cometApiToken`, `cometUrl` y
  `cometWorkspace`, sobrescribibles con variables de entorno
  `NUXT_COMET_*` (ver [`.env.example`](.env.example)).
- `server/api/comet/[...path].ts` es la única ruta de servidor: reenvía
  cualquier petición a `/api/comet/content/...` hacia el API de CometCMS,
  agregando el encabezado `Authorization: Bearer <token>` y los parámetros
  de consulta (`filter[...]`, `include`, `sort`) tal como llegaron. El
  token nunca se envía al navegador — puede verificarse en la pestaña Red
  del navegador que las peticiones del cliente no incluyen `Authorization`.
- Cada página pide su contenido con `useFetch('/api/comet/content/...')`
  en vez de `queryCollection()`. El detalle de un premio usa
  `?include=categoria` para traer la categoría relacionada completa en una
  sola petición; los listados por categoría o década usan
  `filter[categoria]=<slug>` / `filter[decada]=<numero>`.

  Tres particularidades del API de CometCMS que el proxy resuelve:

  - **Desafío anti-bot:** el CMS responde a clientes sin cookie válida con
    un desafío JavaScript (aes.js/slowAES). El navegador lo resuelve solo,
    pero Node no ejecuta JavaScript: por eso `server/api/comet/[...path].ts`
    descifra el desafío con `node:crypto` (AES-128-CBC), guarda la cookie
    `__test` resultante (~6 h de validez) y reintenta con `?i=1`, igual que
    un navegador. También limita a 350 ms el intervalo mínimo entre
    peticiones y cachea respuestas 60 s para no disparar el error 429 del
    CMS (que bloquea la IP por "scanning").
  - **Filtro de relaciones por slug:** `filter[categoria]` compara contra el
    *slug* de la categoría relacionada (`filter[categoria]=teatro`), **no**
    contra su id (`filter[categoria]=Zg0su…` devuelve 0 resultados). Por eso
    las páginas de categoría y de detalle filtran con `categoria.slug`.
  - **Paginación por defecto:** sin `limit`, el API devuelve solo 10
    registros. El proxy agrega `limit=100` cuando la página no lo pide.

## Esquema de organización / jerarquía de navegación

Un premio anual tiene dos ejes de clasificación naturales: la **categoría**
en que se otorga y el **momento en el tiempo** en que se otorgó. El sitio
ofrece ambas jerarquías, más acceso directo por búsqueda:

- **Por categoría** — `/categorias` → `/categorias/[categoria]`
- **Por década** — `/decadas` → `/decadas/[decada]`
- **Todos los premios** — `/premios`: listado completo con búsqueda de texto
  (autor, obra, categoría o año) y filtro por categoría.
- **Detalle de un premio** — `/premios/[codigo]`: ficha con año, categoría,
  división y década, navegación al año anterior/siguiente dentro de la misma
  categoría, y una muestra de premios relacionados.

Todos los listados están **paginados** (20 registros por página, con el
número de página reflejado en la URL para poder compartir un enlace directo).

## Estructura del proyecto

```
pulitzer-nuxt/
├── app/
│   ├── app.vue
│   ├── error.vue
│   ├── assets/css/main.css        # hoja de estilos propia (sin frameworks externos)
│   ├── components/
│   │   ├── HeaderView.vue
│   │   ├── FooterView.vue
│   │   ├── PrizeListItem.vue
│   │   └── PaginationControls.vue
│   ├── composables/
│   │   └── usePagination.ts       # paginación reutilizable, sincronizada con la URL
│   ├── utils/
│   │   └── catalogo.ts            # decadaLabel() (el catálogo de categorías ahora vive en CometCMS)
│   └── pages/
│       ├── index.vue              # inicio
│       ├── acerca.vue
│       ├── categorias/index.vue
│       ├── categorias/[categoria]/index.vue
│       ├── decadas/index.vue
│       ├── decadas/[decada]/index.vue
│       └── premios/
│           ├── index.vue          # listado completo + búsqueda + filtro
│           └── [codigo].vue       # detalle de un premio
├── server/
│   └── api/comet/[...path].ts     # proxy autenticado hacia el API de CometCMS
├── data/
│   ├── pulitzer.csv               # dataset completo (582 registros, referencia)
│   ├── categorias.csv             # 7 categorías, listas para CometCMS
│   └── muestra-premios.csv        # muestra de premios, lista para CometCMS
├── scripts/
│   ├── preparar-datos-cometcms.mjs
│   └── importar-cometcms.mjs
├── public/
│   └── favicon.svg
├── nuxt.config.ts                 # runtimeConfig con las credenciales de CometCMS
├── .env.example
├── netlify.toml                   # fija el build (npm run generate → dist, preset netlify-static)
├── package.json
└── package-lock.json
```

## Cómo correr el proyecto localmente

> **Nota sobre la versión de Node:** a la fecha, Nuxt 4.5 / Nitro 2.13 (las
> versiones más recientes publicadas) chocan con un bug de **Node.js 24** al
> resolver `@rollup/pluginutils` (`ERR_REQUIRE_CYCLE_MODULE` /
> `does not provide an export named 'attachScopes'`), que impide correr
> `npm run dev`, `npm run build` o incluso `npm install` (falla en el
> `postinstall`). Use **Node 22 LTS** — hay un [`.nvmrc`](.nvmrc) con `22`
> (`nvm use`), y `netlify.toml` ya fija `NODE_VERSION=22` para el build.

```bash
npm install
cp .env.example .env   # completar con los datos del espacio en cms-una.gt.tc
npm run dev
```

La aplicación corre en `http://localhost:3000`.

## Despliegue en Netlify

Dado que el contenido ahora vive en un servidor externo (CometCMS), hay que
decidir cuándo se refleja un cambio publicado en el CMS:

- `npm run generate` (usado por `netlify.toml`): pre-renderiza el sitio en
  el momento del build — más rápido de servir, pero para reflejar cambios
  del CMS hay que volver a compilar (por ejemplo disparando un rebuild en
  Netlify desde un *webhook* de CometCMS). En Netlify el preset es
  `netlify-static` y el sitio se genera en `dist/` (localmente en
  `.output/public`), por eso `netlify.toml` publica `dist`.
- `npm run build`: renderiza cada página en cada petición a través de las
  rutas de servidor de Nitro — siempre al día, a costa de una respuesta
  algo más lenta. Requiere cambiar el `publish`/adaptador de Netlify para
  SSR en vez de sitio estático.

En cualquiera de los dos casos, deben definirse en **Site settings →
Environment variables** de Netlify (el `.env` local no se sube al
repositorio):

- `NUXT_COMET_API_TOKEN`
- `NUXT_COMET_URL`
- `NUXT_COMET_WORKSPACE`

```bash
npm run generate
netlify deploy --prod --dir=.output/public
```

---
Siandi Araya Bello — 118870991 — Proyecto 1 / Tarea 3, EIF-511 Arquitectura de Información.
Copyright © 2026.
