// V63 (28/Abr/2026) — Despacho IA / Torre de Control con MAPA Leaflet
// V61 era tabla airline simple; V63 agrega:
//   - Mapa Leaflet con markers de TODOS los tractos GPS (218, 109 con datos 24h)
//   - Toggle Mapa | Tabla | Ambos
//   - Defensivo: si Leaflet no carga, mostrar tabla nada mas (sin pantalla blanca)
//   - Mismo encuadre USA+MX que ControlEquipo

import type { ReactElement } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { Badge } from '../../components/ui/Badge'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { Truck, AlertTriangle, CheckCircle2, Clock, Search, ArrowUp, ArrowDown, Map as MapIcon, List, Layout } from 'lucide-react'

declare const L: any

interface FilaTorre {
  economico: string
  empresa: string | null
  velocidad: number
  ubicacion: string | null
  latitud: number | null
  longitud: number | null
  viaje_num: number | null
  cliente: string
  tipo: string
  caja: string | null
  origen: string
  destino: string
  cita_descarga: string | null
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
  e === 'en_tiempo' ? 'En tiempo' : e === 'en_riesgo' ? 'En riesgo' :
  e === 'retrasado' ? 'Retrasado' : e === 'sin_viaje' ? 'Sin viaje' : 'Sin GPS'
const estadoColor = (e: string): 'green' | 'orange' | 'red' | 'gray' | 'blue' =>
  e === 'en_tiempo' ? 'green' : e === 'en_riesgo' ? 'orange' :
  e === 'retrasado' ? 'red' : e === 'sin_viaje' ? 'blue' : 'gray'
const estadoHex = (e: string) =>
  e === 'en_tiempo' ? '#10B981' : e === 'en_riesgo' ? '#F59E0B' :
  e === 'retrasado' ? '#EF4444' : e === 'sin_viaje' ? '#3B82F6' : '#6B7280'

const fmtMinutos = (m: number | null) => {
  if (m == null) return '—'
  if (m === 0) return 'AHORA'
  const abs = Math.abs(m), h = Math.floor(abs / 60), mm = abs % 60
  const sign = m > 0 ? '+' : '-'
  return h > 0 ? sign + h + 'h ' + mm + 'm' : sign + abs + 'm'
}

type SortKey = 'economico' | 'cliente' | 'origen' | 'destino' | 'cita_descarga' | 'minutos_a_cita' | 'velocidad' | 'estado'
type Vista = 'mapa' | 'tabla' | 'ambos'

export default function TorreControl(): ReactElement {
  const [filas, setFilas] = useState<FilaTorre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('todas')
  const [sortKey, setSortKey] = useState<SortKey>('minutos_a_cita')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [vista, setVista] = useState<Vista>('ambos')
  const [leafletReady, setLeafletReady] = useState(false)
  const [leafletError, setLeafletError] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  // Cargar Leaflet desde CDN (mismo patron que ControlEquipo)
  useEffect(() => {
    if ((window as any).L) { setLeafletReady(true); return }
    try {
      const css = document.createElement('link')
      css.rel = 'stylesheet'
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(css)
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => setLeafletReady(true)
      script.onerror = () => setLeafletError('No se pudo cargar Leaflet desde CDN')
      document.head.appendChild(script)
    } catch (e: any) {
      setLeafletError(e?.message || 'Error al inyectar Leaflet')
    }
  }, [])

  const fetchAll = async () => {
    try {
      setError(null)
      const desde7d = new Date(Date.now() - 7 * 86400000).toISOString()
      const desde24h = new Date(Date.now() - 24 * 3600000).toISOString()
      const [gpsRes, vjRes] = await Promise.all([
        supabase.from('gps_tracking')
          .select('economico, empresa, velocidad, ubicacion, latitud, longitud, ultima_actualizacion')
          .eq('tipo_unidad', 'tracto')
          .gte('ultima_actualizacion', desde24h)
          .limit(500),
        supabase.from('viajes_anodos')
          .select('tracto, caja, cliente, tipo, viaje, municipio_origen, origen, municipio_destino, destino, cita_descarga, inicia_viaje, llega_destino')
          .is('llega_destino', null)
          .neq('tipo', 'VACIO')
          .gte('inicia_viaje', desde7d)
          .order('inicia_viaje', { ascending: false })
          .limit(500),
      ])
      if (gpsRes.error) throw gpsRes.error
      if (vjRes.error) throw vjRes.error

      const gpsMap = new Map<string, any>()
      for (const r of (gpsRes.data || [])) {
        const k = String(r.economico || '').trim()
        if (k) gpsMap.set(k, r)
      }
      const vjMap = new Map<string, any>()
      for (const v of (vjRes.data || [])) {
        const k = String(v.tracto || '').trim()
        if (k && !vjMap.has(k)) vjMap.set(k, v)
      }
      const all = new Set<string>([...gpsMap.keys(), ...vjMap.keys()])
      const now = Date.now()
      const out: FilaTorre[] = []
      all.forEach(tr => {
        const g = gpsMap.get(tr)
        const v = vjMap.get(tr)
        let estado: FilaTorre['estado'] = 'sin_viaje'
        let minutos: number | null = null
        if (v && v.cita_descarga) {
          minutos = Math.round((new Date(v.cita_descarga).getTime() - now) / 60000)
          estado = minutos < 0 ? 'retrasado' : minutos < 120 ? 'en_riesgo' : 'en_tiempo'
        } else if (v && !g) {
          estado = 'sin_gps'
        } else if (!v) {
          estado = 'sin_viaje'
        }
        out.push({
          economico: tr,
          empresa: g?.empresa || null,
          velocidad: Number(g?.velocidad || 0),
          ubicacion: g?.ubicacion || null,
          latitud: g?.latitud != null ? Number(g.latitud) : null,
          longitud: g?.longitud != null ? Number(g.longitud) : null,
          viaje_num: v?.viaje || null,
          cliente: v?.cliente || '—',
          tipo: v?.tipo || '—',
          caja: v?.caja || null,
          origen: v?.municipio_origen || v?.origen || '—',
          destino: v?.municipio_destino || v?.destino || '—',
          cita_descarga: v?.cita_descarga || null,
          estado, minutos_a_cita: minutos,
        })
      })
      setFilas(out)
    } catch (e: any) {
      console.error('TorreControl fetch:', e)
      setError(e?.message || 'Error desconocido')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    console.log('[TorreControl] V63 montado — con mapa Leaflet')
    fetchAll()
    const itv = setInterval(() => { if (document.visibilityState === 'visible') fetchAll() }, 30000)
    return () => clearInterval(itv)
  }, [])

  // Init mapa Leaflet
  useEffect(() => {
    if (!leafletReady || vista === 'tabla' || !mapRef.current || mapInstanceRef.current) return
    if (!(window as any).L) return
    try {
      const map = L.map(mapRef.current, {
        center: [28, -98], zoom: 5, minZoom: 4, maxZoom: 12,
        maxBounds: [[14, -118], [50, -85]], maxBoundsViscosity: 0.85,
      })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap', maxZoom: 12, minZoom: 4,
      }).addTo(map)
      mapInstanceRef.current = map
    } catch (e: any) {
      console.error('[TorreControl] Error init mapa:', e)
      setLeafletError('Error inicializando mapa: ' + (e?.message || 'unknown'))
    }
    return () => {
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove() } catch {}
        mapInstanceRef.current = null
      }
    }
  }, [leafletReady, vista])

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

  // Update markers cuando cambian filas filtradas o vista
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletReady) return
    const map = mapInstanceRef.current
    markersRef.current.forEach((m: any) => { try { map.removeLayer(m) } catch {} })
    markersRef.current = []

    const conCoords = filtradas.filter(f => f.latitud != null && f.longitud != null && f.latitud !== 0)
    conCoords.forEach(f => {
      const color = estadoHex(f.estado)
      const moving = f.velocidad > 5
      const size = moving ? 14 : 11
      try {
        const icon = L.divIcon({
          className: '',
          html: '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;' +
                'background:' + color + ';border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);' +
                (moving ? 'animation:torre-pulse 2s infinite;' : '') + '"></div>',
          iconSize: [size, size], iconAnchor: [size / 2, size / 2],
        })
        const marker = L.marker([f.latitud, f.longitud], { icon }).addTo(map)
        const viajeBlock = f.viaje_num
          ? '<hr style="border:none;border-top:1px solid #E2E8F0;margin:6px 0;"/>' +
            '<b>Viaje:</b> V' + f.viaje_num + '<br/>' +
            '<b>Cliente:</b> ' + f.cliente + '<br/>' +
            '<b>Tipo:</b> ' + f.tipo + '<br/>' +
            '<b>Caja:</b> ' + (f.caja || '—') + '<br/>' +
            '<b>Origen:</b> ' + f.origen + '<br/>' +
            '<b>Destino:</b> ' + f.destino + '<br/>' +
            '<b>Cita descarga:</b> ' + fmt(f.cita_descarga) + '<br/>' +
            '<b>ETA vs cita:</b> <span style="color:' + color + ';font-weight:700;">' + fmtMinutos(f.minutos_a_cita) + '</span>'
          : '<hr style="border:none;border-top:1px solid #E2E8F0;margin:6px 0;"/>' +
            '<i style="color:#94A3B8;">Sin viaje activo en ANODOS</i>'
        marker.bindPopup(
          '<div style="font-family:Montserrat,system-ui,sans-serif;font-size:12px;line-height:1.5;min-width:230px;">' +
          '<strong style="font-size:14px;">Tracto ' + f.economico + '</strong>' +
          '<span style="margin-left:6px;padding:2px 6px;border-radius:10px;font-size:10px;font-weight:600;' +
          'background:' + color + '20;color:' + color + ';">' + estadoLabel(f.estado) + '</span><br/>' +
          '<b>Empresa:</b> ' + empresaLabel(f.empresa) + '<br/>' +
          '<b>Velocidad:</b> ' + (f.velocidad > 0 ? Math.round(f.velocidad) + ' km/h' : '0 km/h') + '<br/>' +
          '<b>Ubicación:</b> ' + (f.ubicacion || '—') +
          viajeBlock +
          '</div>'
        )
        markersRef.current.push(marker)
      } catch (e) { console.warn('Error marker tracto', f.economico, e) }
    })
  }, [filtradas, leafletReady, vista])

  // Inject pulse animation
  useEffect(() => {
    if (document.getElementById('torre-pulse-anim')) return
    const style = document.createElement('style')
    style.id = 'torre-pulse-anim'
    style.textContent = '@keyframes torre-pulse{0%{box-shadow:0 0 0 0 rgba(16,185,129,0.5)}70%{box-shadow:0 0 0 8px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}'
    document.head.appendChild(style)
  }, [])

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

  const Th = ({ k, label, align = 'left' }: { k: SortKey, label: string, align?: 'left' | 'right' | 'center' }) => (
    <th onClick={() => toggleSort(k)} style={{
      textAlign: align as any, padding: '8px 10px', fontSize: '11px',
      textTransform: 'uppercase', color: tokens.colors.textSecondary, fontWeight: 700,
      cursor: 'pointer', userSelect: 'none', borderBottom: '1px solid ' + tokens.colors.border,
      background: sortKey === k ? 'rgba(59,108,231,0.08)' : 'transparent', whiteSpace: 'nowrap',
    }}>
      {label}{sortKey === k ? (sortDir === 'asc' ? <ArrowUp size={10} style={{ marginLeft: 4 }} /> : <ArrowDown size={10} style={{ marginLeft: 4 }} />) : null}
    </th>
  )

  const VistaBtn = ({ v, label, icon }: { v: Vista, label: string, icon: ReactElement }) => (
    <button onClick={() => setVista(v)} style={{
      padding: '8px 14px', borderRadius: tokens.radius.md, display: 'flex', alignItems: 'center', gap: 6,
      border: '1px solid ' + (vista === v ? tokens.colors.primary : tokens.colors.border),
      background: vista === v ? tokens.colors.primary : 'transparent',
      color: vista === v ? '#FFFFFF' : tokens.colors.textPrimary,
      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
    }}>{icon}{label}</button>
  )

  const conCoordsCount = filtradas.filter(f => f.latitud != null && f.longitud != null && f.latitud !== 0).length

  return (
    <ModuleLayout titulo="Despacho IA - Torre de Control">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.md }}>
        <KPICard titulo="Tractos en operación" valor={fmtN(kpis.total)} color="primary" icono={<Truck size={20} />} />
        <KPICard titulo="En tiempo" valor={fmtN(kpis.en_tiempo)} color="green" icono={<CheckCircle2 size={20} />} />
        <KPICard titulo="En riesgo (<2h cita)" valor={fmtN(kpis.en_riesgo)} color="orange" icono={<Clock size={20} />} />
        <KPICard titulo="Retrasados" valor={fmtN(kpis.retrasados)} color="red" icono={<AlertTriangle size={20} />} />
      </div>

      {error && (
        <Card style={{ marginBottom: tokens.spacing.md, borderColor: tokens.colors.red }}>
          <div style={{ color: tokens.colors.red, fontSize: '13px' }}>Error: {error}</div>
        </Card>
      )}

      <div style={{ display: 'flex', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: tokens.colors.textMuted }} />
          <input type="text" placeholder="Buscar tracto, cliente, origen, destino..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 36px', background: tokens.colors.bgMain,
                     border: '1px solid ' + tokens.colors.border, borderRadius: tokens.radius.md,
                     color: tokens.colors.textPrimary, fontSize: '13px', outline: 'none' }} />
        </div>
        <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} style={{
          padding: '10px 12px', background: tokens.colors.bgMain, border: '1px solid ' + tokens.colors.border,
          borderRadius: tokens.radius.md, color: tokens.colors.textPrimary, fontSize: '13px', fontWeight: 600,
          outline: 'none', cursor: 'pointer', minWidth: 140,
        }}>
          <option value="todas">Todas las empresas</option>
          {empresas.map(e => <option key={e} value={e}>{empresaLabel(e)}</option>)}
        </select>
        {(['todos', 'en_tiempo', 'en_riesgo', 'retrasado', 'sin_viaje'] as const).map(s => (
          <button key={s} onClick={() => setFiltroEstado(s)} style={{
            padding: '8px 14px', borderRadius: tokens.radius.md,
            border: '1px solid ' + (filtroEstado === s ? tokens.colors.primary : tokens.colors.border),
            background: filtroEstado === s ? tokens.colors.primary : 'transparent',
            color: filtroEstado === s ? '#FFFFFF' : tokens.colors.textPrimary,
            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}>{s === 'todos' ? 'Todos' : estadoLabel(s)}</button>
        ))}
        <div style={{ flex: '0 0 auto', display: 'flex', gap: 6, marginLeft: 'auto' }}>
          <VistaBtn v="ambos" label="Ambos" icon={<Layout size={14} />} />
          <VistaBtn v="mapa" label="Mapa" icon={<MapIcon size={14} />} />
          <VistaBtn v="tabla" label="Tabla" icon={<List size={14} />} />
        </div>
      </div>

      {(vista === 'mapa' || vista === 'ambos') && (
        <Card style={{ marginBottom: tokens.spacing.md, padding: 0, overflow: 'hidden' }}>
          {leafletError ? (
            <div style={{ padding: tokens.spacing.lg, textAlign: 'center', color: tokens.colors.orange, fontSize: '13px' }}>
              ⚠ Mapa no disponible: {leafletError}<br/>
              <span style={{ fontSize: '11px', color: tokens.colors.textMuted }}>(la tabla sigue funcionando)</span>
            </div>
          ) : !leafletReady ? (
            <div style={{ padding: tokens.spacing.lg, textAlign: 'center', color: tokens.colors.textSecondary, fontSize: '13px' }}>
              Cargando mapa...
            </div>
          ) : (
            <>
              <div style={{ padding: '8px 14px', fontSize: '12px', color: tokens.colors.textSecondary, borderBottom: '1px solid ' + tokens.colors.border }}>
                Mostrando {fmtN(conCoordsCount)} de {fmtN(filtradas.length)} tractos con GPS — verde=en tiempo, naranja=en riesgo, rojo=retrasado, azul=sin viaje
              </div>
              <div ref={mapRef} style={{ width: '100%', height: vista === 'mapa' ? '600px' : '420px' }} />
            </>
          )}
        </Card>
      )}

      {(vista === 'tabla' || vista === 'ambos') && (
        <Card>
          <div style={{ marginBottom: tokens.spacing.sm, fontSize: '13px', color: tokens.colors.textSecondary }}>
            Mostrando {fmtN(sorted.length)} de {fmtN(filas.length)} tractos
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textSecondary }}>Cargando...</div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textMuted }}>Sin resultados</div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: vista === 'tabla' ? 600 : 380 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: tokens.colors.bgCard, zIndex: 5 }}>
                  <tr>
                    <Th k="economico" label="Tracto" />
                    <Th k="cliente" label="Cliente" />
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
                    <tr key={f.economico} style={{ borderBottom: '1px solid ' + tokens.colors.border }}>
                      <td style={{ padding: '6px 10px', fontWeight: 700, fontSize: '12px', color: tokens.colors.textPrimary }}>{f.economico}</td>
                      <td style={{ padding: '6px 10px', fontSize: '12px', color: tokens.colors.textPrimary }}>{f.cliente}</td>
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
      )}
    </ModuleLayout>
  )
}
