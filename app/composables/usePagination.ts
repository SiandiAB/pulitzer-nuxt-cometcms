// app/composables/usePagination.ts
// Paginación reutilizable para las páginas de listado (categoría, década y
// el listado completo con búsqueda). La página actual vive en la URL
// (?pagina=N) para que cada página de resultados sea enlazable directamente.
// Nuxt auto-importa cualquier función colocada en app/composables.

import type { Ref } from 'vue'

export function usePagination<T>(items: Ref<T[] | null | undefined>, perPage = 20) {
  const route = useRoute()
  const router = useRouter()

  const page = computed(() => {
    const raw = Number(route.query.pagina)
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1
  })

  const totalPages = computed(() => {
    const total = items.value?.length ?? 0
    return Math.max(1, Math.ceil(total / perPage))
  })

  // Si una búsqueda o filtro reduce los resultados y la página actual queda
  // fuera de rango, se recalcula silenciosamente a la última página válida.
  const paginaActual = computed(() => Math.min(page.value, totalPages.value))

  const pageItems = computed(() => {
    const start = (paginaActual.value - 1) * perPage
    return (items.value ?? []).slice(start, start + perPage)
  })

  function goToPage(n: number) {
    const destino = Math.min(Math.max(1, n), totalPages.value)
    router.push({
      query: { ...route.query, pagina: destino === 1 ? undefined : String(destino) }
    })
  }

  return { page: paginaActual, totalPages, pageItems, goToPage }
}
