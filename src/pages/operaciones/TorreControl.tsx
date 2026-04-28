// V60 (28/Abr/2026) — Torre de Control / Despacho IA
// JJ: mapa de TRACTOS estilo Control Equipo + tabla airline (origen→destino, cita, ETA, semáforo)
// Datos: gps_tracking (tracto live position) + viajes_anodos (viaje activo + cita + cliente)

import type { ReactElement } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { Badge } from '../../components/ui/Badge'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { Truck, Activity, AlertTriangle, CheckCircle2, MapPin, Clock, Search, ArrowUp, ArrowDown } from 'lucide-react'

declare global { interface Window { L: any } }

interface TractoGPS {
  economico: string
  empresa: string | null
  latitud: number
  longitud: number
  velocidad: number
  ubicacion: string | null
  ultima_actualizacion: string
}

interface ViajeActivo {
  tracto: string
  caja: string | null
  cliente: string
  tipo: string
  viaje: number | null
  origen: string
  destino: string
  cita_carga: string | null
  cita_descarga: string | null
  inicia_viaje: string
  llega_destino: string | null
}

interface FilaTorre {
  economico: string
  empresa: string | null
  // GPS
  latitud: number | null
  longitud: number | null
  velocidad: number
  ubicacion: string | null
  ultimo_gps: string | null
  // Viaje
  viaje_num: number | null
  cliente: string
  tipo: string
  caja: string | null
  origen: string
  destino: string
  cita_descarga: string | null
  inicia_viaje: string | null
  // Computed
  estado: 'en_tiempo' | 'en_riesgo' | 'retrasado' | 'sin_viaje' | 'sin_gps'
  minutos_a_cita: number | null
}

const fmt = (iso: string | null) => {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }
  catch { return '—' }
}
const fmtN = (n: number) => (n || 0).toLocaleString('en-US')
const empresaLabel = (e: string | null) => e === 'wexpress' ? 'WExpress' : e === 'SpeedyHaul' ? 'SpeedyHaul' : (e || '—').toUpperCase()

const estadoLabel = (e: string) =>
  e === 'en_tiempo' ? 'En tiempo' :
  e === 'en_riesgo' ? 'En riesgo' :
  e === 'retrasado' ? 'Retrasado' :
  e === 'sin_viaje' ? 'Sin viaje' : 'Sin GPS'

const estadoColor = (e: string): 'green' | 'orange' | 'red' | 'gray' | 'blue' =>
  e === 'en_tiempo' ? 'green' :
  e === 'en_riesgo' ? 'orange' :
  e === 'retrasado' ? 'red' :
  e === 'sin_viaje' ? 'blue' : 'gray'

type SortKey = 'economico' | 'empresa' | 'cliente' | 'tipo' | 'origen' | 'destino' | 'cita_descarga' | 'estado' | 'minutos_a_cita' | 'velocidad'
type SortDir = 'asc' | 'desc'

export default function TorreControl(): ReactElement {
  const [tractosGps, setTractosGps] = useState<TractoGPS[]>([])
  const [viajes, setViajes] = useState<ViajeActivo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('todas')
  const [sortKey, setSortKey] = useState<SortKey>('minutos_a_cita')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [leafletReady, setLeafletReady] = useState(false)

  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  // ─── Inject Leaflet ─────────────────────────────────────
  useEffect(() => {
    if (window.L) { setLeafletReady(true); return }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setLeafletReady(true)
    document.body.appendChild(script)
  }, [])

  // ─── Fetch data ─────────────────────────────────────────
  const fetchAll = async () => {
    try {
      const desde7d = new Date(Date.now() - 7 * 86400000).toISOString()
      const desde24h = new Date(Date.now() - 24 * 3600000).toISOString()
      const [gpsRes, vjRes] = await Promise.all([
        supabase.from('gps_tracking')
          .select('economico, empresa, latitud, longitud, velocidad, ubicacion, ultima_actualizacion')
          .eq('tipo_unidad', 'tracto')
          .gte('ultima_actualizacion', desde24h)
          .limit(500),
        supabase.from('viajes_anodos')
          .select('tracto, caja, cliente, tipo, viaje, municipio_origen, origen, municipio_destino, destino, cita_carga, cita_descarga, inicia_viaje, llega_destino')
          .is('llega_destino', null)
          .neq('tipo', 'VACIO')
          .gte('inicia_viaje', desde7d)
          .order('inicia_viaje', { ascending: false })
          .limit(500),
      ])
      setTractosGps((gpsRes.data || []).map((r: any) => ({
        economico: String(r.economico || '').trim(),
        empresa: r.empresa,
        latitud: Number(r.latitud),
        longitud: Number(r.longitud),
        velocidad: Number(r.velocidad || 0),
        ubicacion: r.ubicacion,
        ultima_actualizacion: r.ultima_actualizacion,
      })))
      setViajes((vjRes.data || []).map((v: any) => ({
        tracto: String(v.tracto || '').trim(),
        caja: v.caja,
        cliente: v.cliente || '—',
        tipo: v.tipo || 'NAC',
        viaje: v.viaje,
        origen: v.municipio_origen || v.origen || '?',
        destino: v.municipio_destino || v.destino || '?',
        cita_carga: v.cita_carga,
        cita_descarga: v.cita_descarga,
        inicia_viaje: v.inicia_viaje,
        llega_destino: v.llega_destino,
      })))
    } catch (e) {
      console.error('TorreControl fetch:', e)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    fetchAll()
    const itv = setInterval(() => { if (document.visibilityState === 'visible') fetchAll() }, 30000)
    return () => clearInterval(itv)
  }, [])

  // ─── Build filas ────────────────────────────────────────
  const filas = useMemo<FilaTorre[]>(() => {
    // Index viajes por tracto (último activo)
    const viajesPorTracto = new Map<string, ViajeActivo>()
    for (const v of viajes) {
      if (v.tracto && !viajesPorTracto.has(v.tracto)) viajesPorTracto.set(v.tracto, v)
    }
    // Index gps por tracto
    const gpsPorTracto = new Map<string, TractoGPS>()
    for (const g of tractosGps) {
      if (g.economico) gpsPorTracto.set(g.economico, g)
    }
    // Universo: union de tractos en gps O en viajes
    const all = new Set<string>([...gpsPorTracto.keys(), ...viajesPorTracto.keys()])
    const now = Date.now()
    const out: FilaTorre[] = []
    all.forEach(tracto => {
      const g = gpsPorTracto.get(tracto)
      const v = viajesPorTracto.get(tracto)
      let estado: FilaTorre['estado'] = 'sin_viaje'
      let minutos: number | null = null
      if (v && v.cita_descarga) {
        const cita = new Date(v.cita_descarga).getTime()
        minutos = Math.round((cita - now) / 60000)
        if (minutos < 0) estado = 'retrasado'
        else if (minutos < 120) estado = 'en_riesgo'
        else estado = 'en_tiempo'
      } else if (!v && g) {
        estado = 'sin_viaje'
      } else if (v && !g) {
        estado = 'sin_gps'
      } else if (v) {
        estado = 'en_tiempo'
      }
      out.push({
        economico: tracto,
        empresa: g?.empresa || null,
        latitud: g?.latitud || null,
        longitud: g?.longitud || null,
        velocidad: g?.velocidad || 0,
        ubicacion: g?.ubicacion || null,
        ultimo_gps: g?.ultima_actualizacion || null,
        viaje_num: v?.viaje || null,
        cliente: v?.cliente || '—',
        tipo: v?.tipo || '—',
        caja: v?.caja || null,
        origen: v?.origen || '—',
        destino: v?.destino || '—',
        cita_descarga: v?.cita_descarga || null,
        inicia_viaje: v?.inicia_viaje || null,
        estado, minutos_a_cita: minutos,
      })
    })
    return out
  }, [tractosGps, viajes])

  // ─── Filtrado + sort ────────────────────────────────────
  const empresas = useMemo(() => {
    const s = new Set<string>(); filas.forEach(f => f.empresa && s.add(f.empresa))
    return Array.from(s).sort()
  }, [filas])

  const filtradas = useMemo(() => {
    const s = search.trim().toLowerCase()
    return filas.filter(f => {
      if (filtroEstado !== 'todos' && f.estado !== filtroEstado) return false
      if (filtroEmpresa !== 'todas' && (f.empresa || '').toLowerCase() !== filtroEmpresa.toLowerCase()) return false
      if (s && !(f.economico.toLowerCase().includes(s) || f.cliente.toLowerCase().includes(s) ||
                f.origen.toLowerCase().includes(s) || f.destino.toLowerCase().includes(s))) return false
      return true
    })
  }, [filas, search, filtroEstado, filtroEmpresa])

  const sorted = useMemo(() => {
    const arr = [...filtradas]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      const va = (a as any)[sortKey], vb = (b as any)[sortKey]
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb), 'es') * dir
    })
    return arr
  }, [filtradas, sortKey, sortDir])

  const kpis = useMemo(() => ({
    total: filas.length,
    en_tiempo: filas.filter(f => f.estado === 'en_tiempo').length,
    en_riesgo: filas.filter(f => f.estado === 'en_riesgo').length,
    retrasados: filas.filter(f => f.estado === 'retrasado').length,
  }), [filas])

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir(k === 'minutos_a_cita' || k === 'cita_descarga' ? 'asc' : 'desc') }
  }

  // ─── Mapa Leaflet ───────────────────────────────────────
  useEffect(() => {
    if (!leafletReady || !mapDivRef.current || !window.L) return
    const L = window.L
    if (!mapRef.current) {
      mapRef.current = L.map(mapDivRef.current, {
        center: [23.5, -102], zoom: 5, minZoom: 4, maxZoom: 12,
        maxBounds: [[14, -118], [50, -85]],
      })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap', maxZoom: 12,
      }).addTo(mapRef.current)
    }
    // Limpiar markers anteriores
    markersRef.current.forEach(m => mapRef.current.removeLayer(m))
    markersRef.current = []
    sorted.filter(f => f.latitud && f.longitud).forEach(f => {
      const moving = f.velocidad > 5
      const color =
        f.estado === 'retrasado' ? '#EF4444' :
        f.estado === 'en_riesgo' ? '#F59E0B' :
        f.estado === 'en_tiempo' ? '#10B981' :
        f.estado === 'sin_viaje' ? '#6B7280' : '#9CA3AF'
      const size = moving ? 14 : 10
      const icon = L.divIcon({
        className: '',
        html: '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:3px;' +
              'background:' + color + ';border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);' +
              (moving ? 'animation:pulseT 2s infinite;' : '') + '"></div>',
        iconSize: [size, size], iconAnchor: [size / 2, size / 2],
      })
      const marker = L.marker([f.latitud, f.longitud], { icon }).addTo(mapRef.current)
      const popup =
        '<div style="font-family:Montserrat,system-ui;font-size:12px;line-height:1.5;min-width:220px">' +
        '<strong style="font-size:14px">Tracto ' + f.economico + '</strong> ' +
        '<span style="margin-left:6px;padding:2px 6px;border-radius:8px;font-size:10px;font-weight:700;' +
        'background:' + color + ';color:#fff">' + estadoLabel(f.estado).toUpperCase() + '</span>' +
        '<br/><b>Empresa:</b> ' + empresaLabel(f.empresa) +
        '<br/><b>Velocidad:</b> ' + (f.velocidad || 0) + ' km/h' +
        (f.viaje_num ? '<hr style="margin:6px 0;border:none;border-top:1px solid #E2E8F0"/>' +
          '<b>Viaje:</b> V' + f.viaje_num + '<br/>' +
          '<b>Cliente:</b> ' + f.cliente + '<br/>' +
          '<b>Caja:</b> ' + (f.caja || '—') + '<br/>' +
          '<b>Origen:</b> ' + f.origen + '<br/>' +
          '<b>Destino:</b> ' + f.destino + '<br/>' +
          '<b>Cita:</b> ' + fmt(f.cita_descarga)
          : '<br/><i style="color:#94A3B8">Sin viaje activo</i>') +
        '</div>'
      marker.bindPopup(popup)
      markersRef.current.push(marker)
    })
  }, [sorted, leafletReady])

  const Th = ({ k, label, align = 'left' }: { k: SortKey, label: string, align?: 'left' | 'right' | 'center' }) => (
    <th onClick={() => toggleSort(k)} style={{
      textAlign: align as any, padding: '8px 10px', fontSize: '11px',
      textTransform: 'uppercase', color: tokens.colors.textSecondary, fontWeight: 700,
      cursor: 'pointer', userSelect: 'none', borderBottom: `1px solid ${tokens.colors.border}`,
      background: sortKey === k ? 'rgba(30,102,245,0.08)' : 'transparent', whiteSpace: 'nowrap',
    }}>
      {label}{sortKey === k ? (sortDir === 'asc' ? <ArrowUp size={10} style={{ marginLeft: 4 }} /> : <ArrowDown size={10} style={{ marginLeft: 4 }} />) : <span style={{ opacity: 0.3, marginLeft: 4 }}>⇅</span>}
    </th>
  )

  const fmtMinutos = (m: number | null) => {
    if (m == null) return '—'
    if (m === 0) return 'AHORA'
    if (m > 0) {
      const h = Math.floor(m / 60), mm = m % 60
      return h > 0 ? `+${h}h ${mm}m` : `+${m}m`
    }
    const abs = Math.abs(m)
    const h = Math.floor(abs / 60), mm = abs % 60
    return h > 0 ? `-${h}h ${mm}m` : `-${abs}m`
  }

  return (
    <ModuleLayout titulo="Despacho IA — Torre de Control">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="Tractos en operación" valor={fmtN(kpis.total)} color="primary" icono={<Truck size={20} />} />
        <KPICard titulo="En tiempo" valor={fmtN(kpis.en_tiempo)} color="green" icono={<CheckCircle2 size={20} />} />
        <KPICard titulo="En riesgo (<2h cita)" valor={fmtN(kpis.en_riesgo)} color="orange" icono={<Clock size={20} />} />
        <KPICard titulo="Retrasados" valor={fmtN(kpis.retrasados)} color="red" icono={<AlertTriangle size={20} />} />
      </div>

      {/* Mapa */}
      <Card style={{ marginBottom: tokens.spacing.lg, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: tokens.colors.textPrimary }}>
            <MapPin size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            Mapa de tractos en operación ({sorted.filter(f => f.latitud && f.longitud).length})
          </h3>
          <div style={{ fontSize: '11px', color: tokens.colors.textSecondary }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: '#10B981', borderRadius: 2, marginRight: 4 }} />En tiempo
            <span style={{ display: 'inline-block', width: 10, height: 10, background: '#F59E0B', borderRadius: 2, marginLeft: 12, marginRight: 4 }} />En riesgo
            <span style={{ display: 'inline-block', width: 10, height: 10, background: '#EF4444', borderRadius: 2, marginLeft: 12, marginRight: 4 }} />Retrasado
            <span style={{ display: 'inline-block', width: 10, height: 10, background: '#6B7280', borderRadius: 2, marginLeft: 12, marginRight: 4 }} />Sin viaje
          </div>
        </div>
        <div ref={mapDivRef} style={{ height: 420, width: '100%' }} />
      </Card>

      {/* Filtros */}
      <Card>
        <div style={{ display: 'flex', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: tokens.colors.textMuted }} />
            <input type="text" placeholder="Buscar tracto, cliente, origen, destino…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 14px 10px 36px', background: tokens.colors.bgMain,
                       border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
                       color: tokens.colors.textPrimary, fontSize: '13px', outline: 'none' }} />
          </div>
          <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} style={{
            padding: '10px 12px', background: tokens.colors.bgMain, border: `1px solid ${tokens.colors.border}`,
            borderRadius: tokens.radius.md, color: tokens.colors.textPrimary, fontSize: '13px', fontWeight: 600,
            outline: 'none', cursor: 'pointer', minWidth: 140,
          }}>
            <option value="todas">Todas las empresas</option>
            {empresas.map(e => <option key={e} value={e}>{empresaLabel(e)}</option>)}
          </select>
          {(['todos', 'en_tiempo', 'en_riesgo', 'retrasado', 'sin_viaje'] as const).map(s => (
            <button key={s} onClick={() => setFiltroEstado(s)} style={{
              padding: '8px 14px', borderRadius: tokens.radius.md,
              border: `1px solid ${filtroEstado === s ? tokens.colors.primary : tokens.colors.border}`,
              background: filtroEstado === s ? tokens.colors.primary : 'transparent',
              color: filtroEstado === s ? '#FFFFFF' : tokens.colors.textPrimary,
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>
              {s === 'todos' ? 'Todos' : estadoLabel(s)}
            </button>
          ))}
        </div>
        <div style={{ marginBottom: tokens.spacing.sm, fontSize: '13px', color: tokens.colors.textSecondary }}>
          Mostrando {fmtN(sorted.length)} de {fmtN(filas.length)} tractos · click encabezado para ordenar
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textSecondary }}>Cargando torre de control…</div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textMuted }}>Sin resultados</div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: 500 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: tokens.colors.bgCard, zIndex: 5 }}>
                <tr>
                  <Th k="economico" label="Tracto" />
                  <Th k="empresa" label="Empresa" />
                  <Th k="cliente" label="Cliente" />
                  <Th k="tipo" label="Tipo" />
                  <Th k="origen" label="Origen" />
                  <Th k="destino" label="Destino" />
                  <Th k="cita_descarga" label="Cita descarga" />
                  <Th k="minutos_a_cita" label="ETA vs cita" />
                  <Th k="velocidad" label="Vel" align="right" />
                  <Th k="estado" label="Estado" />
                </tr>
              </thead>
              <tbody>
                {sorted.map(f => (
                  <tr key={f.economico} style={{ borderBottom: `1px solid ${tokens.colors.border}` }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, fontSize: '12px', color: tokens.colors.textPrimary }}>{f.economico}</td>
                    <td style={{ padding: '6px 10px', fontSize: '11px', color: tokens.colors.textSecondary }}>{empresaLabel(f.empresa)}</td>
                    <td style={{ padding: '6px 10px', fontSize: '12px', color: tokens.colors.textPrimary }}>{f.cliente}</td>
                    <td style={{ padding: '6px 10px' }}>{f.tipo !== '—' ? <Badge color={f.tipo === 'IMPO' ? 'blue' : f.tipo === 'EXPO' ? 'green' : 'gray'}>{f.tipo}</Badge> : '—'}</td>
                    <td style={{ padding: '6px 10px', fontSize: '11px', color: tokens.colors.textSecondary }}>{f.origen}</td>
                    <td style={{ padding: '6px 10px', fontSize: '11px', color: tokens.colors.textSecondary }}>{f.destino}</td>
                    <td style={{ padding: '6px 10px', fontSize: '11px', color: tokens.colors.textSecondary }}>{fmt(f.cita_descarga)}</td>
                    <td style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700,
                                 color: f.estado === 'retrasado' ? tokens.colors.red : f.estado === 'en_riesgo' ? tokens.colors.orange : f.estado === 'en_tiempo' ? tokens.colors.green : tokens.colors.textMuted }}>
                      {fmtMinutos(f.minutos_a_cita)}
                    </td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontSize: '11px',
                                 color: f.velocidad > 5 ? tokens.colors.green : tokens.colors.textMuted, fontWeight: f.velocidad > 5 ? 700 : 400 }}>
                      {f.velocidad ? Math.round(f.velocidad) + ' km/h' : '—'}
                    </td>
                    <td style={{ padding: '6px 10px' }}><Badge color={estadoColor(f.estado)}>{estadoLabel(f.estado)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <style>{`@keyframes pulseT { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); } 70% { box-shadow: 0 0 0 8px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }`}</style>
    </ModuleLayout>
  )
}
