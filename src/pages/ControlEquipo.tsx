import { useEffect, useMemo, useRef, useState } from 'react'
import { ModuleLayout } from '../components/layout/ModuleLayout'
import { Card } from '../components/ui/Card'
import { tokens } from '../lib/tokens'
import { supabase } from '../lib/supabase'

/* ———————————————————————————————————————————————————————————————
   CONTROL DE EQUIPO — Inventario + Mapa de Cajas
   Fuente de verdad: tabla `cajas` (catálogo maestro ~283 registros)
   Enriquecimiento GPS: tabla `gps_tracking` (tipo_unidad = 'caja')
   ——————————————————————————————————————————————————————————————— */

interface CajaRecord {
  id: string
  numero_economico: string
  empresa: string
  tipo: string
  estado: string
  latitud: number | null
  longitud: number | null
  velocidad: number
  ubicacion: string
  ultimaSenal: string
  conGPS: boolean
}

declare const L: any

export default function ControlEquipo() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [cajas, setCajas] = useState<CajaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [leafletReady, setLeafletReady] = useState(false)
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [vista, setVista] = useState<'mapa' | 'tabla'>('mapa')

  // ─── Load Leaflet from CDN ─────────────────────────────────
  useEffect(() => {
    if ((window as any).L) {
      setLeafletReady(true)
      return
    }
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(css)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setLeafletReady(true)
    document.head.appendChild(script)
  }, [])

  // ─── Fetch cajas + GPS data ───────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // 1) Master catalog: ALL cajas
        const allCajas: any[] = []
        let from = 0
        const PAGE = 1000
        while (true) {
          const { data, error } = await supabase
            .from('cajas')
            .select('*')
            .range(from, from + PAGE - 1)
          if (error || !data || data.length === 0) break
          allCajas.push(...data)
          if (data.length < PAGE) break
          from += PAGE
        }

        // 2) GPS tracking for cajas
        const { data: gpsRows } = await supabase
          .from('gps_tracking')
          .select('*')
          .eq('tipo_unidad', 'caja')

        const gpsMap = new Map<string, any>()
        ;(gpsRows || []).forEach((g: any) => {
          if (g.economico) gpsMap.set(g.economico, g)
        })

        // 3) Merge
        const merged: CajaRecord[] = allCajas.map((c: any, idx: number) => {
          const gps = gpsMap.get(c.numero_economico)
          const tieneCoords = gps && gps.latitud && gps.longitud && gps.latitud !== 0
          return {
            id: c.id?.toString() || idx.toString(),
            numero_economico: c.numero_economico || '—',
            empresa: c.empresa || '—',
            tipo: c.tipo || 'seca',
            estado: c.estado || 'activa',
            latitud: tieneCoords ? gps.latitud : null,
            longitud: tieneCoords ? gps.longitud : null,
            velocidad: gps?.velocidad || 0,
            ubicacion: gps?.ubicacion || '—',
            ultimaSenal: gps?.ultima_actualizacion
              ? new Date(gps.ultima_actualizacion).toLocaleString('es-MX', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                })
              : '—',
            conGPS: !!tieneCoords,
          }
        })

        setCajas(merged)
      } catch (err) {
        console.error('[ControlEquipo] error:', err)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  // ─── KPIs ──────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = cajas.length
    const conGPS = cajas.filter(c => c.conGPS).length
    const sinGPS = total - conGPS
    const secas = cajas.filter(c => c.tipo === 'seca' || c.tipo === 'seco').length
    const thermos = cajas.filter(c => c.tipo === 'thermo' || c.tipo === 'refrigerado' || c.tipo === 'refrigerada').length
    const empresas = new Set(cajas.map(c => c.empresa).filter(e => e !== '—'))
    return { total, conGPS, sinGPS, secas, thermos, empresasCount: empresas.size }
  }, [cajas])

  // ──── Filters ──────────────────────────────────────────────
  const empresas = useMemo(() => [...new Set(cajas.map(c => c.empresa).filter(e => e !== '—'))].sort(), [cajas])
  const tipos = useMemo(() => [...new Set(cajas.map(c => c.tipo).filter(Boolean))].sort(), [cajas])

  const cajasFiltradas = useMemo(() => {
    return cajas.filter(c => {
      if (filtroEmpresa && c.empresa !== filtroEmpresa) return false
      if (filtroTipo && c.tipo !== filtroTipo) return false
      if (filtroEstado === 'conGPS' && !c.conGPS) return false
      if (filtroEstado === 'sinGPS' && c.conGPS) return false
      if (busqueda) {
        const q = busqueda.toLowerCase()
        if (!c.numero_economico.toLowerCase().includes(q) &&
            !c.empresa.toLowerCase().includes(q) &&
            !c.ubicacion.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [cajas, filtroEmpresa, filtroTipo, filtroEstado, busqueda])

  // ─── Init Leaflet map ─────────────────────────────────────
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstanceRef.current) return
    if (!(window as any).L) return

    const map = L.map(mapRef.current).setView([23.6345, -102.5528], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [leafletReady, vista])

  // ─── Update markers on filter change ──────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletReady) return
    const map = mapInstanceRef.current

    markersRef.current.forEach((m: any) => map.removeLayer(m))
    markersRef.current = []

    const withCoords = cajasFiltradas.filter(c => c.latitud && c.longitud)

    withCoords.forEach(c => {
      const vel = c.velocidad ?? 0
      const isSeca = c.tipo === 'seca' || c.tipo === 'seco'
      const color = vel > 0 ? '#0D9668' : '#3B6CE7'
      const shape = isSeca ? 'border-radius:3px;' : 'border-radius:50%;'
      const icon = L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;' + shape + 'background:' + color +
              ';border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })

      const marker = L.marker([c.latitud, c.longitud], { icon }).addTo(map)
      marker.bindPopup(
        '<div style="font-family:Montserrat,system-ui,sans-serif;font-size:13px;line-height:1.6;">' +
        '<strong style="font-size:14px;">' + c.numero_economico + '</strong><br/>' +
        '<b>Empresa:</b> ' + c.empresa + '<br/>' +
        '<b>Tipo:</b> ' + (isSeca ? 'Caja Seca' : 'Thermo') + '<br/>' +
        '<b>Velocidad:</b> ' + vel + ' km/h<br/>' +
        '<b>Ubicación:</b> ' + c.ubicacion + '<br/>' +
        '<b>Señal:</b> ' + c.ultimaSenal +
        '</div>'
      )
      markersRef.current.push(marker)
    })

    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current)
      map.fitBounds(group.getBounds().pad(0.1))
    }
  }, [cajasFiltradas, leafletReady, vista])

  // ─── Styles ────────────────────────────────────────────────
  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: tokens.radius.md,
    border: '1px solid ' + tokens.colors.border,
    backgroundColor: tokens.colors.bgCard,
    color: tokens.colors.textPrimary,
    fontFamily: tokens.fonts.body,
    fontSize: '13px',
    minWidth: '160px',
    outline: 'none',
  }

  const inputStyle: React.CSSProperties = {
    ...selectStyle,
    minWidth: '220px',
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px',
    borderRadius: tokens.radius.md,
    border: 'none',
    cursor: 'pointer',
    fontFamily: tokens.fonts.body,
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    backgroundColor: active ? tokens.colors.primary : 'transparent',
    color: active ? '#FFFFFF' : tokens.colors.textSecondary,
    transition: 'all 0.2s ease',
  })

  return (
    <ModuleLayout
      titulo="Control de Equipo"
      subtitulo={'Inventario completo · ' + kpis.total + ' cajas'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 4px' }}>
        {/* ── KPI Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
          {[
            { label: 'Total Cajas', value: kpis.total, color: tokens.colors.textPrimary, accent: tokens.colors.primary },
            { label: 'Cajas Secas', value: kpis.secas, color: tokens.colors.primary, accent: tokens.colors.primary },
            { label: 'Thermos', value: kpis.thermos, color: '#0D9668', accent: '#0D9668' },
            { label: 'Con GPS', value: kpis.conGPS, color: '#0D9668', accent: '#0D9668' },
            { label: 'Sin GPS', value: kpis.sinGPS, color: tokens.colors.red, accent: tokens.colors.red },
            { label: 'Empresas', value: kpis.empresasCount, color: tokens.colors.textPrimary, accent: tokens.colors.orange },
          ].map(k => (
            <div
              key={k.label}
              style={{
                background: tokens.colors.bgCard,
                borderRadius: '12px',
                padding: '16px 18px',
                border: '1px solid ' + tokens.colors.border,
                borderLeft: '4px solid ' + k.accent,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{
                fontFamily: tokens.fonts.heading,
                fontSize: '11px',
                fontWeight: 600,
                color: tokens.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px',
              }}>
                {k.label}
              </div>
              <div style={{
                fontFamily: tokens.fonts.heading,
                fontSize: '28px',
                fontWeight: 800,
                color: k.color,
                lineHeight: 1,
              }}>
                {loading ? '—' : k.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters + View Toggle ── */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Buscar económico, empresa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={inputStyle}
          />
          <select value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)} style={selectStyle}>
            <option value="">Todas empresas</option>
            {empresas.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={selectStyle}>
            <option value="">Todos tipos</option>
            {tipos.map(t => <option key={t} value={t}>{t === 'seca' || t === 'seco' ? 'Caja Seca' : t === 'thermo' || t === 'refrigerado' ? 'Thermo' : t}</option>)}
          </select>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={selectStyle}>
            <option value="">Todos</option>
            <option value="conGPS">Con GPS</option>
            <option value="sinGPS">Sin GPS</option>
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', background: tokens.colors.bgMain, borderRadius: tokens.radius.md, padding: '3px' }}>
            <button style={tabStyle(vista === 'mapa')} onClick={() => setVista('mapa')}>Mapa</button>
            <button style={tabStyle(vista === 'tabla')} onClick={() => setVista('tabla')}>Tabla</button>
          </div>
        </div>

        {/* ── Content Area ── */}
        {vista === 'mapa' ? (
          <Card>
            <div style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid ' + tokens.colors.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, fontSize: '15px', fontWeight: 600 }}>
                Mapa de Cajas {!loading && '— ' + cajasFiltradas.filter(c => c.conGPS).length + ' con posición GPS'}
              </h3>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: tokens.colors.textSecondary }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '2px', background: '#3B6CE7' }} />
                  Seca
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#3B6CE7' }} />
                  Thermo
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#0D9668' }} />
                  En movimiento
                </span>
              </div>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: tokens.colors.textSecondary }}>
                Cargando mapa...
              </div>
            ) : (
              <div
                ref={mapRef}
                style={{
                  height: 'calc(100vh - 360px)',
                  minHeight: '350px',
                  maxHeight: '550px',
                  borderRadius: tokens.radius.lg,
                  border: '1px solid ' + tokens.colors.border,
                  backgroundColor: '#e5e7eb',
                }}
              />
            )}
          </Card>
        ) : (
          <Card>
            <div style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid ' + tokens.colors.border }}>
              <h3 style={{ margin: 0, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, fontSize: '15px', fontWeight: 600 }}>
                Inventario de Cajas — {cajasFiltradas.length} registros
              </h3>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: tokens.colors.textSecondary }}>
                Cargando...
              </div>
            ) : cajasFiltradas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: tokens.colors.textSecondary }}>
                Sin resultados con los filtros actuales
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: tokens.fonts.body, fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid ' + tokens.colors.border }}>
                      {['N° Económico', 'Empresa', 'Tipo', 'GPS', 'Ubicación', 'Velocidad', 'Última Señal'].map(h => (
                        <th key={h} style={{
                          padding: '10px 12px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: tokens.colors.textSecondary,
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cajasFiltradas.map(c => (
                      <tr
                        key={c.id}
                        style={{ borderBottom: '1px solid ' + tokens.colors.borderLight, transition: 'background 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = tokens.colors.bgHover }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: tokens.colors.textPrimary }}>
                          {c.numero_economico}
                        </td>
                        <td style={{ padding: '10px 12px', color: tokens.colors.textSecondary }}>
                          {c.empresa}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: (c.tipo === 'seca' || c.tipo === 'seco') ? 'rgba(59,108,231,0.1)' : 'rgba(13,150,104,0.1)',
                            color: (c.tipo === 'seca' || c.tipo === 'seco') ? tokens.colors.primary : '#0D9668',
                          }}>
                            {(c.tipo === 'seca' || c.tipo === 'seco') ? 'Seca' : c.tipo === 'thermo' || c.tipo === 'refrigerado' ? 'Thermo' : c.tipo}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            display: 'inline-block',
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: c.conGPS ? '#0D9668' : tokens.colors.red,
                          }} />
                        </td>
                        <td style={{ padding: '10px 12px', color: c.conGPS ? tokens.colors.textPrimary : tokens.colors.textMuted, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.ubicacion}
                        </td>
                        <td style={{ padding: '10px 12px', color: c.velocidad > 0 ? '#0D9668' : tokens.colors.textMuted }}>
                          {c.velocidad > 0 ? c.velocidad + ' km/h' : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', color: tokens.colors.textSecondary, fontSize: '12px' }}>
                          {c.ultimaSenal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* ── Footer ── */}
        <div style={{
          fontFamily: tokens.fonts.heading,
          fontSize: '11px',
          color: tokens.colors.textMuted,
          textAlign: 'right',
        }}>
          Última carga: {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          {' · '}Fuente: Supabase · WidgeTech GPS
        </div>
      </div>
    </ModuleLayout>
  )
}
