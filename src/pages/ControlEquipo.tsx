import { useEffect, useMemo, useRef, useState } from 'react'
import { ModuleLayout } from '../components/layout/ModuleLayout'
import { Card } from '../components/ui/Card'
import { tokens } from '../lib/tokens'
import { supabase } from '../lib/supabase'

/* ———————————————————————————————————————————————————————————————
   CONTROL DE EQUIPO V2 — Inventario + Mapa + Alertas Críticas
   Fuente de verdad: tabla `cajas` (catálogo maestro ~541 registros)
   Enriquecimiento GPS: tabla `gps_tracking` (tipo_unidad = 'caja')
   Tipos en BD: "SECO PROPIO", "THERMO" (uppercase)
   ——————————————————————————————————————————————————————————————— */

interface CajaRecord {
  id: string
  numero_economico: string
  empresa: string
  tipo: string          // raw from DB: "SECO PROPIO", "THERMO"
  tipoNorm: 'seca' | 'thermo'  // normalized
  estado: string
  latitud: number | null
  longitud: number | null
  velocidad: number
  ubicacion: string
  ultimaSenal: string
  ultimaSenalRaw: string | null  // ISO date for calculations
  conGPS: boolean
  enMovimiento: boolean
  diasSinSenal: number | null
}

declare const L: any

// ─── Helper: normalize tipo ─────────────────────────────────
function normalizeTipo(tipo: string | null | undefined): 'seca' | 'thermo' {
  if (!tipo) return 'seca'
  const t = tipo.toUpperCase()
  if (t.includes('THERMO') || t.includes('REFRI')) return 'thermo'
  return 'seca'
}

// ─── Helper: days since date ────────────────────────────────
function daysSince(isoDate: string | null): number | null {
  if (!isoDate) return null
  const then = new Date(isoDate).getTime()
  if (isNaN(then)) return null
  const now = Date.now()
  return Math.floor((now - then) / (1000 * 60 * 60 * 24))
}

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
  const [vista, setVista] = useState<'mapa' | 'tabla' | 'criticos'>('mapa')
  const [umbralDias, setUmbralDias] = useState(3)

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
        // 1) Master catalog: ALL cajas (paginated)
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
          const vel = gps?.velocidad || 0
          const ultimaAct = gps?.ultima_actualizacion || null

          return {
            id: c.id?.toString() || idx.toString(),
            numero_economico: c.numero_economico || '—',
            empresa: c.empresa || '—',
            tipo: c.tipo || 'seca',
            tipoNorm: normalizeTipo(c.tipo),
            estado: c.estado || 'activa',
            latitud: tieneCoords ? gps.latitud : null,
            longitud: tieneCoords ? gps.longitud : null,
            velocidad: vel,
            ubicacion: gps?.ubicacion || '—',
            ultimaSenal: ultimaAct
              ? new Date(ultimaAct).toLocaleString('es-MX', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                })
              : '—',
            ultimaSenalRaw: ultimaAct,
            conGPS: !!tieneCoords,
            enMovimiento: !!tieneCoords && vel > 0,
            diasSinSenal: daysSince(ultimaAct),
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
    const secas = cajas.filter(c => c.tipoNorm === 'seca').length
    const thermos = cajas.filter(c => c.tipoNorm === 'thermo').length
    const conGPS = cajas.filter(c => c.conGPS).length
    const enMovimiento = cajas.filter(c => c.enMovimiento).length
    const sinSenal = total - conGPS
    const empresas = new Set(cajas.map(c => c.empresa).filter(e => e !== '—'))
    const criticos = cajas.filter(c => c.diasSinSenal !== null && c.diasSinSenal >= umbralDias).length
    return { total, secas, thermos, conGPS, enMovimiento, sinSenal, empresasCount: empresas.size, criticos }
  }, [cajas, umbralDias])

  // ─── Filters ──────────────────────────────────────────────
  const empresas = useMemo(() => [...new Set(cajas.map(c => c.empresa).filter(e => e !== '—'))].sort(), [cajas])

  const cajasFiltradas = useMemo(() => {
    return cajas.filter(c => {
      if (filtroEmpresa && c.empresa !== filtroEmpresa) return false
      if (filtroTipo === 'seca' && c.tipoNorm !== 'seca') return false
      if (filtroTipo === 'thermo' && c.tipoNorm !== 'thermo') return false
      if (filtroEstado === 'conGPS' && !c.conGPS) return false
      if (filtroEstado === 'sinGPS' && c.conGPS) return false
      if (filtroEstado === 'movimiento' && !c.enMovimiento) return false
      if (filtroEstado === 'parada' && (c.enMovimiento || !c.conGPS)) return false
      if (busqueda) {
        const q = busqueda.toLowerCase()
        if (!c.numero_economico.toLowerCase().includes(q) &&
            !c.empresa.toLowerCase().includes(q) &&
            !c.ubicacion.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [cajas, filtroEmpresa, filtroTipo, filtroEstado, busqueda])

  // ─── Remolques críticos ───────────────────────────────────
  const remolquesCriticos = useMemo(() => {
    return cajas
      .filter(c => {
        // Crítico: tiene GPS registrado pero lleva >= umbralDias sin señal
        // O nunca tuvo señal (diasSinSenal === null pero no tiene GPS)
        if (c.diasSinSenal !== null && c.diasSinSenal >= umbralDias) return true
        if (!c.conGPS && c.ultimaSenalRaw === null) return true
        return false
      })
      .sort((a, b) => {
        // Los que tienen señal antigua primero (más días sin señal)
        const da = a.diasSinSenal ?? 999
        const db = b.diasSinSenal ?? 999
        return db - da
      })
  }, [cajas, umbralDias])

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
      const isSeca = c.tipoNorm === 'seca'
      const moving = c.enMovimiento

      // Color: green = movimiento, blue = parada seca, teal = parada thermo
      const color = moving ? '#0D9668' : (isSeca ? '#3B6CE7' : '#0891B2')
      // Shape: square = seca, circle = thermo
      const shape = isSeca ? 'border-radius:3px;' : 'border-radius:50%;'
      // Size: bigger if moving
      const size = moving ? 16 : 12

      const icon = L.divIcon({
        className: '',
        html: '<div style="width:' + size + 'px;height:' + size + 'px;' + shape +
              'background:' + color + ';border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);' +
              (moving ? 'animation:pulse 2s infinite;' : '') +
              '"></div>',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })

      const marker = L.marker([c.latitud, c.longitud], { icon }).addTo(map)
      marker.bindPopup(
        '<div style="font-family:Montserrat,system-ui,sans-serif;font-size:13px;line-height:1.6;">' +
        '<strong style="font-size:14px;">' + c.numero_economico + '</strong>' +
        '<span style="margin-left:8px;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;' +
        'background:' + (moving ? 'rgba(13,150,104,0.15);color:#0D9668' : 'rgba(107,114,128,0.15);color:#6B7280') + ';">' +
        (moving ? '● En movimiento' : '■ Detenida') + '</span><br/>' +
        '<b>Empresa:</b> ' + c.empresa + '<br/>' +
        '<b>Tipo:</b> ' + (isSeca ? '◼ Caja Seca' : '● Thermo') + '<br/>' +
        '<b>Velocidad:</b> ' + (c.velocidad > 0 ? c.velocidad + ' km/h' : '0 km/h') + '<br/>' +
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

  // ─── Inject pulse animation ───────────────────────────────
  useEffect(() => {
    if (document.getElementById('pulse-animation')) return
    const style = document.createElement('style')
    style.id = 'pulse-animation'
    style.textContent = `
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(13,150,104,0.4); }
        70% { box-shadow: 0 0 0 8px rgba(13,150,104,0); }
        100% { box-shadow: 0 0 0 0 rgba(13,150,104,0); }
      }
    `
    document.head.appendChild(style)
  }, [])

  // ─── Styles ────────────────────────────────────────────────
  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: tokens.radius.md,
    border: '1px solid ' + tokens.colors.border,
    backgroundColor: tokens.colors.bgCard,
    color: tokens.colors.textPrimary,
    fontFamily: tokens.fonts.body,
    fontSize: '13px',
    minWidth: '140px',
    outline: 'none',
  }

  const inputStyle: React.CSSProperties = {
    ...selectStyle,
    minWidth: '200px',
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
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

  // ─── KPI card config ──────────────────────────────────────
  const kpiCards = [
    { label: 'Total Cajas', value: kpis.total, color: tokens.colors.textPrimary, accent: tokens.colors.primary },
    { label: 'Cajas Secas', value: kpis.secas, color: '#3B6CE7', accent: '#3B6CE7' },
    { label: 'Thermos', value: kpis.thermos, color: '#0891B2', accent: '#0891B2' },
    { label: 'Con GPS', value: kpis.conGPS, color: '#0D9668', accent: '#0D9668' },
    { label: 'En Movimiento', value: kpis.enMovimiento, color: '#0D9668', accent: '#10B981' },
    { label: 'Sin Señal', value: kpis.sinSenal, color: tokens.colors.red, accent: tokens.colors.red },
  ]

  return (
    <ModuleLayout
      titulo="Control de Equipo"
      subtitulo={'Inventario completo · ' + kpis.total + ' cajas'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 4px' }}>
        {/* ── KPI Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
          {kpiCards.map(k => (
            <div
              key={k.label}
              style={{
                background: tokens.colors.bgCard,
                borderRadius: '12px',
                padding: '14px 16px',
                border: '1px solid ' + tokens.colors.border,
                borderLeft: '4px solid ' + k.accent,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{
                fontFamily: tokens.fonts.heading,
                fontSize: '10px',
                fontWeight: 600,
                color: tokens.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '4px',
              }}>
                {k.label}
              </div>
              <div style={{
                fontFamily: tokens.fonts.heading,
                fontSize: '26px',
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
            <option value="seca">Caja Seca</option>
            <option value="thermo">Thermo</option>
          </select>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={selectStyle}>
            <option value="">Todos</option>
            <option value="conGPS">Con GPS</option>
            <option value="sinGPS">Sin GPS</option>
            <option value="movimiento">En Movimiento</option>
            <option value="parada">Detenidas</option>
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', background: tokens.colors.bgMain, borderRadius: tokens.radius.md, padding: '3px' }}>
            <button style={tabStyle(vista === 'mapa')} onClick={() => setVista('mapa')}>Mapa</button>
            <button style={tabStyle(vista === 'tabla')} onClick={() => setVista('tabla')}>Tabla</button>
            <button style={{
              ...tabStyle(vista === 'criticos'),
              ...(vista === 'criticos' ? {} : { position: 'relative' as const }),
            }} onClick={() => setVista('criticos')}>
              Críticos
              {!loading && kpis.criticos > 0 && vista !== 'criticos' && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: tokens.colors.red,
                  color: '#fff',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '10px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {kpis.criticos > 99 ? '99+' : kpis.criticos}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── MAP VIEW ── */}
        {vista === 'mapa' && (
          <Card>
            <div style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid ' + tokens.colors.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, fontSize: '15px', fontWeight: 600 }}>
                Mapa de Cajas {!loading && '— ' + cajasFiltradas.filter(c => c.conGPS).length + ' con posición GPS'}
              </h3>
              <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: tokens.colors.textSecondary }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '2px', background: '#3B6CE7' }} />
                  Seca
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#0891B2' }} />
                  Thermo
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#0D9668' }} />
                  En movimiento
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#94A3B8', border: '1px solid #64748B' }} />
                  Detenida
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
        )}

        {/* ── TABLE VIEW ── */}
        {vista === 'tabla' && (
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
                      {['N° Económico', 'Empresa', 'Tipo', 'Estado', 'GPS', 'Ubicación', 'Velocidad', 'Última Señal'].map(h => (
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
                        style={{ borderBottom: '1px solid ' + tokens.colors.border, transition: 'background 0.15s' }}
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
                            backgroundColor: c.tipoNorm === 'seca' ? 'rgba(59,108,231,0.1)' : 'rgba(8,145,178,0.1)',
                            color: c.tipoNorm === 'seca' ? '#3B6CE7' : '#0891B2',
                          }}>
                            {c.tipoNorm === 'seca' ? 'Seca' : 'Thermo'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {c.conGPS ? (
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: c.enMovimiento ? 'rgba(13,150,104,0.1)' : 'rgba(107,114,128,0.1)',
                              color: c.enMovimiento ? '#0D9668' : '#6B7280',
                            }}>
                              {c.enMovimiento ? '● Movimiento' : '■ Detenida'}
                            </span>
                          ) : (
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: 'rgba(239,68,68,0.1)',
                              color: tokens.colors.red,
                            }}>
                              Sin señal
                            </span>
                          )}
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
                        <td style={{ padding: '10px 12px', color: c.conGPS ? tokens.colors.textPrimary : tokens.colors.textMuted, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.ubicacion}
                        </td>
                        <td style={{ padding: '10px 12px', color: c.velocidad > 0 ? '#0D9668' : tokens.colors.textMuted, fontWeight: c.velocidad > 0 ? 600 : 400 }}>
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

        {/* ── CRITICAL TRAILERS VIEW ── */}
        {vista === 'criticos' && (
          <Card>
            <div style={{ marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid ' + tokens.colors.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, fontSize: '15px', fontWeight: 600 }}>
                  Remolques Críticos — {remolquesCriticos.length} unidades
                </h3>
                <p style={{ margin: '4px 0 0 0', color: tokens.colors.textSecondary, fontSize: '12px' }}>
                  Unidades con {umbralDias}+ días sin reportar posición GPS o sin señal registrada
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: tokens.colors.textSecondary }}>Umbral:</span>
                <select
                  value={umbralDias}
                  onChange={(e) => setUmbralDias(Number(e.target.value))}
                  style={{ ...selectStyle, minWidth: '90px' }}
                >
                  <option value={1}>1 día</option>
                  <option value={2}>2 días</option>
                  <option value={3}>3 días</option>
                  <option value={5}>5 días</option>
                  <option value={7}>7 días</option>
                  <option value={14}>14 días</option>
                  <option value={30}>30 días</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: tokens.colors.textSecondary }}>
                Cargando...
              </div>
            ) : remolquesCriticos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#0D9668' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
                <div style={{ fontWeight: 600 }}>Sin remolques críticos</div>
                <div style={{ fontSize: '13px', color: tokens.colors.textSecondary, marginTop: '4px' }}>
                  Todas las unidades reportaron posición en los últimos {umbralDias} días
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: tokens.fonts.body, fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid ' + tokens.colors.border }}>
                      {['N° Económico', 'Empresa', 'Tipo', 'Última Señal', 'Días sin señal', 'Última Ubicación', 'Alerta'].map(h => (
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
                    {remolquesCriticos.map(c => {
                      const dias = c.diasSinSenal ?? null
                      const severity = dias === null ? 'critical' : dias >= 14 ? 'critical' : dias >= 7 ? 'high' : dias >= 3 ? 'medium' : 'low'
                      const severityColors = {
                        critical: { bg: 'rgba(239,68,68,0.1)', text: '#DC2626', label: 'CRÍTICO' },
                        high: { bg: 'rgba(239,68,68,0.08)', text: '#EF4444', label: 'ALTO' },
                        medium: { bg: 'rgba(245,158,11,0.1)', text: '#D97706', label: 'MEDIO' },
                        low: { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B', label: 'BAJO' },
                      }
                      const sev = severityColors[severity]

                      return (
                        <tr
                          key={c.id}
                          style={{ borderBottom: '1px solid ' + tokens.colors.border, transition: 'background 0.15s' }}
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
                              backgroundColor: c.tipoNorm === 'seca' ? 'rgba(59,108,231,0.1)' : 'rgba(8,145,178,0.1)',
                              color: c.tipoNorm === 'seca' ? '#3B6CE7' : '#0891B2',
                            }}>
                              {c.tipoNorm === 'seca' ? 'Seca' : 'Thermo'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: tokens.colors.textSecondary, fontSize: '12px' }}>
                            {c.ultimaSenal}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: sev.text, fontSize: '14px' }}>
                            {dias !== null ? dias + 'd' : 'Nunca'}
                          </td>
                          <td style={{ padding: '10px 12px', color: tokens.colors.textMuted, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.ubicacion}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '20px',
                              fontSize: '10px',
                              fontWeight: 700,
                              backgroundColor: sev.bg,
                              color: sev.text,
                              letterSpacing: '0.5px',
                            }}>
                              {sev.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
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
          {' · '}Fuente: Supabase · WideTech GPS
          {' · '}{kpis.secas} secas · {kpis.thermos} thermos · {kpis.enMovimiento} en movimiento
        </div>
      </div>
    </ModuleLayout>
  )
}
