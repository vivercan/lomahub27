// V64 (28/Abr/2026) — Despacho IA / Torre de Control AAA
// Cambios sobre V63:
//   - Sidebar lateral clickeable (280px) con flyTo + popup auto
//   - Tab adicional 'Sin viaje (N)' con ultimo viaje + horas sin asignacion
//   - Layout golpe-de-vista: 100vh sin scroll vertical
//   - Universo 218 tractos GPS (sin filtro 24h)
//   - Query nueva: viajes_anodos cerrados para "ultimo viaje por tracto"
//   - Click marker sin viaje muestra: ultimo viaje + horas sin asignacion

import type { ReactElement } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { Badge } from '../../components/ui/Badge'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { Truck, AlertTriangle, CheckCircle2, Clock, Search, Map as MapIcon, List, Layout, AlertCircle } from 'lucide-react'

declare const L: any

interface UltimoViaje {
  viaje: number | null
  cliente: string
  destino: string
  llega_destino: string  // ISO
  horas_sin_asignacion: number
}

interface FilaTorre {
  economico: string
  empresa: string | null
  velocidad: number
  ubicacion: string | null
  latitud: number | null
  longitud: number | null
  ultima_act: string | null
  // viaje activo
  viaje_num: number | null
  cliente: string
  tipo: string
  caja: string | null
  origen: string
  destino: string
  cita_descarga: string | null
  estado: 'en_tiempo' | 'en_riesgo' | 'retrasado' | 'sin_viaje' | 'sin_gps'
  minutos_a_cita: number | null
  // ultimo viaje (cuando estado = sin_viaje)
  ultimo_viaje: UltimoViaje | null
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
const fmtHorasSin = (h: number) => {
  if (h < 1) return 'menos de 1h'
  if (h < 48) return Math.round(h) + 'h'
  const d = Math.floor(h / 24)
  return d + 'd'
}

type Vista = 'mapa' | 'tabla' | 'ambos' | 'sin_viaje'

export default function TorreControl(): ReactElement {
  const [filas, setFilas] = useState<FilaTorre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('todas')
  const [vista, setVista] = useState<Vista>('ambos')
  const [tractoSeleccionado, setTractoSeleccionado] = useState<string | null>(null)
  const [leafletReady, setLeafletReady] = useState(false)
  const [leafletError, setLeafletError] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())

  // Cargar Leaflet
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
      const [gpsRes, vjActRes, vjCerrRes] = await Promise.all([
        // 1) Universo completo: TODOS los tractos GPS (sin filtro 24h)
        supabase.from('gps_tracking')
          .select('economico, empresa, velocidad, ubicacion, latitud, longitud, ultima_actualizacion')
          .eq('tipo_unidad', 'tracto')
          .limit(1000),
        // 2) Viajes ACTIVOS
        supabase.from('viajes_anodos')
          .select('tracto, caja, cliente, tipo, viaje, municipio_origen, origen, municipio_destino, destino, cita_descarga, inicia_viaje, llega_destino')
          .is('llega_destino', null)
          .neq('tipo', 'VACIO')
          .gte('inicia_viaje', desde7d)
          .order('inicia_viaje', { ascending: false })
          .limit(500),
        // 3) Viajes CERRADOS recientes (para "ultimo viaje por tracto sin asignacion")
        supabase.from('viajes_anodos')
          .select('tracto, viaje, cliente, municipio_destino, destino, llega_destino')
          .not('llega_destino', 'is', null)
          .not('tracto', 'is', null)
          .gte('llega_destino', new Date(Date.now() - 90 * 86400000).toISOString())
          .order('llega_destino', { ascending: false })
          .limit(3000),
      ])
      if (gpsRes.error) throw gpsRes.error
      if (vjActRes.error) throw vjActRes.error
      if (vjCerrRes.error) throw vjCerrRes.error

      const gpsMap = new Map<string, any>()
      for (const r of (gpsRes.data || [])) {
        const k = String(r.economico || '').trim()
        if (k) gpsMap.set(k, r)
      }
      const vjActMap = new Map<string, any>()
      for (const v of (vjActRes.data || [])) {
        const k = String(v.tracto || '').trim()
        if (k && !vjActMap.has(k)) vjActMap.set(k, v)
      }
      // Map de ultimo viaje por tracto (cerrados)
      const ultimoViajeMap = new Map<string, UltimoViaje>()
      const now = Date.now()
      for (const v of (vjCerrRes.data || [])) {
        const k = String(v.tracto || '').trim()
        if (!k || ultimoViajeMap.has(k)) continue
        const ll = v.llega_destino ? new Date(v.llega_destino).getTime() : null
        if (!ll || ll > now) continue  // descarta fechas futuras corruptas
        const horas = (now - ll) / 3600000
        ultimoViajeMap.set(k, {
          viaje: v.viaje || null,
          cliente: v.cliente || '—',
          destino: v.municipio_destino || v.destino || '—',
          llega_destino: v.llega_destino,
          horas_sin_asignacion: horas,
        })
      }

      const all = new Set<string>([...gpsMap.keys(), ...vjActMap.keys()])
      const out: FilaTorre[] = []
      all.forEach(tr => {
        const g = gpsMap.get(tr)
        const v = vjActMap.get(tr)
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
          ultima_act: g?.ultima_actualizacion || null,
          viaje_num: v?.viaje || null,
          cliente: v?.cliente || '—',
          tipo: v?.tipo || '—',
          caja: v?.caja || null,
          origen: v?.municipio_origen || v?.origen || '—',
          destino: v?.municipio_destino || v?.destino || '—',
          cita_descarga: v?.cita_descarga || null,
          estado, minutos_a_cita: minutos,
          ultimo_viaje: estado === 'sin_viaje' ? (ultimoViajeMap.get(tr) || null) : null,
        })
      })
      setFilas(out)
    } catch (e: any) {
      console.error('TorreControl fetch:', e)
      setError(e?.message || 'Error desconocido')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    console.log('[TorreControl] V64 montado — sidebar + tab Sin viaje')
    fetchAll()
    const itv = setInterval(() => { if (document.visibilityState === 'visible') fetchAll() }, 30000)
    return () => clearInterval(itv)
  }, [])

  // Init mapa
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
        markersRef.current.clear()
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
      // En tab "sin_viaje" mostrar SOLO sin_viaje
      if (vista === 'sin_viaje' && f.estado !== 'sin_viaje') return false
      if (filtroEstado !== 'todos' && f.estado !== filtroEstado) return false
      if (filtroEmpresa !== 'todas' && (f.empresa || '').toLowerCase() !== filtroEmpresa.toLowerCase()) return false
      if (s && !(f.economico.toLowerCase().includes(s) || f.cliente.toLowerCase().includes(s) ||
                f.origen.toLowerCase().includes(s) || f.destino.toLowerCase().includes(s))) return false
      return true
    })
  }, [filas, search, filtroEstado, filtroEmpresa, vista])

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletReady) return
    const map = mapInstanceRef.current
    markersRef.current.forEach((m: any) => { try { map.removeLayer(m) } catch {} })
    markersRef.current.clear()

    const conCoords = filtradas.filter(f => f.latitud != null && f.longitud != null && f.latitud !== 0)
    conCoords.forEach(f => {
      const color = estadoHex(f.estado)
      const moving = f.velocidad > 5
      const size = moving ? 14 : 11
      const sel = tractoSeleccionado === f.economico
      try {
        const icon = L.divIcon({
          className: '',
          html: '<div style="width:' + (sel ? size + 6 : size) + 'px;height:' + (sel ? size + 6 : size) + 'px;border-radius:50%;' +
                'background:' + color + ';border:' + (sel ? '3' : '2') + 'px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.45);' +
                (moving ? 'animation:torre-pulse 2s infinite;' : '') +
                (sel ? 'transform:scale(1.2);' : '') + '"></div>',
          iconSize: [size, size], iconAnchor: [size / 2, size / 2],
        })
        const marker = L.marker([f.latitud, f.longitud], { icon }).addTo(map)
        // Popup HTML segun si tiene viaje activo o no
        let detalleBlock = ''
        if (f.viaje_num) {
          detalleBlock =
            '<hr style="border:none;border-top:1px solid #E2E8F0;margin:6px 0;"/>' +
            '<b>Viaje:</b> V' + f.viaje_num + '<br/>' +
            '<b>Cliente:</b> ' + f.cliente + '<br/>' +
            '<b>Tipo:</b> ' + f.tipo + '<br/>' +
            '<b>Caja:</b> ' + (f.caja || '—') + '<br/>' +
            '<b>Origen:</b> ' + f.origen + '<br/>' +
            '<b>Destino:</b> ' + f.destino + '<br/>' +
            '<b>Cita descarga:</b> ' + fmt(f.cita_descarga) + '<br/>' +
            '<b>ETA vs cita:</b> <span style="color:' + color + ';font-weight:700;">' + fmtMinutos(f.minutos_a_cita) + '</span>'
        } else if (f.ultimo_viaje) {
          detalleBlock =
            '<hr style="border:none;border-top:1px solid #E2E8F0;margin:6px 0;"/>' +
            '<b style="color:#3B82F6;">SIN VIAJE ACTIVO</b><br/>' +
            '<b>Tiempo sin asignación:</b> <span style="color:#EF4444;font-weight:700;">' + fmtHorasSin(f.ultimo_viaje.horas_sin_asignacion) + '</span><br/>' +
            '<b>Último viaje:</b> V' + (f.ultimo_viaje.viaje || '—') + '<br/>' +
            '<b>Cliente:</b> ' + f.ultimo_viaje.cliente + '<br/>' +
            '<b>Destino:</b> ' + f.ultimo_viaje.destino + '<br/>' +
            '<b>Llegó:</b> ' + fmt(f.ultimo_viaje.llega_destino)
        } else {
          detalleBlock =
            '<hr style="border:none;border-top:1px solid #E2E8F0;margin:6px 0;"/>' +
            '<i style="color:#94A3B8;">Sin viajes registrados en últimos 90 días</i>'
        }
        marker.bindPopup(
          '<div style="font-family:Montserrat,system-ui,sans-serif;font-size:12px;line-height:1.5;min-width:240px;">' +
          '<strong style="font-size:14px;">Tracto ' + f.economico + '</strong>' +
          '<span style="margin-left:6px;padding:2px 6px;border-radius:10px;font-size:10px;font-weight:600;' +
          'background:' + color + '20;color:' + color + ';">' + estadoLabel(f.estado) + '</span><br/>' +
          '<b>Empresa:</b> ' + empresaLabel(f.empresa) + '<br/>' +
          '<b>Velocidad:</b> ' + (f.velocidad > 0 ? Math.round(f.velocidad) + ' km/h' : '0 km/h') + '<br/>' +
          '<b>Ubicación:</b> ' + (f.ubicacion || '—') + '<br/>' +
          '<b>Última señal:</b> ' + fmt(f.ultima_act) +
          detalleBlock +
          '</div>'
        )
        marker.on('click', () => setTractoSeleccionado(f.economico))
        markersRef.current.set(f.economico, marker)
      } catch (e) { console.warn('Error marker tracto', f.economico, e) }
    })
  }, [filtradas, leafletReady, vista, tractoSeleccionado])

  // Click en sidebar -> flyTo + abre popup
  const seleccionarTracto = (eco: string) => {
    setTractoSeleccionado(eco)
    const f = filas.find(x => x.economico === eco)
    if (!f || f.latitud == null || f.longitud == null) return
    const map = mapInstanceRef.current
    if (!map) return
    try {
      map.flyTo([f.latitud, f.longitud], 9, { duration: 0.8 })
      const marker = markersRef.current.get(eco)
      if (marker) setTimeout(() => marker.openPopup(), 850)
    } catch (e) { console.warn('flyTo error', e) }
  }

  // Inject pulse animation
  useEffect(() => {
    if (document.getElementById('torre-pulse-anim')) return
    const style = document.createElement('style')
    style.id = 'torre-pulse-anim'
    style.textContent = '@keyframes torre-pulse{0%{box-shadow:0 0 0 0 rgba(16,185,129,0.5)}70%{box-shadow:0 0 0 8px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}'
    document.head.appendChild(style)
  }, [])

  const kpis = useMemo(() => {
    const baseFilas = filas
    return {
      total: baseFilas.length,
      en_tiempo: baseFilas.filter(f => f.estado === 'en_tiempo').length,
      en_riesgo: baseFilas.filter(f => f.estado === 'en_riesgo').length,
      retrasados: baseFilas.filter(f => f.estado === 'retrasado').length,
      sin_viaje: baseFilas.filter(f => f.estado === 'sin_viaje').length,
    }
  }, [filas])

  const VistaBtn = ({ v, label, icon, badge }: { v: Vista, label: string, icon: ReactElement, badge?: number }) => (
    <button onClick={() => setVista(v)} style={{
      padding: '8px 14px', borderRadius: tokens.radius.md, display: 'flex', alignItems: 'center', gap: 6,
      border: '1px solid ' + (vista === v ? tokens.colors.primary : tokens.colors.border),
      background: vista === v ? tokens.colors.primary : 'transparent',
      color: vista === v ? '#FFFFFF' : tokens.colors.textPrimary,
      fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
    }}>{icon}{label}{badge != null && badge > 0 ? ' (' + badge + ')' : ''}</button>
  )

  const conCoordsCount = filtradas.filter(f => f.latitud != null && f.longitud != null && f.latitud !== 0).length

  // Layout heights
  const mapaH = vista === 'mapa' ? '78vh' : vista === 'sin_viaje' ? '60vh' : '52vh'
  const tablaH = vista === 'tabla' ? '78vh' : vista === 'sin_viaje' ? '78vh' : '23vh'

  return (
    <ModuleLayout titulo="Despacho IA - Torre de Control">
      {/* KPIs compactos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm }}>
        <KPICard titulo="Total" valor={fmtN(kpis.total)} color="primary" icono={<Truck size={18} />} />
        <KPICard titulo="En tiempo" valor={fmtN(kpis.en_tiempo)} color="green" icono={<CheckCircle2 size={18} />} />
        <KPICard titulo="En riesgo" valor={fmtN(kpis.en_riesgo)} color="orange" icono={<Clock size={18} />} />
        <KPICard titulo="Retrasados" valor={fmtN(kpis.retrasados)} color="red" icono={<AlertTriangle size={18} />} />
        <KPICard titulo="Sin viaje" valor={fmtN(kpis.sin_viaje)} color="blue" icono={<AlertCircle size={18} />} />
      </div>

      {error && (
        <Card style={{ marginBottom: tokens.spacing.sm, borderColor: tokens.colors.red }}>
          <div style={{ color: tokens.colors.red, fontSize: '13px' }}>Error: {error}</div>
        </Card>
      )}

      {/* Filtros + toggle vista en una sola fila */}
      <div style={{ display: 'flex', gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: tokens.colors.textMuted }} />
          <input type="text" placeholder="Buscar tracto, cliente, origen, destino..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 32px', background: tokens.colors.bgMain,
                     border: '1px solid ' + tokens.colors.border, borderRadius: tokens.radius.md,
                     color: tokens.colors.textPrimary, fontSize: '12px', outline: 'none' }} />
        </div>
        <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} style={{
          padding: '8px 10px', background: tokens.colors.bgMain, border: '1px solid ' + tokens.colors.border,
          borderRadius: tokens.radius.md, color: tokens.colors.textPrimary, fontSize: '12px', fontWeight: 600,
          outline: 'none', cursor: 'pointer', minWidth: 130,
        }}>
          <option value="todas">Todas las empresas</option>
          {empresas.map(e => <option key={e} value={e}>{empresaLabel(e)}</option>)}
        </select>
        {(['todos', 'en_tiempo', 'en_riesgo', 'retrasado'] as const).map(s => (
          <button key={s} onClick={() => setFiltroEstado(s)} style={{
            padding: '7px 12px', borderRadius: tokens.radius.md,
            border: '1px solid ' + (filtroEstado === s ? tokens.colors.primary : tokens.colors.border),
            background: filtroEstado === s ? tokens.colors.primary : 'transparent',
            color: filtroEstado === s ? '#FFFFFF' : tokens.colors.textPrimary,
            fontSize: '11px', fontWeight: 600, cursor: 'pointer',
          }}>{s === 'todos' ? 'Todos' : estadoLabel(s)}</button>
        ))}
        <div style={{ flex: '0 0 auto', display: 'flex', gap: 6, marginLeft: 'auto' }}>
          <VistaBtn v="ambos" label="Ambos" icon={<Layout size={13} />} />
          <VistaBtn v="mapa" label="Mapa" icon={<MapIcon size={13} />} />
          <VistaBtn v="tabla" label="Tabla" icon={<List size={13} />} />
          <VistaBtn v="sin_viaje" label="Sin viaje" icon={<AlertCircle size={13} />} badge={kpis.sin_viaje} />
        </div>
      </div>

      {/* MAPA + SIDEBAR */}
      {(vista === 'mapa' || vista === 'ambos' || vista === 'sin_viaje') && (
        <Card style={{ marginBottom: tokens.spacing.sm, padding: 0, overflow: 'hidden' }}>
          {leafletError ? (
            <div style={{ padding: tokens.spacing.lg, textAlign: 'center', color: tokens.colors.orange, fontSize: '13px' }}>
              ⚠ Mapa no disponible: {leafletError}
              <br/><span style={{ fontSize: '11px', color: tokens.colors.textMuted }}>(la lista sigue funcionando)</span>
            </div>
          ) : !leafletReady ? (
            <div style={{ padding: tokens.spacing.lg, textAlign: 'center', color: tokens.colors.textSecondary, fontSize: '13px' }}>Cargando mapa...</div>
          ) : (
            <>
              <div style={{ padding: '6px 12px', fontSize: '11px', color: tokens.colors.textSecondary, borderBottom: '1px solid ' + tokens.colors.border }}>
                {fmtN(conCoordsCount)} de {fmtN(filtradas.length)} tractos en mapa · verde=en tiempo · naranja=en riesgo · rojo=retrasado · azul=sin viaje · gris=sin GPS
              </div>
              <div style={{ display: 'flex', height: mapaH }}>
                <div ref={mapRef} style={{ flex: 1, height: '100%' }} />
                {/* SIDEBAR LISTA */}
                <div style={{ width: 280, borderLeft: '1px solid ' + tokens.colors.border, overflowY: 'auto', background: tokens.colors.bgMain }}>
                  <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: tokens.colors.textSecondary, textTransform: 'uppercase', borderBottom: '1px solid ' + tokens.colors.border, position: 'sticky', top: 0, background: tokens.colors.bgMain, zIndex: 2 }}>
                    Tractos ({fmtN(filtradas.length)}) — click para volar
                  </div>
                  {filtradas.length === 0 ? (
                    <div style={{ padding: tokens.spacing.lg, fontSize: '12px', color: tokens.colors.textMuted, textAlign: 'center' }}>Sin resultados</div>
                  ) : filtradas.map(f => {
                    const sel = tractoSeleccionado === f.economico
                    return (
                      <div key={f.economico} onClick={() => seleccionarTracto(f.economico)} style={{
                        padding: '8px 12px', borderBottom: '1px solid ' + tokens.colors.border,
                        cursor: 'pointer', background: sel ? 'rgba(59,108,231,0.12)' : 'transparent',
                        borderLeft: '3px solid ' + (sel ? estadoHex(f.estado) : 'transparent'),
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: tokens.colors.textPrimary }}>{f.economico}</span>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: estadoHex(f.estado) }} />
                        </div>
                        <div style={{ fontSize: '10px', color: tokens.colors.textSecondary, marginTop: 2 }}>
                          {f.estado === 'sin_viaje' && f.ultimo_viaje
                            ? '⏱ ' + fmtHorasSin(f.ultimo_viaje.horas_sin_asignacion) + ' sin asignación'
                            : f.cliente !== '—' ? f.cliente : (f.ubicacion || empresaLabel(f.empresa))}
                        </div>
                        <div style={{ fontSize: '10px', color: tokens.colors.textMuted, marginTop: 1 }}>
                          {f.viaje_num ? f.origen + ' → ' + f.destino : f.ultimo_viaje ? 'Último: ' + f.ultimo_viaje.destino : empresaLabel(f.empresa)}
                          {f.minutos_a_cita != null && (
                            <span style={{ marginLeft: 6, color: estadoHex(f.estado), fontWeight: 700 }}>{fmtMinutos(f.minutos_a_cita)}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {/* TABLA — distinta cuando vista = sin_viaje */}
      {(vista === 'tabla' || vista === 'ambos' || vista === 'sin_viaje') && (
        <Card style={{ padding: 0 }}>
          <div style={{ padding: '6px 12px', fontSize: '11px', color: tokens.colors.textSecondary, borderBottom: '1px solid ' + tokens.colors.border }}>
            {vista === 'sin_viaje'
              ? fmtN(filtradas.length) + ' unidades sin viaje activo · ordenadas por horas sin asignación'
              : fmtN(filtradas.length) + ' tractos · click en una fila para ubicar en mapa'}
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textSecondary }}>Cargando...</div>
          ) : filtradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textMuted }}>Sin resultados</div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: tablaH }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead style={{ position: 'sticky', top: 0, background: tokens.colors.bgCard, zIndex: 5 }}>
                  {vista === 'sin_viaje' ? (
                    <tr>
                      {['Tracto', 'Empresa', 'Último cliente', 'Último destino', 'Llegó', 'Sin asignación', 'Ubicación actual'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', fontSize: '10px', textTransform: 'uppercase', color: tokens.colors.textSecondary, fontWeight: 700, textAlign: 'left', borderBottom: '1px solid ' + tokens.colors.border }}>{h}</th>
                      ))}
                    </tr>
                  ) : (
                    <tr>
                      {['Tracto', 'Cliente', 'Origen', 'Destino', 'Cita', 'ETA', 'Vel', 'Estado'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', fontSize: '10px', textTransform: 'uppercase', color: tokens.colors.textSecondary, fontWeight: 700, textAlign: 'left', borderBottom: '1px solid ' + tokens.colors.border }}>{h}</th>
                      ))}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {(vista === 'sin_viaje'
                    ? [...filtradas].sort((a, b) => (b.ultimo_viaje?.horas_sin_asignacion ?? 99999) - (a.ultimo_viaje?.horas_sin_asignacion ?? 99999))
                    : filtradas
                  ).map(f => vista === 'sin_viaje' ? (
                    <tr key={f.economico} onClick={() => seleccionarTracto(f.economico)} style={{ borderBottom: '1px solid ' + tokens.colors.border, cursor: 'pointer' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color: tokens.colors.textPrimary }}>{f.economico}</td>
                      <td style={{ padding: '6px 10px', color: tokens.colors.textSecondary }}>{empresaLabel(f.empresa)}</td>
                      <td style={{ padding: '6px 10px', color: tokens.colors.textSecondary }}>{f.ultimo_viaje?.cliente || '—'}</td>
                      <td style={{ padding: '6px 10px', color: tokens.colors.textSecondary }}>{f.ultimo_viaje?.destino || '—'}</td>
                      <td style={{ padding: '6px 10px', color: tokens.colors.textMuted }}>{fmt(f.ultimo_viaje?.llega_destino || null)}</td>
                      <td style={{ padding: '6px 10px', color: tokens.colors.red, fontWeight: 700 }}>{f.ultimo_viaje ? fmtHorasSin(f.ultimo_viaje.horas_sin_asignacion) : '—'}</td>
                      <td style={{ padding: '6px 10px', color: tokens.colors.textMuted }}>{f.ubicacion || '—'}</td>
                    </tr>
                  ) : (
                    <tr key={f.economico} onClick={() => seleccionarTracto(f.economico)} style={{ borderBottom: '1px solid ' + tokens.colors.border, cursor: 'pointer' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color: tokens.colors.textPrimary }}>{f.economico}</td>
                      <td style={{ padding: '6px 10px', color: tokens.colors.textPrimary }}>{f.cliente}</td>
                      <td style={{ padding: '6px 10px', color: tokens.colors.textSecondary }}>{f.origen}</td>
                      <td style={{ padding: '6px 10px', color: tokens.colors.textSecondary }}>{f.destino}</td>
                      <td style={{ padding: '6px 10px', color: tokens.colors.textSecondary }}>{fmt(f.cita_descarga)}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700,
                                   color: f.estado === 'retrasado' ? tokens.colors.red : f.estado === 'en_riesgo' ? tokens.colors.orange : f.estado === 'en_tiempo' ? tokens.colors.green : tokens.colors.textMuted }}>
                        {fmtMinutos(f.minutos_a_cita)}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right',
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
