<!-- app/components/HeaderView.vue -->
<template>
  <header class="site-header">
    <div class="container site-header-inner">
      <NuxtLink to="/" class="brand">
        <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="6" />
          <path d="M8.5 13.2 7 22l5-2.8L17 22l-1.5-8.8" />
        </svg>
        <span class="brand-text">Premios Pulitzer</span>
      </NuxtLink>
      <nav class="main-nav" aria-label="Navegación principal">
        <NuxtLink to="/categorias" class="nav-link">Categorías</NuxtLink>
        <NuxtLink to="/decadas" class="nav-link">Décadas</NuxtLink>
        <NuxtLink to="/premios" class="nav-link">Todos los premios</NuxtLink>
        <NuxtLink to="/acerca" class="nav-link">Acerca de</NuxtLink>
      </nav>
    </div>
  </header>
</template>
