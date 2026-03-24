// src/lib/tokens.ts
// FUENTE DE VERDAD VISUAL — todos los módulos importan de aquí
// Cambias algo aquí y se actualiza en todo el sistema automáticamente.
// NUNCA hardcodear colores, fuentes o espaciados directamente en los componentes.

export const tokens = {

  // ─── MARCA ───────────────────────────────────────────
  brand: {
    logo: '/assets/logo.svg',
    logoWhite: '/assets/logo-white.svg',
    logoMini: '/assets/logo-mini.svg',
    nombre: 'LomaHUB27',
    tagline: 'Control Total de tu Operación',
  },

  // ─── COLORES ─────────────────────────────────────────
  colors: {
    // Primarios
    primary:      '#1E66F5',
    primaryHover: '#1854D4',
    primaryGlow:  'rgba(30, 102, 245, 0.3)',

    // Fondos
    bgMain:  '#0B1220',
    bgCard:  '#111827',
    bgHover: '#1F2937',
    bgGlass: 'rgba(17, 24, 39, 0.8)',

    // Bordes
    border:      '#1F2937',
    borderLight: 'rgba(31, 41, 55, 0.5)',

    // Texto
    textPrimary:   '#F9FAFB',
    textSecondary: '#9CA3AF',
    textMuted:     '#6B7280',

    // Acentos
    orange:      '#D97706',
    orangeLight: 'rgba(245, 158, 11, 0.1)',

    // Semáforo (NUNCA cambiar estos — son estándar operativo)
    green:    '#059669',
    greenBg:  'rgba(16, 185, 129, 0.1)',
    yellow:   '#D97706',
    yellowBg: 'rgba(245, 158, 11, 0.1)',
    orange2:  '#F97316',
    red:      '#DC2626',
    redBg:    'rgba(239, 68, 68, 0.1)',
    gray:     '#6B7280',
    blue:     '#2563EB',
    blueBg:   'rgba(59, 130, 246, 0.1)',
  },

  // ─── TIPOGRAFÍA ──────────────────────────────────────
  fonts: {
    heading: "'Montserrat', sans-serif",
    body:    "'Montserrat', sans-serif",
  },

  // ─── EFECTOS ─────────────────────────────────────────
  effects: {
    glassmorphism: {
      background: 'rgba(17, 24, 39, 0.8)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(31, 41, 55, 0.5)',
      borderRadius: '12px',
    },
    gradientBg:  'linear-gradient(135deg, #0B1220 0%, #0D1B2A 50%, #0B1220 100%)',
    cardShadow:  '0 4px 24px rgba(0, 0, 0, 0.4)',
    glowPrimary: '0 0 20px rgba(30, 102, 245, 0.3)',
    glowGreen:   '0 0 12px rgba(16, 185, 129, 0.3)',
    glowRed:     '0 0 12px rgba(239, 68, 68, 0.3)',
  },

  // ─── ESPACIADOS ──────────────────────────────────────
  spacing: {
    xs:  '4px',
    sm:  '8px',
    md:  '16px',
    lg:  '24px',
    xl:  '32px',
    xxl: '48px',
  },

  // ─── BORDER RADIUS ───────────────────────────────────
  radius: {
    sm:   '6px',
    md:   '8px',
    lg:   '12px',
    xl:   '16px',
    full: '9999px',
  },

  // ─── BREAKPOINTS ─────────────────────────────────────
  breakpoints: {
    sm:  '640px',
    md:  '768px',
    lg:  '1024px',
    xl:  '1280px',
    xxl: '1536px',
  },
} as const

// Tipos TypeScript para autocompletado
export type TokenColors = typeof tokens.colors
export type TokenFonts = typeof tokens.fonts
export type SemaforoEstado = 'verde' | 'amarillo' | 'naranja' | 'rojo' | 'gris' | 'azul'
export type SemaforoColor = 'green' | 'yellow' | 'orange' | 'red' | 'gray' | 'blue'
