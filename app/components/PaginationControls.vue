<!-- app/components/PaginationControls.vue -->
<script setup>
const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true }
})

const emit = defineEmits(['goto'])

const paginas = computed(() => {
  const delta = 2
  const desde = Math.max(1, props.page - delta)
  const hasta = Math.min(props.totalPages, props.page + delta)
  const rango = []
  for (let i = desde; i <= hasta; i++) rango.push(i)
  return rango
})
</script>

<template>
  <nav v-if="totalPages > 1" class="pagination" aria-label="Paginación de resultados">
    <button type="button" class="page-btn" :disabled="page <= 1" @click="emit('goto', page - 1)">
      &larr; Anterior
    </button>

    <button v-if="paginas[0] > 1" type="button" class="page-btn" @click="emit('goto', 1)">1</button>
    <span v-if="paginas[0] > 2" class="page-ellipsis">…</span>

    <button
      v-for="p in paginas"
      :key="p"
      type="button"
      class="page-btn"
      :class="{ active: p === page }"
      :aria-current="p === page ? 'page' : undefined"
      @click="emit('goto', p)"
    >
      {{ p }}
    </button>

    <span v-if="paginas[paginas.length - 1] < totalPages - 1" class="page-ellipsis">…</span>
    <button
      v-if="paginas[paginas.length - 1] < totalPages"
      type="button"
      class="page-btn"
      @click="emit('goto', totalPages)"
    >
      {{ totalPages }}
    </button>

    <button type="button" class="page-btn" :disabled="page >= totalPages" @click="emit('goto', page + 1)">
      Siguiente &rarr;
    </button>
  </nav>
</template>
