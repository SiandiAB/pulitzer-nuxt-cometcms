<!-- app/components/PrizeListItem.vue -->
<script setup>
defineProps({
  item: {
    type: Object,
    required: true
  },
  // Oculta la insignia de categoría cuando la propia página ya filtra por
  // una única categoría (evita repetir la misma etiqueta en cada fila).
  mostrarCategoria: {
    type: Boolean,
    default: true
  }
})
</script>

<template>
  <li class="prize-item">
    <NuxtLink :to="`/premios/${item.slug}`" class="prize-item-link">
      <span class="prize-year">{{ item.data.year }}</span>
      <span class="prize-main">
        <strong class="prize-obra">{{ item.title }}</strong>
        <span class="prize-autor">{{ item.data.autor }}</span>
      </span>
      <span v-if="mostrarCategoria && item.data.categoria" class="badge" :data-division="item.data.categoria.data.division">
        {{ item.data.categoria.title }}
      </span>
    </NuxtLink>
  </li>
</template>
