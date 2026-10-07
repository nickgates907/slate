/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', '"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      colors: {
        brand: {
          red: 'rgb(var(--accent-rgb) / <alpha-value>)',
          'red-hover': 'rgb(var(--accent-hover-rgb) / <alpha-value>)',
          'red-strong': 'rgb(var(--accent-strong-rgb) / <alpha-value>)',
          'on-accent': 'rgb(var(--accent-fg-rgb) / <alpha-value>)',
        },
        accent: {
          subtle: 'rgb(var(--accent-rgb) / 0.15)',
        },
        gold: {
          accent: '#EAB308',
        },
        surface: {
          base: '#F3F5F8',
          panel: '#FFFFFF',
          card: '#F6F7FA',
          'card-hover': '#E9ECF1',
          canvas: '#06090E',
        },
        'surface-dark': {
          base: '#0A0E14',
          panel: '#121822',
          card: '#18202E',
          'card-hover': '#1F2B3E',
        },
        text: {
          secondary: '#5B6472',
          disabled: '#A6AEBB',
        },
        'text-dark': {
          secondary: '#8A99AD',
          disabled: '#4F5D73',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(15, 23, 42, 0.08)',
        'card-dark': '0 4px 20px rgba(0, 0, 0, 0.35)',
        'glow-red': '0 0 15px rgb(var(--accent-rgb) / 0.35), inset 0 0 10px rgb(var(--accent-rgb) / 0.1)',
      },
    },
  },
  plugins: [],
}
