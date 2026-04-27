// V53 (Tarea #16 — 27/Abr/2026) — Configuración de metas mensuales de vendedores
// Tabla editable. Selector de mes/año. Tracking automático en metas_vendedores_historial.

import { useState, useEffect } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/ui/Toast'
import { Loader, Save, History } from 'lucide-react'

interface Vendedor { id: string; email: string; nombre: string | null }
interface Meta {
  id?: string
  vendedor_email: string
  mes: number
  anio: number
  meta_ventas_mxn: number
  meta_impos_diarias: number
  meta_expos_diarias: number
  meta_impos_semanales: number
  meta_expos_semanales: number
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function MetasVendedoresConfig() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [metas, setMetas] = useState<Record<string, Meta>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())

  useEffect(() => { void load() }, [mes, anio])

  async function load() {
    setLoading(true)
    try {
      const [vRes, mRes] = await Promise.all([
        supabase.from('usuarios_autorizados').select('id, email, nombre').eq('rol', 'ventas').eq('activo', true).order('nombre'),
        supabase.from('metas_vendedores').select('*').eq('mes', mes).eq('anio', anio),
      ])
      setVendedores((vRes.data as Vendedor[]) || [])
      const map: Record<string, Meta> = {}
      for (const m of ((mRes.data as Meta[]) || [])) map[m.vendedor_email] = m
      setMetas(map)
    } catch (e: any) {
      toast.error('Error cargando: ' + (e?.message || 'desconocido'))
    } finally { setLoading(false) }
  }

  function setField(email: string, field: keyof Meta, value: number) {
    setMetas(prev => ({
      ...prev,
      [email]: {
        ...(prev[email] || { vendedor_email: email, mes, anio, meta_ventas_mxn: 0, meta_impos_diarias: 0, meta_expos_diarias: 0, meta_impos_semanales: 0, meta_expos_semanales: 0 }),
        [field]: value,
      } as Meta
    }))
  }

  async function saveOne(email: string) {
    setSaving(email)
    try {
      const m = metas[email]
      if (!m) return
      const payload = { ...m, mes, anio, vendedor_email: email }
      const { error } = await supabase.from('metas_vendedores').upsert(payload, { onConflict: 'vendedor_email,mes,anio' })
      if (error) throw error
      toast.success(`Meta de ${email} guardada`)
      await load()
    } catch (e: any) {
      toast.error('Error guardando: ' + (e?.message || 'desconocido'))
    } finally { setSaving(null) }
  }

  const cellInput: React.CSSProperties = {
    width: '100%', padding: '6px 10px', fontSize: 13,
    border: '1px solid ' + tokens.colors.border, borderRadius: 6,
    background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
    fontFamily: tokens.fonts.body,
  }

  return (
    <ModuleLayout
      titulo="Metas de Vendedores"
      subtitulo={`${MESES[mes-1]} ${anio} · Editable con tracking automático en historial`}
      acciones={
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid ' + tokens.colors.border }}>
            {MESES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={anio} onChange={e => setAnio(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid ' + tokens.colors.border }}>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      }
    >
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' as const }}>
          <Loader size={28} style={{ color: tokens.colors.textMuted, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ background: tokens.colors.bgCard, border: '1px solid ' + tokens.colors.border, borderRadius: 12, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
            <thead style={{ background: tokens.colors.bgHover }}>
              <tr>
                <th style={{ padding: 12, textAlign: 'left' as const, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' as const }}>Vendedor</th>
                <th style={{ padding: 12, textAlign: 'right' as const, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' as const }}>Meta $ MXN</th>
                <th style={{ padding: 12, textAlign: 'right' as const, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' as const }}>IMPO/día</th>
                <th style={{ padding: 12, textAlign: 'right' as const, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' as const }}>EXPO/día</th>
                <th style={{ padding: 12, textAlign: 'right' as const, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' as const }}>IMPO/sem</th>
                <th style={{ padding: 12, textAlign: 'right' as const, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' as const }}>EXPO/sem</th>
                <th style={{ padding: 12, width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {vendedores.map(v => {
                const m = metas[v.email] || { vendedor_email: v.email, mes, anio, meta_ventas_mxn: 0, meta_impos_diarias: 0, meta_expos_diarias: 0, meta_impos_semanales: 0, meta_expos_semanales: 0 }
                return (
                  <tr key={v.email} style={{ borderTop: '1px solid ' + tokens.colors.border }}>
                    <td style={{ padding: 10, fontWeight: 600 }}>{v.nombre || v.email}</td>
                    <td style={{ padding: 10 }}><input type="number" value={m.meta_ventas_mxn} onChange={e => setField(v.email, 'meta_ventas_mxn', Number(e.target.value))} style={{ ...cellInput, textAlign: 'right' as const }} /></td>
                    <td style={{ padding: 10 }}><input type="number" value={m.meta_impos_diarias} onChange={e => setField(v.email, 'meta_impos_diarias', Number(e.target.value))} style={{ ...cellInput, textAlign: 'right' as const }} /></td>
                    <td style={{ padding: 10 }}><input type="number" value={m.meta_expos_diarias} onChange={e => setField(v.email, 'meta_expos_diarias', Number(e.target.value))} style={{ ...cellInput, textAlign: 'right' as const }} /></td>
                    <td style={{ padding: 10 }}><input type="number" value={m.meta_impos_semanales} onChange={e => setField(v.email, 'meta_impos_semanales', Number(e.target.value))} style={{ ...cellInput, textAlign: 'right' as const }} /></td>
                    <td style={{ padding: 10 }}><input type="number" value={m.meta_expos_semanales} onChange={e => setField(v.email, 'meta_expos_semanales', Number(e.target.value))} style={{ ...cellInput, textAlign: 'right' as const }} /></td>
                    <td style={{ padding: 10, textAlign: 'center' as const }}>
                      <button onClick={() => saveOne(v.email)} disabled={saving === v.email} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: tokens.colors.primary, color: '#FFF', fontWeight: 600, cursor: 'pointer', fontSize: 12, display: 'inline-flex', alignItems: 'center' as const, gap: 4 }}>
                        <Save size={12} /> {saving === v.email ? '…' : 'Guardar'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: 14, padding: 12, background: 'rgba(59,108,231,0.06)', border: '1px solid rgba(59,108,231,0.20)', borderRadius: 10, color: tokens.colors.textSecondary, fontSize: 12 }}>
        <History size={12} style={{ display: 'inline-block' as const, verticalAlign: 'middle' as const, marginRight: 6 }} />
        Cada cambio se registra en <code>metas_vendedores_historial</code> automáticamente vía trigger SQL.
      </div>
    </ModuleLayout>
  )
}
