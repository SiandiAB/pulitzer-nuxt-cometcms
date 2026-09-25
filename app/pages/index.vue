<!-- app/pages/index.vue -->
<script setup>
useHead({ title: 'Inicio' })

const { data: premiosData } = await useFetch('/api/comet/content/pulitzer-premios')
const { data: categoriasData } = await useFetch('/api/comet/content/pulitzer-categorias')

const resumen = computed(() => premiosData.value?.data ?? [])

const totalPremios = computed(() => resumen.value.length)
const anioMin = computed(() => Math.min(...resumen.value.map(i => i.data.year)))
const anioMax = computed(() => Math.max(...resumen.value.map(i => i.data.year)))
const totalCategorias = computed(() => categoriasData.value?.data?.length ?? 0)
const totalDecadas = computed(() => new Set(resumen.value.map(i => i.data.decada)).size)

const busqueda = ref('')

function buscar() {
  const q = busqueda.value.trim()
  navigateTo({ path: '/premios', query: q ? { q } : {} })
}
</script>

<template>
  <div>
    <HeaderView />

    <section class="hero">
      <div class="container">
        <h1>Premios Pulitzer</h1>
        <p class="hero-lead">
          Explorador del conjunto de datos de los Premios Pulitzer en las categorías de
          Letras y Teatro: {{ totalPremios }} registros entre {{ anioMin }} y {{ anioMax }},
          organizados por categoría y por década, con búsqueda y ficha de detalle para
          cada obra premiada.
        </p>

        <form class="hero-search" @submit.prevent="buscar">
          <input
            v-model="busqueda"
            type="search"
            autocomplete="off"
            placeholder="Buscar por autor, obra, categoría o año…"
            aria-label="Buscar premios"
          />
          <button type="submit">Buscar</button>
        </form>

        <div class="stats-row">
          <div class="stat">
            <span class="stat-num">{{ totalPremios }}</span>
            <span class="stat-label">Registros</span>
          </div>
          <div class="stat">
            <span class="stat-num">{{ anioMin }}–{{ anioMax }}</span>
            <span class="stat-label">Rango de años</span>
          </div>
          <div class="stat">
            <span class="stat-num">{{ totalCategorias }}</span>
            <span class="stat-label">Categorías</span>
          </div>
          <div class="stat">
            <span class="stat-num">{{ totalDecadas }}</span>
            <span class="stat-label">Décadas</span>
          </div>
        </div>
      </div>
    </section>

    <section class="container">
      <h2 class="section-title">Explorar el dataset</h2>
      <div class="nav-cards">
        <NuxtLink to="/categorias" class="nav-card">
          <svg class="nav-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <h3>Por categoría</h3>
          <p>Ficción, Teatro, Historia, Biografía, Memorias, No Ficción General y Poesía.</p>
        </NuxtLink>
        <NuxtLink to="/decadas" class="nav-card">
          <svg class="nav-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <h3>Por década</h3>
          <p>Desde los años 1910 hasta los años 2020, una década a la vez.</p>
        </NuxtLink>
        <NuxtLink to="/premios" class="nav-card">
          <svg class="nav-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <h3>Todos los premios</h3>
          <p>Listado completo con búsqueda, filtro por categoría y paginación.</p>
        </NuxtLink>
      </div>
    </section>

    <FooterView />
  </div>
</template>
