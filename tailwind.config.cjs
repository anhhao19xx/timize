/* eslint-disable */
const colors = require("tailwindcss/colors");

// delete unsupported colors
delete colors.lightBlue;
delete colors.warmGray;
delete colors.coolGray;
delete colors.blueGray;
delete colors.trueGray;

/** @type {import('tailwindcss').Config} */ 
module.exports = {
  darkMode: "class",
  content: [
    "./node_modules/@rugo-vn/vue/dist/**/*.js",
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      primary: colors.cyan,
      secondary: colors.stone,
      danger: colors.rose,
      info: colors.indigo,
      warn: colors.amber,
      success: colors.emerald,
      ...colors,
    },
    fontFamily: {
      sans: ["PoppinsVN", "sans-serif"],
      mono: ['"Fira Code"'],
    },
    extend: {},
    fontSize: {
      xs: ".75rem",
      sm: ".825rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "4rem",
      "7xl": "5rem",
    },
  },
  plugins: [
    require('@rugo-vn/vue/dist/plugin.cjs')
  ],
}