<!-- app/pages/premios/index.vue -->
<script setup>
useHead({ title: 'Todos los premios' })

const route = useRoute()
const router = useRouter()

const { data: premiosData } = await useFetch('/api/comet/content/pulitzer-premios', {
  query: { sort: '-year', include: 'categoria' }
})
const { data: categoriasData } = await useFetch('/api/comet/content/pulitzer-categorias')

const todos = computed(() => premiosData.value?.data ?? [])
const CATEGORIAS = computed(() => categoriasData.value?.data ?? [])

const busqueda = ref(typeof route.query.q === 'string' ? route.query.q : '')
const categoriaFiltro = ref(typeof route.query.categoria === 'string' ? route.query.categoria : 'todas')

const resultados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return todos.value.filter(item => {
    if (categoriaFiltro.value !== 'todas' && item.data.categoria?.slug !== categoriaFiltro.value) return false
    if (!q) return true
    return (
      item.title.toLowerCase().includes(q) ||
      item.data.autor.toLowerCase().includes(q) ||
      (item.data.categoria?.title ?? '').toLowerCase().includes(q) ||
      String(item.data.year).includes(q)
    )
  })
})

const { page, totalPages, pageItems, goToPage } = usePagination(resultados, 20)

// Mantiene la búsqueda y el filtro en la URL (para poder compartir el enlace)
// y regresa a la primera página cada vez que cambian.
watch([busqueda, categoriaFiltro], () => {
  router.replace({
    query: {
      q: busqueda.value.trim() || undefined,
      categoria: categoriaFiltro.value !== 'todas' ? categoriaFiltro.value : undefined
    }
  })
})
</script>

<template>
  <div>
    <HeaderView />

    <section class="container">
      <nav class="breadcrumbs" aria-label="Ruta de navegación">
        <NuxtLink to="/">Inicio</NuxtLink> <span>/</span> <span>Todos los premios</span>
      </nav>

      <h1>Todos los premios</h1>
      <p class="section-lead">
        Listado completo del dataset ({{ todos?.length || 0 }} registros). Use la búsqueda
        o el filtro por categoría para reducir los resultados.
      </p>

      <div class="filter-bar">
        <input
          v-model="busqueda"
          type="search"
          autocomplete="off"
          placeholder="Buscar por autor, obra, categoría o año…"
          aria-label="Buscar premios"
        />
        <select v-model="categoriaFiltro" aria-label="Filtrar por categoría">
          <option value="todas">Todas las categorías</option>
          <option v-for="c in CATEGORIAS" :key="c.slug" :value="c.slug">{{ c.title }}</option>
        </select>
      </div>

      <p class="results-count">{{ resultados.length }} resultado(s)</p>

      <ul v-if="pageItems.length" class="prize-list">
        <PrizeListItem v-for="item in pageItems" :key="item.slug" :item="item" />
      </ul>
      <p v-else class="empty-state">No se encontraron premios que coincidan con la búsqueda.</p>

      <PaginationControls :page="page" :total-pages="totalPages" @goto="goToPage" />
    </section>

    <FooterView />
  </div>
</template>
