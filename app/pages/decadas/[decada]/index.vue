<!-- app/pages/decadas/[decada]/index.vue -->
<script setup>
const route = useRoute()
const decadaNum = Number(route.params.decada)

if (!Number.isFinite(decadaNum) || decadaNum % 10 !== 0) {
  throw createError({ statusCode: 404, statusMessage: 'Década no encontrada' })
}

const { data: premiosData } = await useFetch('/api/comet/content/pulitzer-premios', {
  key: `decada-${decadaNum}`,
  query: { 'filter[decada]': decadaNum, sort: 'year', include: 'categoria' }
})

const premios = computed(() => {
  const items = premiosData.value?.data ?? []
  // Orden secundario por categoría, dentro de cada año, para agrupar visualmente.
  return [...items].sort((a, b) => a.data.year - b.data.year || a.data.categoria.title.localeCompare(b.data.categoria.title, 'es'))
})

if (!premios.value.length) {
  throw createError({ statusCode: 404, statusMessage: 'Década no encontrada' })
}

const { page, totalPages, pageItems, goToPage } = usePagination(premios, 20)
</script>

<template>
  <div>
    <HeaderView />

    <section class="container">
      <nav class="breadcrumbs" aria-label="Ruta de navegación">
        <NuxtLink to="/">Inicio</NuxtLink> <span>/</span>
        <NuxtLink to="/decadas">Décadas</NuxtLink> <span>/</span>
        <span>{{ decadaLabel(decadaNum) }}</span>
      </nav>

      <h1>Años {{ decadaLabel(decadaNum) }}</h1>
      <p class="section-lead">{{ premios.length }} premios otorgados durante esta década.</p>

      <ul class="prize-list">
        <PrizeListItem v-for="item in pageItems" :key="item.slug" :item="item" />
      </ul>

      <PaginationControls :page="page" :total-pages="totalPages" @goto="goToPage" />
    </section>

    <FooterView />
  </div>
</template>
