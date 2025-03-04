/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#3366FF',
        secondary: '#F5F7FF',
        accent: '#8A3FFC'
      },
      fontFamily: {
        sans: ['var(--font-family-sans)'],
        inter: ['var(--font-family-sans)'],
        display: ['var(--font-family-display)']
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      }
    },
  },
  plugins: [],
}