/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#3366FF',
        secondary: '#F5F7FF',
        accent: '#8A3FFC'
      }
    },
  },
  plugins: [],
}