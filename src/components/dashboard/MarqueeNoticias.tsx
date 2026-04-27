// V1 (28/Abr/2026) — Cenefa noticias transporte MX
// Lee tabla noticias_transporte (poblada por edge function sync-noticias-transporte
// + pg_cron 30min). Solo muestra noticias del DIA. Si no hay del dia, muestra
// las ultimas 7d. Si no hay nada, no renderiza.
// Mismo patron fluido side-by-side que MarqueeMetas (sin tic-tac).

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Noticia {
  id: string
  fuente: string
  titulo: string
  url: string
  publicado_at: string | null
}

const AZUL_OSCURO = '#0F1B3D'

export function MarqueeNoticias() {
  const [items, setItems] = useState<Noticia[]>([])

  async function fetchData() {
    try {
      // 1) Intenta noticias del dia
      const inicioHoy = new Date()
      inicioHoy.setHours(0, 0, 0, 0)
      const hoyISO = inicioHoy.toISOString()
      let { data } = await supabase
        .from('noticias_transporte')
        .select('id, fuente, titulo, url, publicado_at')
        .eq('relevante', true)
        .gte('publicado_at', hoyISO)
        .order('publicado_at', { ascending: false })
        .limit(15)
      // 2) Si nada hoy, ultimos 7 dias
      if (!data || data.length === 0) {
        const hace7d = new Date(Date.now() - 7 * 86400000).toISOString()
        const fb = await supabase
          .from('noticias_transporte')
          .select('id, fuente, titulo, url, publicado_at')
          .eq('relevante', true)
          .gte('publicado_at', hace7d)
          .order('publicado_at', { ascending: false })
          .limit(15)
        data = fb.data
      }
      setItems((data as Noticia[]) || [])
    } catch (e) {
      console.warn('MarqueeNoticias: error fetch', e)
    }
  }

  useEffect(() => {
    fetchData()
    // Refresh cada 5 min mientras esta visible
    const itv = setInterval(() => {
      if (document.visibilityState === 'visible') fetchData()
    }, 5 * 60 * 1000)
    return () => clearInterval(itv)
  }, [])

  if (items.length === 0) return null

  const tickerOnce = items
    .map(n => `📰 ${n.fuente.toUpperCase()}: ${n.titulo}`)
    .join('     ●     ') + '     ●     '

  // Click handler delega al elemento padre via data attribute
  // Para no perder simplicidad, todo el ticker abre la primer noticia
  // (los usuarios pueden ir a /comunicaciones/noticias para lista completa - futuro)

  return (
    <div style={{
      width: '100vw',
      marginLeft: 'calc(50% - 50vw)',
      marginRight: 'calc(50% - 50vw)',
      background: AZUL_OSCURO,
      color: '#FFFFFF',
      padding: '18px 0',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      borderRadius: 0,
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 600,
      fontSize: '17px',
      letterSpacing: '0.02em',
      position: 'relative',
      cursor: 'pointer',
    }}
    onClick={() => {
      if (items[0]?.url) window.open(items[0].url, '_blank', 'noopener,noreferrer')
    }}>
      <div style={{
        display: 'inline-flex',
        animation: 'lhub-marquee-noticias 110s linear infinite',
        willChange: 'transform',
      }}>
        <span>{tickerOnce}</span>
        <span>{tickerOnce}</span>
      </div>
      <style>{`
        @keyframes lhub-marquee-noticias {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>
    </div>
  )
}
