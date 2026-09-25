// server/api/comet/[...path].ts
import { createDecipheriv } from 'node:crypto'

// Única ruta de servidor que reenvía cualquier llamada al API de CometCMS y
// reenvía los parámetros de consulta (filter[...], include, sort, etc.) tal
// como llegaron. Si se configura NUXT_COMET_API_TOKEN, se agrega como
// Authorization (el token nunca se envía al navegador, sólo vive aquí, en
// el servidor de Nuxt — ver Tutorial 6 - CometCMS con Nuxt). En el espacio
// del curso los content types son de lectura pública para estudiantes, así
// que el token es opcional: sin él, la petición igual funciona.
//
// Dos detalles de integración que aquí se resuelven:
//
// 1) El catch-all ya incluye el segmento "content/": las páginas llaman
//    /api/comet/content/... y el path del enrutador es "content/...", así
//    que NO se antepone /content de nuevo al armar la URL del CMS.
//
// 2) El CMS sirve su API detrás de un desafío anti-bot de JavaScript (el
//    clásico aes.js de "slowAES"): a quien llega sin cookie válida le
//    devuelve HTML con una clave AES-128-CBC que el navegador descifra,
//    guarda en la cookie __test y reintenta (location.href = url + "?i=1").
//    Como este proxy corre en Node y no ejecuta JavaScript, se descifra el
//    desafío aquí con node:crypto. La cookie vale ~6 horas (max-age del
//    propio CMS) y se reutiliza en las peticiones siguientes.
//
// Además se pide limit=100 por defecto (CometCMS pagina a 10 por defecto y
// los listados del sitio necesitan el dataset completo), y se agregan una
// caché breve y un intervalo mínimo entre peticiones para no sobrepasar el
// límite de peticiones del CMS (error 429 por "scanning").

const CMS_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

// ---------- Desafío anti-bot (cookie __test) --------------------------------

let desafio: { cookie: string; expiraEn: number } | null = null

function descifrarDesafio(html: string): string | null {
  const m = html.match(
    /toNumbers\("([0-9a-f]+)"\),b=toNumbers\("([0-9a-f]+)"\),c=toNumbers\("([0-9a-f]+)"\)/
  )
  if (!m) return null
  const [, keyHex, ivHex, cipherHex] = m
  try {
    // slowAES.decrypt(c, 2, a, b): modo 2 = CBC, sin padding (un solo bloque).
    const decipher = createDecipheriv('aes-128-cbc', Buffer.from(keyHex, 'hex'), Buffer.from(ivHex, 'hex'))
    decipher.setAutoPadding(false)
    return Buffer.concat([decipher.update(Buffer.from(cipherHex, 'hex')), decipher.final()]).toString('hex')
  } catch {
    return null
  }
}

// ---------- Intervalo mínimo entre peticiones al CMS (anti-429) -------------

const INTERVALO_MINIMO_MS = 350
let cola: Promise<void> = Promise.resolve()
let ultimaPeticion = 0

function conIntervalo<T>(fn: () => Promise<T>): Promise<T> {
  const tarea = cola.then(async () => {
    const restante = ultimaPeticion + INTERVALO_MINIMO_MS - Date.now()
    if (restante > 0) await new Promise(resolve => setTimeout(resolve, restante))
    const resultado = await fn()
    ultimaPeticion = Date.now()
    return resultado
  })
  cola = tarea.then(() => {}, () => {})
  return tarea
}

// ---------- Caché breve de respuestas ---------------------------------------

const TTL_CACHE_MS = 60_000
const cache = new Map<string, { hasta: number; status: number; contentType: string; body: string }>()

function guardarEnCache(clave: string, respuesta: { status: number; contentType: string; body: string }) {
  if (cache.size > 400) cache.clear()
  cache.set(clave, { hasta: Date.now() + TTL_CACHE_MS, ...respuesta })
}

// ---------- Petición al CMS con reintento tras resolver el desafío ----------

async function pedirAlCms(url: string, headers: Record<string, string>): Promise<Response> {
  let cookie = desafio && desafio.expiraEn > Date.now() ? desafio.cookie : null
  let urlActual = url

  // Máximo 2 intentos: el segundo es el reintento con la cookie ya resuelta,
  // replicando lo que hace el navegador (misma URL + "?i=1").
  for (let intento = 0; intento < 2; intento++) {
    const cabeceras = { ...headers }
    if (cookie) cabeceras.Cookie = `__test=${cookie}`

    const res = await fetch(urlActual, { headers: cabeceras })

    // Un 429 (límite de peticiones) NO se reintenta: devolver tal cual para
    // no agravar el bloqueo.
    if (res.status === 429) return res

    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) return res

    const texto = await res.text()
    if (texto.includes('toNumbers(') && texto.includes('__test')) {
      const nueva = descifrarDesafio(texto)
      if (!nueva) return res
      cookie = nueva
      desafio = { cookie: nueva, expiraEn: Date.now() + 5.5 * 60 * 60 * 1000 }
      urlActual = `${url}${url.includes('?') ? '&' : '?'}i=1`
      continue
    }

    // Otro contenido no-JSON (página de error del CMS, etc.): devolverlo.
    return new Response(texto, { status: res.status, headers: { 'content-type': contentType } })
  }

  throw createError({ statusCode: 502, statusMessage: 'No se pudo superar el desafío anti-bot del CMS' })
}

// ---------- Manejador de la ruta --------------------------------------------

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  const config = useRuntimeConfig()

  const query = getQuery(event)
  const params = new URLSearchParams()
  for (const [clave, valor] of Object.entries(query)) {
    if (valor === undefined || valor === null) continue
    params.append(clave, Array.isArray(valor) ? valor.join(',') : String(valor))
  }
  // CometCMS pagina por defecto a 10 registros; los listados del sitio
  // necesitan el dataset completo.
  if (!params.has('limit')) params.set('limit', '100')

  // El path del catch-all ya incluye "content/" (p. ej. "content/pulitzer-premios").
  const url = `${config.cometUrl}/api/v1/workspaces/${config.cometWorkspace}/${path}?${params.toString()}`

  const enCache = cache.get(url)
  if (enCache && enCache.hasta > Date.now()) {
    return new Response(enCache.body, {
      status: enCache.status,
      headers: { 'content-type': enCache.contentType }
    })
  }

  const headers: Record<string, string> = { 'User-Agent': CMS_USER_AGENT, Accept: 'application/json' }
  if (config.cometApiToken) headers.Authorization = `Bearer ${config.cometApiToken}`

  const res = await conIntervalo(() => pedirAlCms(url, headers))
  const body = await res.text()
  const contentType = res.headers.get('content-type') ?? 'application/json'

  if (res.ok && contentType.includes('application/json')) {
    guardarEnCache(url, { status: res.status, contentType, body })
  }

  return new Response(body, { status: res.status, headers: { 'content-type': contentType } })
})
