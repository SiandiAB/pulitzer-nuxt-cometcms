<!-- app/pages/decadas/index.vue -->
<script setup>
const { data: premiosData } = await useFetch('/api/comet/content/pulitzer-premios')
const registros = computed(() => premiosData.value?.data ?? [])

const decadas = computed(() => {
  const mapa = {}
  for (const r of registros.value) {
    mapa[r.data.decada] = (mapa[r.data.decada] || 0) + 1
  }
  return Object.keys(mapa)
    .map(Number)
    .sort((a, b) => b - a)
    .map(decada => ({ decada, total: mapa[decada] }))
})
</script>

<template>
  <div>
    <HeaderView />

    <section class="container">
      <nav class="breadcrumbs" aria-label="Ruta de navegación">
        <NuxtLink to="/">Inicio</NuxtLink> <span>/</span> <span>Décadas</span>
      </nav>

      <h1>Décadas</h1>
      <p class="section-lead">
        Navegue el dataset en orden cronológico, una década a la vez, desde los
        primeros Premios Pulitzer de 1917 hasta la actualidad.
      </p>

      <div class="decade-grid">
        <NuxtLink
          v-for="d in decadas"
          :key="d.decada"
          :to="`/decadas/${d.decada}`"
          class="decade-card"
        >
          <span class="decade-label">{{ decadaLabel(d.decada) }}</span>
          <span class="decade-count">{{ d.total }} premios</span>
        </NuxtLink>
      </div>
    </section>

    <FooterView />
  </div>
</template>
