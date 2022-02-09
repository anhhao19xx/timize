const defaultConfig = require('nuxt-minimal-admin/tailwind.config');

module.exports = {
  ...defaultConfig,
  content: [
    './node_modules/nuxt-minimal-admin/lib/**/*.{js,vue,ts}',
    './comps/**/*.{js,vue,ts}',
    './layouts/**/*.{js,vue,ts}',
    './pages/**/*.{js,vue,ts}'
  ]
}