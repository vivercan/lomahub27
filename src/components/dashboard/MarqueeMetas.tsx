// V57 (28/Abr/2026) — Cenefa por vendedor: solo SUS metas + verde + doble alto
// JJ pidio:
//  - Color verde #29ED22 (no rosa) con texto blanco + sombra oscura para contraste
//  - Doble de alto (padding 24px vs 12px)
//  - Tipografia mas grande (18px vs 14px)
//  - 10% mas rapido (108s vs 120s)
//  - Solo meta venta + IMPO + EXPO + Prioridad de la semana
//  - Sin nombres del vendedor (cada vendedor ve solo lo suyo, asi que es redundante)
//  - Para superadmin (JJ): muestra Isis para validar resultado

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/AuthContext'

interface MetaVendedor {
  vendedor_email: string
  meta_ventas_mxn: number
  meta_impos_diarias: number
  meta_expos_diarias: number
  meta_impos_semanales: number
  meta_expos_semanales: number
}

interface MiAvance {
  meta: number
  avance_mxn: number
  pct: number
  impos_hoy: number
  expos_hoy: number
}

const VERDE_BRILLANTE = '#29ED22'
const PRIORIDAD_SEMANA = 'PROSPECCION DE CLIENTES IMPO SECA Y REFRIGERADA'

const fmtMoney = (n: number) => '$' + (n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })

export function MarqueeMetas() {
  const { user } = useAuthContext()
  const [data, setData] = useState<MiAvance | null>(null)

  // Para superadmin (JJ) muestra la perspectiva de Isis para validar
  const emailObjetivo = user?.rol === 'superadmin'
    ? 'isis@trob.com.mx'
    : (user?.email || '')

  async function fetchData() {
    if (!emailObjetivo) return
    try {
      const ahora = new Date()
      const mes = ahora.getMonth() + 1
      const anio = ahora.getFullYear()
      const inicioMes = new Date(anio, mes - 1, 1).toISOString()
      const inicioHoy = new Date(anio, ahora.getMonth(), ahora.getDate()).toISOString()

      const [metaRes, ventasMesRes, ventasHoyRes] = await Promise.all([
        supabase.from('metas_vendedores').select('*')
          .eq('mes', mes).eq('anio', anio).eq('vendedor_email', emailObjetivo).maybeSingle(),
        supabase.from('formatos_venta').select('monto_total, tipo_servicio')
          .eq('vendedor_email', emailObjetivo).gte('fecha_facturacion', inicioMes),
        supabase.from('formatos_venta').select('tipo_servicio')
          .eq('vendedor_email', emailObjetivo).gte('fecha_facturacion', inicioHoy),
      ])

      const meta = (metaRes.data as MetaVendedor | null) || null
      const ventasMes: any[] = (ventasMesRes.data as any) || []
      const ventasHoy: any[] = (ventasHoyRes.data as any) || []

      const metaMxn = meta?.meta_ventas_mxn || 0
      const avance_mxn = ventasMes.reduce((s, v) => s + (Number(v.monto_total) || 0), 0)
      const pct = metaMxn > 0 ? Math.round((avance_mxn / metaMxn) * 100) : 0
      const impos_hoy = ventasHoy.filter(v => String(v.tipo_servicio).toUpperCase() === 'IMPO').length
      const expos_hoy = ventasHoy.filter(v => String(v.tipo_servicio).toUpperCase() === 'EXPO').length

      setData({ meta: metaMxn, avance_mxn, pct, impos_hoy, expos_hoy })
    } catch (e) {
      console.warn('MarqueeMetas: error fetch', e)
    }
  }

  useEffect(() => {
    fetchData()
    const itv = setInterval(() => {
      if (document.visibilityState === 'visible') fetchData()
    }, 30000)
    return () => clearInterval(itv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailObjetivo])

  if (!data) return null

  // Texto del ticker SIN nombre — cada vendedor solo ve lo suyo
  const tickerOnce = [
    `META VENTA: ${data.pct}%  ·  ${fmtMoney(data.avance_mxn)} de ${fmtMoney(data.meta)}`,
    `IMPO HOY: ${data.impos_hoy}`,
    `EXPO HOY: ${data.expos_hoy}`,
    `PRIORIDAD DE LA SEMANA: ${PRIORIDAD_SEMANA}`,
  ].join('     ◆     ')
  const ticker = `${tickerOnce}     ◆     ${tickerOnce}     ◆     ${tickerOnce}`

  return (
    <div style={{
      width: '100vw',
      marginLeft: 'calc(50% - 50vw)',
      marginRight: 'calc(50% - 50vw)',
      background: VERDE_BRILLANTE,
      color: '#FFFFFF',
      // Doble de alto: padding 24px vs 12px previo
      padding: '24px 0',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      borderRadius: 0,
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 800,
      // Tipografia mas grande: 18px vs 14px
      fontSize: '18px',
      letterSpacing: '0.04em',
      // Sombra oscura fuerte para que blanco se lea sobre verde brillante
      textShadow: '0 1px 2px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.7)',
      // Linea oscura arriba/abajo para enmarcar
      borderTop: '2px solid rgba(0,0,0,0.25)',
      borderBottom: '2px solid rgba(0,0,0,0.25)',
      position: 'relative',
    }}>
      <div style={{
        display: 'inline-block',
        paddingLeft: '100%',
        // 10% mas rapido: 120s -> 108s
        animation: 'lhub-marquee-metas 108s linear infinite',
        willChange: 'transform',
      }}>
        {ticker}
      </div>
      <style>{`
        @keyframes lhub-marquee-metas {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-33.333%, 0, 0); }
        }
      `}</style>
    </div>
  )
}
