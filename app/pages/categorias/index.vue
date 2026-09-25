<!-- app/pages/categorias/index.vue -->
<script setup>
const { data: categoriasData } = await useFetch('/api/comet/content/pulitzer-categorias')
const { data: premiosData } = await useFetch('/api/comet/content/pulitzer-premios')

const CATEGORIAS = computed(() => categoriasData.value?.data ?? [])
const registros = computed(() => premiosData.value?.data ?? [])

// El campo "categoria" de cada premio guarda el id de la categoría relacionada
// (llave foránea), por eso se agrupa por r.data.categoria en vez de un slug.
const conteos = computed(() => {
  const mapa = {}
  for (const r of registros.value) {
    mapa[r.data.categoria] = (mapa[r.data.categoria] || 0) + 1
  }
  return mapa
})

function rangoAnios(categoriaId) {
  const anios = registros.value.filter(r => r.data.categoria === categoriaId).map(r => r.data.year)
  if (!anios.length) return ''
  return `${Math.min(...anios)}–${Math.max(...anios)}`
}
</script>

<template>
  <div>
    <HeaderView />

    <section class="container">
      <nav class="breadcrumbs" aria-label="Ruta de navegación">
        <NuxtLink to="/">Inicio</NuxtLink> <span>/</span> <span>Categorías</span>
      </nav>

      <h1>Categorías</h1>
      <p class="section-lead">
        Los Premios Pulitzer en Letras y Teatro se organizan en siete categorías.
        Elija una para ver todos sus premios ordenados por año.
      </p>

      <div class="category-grid">
        <NuxtLink
          v-for="categoria in CATEGORIAS"
          :key="categoria.id"
          :to="`/categorias/${categoria.slug}`"
          class="category-card"
        >
          <span class="badge" :data-division="categoria.data.division">{{ categoria.data.division }}</span>
          <h2>{{ categoria.title }}</h2>
          <p>{{ categoria.data.descripcion }}</p>
          <p class="category-meta">
            {{ conteos[categoria.id] || 0 }} premios · {{ rangoAnios(categoria.id) }}
          </p>
        </NuxtLink>
      </div>
    </section>

    <FooterView />
  </div>
</template>
