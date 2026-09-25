// scripts/preparar-datos-cometcms.mjs
// Genera, a partir de data/pulitzer.csv (el dataset completo del Proyecto 1),
// los dos archivos que se usan para poblar CometCMS:
//   - data/categorias.csv   -> las 7 categorías completas
//   - data/muestra-premios.csv -> una muestra representativa de premios
//     (varias décadas y las 7 categorías), suficiente para probar cada
//     página del sitio sin tener que cargar los 582 registros a mano.
//
// Uso: node scripts/preparar-datos-cometcms.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const CATEGORIAS = [
  { slug: 'ficcion', nombre: 'Ficción', division: 'Letras', descripcion: 'Novela estadounidense (llamada "Novel" hasta 1947 y "Fiction" desde 1948).' },
  { slug: 'teatro', nombre: 'Teatro', division: 'Teatro', descripcion: 'Obras de teatro estrenadas en Estados Unidos.' },
  { slug: 'historia', nombre: 'Historia', division: 'Letras', descripcion: 'Libros de historia sobre Estados Unidos.' },
  { slug: 'biografia', nombre: 'Biografía o Autobiografía', division: 'Letras', descripcion: 'Biografías y autobiografías distinguidas.' },
  { slug: 'memorias', nombre: 'Memorias', division: 'Letras', descripcion: 'Categoría separada de Memorias o Vida Personal, creada en 2023.' },
  { slug: 'no-ficcion-general', nombre: 'No Ficción General', division: 'Letras', descripcion: 'Libros de no ficción que no encajan en otras categorías de Letras.' },
  { slug: 'poesia', nombre: 'Poesía', division: 'Letras', descripcion: 'Libros de poesía originales de un autor estadounidense.' }
]

// --- parseo mínimo de CSV con comillas (soporta comas y comillas dentro de campos) ---
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

function toCsvField(value) {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(rows) {
  return rows.map(r => r.map(toCsvField).join(',')).join('\n') + '\n'
}

const raw = readFileSync(join(root, 'data/pulitzer.csv'), 'utf8')
const [header, ...rows] = parseCsv(raw)
const idx = Object.fromEntries(header.map((h, i) => [h, i]))

const premios = rows.map(r => ({
  codigo: r[idx.codigo],
  year: Number(r[idx.year]),
  decada: Number(r[idx.decada]),
  categoria_slug: r[idx.categoria_slug],
  autor: r[idx.autor],
  obra: r[idx.obra]
}))

// Muestra: hasta 2 registros por categoría y década (recorriendo las décadas
// disponibles de más reciente a más antigua), con un tope de 6 por categoría,
// para cubrir las 7 categorías en varios puntos de la línea de tiempo.
const muestra = []
for (const cat of CATEGORIAS) {
  const deCategoria = premios
    .filter(p => p.categoria_slug === cat.slug)
    .sort((a, b) => b.year - a.year)

  const porDecada = new Map()
  for (const p of deCategoria) {
    const lista = porDecada.get(p.decada) ?? []
    if (lista.length < 2) { lista.push(p); porDecada.set(p.decada, lista) }
  }

  const elegidos = [...porDecada.values()].flat().slice(0, 6)
  muestra.push(...elegidos)
}
muestra.sort((a, b) => b.year - a.year || a.categoria_slug.localeCompare(b.categoria_slug))

writeFileSync(
  join(root, 'data/categorias.csv'),
  toCsv([['slug', 'nombre', 'division', 'descripcion'], ...CATEGORIAS.map(c => [c.slug, c.nombre, c.division, c.descripcion])])
)

writeFileSync(
  join(root, 'data/muestra-premios.csv'),
  toCsv([
    ['slug', 'obra', 'autor', 'year', 'decada', 'categoria_slug'],
    ...muestra.map(p => [p.codigo, p.obra, p.autor, p.year, p.decada, p.categoria_slug])
  ])
)

console.log(`data/categorias.csv escrito (${CATEGORIAS.length} filas).`)
console.log(`data/muestra-premios.csv escrito (${muestra.length} filas, ${premios.length} disponibles en total).`)
