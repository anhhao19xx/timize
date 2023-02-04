const mode = process.env.NODE_ENV || 'development'; 

module.exports = {
  ssr: false,
  router: {
    mode: 'hash'
  },
  plugins: [
    { src: '~/plugins/quill.js' },
    { src: '~/plugins/index.js' },
    { src: '~/plugins/clipboard.js' },
  ],
  publicRuntimeConfig: {
    apiUrl: mode === 'production' ? 'https://timize.anhhao.me' : 'http://localhost:3001/timize'
  },
  buildModules: [
    '@nuxt/postcss8',
    '@nuxtjs/pwa',
  ],
  build: {
    postcss: {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    },
  },
  modules: [
    'nuxt-minimal-admin'
  ],
  pwa: {
    meta: {
      title: 'Timize',
      author: 'Vu Anh Hao <hi@anhhao.me> (https://www.anhhao.me)',
    },
    manifest: {
      name: 'Timize',
      lang: 'en',
      short_name: 'Timize',
    }
  },
  css: [
    '~/assets/scss/main.scss'
  ]
}