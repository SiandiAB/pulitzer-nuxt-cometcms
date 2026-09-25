export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Valores por defecto vacíos/placeholder: los reales se definen en .env
    // (local) o en las variables de entorno del sitio en Netlify.
    cometApiToken: '',
    cometUrl: '',
    cometWorkspace: 'default'
  },
  app: {
    head: {
      titleTemplate: '%s · Premios Pulitzer',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Explorador de los Premios Pulitzer (categorías de Letras y Teatro, 1917-2024): navegación por categoría y década, búsqueda y ficha de detalle de cada obra premiada.'
        }
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    }
  }
})
