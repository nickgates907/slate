/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#FF4D4D',
          dark: '#111827',
        },
        accent: {
          subtle: 'rgba(255, 77, 77, 0.15)',
        },
        gold: {
          accent: '#EAB308',
        },
      },
    },
  },
  plugins: [],
}
