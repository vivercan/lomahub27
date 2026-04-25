// InventarioObjetivoConfig.tsx — CRUD para terminal_inventario_objetivo
// Define cuántas cajas (secas / thermos) DEBE haber en cada terminal.
// Default 2 secas + 2 thermos por terminal. Editable inline.
import { useState, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../../lib/supabase'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'
import { Loader2, Save, CheckCircle, AlertCircle, Package, Snowflake } from 'lucide-react'

interface Terminal {
  id: string
  nombre: string
  empresa: string | null
  activa: boolean
}

interface Objetivo {
  id?: string
  terminal_id: string
  tipo_caja: 'seca' | 'thermo'
  cantidad_objetivo: number
}

interface RowData {
  terminal: Terminal
  secas: number
  thermos: number
  secasOrig: number
  thermosOrig: number
  dirty: boolean
}

export default function InventarioObjetivoConfig() {
  const [rows, setRows] = useState<RowData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [tRes, oRes] = await Promise.all([
        supabase.from('terminales').select('id, nombre, empresa, activa').eq('activa', true).order('nombre'),
        supabase.from('terminal_inventario_objetivo').select('*'),
      ])

      if (tRes.error) throw tRes.error

      const terminales = (tRes.data || []) as Terminal[]
      const objetivos = (oRes.data || []) as Objetivo[]

      const merged: RowData[] = terminales.map(t => {
        const sec = objetivos.find(o => o.terminal_id === t.id && o.tipo_caja === 'seca')
        const thr = objetivos.find(o => o.terminal_id === t.id && o.tipo_caja === 'thermo')
        const secas = sec?.cantidad_objetivo ?? 2
        const thermos = thr?.cantidad_objetivo ?? 2
        return { terminal: t, secas, thermos, secasOrig: secas, thermosOrig: thermos, dirty: false }
      })

      setRows(merged)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t) }
  }, [success])

  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t) }
  }, [error])

  const updateRow = (idx: number, field: 'secas' | 'thermos', value: number) => {
    const v = Math.max(0, Math.floor(value || 0))
    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r
      const next = { ...r, [field]: v }
      next.dirty = next.secas !== next.secasOrig || next.thermos !== next.thermosOrig
      return next
    }))
  }

  const saveRow = async (idx: number) => {
    const row = rows[idx]
    if (!row.dirty) return
    try {
      setSaving(true)
      setError(null)

      // Upsert seca
      const upSec = await supabase.from('terminal_inventario_objetivo')
        .upsert({
          terminal_id: row.terminal.id,
          tipo_caja: 'seca',
          cantidad_objetivo: row.secas,
        }, { onConflict: 'terminal_id,tipo_caja' })
      if (upSec.error) throw upSec.error

      // Upsert thermo
      const upThr = await supabase.from('terminal_inventario_objetivo')
        .upsert({
          terminal_id: row.terminal.id,
          tipo_caja: 'thermo',
          cantidad_objetivo: row.thermos,
        }, { onConflict: 'terminal_id,tipo_caja' })
      if (upThr.error) throw upThr.error

      setRows(prev => prev.map((r, i) => i === idx
        ? { ...r, secasOrig: r.secas, thermosOrig: r.thermos, dirty: false }
        : r))
      setSuccess(`Inventario de "${row.terminal.nombre}" guardado`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando')
    } finally {
      setSaving(false)
    }
  }

  const saveAll = async () => {
    const dirtyRows = rows.filter(r => r.dirty)
    if (dirtyRows.length === 0) return
    try {
      setSaving(true)
      setError(null)

      const payload = dirtyRows.flatMap(r => [
        { terminal_id: r.terminal.id, tipo_caja: 'seca', cantidad_objetivo: r.secas },
        { terminal_id: r.terminal.id, tipo_caja: 'thermo', cantidad_objetivo: r.thermos },
      ])

      const { error: err } = await supabase.from('terminal_inventario_objetivo')
        .upsert(payload, { onConflict: 'terminal_id,tipo_caja' })
      if (err) throw err

      setRows(prev => prev.map(r => r.dirty
        ? { ...r, secasOrig: r.secas, thermosOrig: r.thermos, dirty: false }
        : r))
      setSuccess(`${dirtyRows.length} terminales guardadas`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando')
    } finally {
      setSaving(false)
    }
  }

  const totalDirty = rows.filter(r => r.dirty).length
  const totalSecas = rows.reduce((s, r) => s + r.secas, 0)
  const totalThermos = rows.reduce((s, r) => s + r.thermos, 0)

  return (
    <ModuleLayout
      titulo="Inventario Objetivo por Terminal"
      subtitulo={`${rows.length} terminales · ${totalSecas} secas + ${totalThermos} thermos objetivo`}
      moduloPadre={{ label: 'Configuración', ruta: '/admin/configuracion' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>

        {/* Flash messages */}
        {success && (
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: 'rgba(16,185,129,0.08)',
            border: `1px solid ${tokens.colors.green}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <CheckCircle size={16} color={tokens.colors.green} />
            <span style={{ color: tokens.colors.green, fontSize: 13, fontWeight: 500 }}>{success}</span>
          </div>
        )}
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: 'rgba(239,68,68,0.08)',
            border: `1px solid ${tokens.colors.red}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertCircle size={16} color={tokens.colors.red} />
            <span style={{ color: tokens.colors.red, fontSize: 13, fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{
            margin: 0, fontSize: 13, color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body,
          }}>
            Define cuántas cajas <b>secas</b> y <b>thermos</b> debe tener cada terminal.
            Los inventarios reales se comparan contra este objetivo en <b>Control de Equipo → Inventarios</b>.
          </p>
          <button
            onClick={saveAll}
            disabled={totalDirty === 0 || saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 10,
              background: totalDirty > 0 ? tokens.colors.primary : '#CBD5E1',
              color: '#FFFFFF', border: 'none',
              fontSize: 13, fontWeight: 600, fontFamily: tokens.fonts.body,
              cursor: totalDirty > 0 && !saving ? 'pointer' : 'not-allowed',
              transition: 'all 0.18s ease',
            }}
          >
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            Guardar todo {totalDirty > 0 && `(${totalDirty})`}
          </button>
        </div>

        {loading ? (
          <div style={{
            background: '#FFFFFF', border: `1px solid ${tokens.colors.border}`, borderRadius: 12,
            padding: 60, textAlign: 'center',
          }}>
            <Loader2 size={28} color={tokens.colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 12, color: tokens.colors.textSecondary, fontSize: 14 }}>Cargando inventarios...</p>
          </div>
        ) : rows.length === 0 ? (
          <div style={{
            background: '#FFFFFF', border: `1px solid ${tokens.colors.border}`, borderRadius: 12,
            padding: 60, textAlign: 'center',
          }}>
            <p style={{ color: tokens.colors.textMuted, fontSize: 14, margin: 0 }}>
              No hay terminales activas. Agrégalas en <b>Configuración → Terminales</b>.
            </p>
          </div>
        ) : (
          <div style={{
            background: '#FFFFFF', border: `1px solid ${tokens.colors.border}`, borderRadius: 12,
            overflow: 'auto', flex: 1,
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: tokens.fonts.body, fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={th}>Terminal</th>
                  <th style={th}>Empresa</th>
                  <th style={{ ...th, textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#F97316' }}>
                      <Package size={14} /> Secas objetivo
                    </div>
                  </th>
                  <th style={{ ...th, textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0891B2' }}>
                      <Snowflake size={14} /> Thermos objetivo
                    </div>
                  </th>
                  <th style={{ ...th, textAlign: 'right', width: 120 }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.terminal.id} style={{
                    borderTop: `1px solid ${tokens.colors.border}`,
                    background: r.dirty ? 'rgba(59,108,231,0.04)' : 'transparent',
                  }}>
                    <td style={{ ...td, fontWeight: 600, color: tokens.colors.textPrimary }}>
                      {r.terminal.nombre}
                    </td>
                    <td style={{ ...td, color: tokens.colors.textSecondary }}>
                      {r.terminal.empresa || '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <input
                        type="number"
                        min={0}
                        value={r.secas}
                        onChange={e => updateRow(idx, 'secas', parseInt(e.target.value, 10))}
                        style={inputNum}
                      />
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <input
                        type="number"
                        min={0}
                        value={r.thermos}
                        onChange={e => updateRow(idx, 'thermos', parseInt(e.target.value, 10))}
                        style={inputNum}
                      />
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <button
                        onClick={() => saveRow(idx)}
                        disabled={!r.dirty || saving}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px', borderRadius: 8,
                          background: r.dirty ? tokens.colors.green : '#CBD5E1',
                          color: '#FFFFFF', border: 'none',
                          fontSize: 12, fontWeight: 600,
                          cursor: r.dirty && !saving ? 'pointer' : 'not-allowed',
                        }}
                      >
                        <Save size={12} /> Guardar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </ModuleLayout>
  )
}

const th: CSSProperties = {
  padding: '12px 14px', textAlign: 'left',
  fontSize: 11, fontWeight: 700,
  color: tokens.colors.textSecondary,
  textTransform: 'uppercase', letterSpacing: '0.06em',
  borderBottom: `2px solid ${tokens.colors.border}`,
}
const td: CSSProperties = {
  padding: '12px 14px',
  color: tokens.colors.textPrimary,
}
const inputNum: CSSProperties = {
  width: 70, padding: '6px 10px',
  border: `1px solid ${tokens.colors.border}`,
  borderRadius: 8, fontSize: 13, fontFamily: tokens.fonts.body,
  textAlign: 'center', outline: 'none',
  color: tokens.colors.textPrimary,
  background: '#F8FAFC',
}
