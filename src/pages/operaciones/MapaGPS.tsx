import type { ReactElement } from 'react';
import { useState, useEffect, useRef } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface GpsRecord {
  id: string;
  economico: string;
  empresa: string;
  segmento: string;
  latitud: number;
  longitud: number;
  velocidad: number;
  ubicacion: string;
  estatus: string;
  ultima_actualizacion: string;
  estado_geo: string;
  municipio_geo: string;
}

declare const L: any;

export default function MapaGPS(): ReactElement {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [gpsData, setGpsData] = useState<GpsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [leafletReady, setLeafletReady] = useState(false);

  // Load Leaflet CSS + JS from CDN
  useEffect(() => {
    if ((window as any).L) {
      setLeafletReady(true);
      return;
    }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  // Fetch GPS data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('gps_tracking')
        .select('*')
        .or('tipo_unidad.is.null,tipo_unidad.eq.tracto')
        .order('ultima_actualizacion', { ascending: false });

      if (!error && data) {
        setGpsData(data as GpsRecord[]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstanceRef.current) return;
    if (!(window as any).L) return;

    const map = L.map(mapRef.current).setView([23.6345, -102.5528], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [leafletReady]);

  // Add/update markers when data or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletReady || gpsData.length === 0) return;
    const map = mapInstanceRef.current;

    // Remove old markers
    markersRef.current.forEach((m: any) => map.removeLayer(m));
    markersRef.current = [];

    const filtered = gpsData.filter((r) => {
      if (filtroEmpresa && r.empresa !== filtroEmpresa) return false;
      if (filtroEstatus && r.estatus !== filtroEstatus) return false;
      return r.latitud && r.longitud;
    });

    filtered.forEach((r) => {
      const vel = r.velocidad ?? 0;
      const color = vel > 0 ? '#22c55e' : r.estatus === 'sin_senal' ? '#ef4444' : '#f59e0b';
      const icon = L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;border-radius:50%;background:' + color + ';border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([r.latitud, r.longitud], { icon }).addTo(map);
      const updStr = r.ultima_actualizacion
        ? new Date(r.ultima_actualizacion).toLocaleString('es-MX')
        : '-';
      marker.bindPopup(
        '<div style="font-family:system-ui,sans-serif;font-size:13px;line-height:1.5;">' +
        '<strong style="font-size:14px;">' + (r.economico || 'S/N') + '</strong><br/>' +
        '<b>Empresa:</b> ' + (r.empresa || '-') + '<br/>' +
        '<b>Segmento:</b> ' + (r.segmento || '-') + '<br/>' +
        '<b>Velocidad:</b> ' + vel + ' km/h<br/>' +
        '<b>Ubicación:</b> ' + (r.ubicacion || r.municipio_geo || '-') + '<br/>' +
        '<b>Estado:</b> ' + (r.estado_geo || '-') + '<br/>' +
        '<b>Estatus:</b> ' + (r.estatus || '-') + '<br/>' +
        '<b>Actualización:</b> ' + updStr +
        '</div>'
      );
      markersRef.current.push(marker);
    });

    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [gpsData, filtroEmpresa, filtroEstatus, leafletReady]);

  const empresas = [...new Set(gpsData.map((r) => r.empresa).filter(Boolean))];
  const estatuses = [...new Set(gpsData.map((r) => r.estatus).filter(Boolean))];
  const enMovimiento = gpsData.filter((r) => (r.velocidad ?? 0) > 0).length;
  const detenidas = gpsData.filter((r) => !r.velocidad || r.velocidad === 0).length;

  const selectStyle = {
    padding: '8px 12px',
    borderRadius: tokens.radius.md,
    border: '1px solid ' + tokens.colors.border,
    backgroundColor: tokens.colors.bgCard,
    color: tokens.colors.textPrimary,
    fontSize: tokens.fonts.body,
    minWidth: '180px',
  };

  return (
    <ModuleLayout titulo="Mapa GPS en Tiempo Real" moduloPadre={{ nombre: 'Operaciones', ruta: '/operaciones/dashboard' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.md }}>
        {[
          { label: 'Total Tractos', value: gpsData.length, color: tokens.colors.textPrimary },
          { label: 'En Movimiento', value: enMovimiento, color: '#22c55e' },
          { label: 'Detenidas', value: detenidas, color: '#f59e0b' },
          { label: 'Empresas', value: empresas.length, color: tokens.colors.textPrimary },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <div style={{ textAlign: 'center', padding: tokens.spacing.sm }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
              <div style={{ fontSize: tokens.fonts.body, color: tokens.colors.textSecondary, marginTop: '4px' }}>{kpi.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: tokens.spacing.md, marginBottom: tokens.spacing.md, alignItems: 'center' }}>
        <select value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)} style={selectStyle}>
          <option value="">Todas las empresas</option>
          {empresas.map((emp) => (
            <option key={emp} value={emp}>{emp}</option>
          ))}
        </select>
        <select value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)} style={selectStyle}>
          <option value="">Todos los estatus</option>
          {estatuses.map((est) => (
            <option key={est} value={est}>{est}</option>
          ))}
        </select>
      </div>

      {/* Map Container */}
      <Card>
        <div style={{ marginBottom: tokens.spacing.sm, paddingBottom: tokens.spacing.sm, borderBottom: '1px solid ' + tokens.colors.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: tokens.colors.textPrimary }}>
            Mapa GPS {loading ? '— Cargando...' : '— ' + gpsData.length + ' tractos rastreados'}
          </h3>
        </div>
        <div
          ref={mapRef}
          style={{
            height: 'calc(100vh - 340px)',
            minHeight: '300px',
            maxHeight: '600px',
            borderRadius: tokens.radius.lg,
            border: '1px solid ' + tokens.colors.border,
            backgroundColor: '#e5e7eb',
          }}
        />
      </Card>

      {/* Legend */}
      <div style={{ display: 'flex', gap: tokens.spacing.lg, marginTop: tokens.spacing.md, fontSize: tokens.fonts.body, color: tokens.colors.textSecondary, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
          En movimiento
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
          Detenida
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
          Sin señal
        </span>
        <span style={{ marginLeft: 'auto' }}>
          Última actualización: {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </ModuleLayout>
  );
}
