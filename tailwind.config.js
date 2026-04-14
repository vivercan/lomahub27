/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // V30 Light Premium — sincronizado con src/lib/tokens.ts
        // Actualizado 13/Abr/2026 — eliminados colores dark del sistema viejo
        'fx-primary':        '#3B6CE7',
        'fx-bg':             '#F7F8FA',
        'fx-bg-card':        '#FFFFFF',
        'fx-bg-hover':       '#F1F5F9',
        'fx-border':         '#E2E8F0',
        'fx-text-primary':   '#0F172A',
        'fx-text-secondary': '#64748B',
        'fx-orange':         '#C27803',
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
