// V53 (Tarea #16 — 27/Abr/2026)
// Cenefa rosa mexicano con marquee horizontal de metas vs avance por vendedor.
// Lee tabla metas_vendedores + cruza con formatos_venta del mes para calcular avance.
// Auto-refresh cada 30s.

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface MetaVendedor {
  vendedor_email: string
  meta_ventas_mxn: number
  meta_impos_diarias: number
  meta_expos_diarias: number
  meta_impos_semanales: number
  meta_expos_semanales: number
}

interface VendedorAvance {
  email: string
  nombre: string
  meta: number
  avance_mxn: number
  pct: number
  impos_hoy: number
  expos_hoy: number
}

const ROSA_MEX = '#E91E63'
const ROSA_MEX_DARK = '#AD1457'

function formatName(email: string): string {
  if (!email) return ''
  const n = email.split('@')[0]
  return n.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

const fmtMoney = (n: number) => '$' + (n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })

export function MarqueeMetas() {
  const [items, setItems] = useState<VendedorAvance[]>([])

  async function fetchData() {
    try {
      const ahora = new Date()
      const mes = ahora.getMonth() + 1
      const anio = ahora.getFullYear()
      const inicioMes = new Date(anio, mes - 1, 1).toISOString()
      const inicioHoy = new Date(anio, ahora.getMonth(), ahora.getDate()).toISOString()

      const [metasRes, ventasMesRes, ventasHoyRes] = await Promise.all([
        supabase.from('metas_vendedores').select('*').eq('mes', mes).eq('anio', anio),
        supabase.from('formatos_venta').select('vendedor_email, monto_total, tipo_servicio').gte('fecha_facturacion', inicioMes),
        supabase.from('formatos_venta').select('vendedor_email, tipo_servicio').gte('fecha_facturacion', inicioHoy),
      ])
      const metas: MetaVendedor[] = (metasRes.data as any) || []
      const ventasMes: any[] = (ventasMesRes.data as any) || []
      const ventasHoy: any[] = (ventasHoyRes.data as any) || []

      const vendedores: VendedorAvance[] = metas.map(m => {
        const email = m.vendedor_email
        const ventasV = ventasMes.filter(v => v.vendedor_email === email)
        const avance_mxn = ventasV.reduce((s, v) => s + (Number(v.monto_total) || 0), 0)
        const pct = m.meta_ventas_mxn > 0 ? Math.round((avance_mxn / m.meta_ventas_mxn) * 100) : 0
        const ventasHoyV = ventasHoy.filter(v => v.vendedor_email === email)
        const impos_hoy = ventasHoyV.filter(v => String(v.tipo_servicio).toUpperCase() === 'IMPO').length
        const expos_hoy = ventasHoyV.filter(v => String(v.tipo_servicio).toUpperCase() === 'EXPO').length
        return { email, nombre: formatName(email), meta: m.meta_ventas_mxn, avance_mxn, pct, impos_hoy, expos_hoy }
      })
      setItems(vendedores)
    } catch (e) {
      // Silent fail — la cenefa puede no mostrar nada si la tabla aún no existe
      console.warn('MarqueeMetas: tabla metas_vendedores aún no creada o error', e)
    }
  }

  useEffect(() => {
    fetchData()
    const itv = setInterval(() => {
      if (document.visibilityState === 'visible') fetchData()
    }, 30000)
    return () => clearInterval(itv)
  }, [])

  if (items.length === 0) return null

  // Construir el contenido del ticker concatenando todos los vendedores
  const ticker = items.map(v =>
    `${v.nombre} · ${v.pct}% meta (${fmtMoney(v.avance_mxn)} de ${fmtMoney(v.meta)}) · ${v.impos_hoy} IMPO hoy · ${v.expos_hoy} EXPO hoy`
  ).join('  ◆  ')

  return (
    <div style={{
      width: '100%',
      background: `linear-gradient(180deg, ${ROSA_MEX} 0%, ${ROSA_MEX_DARK} 100%)`,
      color: '#FFFFFF',
      padding: '10px 0',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      borderRadius: '10px',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.20), 0 4px 12px rgba(233,30,99,0.30)',
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 600,
      fontSize: '14px',
      letterSpacing: '0.02em',
      position: 'relative',
    }}>
      <div style={{
        display: 'inline-block',
        paddingLeft: '100%',
        animation: 'lhub-marquee-metas 60s linear infinite',
      }}>
        {ticker}  ◆  {ticker}
      </div>
      <style>{`
        @keyframes lhub-marquee-metas {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  )
}
