// src/lib/tokens.ts
// FUENTE DE VERDAD VISUAL — todos los módulos importan de aquí
// Cambias algo aquí y se actualiza en todo el sistema automáticamente.
// NUNCA hardcodear colores, fuentes o espaciados directamente en los componentes.
// V30 LIGHT PREMIUM — Actualizado 24/Mar/2026 por JJ
// Filosofía: "No necesito presumir, valgo mucho" — autoridad, no adrenalina

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
    // Primarios — azul institucional (no eléctrico)
    primary:      '#3B6CE7',
    primaryHover: '#2F5BC4',
    primaryGlow:  'rgba(59, 108, 231, 0.15)',

    // Fondos — light premium Apple (blanco + grises sutiles)
    bgMain:  '#F7F8FA',
    bgCard:  '#FFFFFF',
    bgHover: '#F1F5F9',
    bgGlass: 'rgba(255, 255, 255, 0.92)',

    // Bordes — sutiles sobre fondo claro
    border:      'rgba(15, 23, 42, 0.08)',
    borderLight: 'rgba(15, 23, 42, 0.04)',

    // Texto
    textPrimary:   '#0F172A',
    textSecondary: '#64748B',
    textMuted:     '#94A3B8',

    // Acentos — marca (naranja sobrio, no turbo)
    orange:      '#C27803',
    orangeLight: 'rgba(194, 120, 3, 0.08)',

    // Semáforo premium — señalética medida, no escándalos
    green:    '#0D9668',
    greenBg:  'rgba(13, 150, 104, 0.08)',
    yellow:   '#B8860B',
    yellowBg: 'rgba(184, 134, 11, 0.08)',
    orange2:  '#D4710A',
    red:      '#C53030',
    redBg:    'rgba(197, 48, 48, 0.08)',
    gray:     '#6B6B7A',
    blue:     '#3B6CE7',
    blueBg:   'rgba(59, 108, 231, 0.08)',
  },

  // ─── TIPOGRAFÍA ──────────────────────────────────────
  fonts: {
    heading: "'Montserrat', sans-serif",
    body:    "'Montserrat', sans-serif",
  },

  // ─── EFECTOS ─────────────────────────────────────────
  effects: {
    glassmorphism: {
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(15, 23, 42, 0.06)',
    },
    // Sombras premium — amplias, suaves, difusas (NO glow LED)
    cardShadow:  '0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.08)',
    cardHover:   '0 2px 6px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.12)',
    // Highlight sutil superior para materialidad (hardware digital premium)
    cardHighlight: 'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
    // Sin glows — autoridad no adrenalina
    glowPrimary: '0 4px 16px rgba(59, 108, 231, 0.10)',
    glowGreen:   '0 4px 12px rgba(13, 150, 104, 0.08)',
    glowRed:     '0 4px 12px rgba(197, 48, 48, 0.08)',
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
export type SemaforoColor = 'green' | 'yellow' | 'orange2' | 'red' | 'gray' | 'blue'
