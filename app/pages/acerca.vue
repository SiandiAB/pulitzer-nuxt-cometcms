<!-- app/pages/acerca.vue -->
<script setup>
useHead({ title: 'Acerca de' })
</script>

<template>
  <div>
    <HeaderView />

    <section class="container prose-section">
      <nav class="breadcrumbs" aria-label="Ruta de navegación">
        <NuxtLink to="/">Inicio</NuxtLink> <span>/</span> <span>Acerca de</span>
      </nav>

      <h1>Acerca de este sitio</h1>

      <p>
        Este sitio es el <strong>Proyecto 1</strong> del curso EIF-511 Arquitectura de
        Información, realizado por <strong>Siandi Araya Bello</strong> (118870991).
        Presenta un explorador del conjunto de datos de los <strong>Premios Pulitzer</strong>
        en las categorías de Letras (Ficción, Historia, Biografía o Autobiografía, Memorias,
        No Ficción General y Poesía) y Teatro, publicados entre 1917 y 2024.
      </p>

      <h2>Esquema de organización</h2>
      <p>
        Un premio anual es, por naturaleza, un dato con dos ejes de clasificación igualmente
        naturales: la <strong>categoría</strong> en la que se otorga y el <strong>momento
        en el tiempo</strong> en que se otorgó. Por eso el sitio ofrece dos jerarquías de
        navegación independientes hacia el mismo conjunto de registros:
      </p>
      <ul>
        <li><NuxtLink to="/categorias">Por categoría</NuxtLink>: agrupa los premios según el tipo de obra (Ficción, Teatro, Poesía, etc.).</li>
        <li><NuxtLink to="/decadas">Por década</NuxtLink>: agrupa los premios en tramos de diez años, en orden cronológico.</li>
      </ul>
      <p>
        Además, la página <NuxtLink to="/premios">Todos los premios</NuxtLink> ofrece
        acceso directo a cualquier registro mediante búsqueda de texto (autor, obra,
        categoría o año) combinada con un filtro por categoría, y todos los listados
        del sitio están paginados para explorar el dataset de forma eficiente.
      </p>

      <h2>Origen de los datos</h2>
      <p>
        Los registros fueron tomados del repositorio público
        <a href="https://github.com/terrykimura/pulitzer" target="_blank" rel="noopener noreferrer">terrykimura/pulitzer</a>
        en GitHub, que a su vez extrae la información directamente de la API oficial de
        <a href="https://www.pulitzer.org" target="_blank" rel="noopener noreferrer">pulitzer.org</a>.
        Durante la limpieza de los datos para el Proyecto 1 se consolidaron las ocho
        categorías originales en un único dataset (<code>data/pulitzer.csv</code>), se
        unificó la categoría de Ficción (llamada "Novel" hasta 1947 y "Fiction" desde 1948),
        se calculó la década de cada premio y se excluyeron los años en que no hubo un
        ganador (<em>"No award"</em>), ya que esos años no tienen autor ni obra que mostrar
        en una ficha de detalle. Para la Tarea 3 se incorporó una muestra de estos registros
        al CMS headless (ver más abajo).
      </p>

      <h2>Cómo está construido</h2>
      <p>
        El contenido (categorías y premios) se administra en un espacio propio de
        <strong>CometCMS</strong>, un CMS headless. La aplicación, construida con
        <strong>Nuxt 4</strong>, no guarda los datos en el proyecto: una ruta de servidor
        (<code>server/api/comet/[...path].ts</code>) reenvía cada petición al API REST de
        CometCMS agregando el token de acceso, para que este nunca quede expuesto en el
        navegador. Cada página pide su contenido con <code>useFetch()</code> contra esa
        ruta propia. No se usa ningún framework CSS externo: los estilos son una hoja
        propia en <code>app/assets/css/main.css</code>.
      </p>
    </section>

    <FooterView />
  </div>
</template>
