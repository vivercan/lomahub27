// V52 (FIX 31) - 26/Abr/2026 - Modulo Comisiones por Ejecutivo
// Llama edge fn comisiones-ejecutivo (ya deployed) que cruza viajes con ejecutivos
// y aplica % comision desde parametros_sistema.

import { useState, useEffect } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { Loader, Calculator, TrendingUp, Award } from 'lucide-react'

interface ComisionRow {
  ejecutivo_id: string
  ejecutivo_nombre: string
  total_viajes: number
  total_ingreso: number
  total_comision: number
  pct_aplicado: number
}

export default function Comisiones() {
  const [data, setData] = useState<ComisionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const { data: result, error: err } = await supabase.functions.invoke('comisiones-ejecutivo', {
          body: { mes, anio }
        })
        if (err) throw err
        if (!mounted) return
        setData((result?.comisiones || []) as ComisionRow[])
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Error calculando comisiones')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [mes, anio])

  const totalComisionesGlobal = data.reduce((sum, r) => sum + (r.total_comision || 0), 0)
  const totalIngresoGlobal = data.reduce((sum, r) => sum + (r.total_ingreso || 0), 0)
  const totalViajesGlobal = data.reduce((sum, r) => sum + (r.total_viajes || 0), 0)

  const formatCurrency = (n: number) => `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  return (
    <ModuleLayout
      titulo="Comisiones por Ejecutivo"
      subtitulo={`Calculo automatico desde edge fn comisiones-ejecutivo - ${meses[mes-1]} ${anio}`}
      acciones={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} style={{
            padding: '7px 12px', borderRadius: 8, border: '1px solid ' + tokens.colors.border,
            background: tokens.colors.bgCard, color: tokens.colors.textPrimary, fontSize: 13,
          }}>
            {meses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={anio} onChange={e => setAnio(Number(e.target.value))} style={{
            padding: '7px 12px', borderRadius: 8, border: '1px solid ' + tokens.colors.border,
            background: tokens.colors.bgCard, color: tokens.colors.textPrimary, fontSize: 13,
          }}>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      }
    >
      {/* KPIs globales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
        <div style={{
          background: tokens.colors.bgCard, border: '1px solid ' + tokens.colors.border,
          borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Calculator size={24} style={{ color: tokens.colors.primary }} />
          <div>
            <div style={{ fontSize: 11, color: tokens.colors.textMuted, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>Comisiones del mes</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: tokens.colors.textPrimary, marginTop: 2 }}>{formatCurrency(totalComisionesGlobal)}</div>
          </div>
        </div>
        <div style={{
          background: tokens.colors.bgCard, border: '1px solid ' + tokens.colors.border,
          borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <TrendingUp size={24} style={{ color: tokens.colors.green }} />
          <div>
            <div style={{ fontSize: 11, color: tokens.colors.textMuted, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>Ingreso del mes</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: tokens.colors.textPrimary, marginTop: 2 }}>{formatCurrency(totalIngresoGlobal)}</div>
          </div>
        </div>
        <div style={{
          background: tokens.colors.bgCard, border: '1px solid ' + tokens.colors.border,
          borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Award size={24} style={{ color: tokens.colors.yellow }} />
          <div>
            <div style={{ fontSize: 11, color: tokens.colors.textMuted, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>Viajes facturados</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: tokens.colors.textPrimary, marginTop: 2 }}>{totalViajesGlobal}</div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.30)',
          color: '#B91C1C', fontSize: 13, marginBottom: 14,
        }}>Error: {error}</div>
      )}

      {/* Tabla detalle por ejecutivo */}
      <div style={{ background: tokens.colors.bgCard, border: '1px solid ' + tokens.colors.border, borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' as const }}>
            <Loader size={28} style={{ color: tokens.colors.textMuted, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : data.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' as const, color: tokens.colors.textMuted, fontSize: 13 }}>
            Sin comisiones para este periodo. Verifica que existen viajes facturados con ejecutivo asignado.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
            <thead>
              <tr style={{ background: tokens.colors.bgHover, color: tokens.colors.textSecondary }}>
                <th style={{ padding: 12, textAlign: 'left' as const, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>Ejecutivo</th>
                <th style={{ padding: 12, textAlign: 'right' as const, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>Viajes</th>
                <th style={{ padding: 12, textAlign: 'right' as const, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>Ingreso</th>
                <th style={{ padding: 12, textAlign: 'right' as const, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>% aplicado</th>
                <th style={{ padding: 12, textAlign: 'right' as const, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>Comision</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.ejecutivo_id} style={{ borderTop: '1px solid ' + tokens.colors.border }}>
                  <td style={{ padding: 12, color: tokens.colors.textPrimary, fontWeight: 600 }}>{row.ejecutivo_nombre || '—'}</td>
                  <td style={{ padding: 12, textAlign: 'right' as const, color: tokens.colors.textPrimary }}>{row.total_viajes}</td>
                  <td style={{ padding: 12, textAlign: 'right' as const, color: tokens.colors.textPrimary }}>{formatCurrency(row.total_ingreso)}</td>
                  <td style={{ padding: 12, textAlign: 'right' as const, color: tokens.colors.textMuted }}>{row.pct_aplicado}%</td>
                  <td style={{ padding: 12, textAlign: 'right' as const, color: tokens.colors.green, fontWeight: 700 }}>{formatCurrency(row.total_comision)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ModuleLayout>
  )
}
