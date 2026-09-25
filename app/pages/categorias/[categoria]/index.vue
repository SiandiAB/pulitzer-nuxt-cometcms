<!-- app/pages/categorias/[categoria]/index.vue -->
<script setup>
const route = useRoute()
const slug = route.params.categoria

// La categoría se busca por su slug (identificador de URL); CometCMS acepta
// tanto el id opaco como el slug en /content/{coleccion}/{identifier}.
const { data: categoriaData } = await useFetch(`/api/comet/content/pulitzer-categorias/${slug}`, {
  key: `categoria-${slug}`
})
const categoria = computed(() => categoriaData.value?.data)

if (!categoria.value) {
  throw createError({ statusCode: 404, statusMessage: 'Categoría no encontrada' })
}

// El campo "categoria" de premios guarda el id de la categoría (llave
// foránea), pero el filtro de la API de CometCMS compara relaciones por el
// slug de la entrada relacionada, así que se filtra por categoria.value.slug.
const { data: premiosData } = await useFetch('/api/comet/content/pulitzer-premios', {
  key: `categoria-${slug}-premios`,
  query: { 'filter[categoria]': categoria.value.slug, sort: '-year' }
})
const premios = computed(() => premiosData.value?.data ?? [])

const { page, totalPages, pageItems, goToPage } = usePagination(premios, 20)
</script>

<template>
  <div>
    <HeaderView />

    <section class="container">
      <nav class="breadcrumbs" aria-label="Ruta de navegación">
        <NuxtLink to="/">Inicio</NuxtLink> <span>/</span>
        <NuxtLink to="/categorias">Categorías</NuxtLink> <span>/</span>
        <span>{{ categoria.title }}</span>
      </nav>

      <h1>{{ categoria.title }}</h1>
      <p class="section-lead">
        {{ categoria.data.descripcion }}
        {{ premios?.length || 0 }} premios registrados en esta categoría.
      </p>

      <ul class="prize-list">
        <PrizeListItem v-for="item in pageItems" :key="item.slug" :item="item" :mostrar-categoria="false" />
      </ul>

      <p v-if="!premios?.length" class="empty-state">No hay registros para esta categoría.</p>

      <PaginationControls :page="page" :total-pages="totalPages" @goto="goToPage" />
    </section>

    <FooterView />
  </div>
</template>
