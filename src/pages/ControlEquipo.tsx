import { useEffect, useMemo, useRef, useState } from 'react'
import { ModuleLayout } from '../components/layout/ModuleLayout'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'  // V50 26/Abr/2026 — Badge sólido 3D
import { tokens } from '../lib/tokens'
import { supabase } from '../lib/supabase'

/* ———————————————————————————————————————————————————————————————
   CONTROL DE EQUIPO V3 — Inventario + Mapa + Alertas + Reportes
   Fuente de verdad: tabla `cajas` (catálogo maestro ~541 registros)
   Enriquecimiento GPS: tabla `gps_tracking` (tipo_unidad = 'caja')
   Historial GPS: tabla `gps_historial` (economico, latitud, longitud, velocidad, created_at)
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

interface ReporteRow {
  economico: string
  empresa: string
  tipo: string
  totalRegistros: number
  registrosConMovimiento: number
  velocidadMax: number
  velocidadPromedio: number
  primeraSenal: string
  ultimaSenal: string
  horasActivo: number
}

interface Terminal {
  id: string
  nombre: string
  latitud: number
  longitud: number
  radio_metros: number
  direccion: string | null
  empresa: string | null
  activa: boolean
}

interface InventarioObjetivo {
  terminal_id: string
  tipo_caja: 'seca' | 'thermo'
  cantidad_objetivo: number
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

// ─── Helper: Haversine distance (meters) ───────────────────
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Helper: format date for input ─────────────────────────
function toDateInput(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ─── Helper: CSV export ─────────────────────────────────────
function exportCSV(rows: ReporteRow[], desde: string, hasta: string) {
  const headers = ['Económico', 'Empresa', 'Tipo', 'Total Registros', 'En Movimiento', 'Vel. Máx (km/h)', 'Vel. Prom (km/h)', 'Primera Señal', 'Última Señal', 'Horas Activo']
  const csvRows = [headers.join(',')]
  rows.forEach(r => {
    csvRows.push([
      r.economico,
      '"' + r.empresa.replace(/"/g, '""') + '"',
      r.tipo,
      r.totalRegistros,
      r.registrosConMovimiento,
      r.velocidadMax.toFixed(1),
      r.velocidadPromedio.toFixed(1),
      r.primeraSenal,
      r.ultimaSenal,
      r.horasActivo.toFixed(1),
    ].join(','))
  })
  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'reporte_gps_' + desde + '_a_' + hasta + '.csv'
  a.click()
  URL.revokeObjectURL(url)
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
  // V50 26/Abr/2026 — JJ pidió que abra en Inventarios por default (no Mapa)
  const [vista, setVista] = useState<'mapa' | 'tabla' | 'criticos' | 'reportes' | 'inventarios'>('inventarios')
  const [umbralDias, setUmbralDias] = useState(3)

  // ─── Reportes state ────────────────────────────────────────
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(ayer.getDate() - 1)
  const [fechaDesde, setFechaDesde] = useState(toDateInput(ayer))
  const [fechaHasta, setFechaHasta] = useState(toDateInput(hoy))
  const [reporteData, setReporteData] = useState<ReporteRow[]>([])
  const [reporteLoading, setReporteLoading] = useState(false)
  const [reporteError, setReporteError] = useState('')
  const [reporteGenerado, setReporteGenerado] = useState(false)

  // ─── Terminales / Inventarios state ───────────────────────
  const [terminales, setTerminales] = useState<Terminal[]>([])
  const [terminalesLoading, setTerminalesLoading] = useState(false)
  const [terminalExpandida, setTerminalExpandida] = useState<string | null>(null)
  // V46 - objetivos de inventario por terminal (default 2 secas + 2 thermos)
  const [objetivos, setObjetivos] = useState<Map<string, { seca: number; thermo: number }>>(new Map())
  // V46 - dias sin movimiento por economico (basado en gps_historial velocidad > 5)
  const [diasSinMovMap, setDiasSinMovMap] = useState<Map<string, number>>(new Map())
  // V46.7 - viajes activos por caja_id (para hacer cajas clickeables hacia su viaje)
  const [viajesByCajaId, setViajesByCajaId] = useState<Map<string, { id: string; folio?: string; estado?: string }>>(new Map())

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

  // ─── Fetch terminales + objetivos de inventario ──────────
  useEffect(() => {
    const fetchTerminalesYObjetivos = async () => {
      setTerminalesLoading(true)
      try {
        const [tRes, oRes] = await Promise.all([
          supabase.from('terminales').select('*').eq('activa', true).is('deleted_at', null).order('nombre'),
          supabase.from('terminal_inventario_objetivo').select('*'),
        ])
        if (!tRes.error && tRes.data) setTerminales(tRes.data as Terminal[])
        if (!oRes.error && oRes.data) {
          const map = new Map<string, { seca: number; thermo: number }>()
          ;(oRes.data as InventarioObjetivo[]).forEach(o => {
            const cur = map.get(o.terminal_id) || { seca: 2, thermo: 2 }
            cur[o.tipo_caja] = o.cantidad_objetivo
            map.set(o.terminal_id, cur)
          })
          setObjetivos(map)
        }
      } catch { /* tabla puede no existir aún */ }
      setTerminalesLoading(false)
    }
    fetchTerminalesYObjetivos()
  }, [])

  // V46.7 — Fetch viajes activos por caja_id (para hacer cajas clickeables)
  useEffect(() => {
    const fetchViajesActivos = async () => {
      try {
        const { data } = await supabase
          .from('viajes')
          .select('id, caja_id, folio, estado')
          .in('estado', ['asignado', 'en_transito', 'en_curso', 'programado', 'en_riesgo', 'activo'])
        if (!data) return
        const map = new Map<string, { id: string; folio?: string; estado?: string }>()
        ;(data as any[]).forEach(v => {
          if (v.caja_id) map.set(v.caja_id, { id: v.id, folio: v.folio, estado: v.estado })
        })
        setViajesByCajaId(map)
      } catch { /* tabla puede no responder */ }
    }
    fetchViajesActivos()
  }, [])

  // ─── Fetch dias sin movimiento (gps_historial velocidad > 5) ──
  useEffect(() => {
    const fetchDiasSinMov = async () => {
      try {
        const desde = new Date()
        desde.setDate(desde.getDate() - 90)
        const { data } = await supabase
          .from('gps_historial')
          .select('economico, created_at, velocidad')
          .gte('created_at', desde.toISOString())
          .gt('velocidad', 5)
          .order('created_at', { ascending: false })
          .limit(50000)
        if (!data) return
        const map = new Map<string, number>()
        const now = Date.now()
        const seen = new Set<string>()
        ;(data as any[]).forEach(r => {
          if (!seen.has(r.economico)) {
            seen.add(r.economico)
            const days = Math.floor((now - new Date(r.created_at).getTime()) / 86400000)
            map.set(r.economico, days)
          }
        })
        setDiasSinMovMap(map)
      } catch { /* tabla puede no existir o estar vacia */ }
    }
    fetchDiasSinMov()
  }, [])

  // ─── Compute inventarios por terminal ────────────────────
  const inventariosPorTerminal = useMemo(() => {
    if (terminales.length === 0 || cajas.length === 0) return []
    const cajasConGPS = cajas.filter(c => c.latitud != null && c.longitud != null)
    return terminales.map(t => {
      const enPatio = cajasConGPS.filter(c =>
        haversineMeters(t.latitud, t.longitud, c.latitud!, c.longitud!) <= t.radio_metros
      )
      const secas = enPatio.filter(c => c.tipoNorm === 'seca').length
      const thermos = enPatio.filter(c => c.tipoNorm === 'thermo').length
      return { terminal: t, cajas: enPatio, secas, thermos, total: enPatio.length }
    })
  }, [terminales, cajas])

  // Cajas sin terminal (fuera de todas las geocercas)
  const cajasEnRuta = useMemo(() => {
    if (terminales.length === 0) return cajas.filter(c => c.conGPS)
    return cajas.filter(c => {
      if (!c.latitud || !c.longitud) return false
      return !terminales.some(t =>
        haversineMeters(t.latitud, t.longitud, c.latitud!, c.longitud!) <= t.radio_metros
      )
    })
  }, [terminales, cajas])

  // ─── Fetch reporte histórico ──────────────────────────────
  const fetchReporte = async () => {
    setReporteLoading(true)
    setReporteError('')
    setReporteData([])
    try {
      const desdeISO = fechaDesde + 'T00:00:00.000Z'
      const hastaISO = fechaHasta + 'T23:59:59.999Z'

      // Fetch gps_historial in paginated batches
      const allRows: any[] = []
      let from = 0
      const PAGE = 1000
      while (true) {
        const { data, error } = await supabase
          .from('gps_historial')
          .select('economico, latitud, longitud, velocidad, created_at')
          .gte('created_at', desdeISO)
          .lte('created_at', hastaISO)
          .order('created_at', { ascending: true })
          .range(from, from + PAGE - 1)
        if (error) {
          setReporteError('Error consultando historial: ' + error.message)
          break
        }
        if (!data || data.length === 0) break
        allRows.push(...data)
        if (data.length < PAGE) break
        from += PAGE
      }

      if (allRows.length === 0 && !reporteError) {
        setReporteError('Sin datos de historial GPS en el rango seleccionado')
        setReporteLoading(false)
        setReporteGenerado(true)
        return
      }

      // Build map of economico -> cajas for empresa/tipo lookup
      const cajasLookup = new Map<string, { empresa: string; tipoNorm: string }>()
      cajas.forEach(c => {
        cajasLookup.set(c.numero_economico, { empresa: c.empresa, tipoNorm: c.tipoNorm === 'thermo' ? 'Thermo' : 'Seca' })
      })

      // Aggregate by economico
      const agg = new Map<string, {
        economico: string
        registros: number
        conMovimiento: number
        velMax: number
        velSum: number
        velCount: number
        primera: string
        ultima: string
        timestamps: number[]
      }>()

      allRows.forEach((r: any) => {
        const eco = r.economico
        if (!agg.has(eco)) {
          agg.set(eco, {
            economico: eco,
            registros: 0,
            conMovimiento: 0,
            velMax: 0,
            velSum: 0,
            velCount: 0,
            primera: r.created_at,
            ultima: r.created_at,
            timestamps: [],
          })
        }
        const a = agg.get(eco)!
        a.registros++
        const vel = r.velocidad || 0
        if (vel > 0) {
          a.conMovimiento++
          a.velSum += vel
          a.velCount++
        }
        if (vel > a.velMax) a.velMax = vel
        a.ultima = r.created_at
        a.timestamps.push(new Date(r.created_at).getTime())
      })

      // Build report rows
      const reportRows: ReporteRow[] = []
      agg.forEach((a) => {
        const info = cajasLookup.get(a.economico) || { empresa: '—', tipoNorm: '—' }
        // Calculate active hours: time span between first and last record
        const sorted = a.timestamps.sort((x, y) => x - y)
        const spanMs = sorted.length > 1 ? sorted[sorted.length - 1] - sorted[0] : 0
        const horasActivo = spanMs / (1000 * 60 * 60)

        reportRows.push({
          economico: a.economico,
          empresa: info.empresa,
          tipo: info.tipoNorm,
          totalRegistros: a.registros,
          registrosConMovimiento: a.conMovimiento,
          velocidadMax: a.velMax,
          velocidadPromedio: a.velCount > 0 ? a.velSum / a.velCount : 0,
          primeraSenal: new Date(a.primera).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
          ultimaSenal: new Date(a.ultima).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
          horasActivo,
        })
      })

      // Sort: most active first
      reportRows.sort((a, b) => b.totalRegistros - a.totalRegistros)
      setReporteData(reportRows)
      setReporteGenerado(true)
    } catch (err) {
      setReporteError('Error inesperado: ' + String(err))
    }
    setReporteLoading(false)
  }

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
        if (c.diasSinSenal !== null && c.diasSinSenal >= umbralDias) return true
        if (!c.conGPS && c.ultimaSenalRaw === null) return true
        return false
      })
      .sort((a, b) => {
        const da = a.diasSinSenal ?? 999
        const db = b.diasSinSenal ?? 999
        return db - da
      })
  }, [cajas, umbralDias])

  // ─── Reporte KPIs ─────────────────────────────────────────
  const reporteKpis = useMemo(() => {
    if (reporteData.length === 0) return null
    const totalUnidades = reporteData.length
    const totalRegistros = reporteData.reduce((s, r) => s + r.totalRegistros, 0)
    const conMovimiento = reporteData.filter(r => r.registrosConMovimiento > 0).length
    const velMaxGlobal = Math.max(...reporteData.map(r => r.velocidadMax))
    return { totalUnidades, totalRegistros, conMovimiento, velMaxGlobal }
  }, [reporteData])

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
  }, [leafletReady, vista, loading])

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

      const color = moving ? '#0D9668' : (isSeca ? '#F97316' : '#0891B2')
      const shape = isSeca ? 'border-radius:3px;' : 'border-radius:50%;'
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

  const dateInputStyle: React.CSSProperties = {
    ...selectStyle,
    minWidth: '150px',
    cursor: 'pointer',
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

  const btnPrimary: React.CSSProperties = {
    padding: '8px 20px',
    borderRadius: tokens.radius.md,
    border: 'none',
    cursor: 'pointer',
    fontFamily: tokens.fonts.body,
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: tokens.colors.primary,
    color: '#FFFFFF',
    transition: 'all 0.2s ease',
  }

  const btnSecondary: React.CSSProperties = {
    ...btnPrimary,
    backgroundColor: 'transparent',
    border: '1px solid ' + tokens.colors.border,
    color: tokens.colors.textSecondary,
  }

  // ─── KPI card config ──────────────────────────────────────
  const kpiCards = [
    { label: 'Total Cajas', value: kpis.total, color: tokens.colors.textPrimary, accent: tokens.colors.primary },
    { label: 'Cajas Secas', value: kpis.secas, color: '#F97316', accent: '#F97316' },
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
            <button style={tabStyle(vista === 'inventarios')} onClick={() => setVista('inventarios')}>Inventarios</button>
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
            <button style={tabStyle(vista === 'reportes')} onClick={() => setVista('reportes')}>
              Reportes
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
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '2px', background: '#F97316' }} />
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
                          <Badge color={c.tipoNorm === 'seca' ? 'orange' : 'blue'}>
                            {c.tipoNorm === 'seca' ? 'Seca' : 'Thermo'}
                          </Badge>
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
                            <Badge color={c.tipoNorm === 'seca' ? 'orange' : 'blue'}>
                              {c.tipoNorm === 'seca' ? 'Seca' : 'Thermo'}
                            </Badge>
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

        {/* ── REPORTES VIEW ── */}
        {vista === 'reportes' && (
          <Card>
            <div style={{ marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid ' + tokens.colors.border }}>
              <h3 style={{ margin: 0, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, fontSize: '15px', fontWeight: 600 }}>
                Reporte GPS por Rango de Fechas
              </h3>
              <p style={{ margin: '4px 0 0 0', color: tokens.colors.textSecondary, fontSize: '12px' }}>
                Consulta el historial de posiciones GPS registradas en el período seleccionado
              </p>
            </div>

            {/* Date range controls */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: tokens.colors.textSecondary, fontWeight: 600 }}>Desde:</span>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  style={dateInputStyle}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: tokens.colors.textSecondary, fontWeight: 600 }}>Hasta:</span>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  style={dateInputStyle}
                />
              </div>
              <button
                onClick={fetchReporte}
                disabled={reporteLoading}
                style={{
                  ...btnPrimary,
                  opacity: reporteLoading ? 0.6 : 1,
                  cursor: reporteLoading ? 'wait' : 'pointer',
                }}
              >
                {reporteLoading ? 'Consultando...' : 'Generar Reporte'}
              </button>
              {reporteData.length > 0 && (
                <button
                  onClick={() => exportCSV(reporteData, fechaDesde, fechaHasta)}
                  style={btnSecondary}
                >
                  Exportar CSV
                </button>
              )}
            </div>

            {/* Reporte KPIs */}
            {reporteKpis && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Unidades con Datos', value: reporteKpis.totalUnidades, color: tokens.colors.primary },
                  { label: 'Total Registros', value: reporteKpis.totalRegistros.toLocaleString('es-MX'), color: '#0D9668' },
                  { label: 'Con Movimiento', value: reporteKpis.conMovimiento, color: '#10B981' },
                  { label: 'Vel. Máx Global', value: reporteKpis.velMaxGlobal.toFixed(0) + ' km/h', color: '#F59E0B' },
                ].map(k => (
                  <div key={k.label} style={{
                    background: tokens.colors.bgMain,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    border: '1px solid ' + tokens.colors.border,
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: tokens.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      {k.label}
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: k.color, fontFamily: tokens.fonts.heading }}>
                      {k.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loading / Error / Empty */}
            {reporteLoading && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: tokens.colors.textSecondary }}>
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>Consultando historial GPS...</div>
                <div style={{ fontSize: '12px', color: tokens.colors.textMuted }}>Esto puede tomar unos segundos según el rango seleccionado</div>
              </div>
            )}

            {reporteError && !reporteLoading && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: tokens.colors.textMuted }}>
                <div style={{ fontSize: '14px' }}>{reporteError}</div>
              </div>
            )}

            {!reporteGenerado && !reporteLoading && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: tokens.colors.textMuted }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📊</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>Selecciona un rango de fechas y presiona "Generar Reporte"</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Se consultará la tabla gps_historial con las posiciones registradas</div>
              </div>
            )}

            {/* Results table */}
            {reporteData.length > 0 && !reporteLoading && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: tokens.fonts.body, fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid ' + tokens.colors.border }}>
                      {['Económico', 'Empresa', 'Tipo', 'Registros', 'En Movimiento', 'Vel. Máx', 'Vel. Prom', 'Primera Señal', 'Última Señal', 'Hrs Activo'].map(h => (
                        <th key={h} style={{
                          padding: '10px 12px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: tokens.colors.textSecondary,
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          whiteSpace: 'nowrap',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reporteData.map(r => {
                      const movPct = r.totalRegistros > 0 ? (r.registrosConMovimiento / r.totalRegistros * 100) : 0
                      return (
                        <tr
                          key={r.economico}
                          style={{ borderBottom: '1px solid ' + tokens.colors.border, transition: 'background 0.15s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = tokens.colors.bgHover }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                        >
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: tokens.colors.textPrimary }}>
                            {r.economico}
                          </td>
                          <td style={{ padding: '10px 12px', color: tokens.colors.textSecondary }}>
                            {r.empresa}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <Badge color={r.tipo === 'Thermo' ? 'blue' : 'orange'}>
                              {r.tipo}
                            </Badge>
                          </td>
                          <td style={{ padding: '10px 12px', color: tokens.colors.textPrimary, fontWeight: 600 }}>
                            {r.totalRegistros}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: r.registrosConMovimiento > 0 ? '#0D9668' : tokens.colors.textMuted, fontWeight: 600 }}>
                                {r.registrosConMovimiento}
                              </span>
                              <span style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                backgroundColor: movPct > 50 ? 'rgba(13,150,104,0.1)' : movPct > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(107,114,128,0.1)',
                                color: movPct > 50 ? '#0D9668' : movPct > 0 ? '#D97706' : '#6B7280',
                                fontWeight: 600,
                              }}>
                                {movPct.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', color: r.velocidadMax > 80 ? '#DC2626' : r.velocidadMax > 0 ? tokens.colors.textPrimary : tokens.colors.textMuted, fontWeight: r.velocidadMax > 0 ? 600 : 400 }}>
                            {r.velocidadMax > 0 ? r.velocidadMax.toFixed(0) + ' km/h' : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', color: tokens.colors.textSecondary }}>
                            {r.velocidadPromedio > 0 ? r.velocidadPromedio.toFixed(0) + ' km/h' : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', color: tokens.colors.textSecondary, fontSize: '12px', whiteSpace: 'nowrap' }}>
                            {r.primeraSenal}
                          </td>
                          <td style={{ padding: '10px 12px', color: tokens.colors.textSecondary, fontSize: '12px', whiteSpace: 'nowrap' }}>
                            {r.ultimaSenal}
                          </td>
                          <td style={{ padding: '10px 12px', color: r.horasActivo > 0 ? tokens.colors.textPrimary : tokens.colors.textMuted, fontWeight: r.horasActivo > 0 ? 600 : 400 }}>
                            {r.horasActivo > 0 ? r.horasActivo.toFixed(1) + 'h' : '—'}
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

        {/* ── INVENTARIOS POR TERMINAL — V46.7 cards 4-cols + click detalle + cajas → viaje (25/Abr/2026) ── */}
        {vista === 'inventarios' && (
          <Card>
            <div style={{ marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid ' + tokens.colors.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, fontSize: '15px', fontWeight: 700 }}>
                Inventarios por Terminal
                {!terminalesLoading && terminales.length > 0 && (
                  <span style={{ fontWeight: 400, fontSize: '12px', color: tokens.colors.textSecondary, marginLeft: '10px' }}>
                    {terminales.length} terminales · {inventariosPorTerminal.reduce((s, i) => s + i.total, 0)} en patio · {cajasEnRuta.length} en ruta
                  </span>
                )}
              </h3>
              {/* Leyenda colores */}
              <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width:10, height:10, borderRadius:'50%', background:'#0D9668' }}/>OK</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width:10, height:10, borderRadius:'50%', background:'#DC2626' }}/>Déficit</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width:10, height:10, borderRadius:'50%', background:'#B8860B' }}/>Exceso</span>
              </div>
            </div>

            {terminalesLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: tokens.colors.textSecondary }}>
                Cargando terminales...
              </div>
            ) : terminales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: tokens.colors.textMuted }}>
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>No hay terminales configuradas</p>
                <p style={{ fontSize: '12px' }}>Ve a Configuración para agregar terminales y geocercas</p>
              </div>
            ) : (
              <>
                {/* V49 — Enterprise look: blanco puro, sin tinte cream "papel Claude" (25/Abr/2026) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: terminalExpandida ? '18px' : 0 }}>
                  {inventariosPorTerminal.map(inv => {
                    const obj = objetivos.get(inv.terminal.id) || { seca: 2, thermo: 2 }
                    // Paleta enterprise — colores corporate, sin pasteles ni cream
                    const PAL = {
                      ok:    { txt: '#0F766E', bar: '#14B8A6', dot: '#14B8A6' },
                      warn:  { txt: '#C2410C', bar: '#F97316', dot: '#F97316' },
                      err:   { txt: '#BE123C', bar: '#F43F5E', dot: '#F43F5E' },
                    }
                    const stateFor = (a: number, t: number): keyof typeof PAL => {
                      if (a >= t) return 'ok'
                      if (a >= Math.ceil(t * 0.5)) return 'warn'
                      return 'err'
                    }
                    const iconFor = (s: keyof typeof PAL) => s === 'ok' ? '✓' : s === 'warn' ? '◐' : '!'
                    const pctFor = (a: number, t: number) => Math.min(100, t === 0 ? 0 : Math.round((a / t) * 100))
                    const sSecas = stateFor(inv.secas, obj.seca)
                    const sThermos = stateFor(inv.thermos, obj.thermo)
                    const sGlobal: keyof typeof PAL = (sSecas === 'err' || sThermos === 'err') ? 'err'
                                                    : (sSecas === 'warn' || sThermos === 'warn') ? 'warn'
                                                    : 'ok'
                    const isOpen = terminalExpandida === inv.terminal.id
                    return (
                      <div
                        key={inv.terminal.id}
                        onClick={() => setTerminalExpandida(isOpen ? null : inv.terminal.id)}
                        style={{
                          background: '#FFFFFF',
                          border: isOpen ? '1.5px solid ' + tokens.colors.primary : '1px solid #E5E7EB',
                          borderRadius: '10px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isOpen
                            ? '0 0 0 3px rgba(59,108,231,0.08), 0 4px 12px rgba(15,23,42,0.08)'
                            : '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)',
                          display: 'flex', flexDirection: 'column', gap: '12px',
                          minHeight: '158px',
                        }}
                        onMouseEnter={(e) => {
                          if (!isOpen) {
                            e.currentTarget.style.borderColor = '#CBD5E1'
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.08)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isOpen) {
                            e.currentTarget.style.borderColor = '#E5E7EB'
                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)'
                          }
                        }}
                      >
                        {/* Header: dot prominente + nombre + chip estado */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: PAL[sGlobal].dot, flexShrink: 0 }} />
                          <span style={{ fontFamily: tokens.fonts.heading, fontWeight: 600, fontSize: '14px', color: '#0F172A', letterSpacing: '-0.005em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                            {inv.terminal.nombre}
                          </span>
                        </div>

                        {/* Número EN PATIO — slate corporate */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontFamily: tokens.fonts.heading, fontSize: '34px', fontWeight: 700, color: '#0F172A', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.025em' }}>
                            {inv.total}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B', letterSpacing: '-0.005em' }}>
                            en patio
                          </span>
                        </div>

                        {/* Barras finas alineadas tipo Linear */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: 'auto' }}>
                          {/* SECAS */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B' }}>Secas</span>
                              <span style={{ fontFamily: tokens.fonts.heading, fontSize: '12px', fontWeight: 600, color: PAL[sSecas].txt, fontVariantNumeric: 'tabular-nums' }}>
                                {inv.secas}<span style={{ color: '#94A3B8', fontWeight: 500 }}> / {obj.seca}</span> <span style={{ marginLeft: 3, fontSize: '11px' }}>{iconFor(sSecas)}</span>
                              </span>
                            </div>
                            <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: pctFor(inv.secas, obj.seca) + '%', background: PAL[sSecas].bar, borderRadius: '2px', transition: 'width 0.3s ease' }} />
                            </div>
                          </div>
                          {/* THERMOS */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B' }}>Thermos</span>
                              <span style={{ fontFamily: tokens.fonts.heading, fontSize: '12px', fontWeight: 600, color: PAL[sThermos].txt, fontVariantNumeric: 'tabular-nums' }}>
                                {inv.thermos}<span style={{ color: '#94A3B8', fontWeight: 500 }}> / {obj.thermo}</span> <span style={{ marginLeft: 3, fontSize: '11px' }}>{iconFor(sThermos)}</span>
                              </span>
                            </div>
                            <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: pctFor(inv.thermos, obj.thermo) + '%', background: PAL[sThermos].bar, borderRadius: '2px', transition: 'width 0.3s ease' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Card En Ruta — V49 enterprise blanco, dot azul brand */}
                  <div
                    onClick={() => setTerminalExpandida(terminalExpandida === '__ruta__' ? null : '__ruta__')}
                    style={{
                      background: '#FFFFFF',
                      border: terminalExpandida === '__ruta__' ? '1.5px solid ' + tokens.colors.primary : '1px solid #E5E7EB',
                      borderRadius: '10px', padding: '16px', cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)',
                      display: 'flex', flexDirection: 'column', gap: '12px',
                      minHeight: '158px',
                    }}
                    onMouseEnter={(e) => {
                      if (terminalExpandida !== '__ruta__') {
                        e.currentTarget.style.borderColor = '#CBD5E1'
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.08)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (terminalExpandida !== '__ruta__') {
                        e.currentTarget.style.borderColor = '#E5E7EB'
                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)'
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: tokens.colors.primary, flexShrink: 0 }} />
                      <span style={{ fontFamily: tokens.fonts.heading, fontWeight: 600, fontSize: '14px', color: '#0F172A', letterSpacing: '-0.005em', flex: 1 }}>
                        En Ruta
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontFamily: tokens.fonts.heading, fontSize: '34px', fontWeight: 700, color: tokens.colors.primary, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.025em' }}>
                        {cajasEnRuta.length}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B' }}>
                        en tránsito
                      </span>
                    </div>
                    <div style={{ marginTop: 'auto', fontSize: '11px', color: '#94A3B8' }}>
                      Fuera de geocercas · click para detalle
                    </div>
                  </div>
                </div>

                {/* Panel detalle expandido — debajo del grid */}
                {terminalExpandida && (() => {
                  const isRuta = terminalExpandida === '__ruta__'
                  const detalleInv = isRuta ? null : inventariosPorTerminal.find(i => i.terminal.id === terminalExpandida)
                  const cajasDetalle = isRuta ? cajasEnRuta : (detalleInv?.cajas || [])
                  const tituloDetalle = isRuta ? 'En Ruta — Cajas fuera de geocercas' : (detalleInv?.terminal.nombre || '')
                  const subtDetalle = isRuta
                    ? cajasEnRuta.length + ' cajas en tránsito'
                    : (detalleInv ? (detalleInv.terminal.direccion || '') + ' · ' + cajasDetalle.length + ' cajas en patio' : '')

                  return (
                    <div style={{
                      border: '1px solid ' + tokens.colors.border,
                      borderRadius: '14px',
                      background: '#FFFFFF',
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(15,23,42,0.04)',
                    }}>
                      <div style={{ padding: '14px 18px', borderBottom: '1px solid ' + tokens.colors.border, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontFamily: tokens.fonts.heading, fontWeight: 700, fontSize: '14px', color: tokens.colors.textPrimary }}>{tituloDetalle}</div>
                          <div style={{ fontSize: '11px', color: tokens.colors.textMuted, marginTop: 2 }}>{subtDetalle}</div>
                        </div>
                        <button onClick={() => setTerminalExpandida(null)} style={{
                          background: 'transparent', border: '1px solid ' + tokens.colors.border, borderRadius: '8px',
                          padding: '4px 10px', fontSize: '11px', cursor: 'pointer', color: tokens.colors.textSecondary,
                        }}>Cerrar</button>
                      </div>
                      {cajasDetalle.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: tokens.colors.textMuted, fontSize: '12px' }}>
                          Sin cajas en esta ubicación
                        </div>
                      ) : (
                        <div style={{ maxHeight: '320px', overflow: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                              <tr style={{ background: '#F1F5F9', position: 'sticky', top: 0 }}>
                                <th style={{ padding: '10px 14px', textAlign: 'left', color: tokens.colors.textSecondary, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Económico</th>
                                <th style={{ padding: '10px 14px', textAlign: 'left', color: tokens.colors.textSecondary, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Empresa</th>
                                <th style={{ padding: '10px 14px', textAlign: 'left', color: tokens.colors.textSecondary, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</th>
                                <th style={{ padding: '10px 14px', textAlign: 'left', color: tokens.colors.textSecondary, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                                <th style={{ padding: '10px 14px', textAlign: 'left', color: tokens.colors.textSecondary, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Última Señal</th>
                                <th style={{ padding: '10px 14px', textAlign: 'center', color: tokens.colors.textSecondary, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Días sin mov.</th>
                                <th style={{ padding: '10px 14px', textAlign: 'left', color: tokens.colors.textSecondary, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Viaje</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cajasDetalle.map(c => {
                                const dSinMov = c.enMovimiento ? 0 : (diasSinMovMap.get(c.numero_economico) ?? c.diasSinSenal ?? null)
                                const dSinMovColor = dSinMov === null ? tokens.colors.textMuted
                                  : dSinMov === 0 ? '#0D9668'
                                  : dSinMov <= 3 ? tokens.colors.textPrimary
                                  : dSinMov <= 7 ? '#B8860B'
                                  : '#DC2626'
                                const viaje = viajesByCajaId.get(c.id)
                                const hasViaje = !!viaje
                                return (
                                  <tr
                                    key={c.id}
                                    onClick={() => { if (hasViaje) window.location.href = '/operaciones/viajes/' + viaje!.id }}
                                    style={{
                                      borderTop: '1px solid ' + tokens.colors.border,
                                      cursor: hasViaje ? 'pointer' : 'default',
                                      transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => { if (hasViaje) e.currentTarget.style.background = 'rgba(59,108,231,0.05)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                    title={hasViaje ? 'Ver viaje ' + (viaje!.folio || viaje!.id.substring(0, 8)) : 'Sin viaje activo'}
                                  >
                                    <td style={{ padding: '10px 14px', color: tokens.colors.textPrimary, fontWeight: 600 }}>{c.numero_economico}</td>
                                    <td style={{ padding: '10px 14px', color: tokens.colors.textSecondary }}>{c.empresa}</td>
                                    <td style={{ padding: '10px 14px' }}>
                                      <span style={{
                                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                                        background: c.tipoNorm === 'seca' ? 'rgba(249,115,22,0.15)' : 'rgba(8,145,178,0.15)',
                                        color: c.tipoNorm === 'seca' ? '#F97316' : '#0891B2',
                                      }}>{c.tipoNorm === 'seca' ? 'Seca' : 'Thermo'}</span>
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                      <span style={{
                                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                                        background: c.enMovimiento ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.10)',
                                        color: c.enMovimiento ? tokens.colors.green : tokens.colors.textMuted,
                                      }}>{c.enMovimiento ? 'Movimiento' : 'Detenida'}</span>
                                    </td>
                                    <td style={{ padding: '10px 14px', color: tokens.colors.textSecondary, fontSize: '11px' }}>{c.ultimaSenal}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', color: dSinMovColor, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                      {dSinMov === null ? '—' : dSinMov === 0 ? '0' : dSinMov + 'd'}
                                    </td>
                                    <td style={{ padding: '10px 14px', fontSize: '11px' }}>
                                      {hasViaje ? (
                                        <span style={{
                                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                                          padding: '3px 10px', borderRadius: '20px',
                                          background: 'rgba(59,108,231,0.10)',
                                          color: tokens.colors.primary, fontWeight: 600,
                                        }}>
                                          {viaje!.folio || ('Viaje #' + viaje!.id.substring(0, 6))}
                                          <span style={{ fontSize: '10px', color: tokens.colors.textMuted }}>↗</span>
                                        </span>
                                      ) : (
                                        <span style={{ color: tokens.colors.textMuted, fontStyle: 'italic' }}>Sin viaje</span>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </>
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
