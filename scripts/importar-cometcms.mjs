// scripts/importar-cometcms.mjs
// Carga automáticamente data/categorias.csv y data/muestra-premios.csv al
// espacio de CometCMS usando el API de escritura (POST .../content/{tipo}).
//
// Es OPCIONAL: los registros también se pueden crear a mano en el panel de
// administración. Este script sólo evita tipear ~45 entradas.
//
// Requisitos antes de correrlo:
//   1. Los content types "categorias" y "premios" ya deben existir en el
//      panel (creados a mano, con los campos descritos en el README).
//   2. Se necesita un token de administración TEMPORAL con permisos
//      content.create y content.publish sobre content:categorias:* y
//      content:premios:* (además de content.read, o cree uno aparte).
//      No es el mismo token de sólo lectura que usa el sitio en producción;
//      revóquelo desde el panel al terminar la importación.
//
// Uso:
//   COMET_URL=https://cms-una.gt.tc \
//   COMET_WORKSPACE=default \
//   COMET_ADMIN_TOKEN=ctcms_xxxxx \
//   node scripts/importar-cometcms.mjs

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const COMET_URL = process.env.COMET_URL
const COMET_WORKSPACE = process.env.COMET_WORKSPACE || 'default'
const COMET_ADMIN_TOKEN = process.env.COMET_ADMIN_TOKEN

if (!COMET_URL || !COMET_ADMIN_TOKEN) {
  console.error('Defina COMET_URL y COMET_ADMIN_TOKEN como variables de entorno antes de correr este script.')
  process.exit(1)
}

const baseUrl = `${COMET_URL.replace(/\/$/, '')}/api/v1/workspaces/${COMET_WORKSPACE}/content`

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n') {
      row.push(field); field = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else if (c !== '\r') {
      field += c
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

function readCsvAsObjects(path) {
  const [header, ...rows] = parseCsv(readFileSync(path, 'utf8'))
  return rows.map(r => Object.fromEntries(header.map((h, i) => [h, r[i]])))
}

async function crearEntrada(coleccion, body) {
  const res = await fetch(`${baseUrl}/${coleccion}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${COMET_ADMIN_TOKEN}`
    },
    body: JSON.stringify(body)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`${coleccion}/${body.slug}: ${json.error?.message || res.statusText}`)
  return json.data
}

async function main() {
  const categorias = readCsvAsObjects(join(root, 'data/categorias.csv'))
  const premios = readCsvAsObjects(join(root, 'data/muestra-premios.csv'))

  console.log(`Creando ${categorias.length} categorías...`)
  const idPorSlug = {}
  for (const c of categorias) {
    const entrada = await crearEntrada('categorias', {
      slug: c.slug,
      status: 'published',
      nombre: c.nombre,
      division: c.division,
      descripcion: c.descripcion
    })
    idPorSlug[c.slug] = entrada.id
    console.log(`  ✓ ${c.slug} -> ${entrada.id}`)
  }

  console.log(`Creando ${premios.length} premios...`)
  let ok = 0
  for (const p of premios) {
    const categoriaId = idPorSlug[p.categoria_slug]
    if (!categoriaId) {
      console.warn(`  ✗ ${p.slug}: categoría "${p.categoria_slug}" no encontrada, se omite.`)
      continue
    }
    try {
      await crearEntrada('premios', {
        slug: p.slug,
        status: 'published',
        obra: p.obra,
        autor: p.autor,
        year: Number(p.year),
        decada: Number(p.decada),
        categoria: categoriaId
      })
      ok++
      console.log(`  ✓ ${p.slug}`)
    } catch (err) {
      console.warn(`  ✗ ${p.slug}: ${err.message}`)
    }
  }

  console.log(`Listo: ${ok}/${premios.length} premios creados.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
