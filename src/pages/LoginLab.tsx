import { useEffect, useRef, useState } from 'react'

/**
 * LoginLab — Laboratorio visual del login
 *
 * Ruta: /login-lab
 * NO modifica Login.tsx. NO toca lógica de autenticación.
 * NO cambia el login real. Solo muestra 10 previews aislados
 * donde cada uno aplica UN SOLO efecto controlado.
 *
 * Paleta replicada de Login.tsx (fuente de verdad).
 */

const L = {
  bg: '#08080C',
  orange: 'rgba(232,97,26,0.80)',
  orangeGlow: 'rgba(232, 97, 26, 0.15)',
  w90: 'rgba(255,255,255,0.90)',
  w50: 'rgba(255,255,255,0.50)',
  w20: 'rgba(255,255,255,0.20)',
  w10: 'rgba(255,255,255,0.10)',
  w08: 'rgba(255,255,255,0.08)',
  w04: 'rgba(255,255,255,0.04)',
  w02: 'rgba(255,255,255,0.02)',
  font: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
} as const

/* =========================================================
   MINI-LOGIN BASE — estructura replicada, sin efectos.
   Cada preview envuelve ESTO con UN solo efecto adicional.
   ========================================================= */

type MiniProps = {
  bgLayers?: React.ReactNode
  frontLayers?: React.ReactNode
  cardStyle?: React.CSSProperties
  logoStyle?: React.CSSProperties
  btnNode?: React.ReactNode
  containerRef?: React.Ref<HTMLDivElement>
  onMouseMove?: React.MouseEventHandler<HTMLDivElement>
}

function MiniLogin({
  bgLayers,
  frontLayers,
  cardStyle,
  logoStyle,
  btnNode,
  containerRef,
  onMouseMove,
}: MiniProps) {
  const baseCard: React.CSSProperties = {
    position: 'relative',
    zIndex: 10,
    background: 'rgba(14,14,20,0.85)',
    border: `1px solid ${L.w08}`,
    borderRadius: 8,
    padding: '24px 28px 20px',
    width: 220,
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  }
  const baseLogo: React.CSSProperties = {
    fontWeight: 800,
    fontStyle: 'italic',
    fontSize: 20,
    letterSpacing: -1,
    color: L.w90,
    marginBottom: 4,
    display: 'inline-block',
  }
  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4 / 3',
        background: L.bg,
        borderRadius: 10,
        overflow: 'hidden',
        fontFamily: L.font,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {bgLayers}
      <div style={{ ...baseCard, ...cardStyle }}>
        <div style={{ ...baseLogo, ...logoStyle }}>
          Loma<span style={{ color: L.orange }}>HUB</span>
          <span style={{ color: L.orange, marginLeft: 2 }}>27</span>
        </div>
        <div
          style={{
            fontSize: 8,
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'rgba(190,190,190,0.55)',
            marginBottom: 18,
            letterSpacing: 0.5,
          }}
        >
          Future Experience
        </div>
        {btnNode ?? (
          <div
            style={{
              border: `1px solid ${L.w20}`,
              borderRadius: 4,
              padding: '8px 10px',
              fontSize: 10,
              fontWeight: 500,
              color: L.w90,
              background: 'transparent',
            }}
          >
            Continuar con Google
          </div>
        )}
        <div
          style={{
            marginTop: 14,
            fontSize: 7,
            color: L.w50,
            letterSpacing: 0.5,
          }}
        >
          ACCESO AUTORIZADO
        </div>
      </div>
      {frontLayers}
    </div>
  )
}

/* =========================================================
   PRUEBA 1 — Partículas atmosféricas ultrasutiles
   Solo modifica: capa de fondo con puntos lentos.
   ========================================================= */
function Preview1() {
  const particles = Array.from({ length: 16 }, (_, i) => {
    const left = (i * 37 + 11) % 100
    const top = (i * 53 + 7) % 100
    const size = 1 + (i % 3) * 0.5
    const dur = 18 + (i % 5) * 4
    const delay = (i * 0.9) % 6
    return { left, top, size, dur, delay, k: i }
  })
  return (
    <MiniLogin
      bgLayers={
        <>
          <style>{`
            @keyframes lab-p1 {
              0%   { transform: translate(0,0);   opacity: 0.05; }
              50%  { transform: translate(6px,-4px); opacity: 0.10; }
              100% { transform: translate(-4px,5px); opacity: 0.05; }
            }
          `}</style>
          {particles.map((p) => (
            <div
              key={p.k}
              style={{
                position: 'absolute',
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                background: 'rgba(232,180,140,0.10)',
                animation: `lab-p1 ${p.dur}s ease-in-out ${p.delay}s infinite`,
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          ))}
        </>
      }
    />
  )
}

/* =========================================================
   PRUEBA 2 — Grid técnico tenue
   Solo modifica: background-image con líneas de grid.
   ========================================================= */
function Preview2() {
  return (
    <MiniLogin
      bgLayers={
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      }
    />
  )
}

/* =========================================================
   PRUEBA 3 — Glow ambiental naranja controlado
   Solo modifica: capa de fondo con radial-gradient difuso.
   ========================================================= */
function Preview3() {
  return (
    <MiniLogin
      bgLayers={
        <div
          style={{
            position: 'absolute',
            top: '20%',
            right: '-10%',
            width: '60%',
            height: '60%',
            background:
              'radial-gradient(circle, rgba(232,97,26,0.18) 0%, rgba(232,97,26,0.08) 40%, transparent 70%)',
            filter: 'blur(20px)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      }
    />
  )
}

/* =========================================================
   PRUEBA 4 — Borde premium en la card
   Solo modifica: border + box-shadow de la card.
   ========================================================= */
function Preview4() {
  return (
    <MiniLogin
      cardStyle={{
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow:
          '0 0 0 1px rgba(255,255,255,0.03) inset, 0 16px 48px rgba(0,0,0,0.55), 0 2px 0 rgba(255,255,255,0.04) inset',
      }}
    />
  )
}

/* =========================================================
   PRUEBA 5 — Hover premium del botón Google
   Solo modifica: botón con estado hover con micro-elevación.
   ========================================================= */
function Preview5() {
  const [hover, setHover] = useState(false)
  return (
    <MiniLogin
      btnNode={
        <div
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            border: `1px solid ${hover ? 'rgba(255,255,255,0.32)' : L.w20}`,
            borderRadius: 4,
            padding: '8px 10px',
            fontSize: 10,
            fontWeight: 500,
            color: L.w90,
            background: hover ? 'rgba(255,255,255,0.04)' : 'transparent',
            transform: hover ? 'translateY(-1px)' : 'translateY(0)',
            boxShadow: hover ? '0 6px 16px rgba(0,0,0,0.35)' : 'none',
            transition:
              'transform 180ms ease, box-shadow 180ms ease, background 180ms ease, border-color 180ms ease',
            cursor: 'pointer',
          }}
        >
          Continuar con Google
        </div>
      }
    />
  )
}

/* =========================================================
   PRUEBA 6 — Reveal elegante del logo
   Solo modifica: animación de entrada del logo al montar.
   ========================================================= */
function Preview6() {
  const [key, setKey] = useState(0)
  // Replay on click para que el usuario pueda ver el reveal de nuevo
  return (
    <div onClick={() => setKey((k) => k + 1)} style={{ cursor: 'pointer' }}>
      <MiniLogin
        key={key}
        logoStyle={{
          animation: 'lab-p6 700ms ease-out both',
        }}
        bgLayers={
          <style>{`
            @keyframes lab-p6 {
              0%   { opacity: 0; transform: translateY(6px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        }
      />
    </div>
  )
}

/* =========================================================
   PRUEBA 7 — Línea de escaneo horizontal ultrasutil
   Solo modifica: línea 1px animada recorriendo el fondo.
   ========================================================= */
function Preview7() {
  return (
    <MiniLogin
      bgLayers={
        <>
          <style>{`
            @keyframes lab-p7 {
              0%   { top: -2%; opacity: 0; }
              10%  { opacity: 0.18; }
              90%  { opacity: 0.18; }
              100% { top: 102%; opacity: 0; }
            }
          `}</style>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 1,
              background:
                'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
              animation: 'lab-p7 7s linear infinite',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        </>
      }
    />
  )
}

/* =========================================================
   PRUEBA 8 — Vignette cinematográfico controlado
   Solo modifica: capa superpuesta con radial-gradient oscuro.
   ========================================================= */
function Preview8() {
  return (
    <MiniLogin
      frontLayers={
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.35) 100%)',
            pointerEvents: 'none',
            zIndex: 9,
          }}
        />
      }
    />
  )
}

/* =========================================================
   PRUEBA 9 — Parallax mínimo
   Solo modifica: capa de fondo se desplaza muy poco con mouse.
   ========================================================= */
function Preview9() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width
    const dy = (e.clientY - (rect.top + rect.height / 2)) / rect.height
    setTx(dx * 6)
    setTy(dy * 4)
  }
  return (
    <MiniLogin
      containerRef={ref}
      onMouseMove={onMove}
      bgLayers={
        <div
          style={{
            position: 'absolute',
            inset: '-8%',
            background:
              'radial-gradient(circle at 30% 40%, rgba(232,97,26,0.06) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.03) 0%, transparent 50%)',
            transform: `translate(${tx}px, ${ty}px)`,
            transition: 'transform 200ms ease-out',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      }
    />
  )
}

/* =========================================================
   PRUEBA 10 — Shimmer controlado (sobre el logo)
   Solo modifica: logo con pasada de brillo muy ocasional.
   ========================================================= */
function Preview10() {
  return (
    <MiniLogin
      logoStyle={{
        position: 'relative',
        backgroundImage:
          'linear-gradient(100deg, transparent 0%, transparent 45%, rgba(255,255,255,0.35) 50%, transparent 55%, transparent 100%)',
        backgroundSize: '300% 100%',
        backgroundPosition: '-100% 0',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        animation: 'lab-p10 8s ease-in-out infinite',
      }}
      bgLayers={
        <style>{`
          @keyframes lab-p10 {
            0%   { background-position: -100% 0; }
            20%  { background-position: -100% 0; }
            30%  { background-position: 200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      }
    />
  )
}

/* =========================================================
   Tabla de metadatos por prueba
   ========================================================= */
type TestMeta = {
  n: number
  name: string
  changed: string
  untouched: string
  Comp: React.FC
}

const TESTS: TestMeta[] = [
  {
    n: 1,
    name: 'Partículas atmosféricas ultrasutiles',
    changed: 'Capa de fondo con 16 partículas 1–2.5px, opacidad 0.05–0.10, flotación lenta.',
    untouched: 'Logo · card · botón · borde · sombra · glow · grid · reveal · vignette · parallax · shimmer.',
    Comp: Preview1,
  },
  {
    n: 2,
    name: 'Grid técnico tenue',
    changed: 'Background-image con líneas 1px a 40px, opacidad 0.05, sin animación.',
    untouched: 'Partículas · glow · card · botón · logo · reveal · escaneo · vignette · parallax · shimmer.',
    Comp: Preview2,
  },
  {
    n: 3,
    name: 'Glow ambiental naranja controlado',
    changed: 'Radial-gradient difuso naranja en zona lateral, blur 20px, fuera de la card.',
    untouched: 'Grid · partículas · card · botón · reveal · logo · vignette · escaneo · parallax · shimmer.',
    Comp: Preview3,
  },
  {
    n: 4,
    name: 'Borde premium en la card',
    changed: 'Border de la card a 1px rgba(255,255,255,0.14) + box-shadow extendida + highlight interno sutil.',
    untouched: 'Partículas · grid · glow ambiental · reveal · escaneo · vignette · parallax · shimmer.',
    Comp: Preview4,
  },
  {
    n: 5,
    name: 'Hover premium del botón Google',
    changed: 'Botón: al hover, translateY(-1px), borde +12% blanco, bg +0.04 blanco, sombra 0 6px 16px. Transición 180ms.',
    untouched: 'Fondo · partículas · grid · glow · card · logo · reveal · escaneo · vignette · parallax.',
    Comp: Preview5,
  },
  {
    n: 6,
    name: 'Reveal elegante del logo',
    changed: 'Logo: fade-in + translateY(6→0) en 700ms al montar. Click en la tarjeta re-ejecuta el reveal.',
    untouched: 'Fondo · card · botón · glow · partículas · grid · vignette · parallax · escaneo.',
    Comp: Preview6,
  },
  {
    n: 7,
    name: 'Línea de escaneo horizontal ultrasutil',
    changed: 'Línea 1px blanca con opacidad máxima 0.18 recorre top→bottom en 7s.',
    untouched: 'Partículas · grid · glow · card · botón · logo · reveal · vignette · parallax · shimmer.',
    Comp: Preview7,
  },
  {
    n: 8,
    name: 'Vignette cinematográfico controlado',
    changed: 'Radial-gradient oscuro desde centro (transparente) a bordes (rgba(0,0,0,0.35)).',
    untouched: 'Partículas · grid · glow · card · botón · reveal · escaneo · parallax · shimmer.',
    Comp: Preview8,
  },
  {
    n: 9,
    name: 'Parallax mínimo',
    changed: 'Capa de fondo se desplaza máx ±6px x / ±4px y siguiendo al cursor, transición 200ms.',
    untouched: 'Partículas · grid · glow · borde card · hover botón · reveal · escaneo · vignette · shimmer.',
    Comp: Preview9,
  },
  {
    n: 10,
    name: 'Shimmer controlado (logo)',
    changed: 'Logo: pasada de brillo blanco 0.35 en 30% del ciclo de 8s, resto en reposo.',
    untouched: 'Partículas · grid · glow · card · hover · reveal · escaneo · vignette · parallax.',
    Comp: Preview10,
  },
]

/* =========================================================
   LAB CONTAINER
   ========================================================= */
export default function LoginLab() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0A0E',
        color: L.w90,
        fontFamily: L.font,
        padding: '48px 32px',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <header style={{ marginBottom: 40 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: 2,
              color: L.w50,
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            LomaHUB27 · Visual Lab
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              marginBottom: 10,
              color: L.w90,
              letterSpacing: -0.5,
            }}
          >
            Login — 10 pruebas de efectos aislados
          </h1>
          <p
            style={{
              fontSize: 13,
              color: L.w50,
              margin: 0,
              maxWidth: 760,
              lineHeight: 1.55,
            }}
          >
            Cada preview muestra la misma estructura del login actual con UN solo efecto aplicado.
            Sin mezcla. Sin rediseño. Sin modificación del login real.
            El login de producción en /login sigue intacto.
          </p>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 28,
          }}
        >
          {TESTS.map(({ n, name, changed, untouched, Comp }) => (
            <div
              key={n}
              style={{
                background: '#101016',
                border: `1px solid ${L.w08}`,
                borderRadius: 12,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: L.orange,
                    letterSpacing: 1,
                  }}
                >
                  {String(n).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: L.w90 }}>
                  {name}
                </div>
              </div>
              <Comp />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 11, color: L.w90, lineHeight: 1.5 }}>
                  <span style={{ color: L.orange, fontWeight: 600 }}>Modificado:</span>{' '}
                  {changed}
                </div>
                <div style={{ fontSize: 11, color: L.w50, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600 }}>No modificado:</span> {untouched}
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer
          style={{
            marginTop: 48,
            paddingTop: 20,
            borderTop: `1px solid ${L.w04}`,
            fontSize: 11,
            color: L.w50,
            textAlign: 'center',
          }}
        >
          /login-lab · vista de laboratorio · Login real en /login · sin auth · sin datos
        </footer>
      </div>
    </div>
  )
}
