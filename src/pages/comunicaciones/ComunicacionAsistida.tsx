// V53 (Tarea #8 — 27/Abr/2026)
// Fusión de Comunicación Proactiva + Escalamiento WhatsApp en un solo módulo.
// Tabs internos para alternar. Default: proactiva.
// Los archivos originales (servicio/ComunicacionProactiva, EscalamientoWhatsApp)
// quedan SOFT DEPRECATED — siguen funcionando vía redirect legacy en App.tsx.

import { useState, useEffect, lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'

const ComunicacionProactiva = lazy(() => import('../servicio/ComunicacionProactiva'))
const EscalamientoWhatsApp = lazy(() => import('../servicio/EscalamientoWhatsApp'))

type TabKey = 'proactiva' | 'escalamiento'

export default function ComunicacionAsistida() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab: TabKey = (searchParams.get('tab') === 'escalamiento') ? 'escalamiento' : 'proactiva'
  const [tab, setTab] = useState<TabKey>(initialTab)

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    setSearchParams(next, { replace: true })
  }, [tab])

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    borderRadius: 8,
    border: '1px solid ' + (active ? tokens.colors.primary : 'transparent'),
    background: active ? tokens.colors.primary : 'transparent',
    color: active ? '#FFFFFF' : tokens.colors.textSecondary,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: tokens.fonts.body,
    transition: 'all 0.18s ease',
  })

  return (
    <ModuleLayout
      titulo="Comunicación Asistida"
      subtitulo="Alertas proactivas + escalamientos de tickets vía WhatsApp"
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, padding: 4, background: tokens.colors.bgMain, borderRadius: 10, width: 'fit-content' }}>
        <button style={tabBtn(tab === 'proactiva')} onClick={() => setTab('proactiva')}>Comunicación Proactiva</button>
        <button style={tabBtn(tab === 'escalamiento')} onClick={() => setTab('escalamiento')}>Escalamiento WhatsApp</button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Suspense fallback={<div style={{ padding: 32, textAlign: 'center', color: tokens.colors.textMuted }}>Cargando…</div>}>
          {tab === 'proactiva' ? <ComunicacionProactiva /> : <EscalamientoWhatsApp />}
        </Suspense>
      </div>
    </ModuleLayout>
  )
}
