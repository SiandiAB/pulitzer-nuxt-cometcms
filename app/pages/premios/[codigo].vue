<!-- app/pages/premios/[codigo].vue -->
<script setup>
const route = useRoute()

// El parámetro de ruta [codigo] es directamente el slug de la entrada en
// CometCMS (p. ej. "biografia-2024"), así que se pide por id/slug tal como
// hace el Tutorial 6 con /content/books/{id}. include=categoria trae el
// objeto completo de la categoría relacionada en una sola petición.
const { data: premioData } = await useFetch(`/api/comet/content/pulitzer-premios/${route.params.codigo}`, {
  key: route.path,
  query: { include: 'categoria' }
})
const premio = computed(() => premioData.value?.data)

if (!premio.value) {
  throw createError({ statusCode: 404, statusMessage: 'Premio no encontrado' })
}

useHead({ title: `${premio.value.title} (${premio.value.data.year})` })

// Se recupera una sola vez toda la categoría (ordenada por año descendente)
// para derivar, sin consultas adicionales: el registro anterior/siguiente en
// el tiempo y una muestra de "premios relacionados" de la misma categoría.
// El filtro de relaciones de la API de CometCMS compara por el slug de la
// entrada relacionada (no por su id), así que se usa categoria.slug.
const { data: categoriaItemsData } = await useFetch('/api/comet/content/pulitzer-premios', {
  key: `${route.path}-categoria`,
  query: { 'filter[categoria]': premio.value.data.categoria.slug, sort: '-year' }
})
const categoriaItems = computed(() => categoriaItemsData.value?.data ?? [])

const indiceActual = computed(() =>
  categoriaItems.value.findIndex(item => item.slug === premio.value.slug)
)

// La lista está ordenada de más reciente a más antigua: el índice siguiente
// corresponde a un año anterior, y el índice previo a un año posterior.
const anioAnterior = computed(() => {
  const lista = categoriaItems.value
  const idx = indiceActual.value
  return idx >= 0 && idx < lista.length - 1 ? lista[idx + 1] : null
})

const anioSiguiente = computed(() => {
  const lista = categoriaItems.value
  const idx = indiceActual.value
  return idx > 0 ? lista[idx - 1] : null
})

const relacionados = computed(() =>
  categoriaItems.value.filter(item => item.slug !== premio.value.slug).slice(0, 6)
)
</script>

<template>
  <div>
    <HeaderView />

    <article class="container prize-detail">
      <nav class="breadcrumbs" aria-label="Ruta de navegación">
        <NuxtLink to="/">Inicio</NuxtLink> <span>/</span>
        <NuxtLink to="/categorias">Categorías</NuxtLink> <span>/</span>
        <NuxtLink :to="`/categorias/${premio.data.categoria.slug}`">{{ premio.data.categoria.title }}</NuxtLink>
        <span>/</span>
        <span>{{ premio.data.year }}</span>
      </nav>

      <span class="badge" :data-division="premio.data.categoria.data.division">{{ premio.data.categoria.title }}</span>
      <h1>{{ premio.title }}</h1>
      <p class="prize-detail-autor">por {{ premio.data.autor }}</p>

      <dl class="prize-detail-meta">
        <div>
          <dt>Año</dt>
          <dd>{{ premio.data.year }}</dd>
        </div>
        <div>
          <dt>Categoría</dt>
          <dd><NuxtLink :to="`/categorias/${premio.data.categoria.slug}`">{{ premio.data.categoria.title }}</NuxtLink></dd>
        </div>
        <div>
          <dt>División</dt>
          <dd>{{ premio.data.categoria.data.division }}</dd>
        </div>
        <div>
          <dt>Década</dt>
          <dd><NuxtLink :to="`/decadas/${premio.data.decada}`">{{ decadaLabel(premio.data.decada) }}</NuxtLink></dd>
        </div>
      </dl>

      <nav class="prize-prevnext" aria-label="Navegación cronológica dentro de la categoría">
        <NuxtLink v-if="anioAnterior" :to="`/premios/${anioAnterior.slug}`" class="prevnext-link">
          <span class="prevnext-dir">&larr; {{ anioAnterior.data.year }}</span>
          <span class="prevnext-title">{{ anioAnterior.title }}</span>
        </NuxtLink>
        <span v-else class="prevnext-placeholder" />

        <NuxtLink v-if="anioSiguiente" :to="`/premios/${anioSiguiente.slug}`" class="prevnext-link prevnext-link-right">
          <span class="prevnext-dir">{{ anioSiguiente.data.year }} &rarr;</span>
          <span class="prevnext-title">{{ anioSiguiente.title }}</span>
        </NuxtLink>
        <span v-else class="prevnext-placeholder" />
      </nav>

      <section v-if="relacionados.length" class="related-section">
        <h2>Otros premios en {{ premio.data.categoria.title }}</h2>
        <ul class="prize-list">
          <PrizeListItem v-for="item in relacionados" :key="item.slug" :item="item" :mostrar-categoria="false" />
        </ul>
        <NuxtLink :to="`/categorias/${premio.data.categoria.slug}`" class="see-all-link">
          Ver todos los premios de {{ premio.data.categoria.title }} →
        </NuxtLink>
      </section>
    </article>

    <FooterView />
  </div>
</template>
