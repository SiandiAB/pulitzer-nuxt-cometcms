<!-- app/error.vue -->
<script setup>
const props = defineProps({
  error: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div>
    <HeaderView />

    <section class="container error-section">
      <span class="badge" data-division="Teatro">Error {{ error.statusCode }}</span>
      <h1>{{ error.statusCode === 404 ? 'Página no encontrada' : 'Ocurrió un error' }}</h1>
      <p>{{ error.statusMessage || 'No fue posible mostrar el contenido solicitado.' }}</p>
      <NuxtLink to="/" class="nav-card" style="max-width: 220px; margin-top: 1.5rem;">
        Volver al inicio
      </NuxtLink>
    </section>

    <FooterView />
  </div>
</template>
