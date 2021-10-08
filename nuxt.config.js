module.exports = {
  ssr: false,
  srcDir: './client',
  router: {
    mode: 'hash'
  },
  plugins: [
    '~/plugins/index.js'
  ],
  modules: ['bootstrap-vue/nuxt'],
  bootstrapVue: {
    bootstrapCSS: false, // Or `css: false`
    bootstrapVueCSS: false // Or `bvCSS: false`
  },
  css: [
    '~/assets/scss/app.scss'
  ]
}