// V53 (Tarea #16 — 27/Abr/2026) — Editor de qué se muestra en la cenefa rosa del dashboard
// Toggle activo/inactivo + drag-and-drop para reordenar (V1 sin DnD, solo toggle)

import { useState, useEffect } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/ui/Toast'
import { Loader } from 'lucide-react'

interface CenefaItem {
  id: string
  key: string
  label: string
  formato: string
  activo: boolean
  orden: number
}

export default function CenefaConfig() {
  const [items, setItems] = useState<CenefaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data } = await supabase.from('dashboard_cenefa_config').select('*').order('orden')
      setItems((data as CenefaItem[]) || [])
    } catch (e: any) {
      toast.error('Error: ' + (e?.message || 'desconocido'))
    } finally { setLoading(false) }
  }

  async function toggleActivo(item: CenefaItem) {
    setSaving(true)
    try {
      const { error } = await supabase.from('dashboard_cenefa_config').update({ activo: !item.activo }).eq('id', item.id)
      if (error) throw error
      toast.success(`${item.label}: ${!item.activo ? 'activado' : 'desactivado'}`)
      await load()
    } catch (e: any) {
      toast.error('Error: ' + (e?.message || 'desconocido'))
    } finally { setSaving(false) }
  }

  return (
    <ModuleLayout
      titulo="Cenefa Dashboard"
      subtitulo="Configura qué información se muestra en el ticker rosa del dashboard principal"
    >
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' as const }}>
          <Loader size={28} style={{ color: tokens.colors.textMuted, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ background: tokens.colors.bgCard, border: '1px solid ' + tokens.colors.border, borderRadius: 12, overflow: 'hidden' }}>
          {items.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' as const, color: tokens.colors.textMuted }}>
              No hay configuración de cenefa todavía. Ejecuta el SQL de inicialización.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
              <thead style={{ background: tokens.colors.bgHover }}>
                <tr>
                  <th style={{ padding: 12, textAlign: 'center' as const, width: 60 }}>Orden</th>
                  <th style={{ padding: 12, textAlign: 'left' as const, fontSize: 11, textTransform: 'uppercase' as const }}>Campo</th>
                  <th style={{ padding: 12, textAlign: 'left' as const, fontSize: 11, textTransform: 'uppercase' as const }}>Formato</th>
                  <th style={{ padding: 12, textAlign: 'center' as const, fontSize: 11, textTransform: 'uppercase' as const, width: 100 }}>Activo</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id} style={{ borderTop: '1px solid ' + tokens.colors.border }}>
                    <td style={{ padding: 12, textAlign: 'center' as const, color: tokens.colors.textMuted }}>{it.orden}</td>
                    <td style={{ padding: 12, fontWeight: 600 }}>{it.label} <code style={{ marginLeft: 8, fontSize: 11, color: tokens.colors.textMuted }}>{it.key}</code></td>
                    <td style={{ padding: 12, color: tokens.colors.textSecondary }}>{it.formato}</td>
                    <td style={{ padding: 12, textAlign: 'center' as const }}>
                      <button
                        onClick={() => void toggleActivo(it)}
                        disabled={saving}
                        style={{
                          padding: '6px 14px', borderRadius: 14, border: 'none',
                          background: it.activo ? '#10B981' : '#94A3B8',
                          color: '#FFF', fontWeight: 700, fontSize: 11, cursor: 'pointer',
                        }}
                      >
                        {it.activo ? 'ACTIVO' : 'INACTIVO'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </ModuleLayout>
  )
}
