/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'fx-primary': '#1E66F5',
        'fx-bg': '#0B1220',
        'fx-bg-card': '#111827',
        'fx-bg-hover': '#1F2937',
        'fx-border': '#1F2937',
        'fx-text-primary': '#F9FAFB',
        'fx-text-secondary': '#9CA3AF',
        'fx-orange': '#F59E0B',
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        orbitron: ['Montserrat', 'sans-serif'],
        exo2: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
