// app/utils/catalogo.ts
// Utilidades pequeñas compartidas por varias páginas. El catálogo de
// categorías ya no es estático: vive en el content type "categorias" de
// CometCMS y se consulta con useFetch en cada página que lo necesita.
// Nuxt auto-importa cualquier función colocada en app/utils.

export function decadaLabel(decada: number): string {
  return `${decada}s`
}
