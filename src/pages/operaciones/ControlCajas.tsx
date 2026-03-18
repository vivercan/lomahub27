import type { ReactElement } from 'react';
import { useState, useEffect } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface CajaRow {
  id: string;
  economico: string;
  empresa: string;
  tipo: string;
  estado: string;
  ubicacion: string;
  latitud: number | null;
  longitud: number | null;
  conGPS: boolean;
  ultimaActualizacion: string;
}

export default function ControlCajas(): ReactElement {
  const [cajas, setCajas] = useState<CajaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  useEffect(() => {
    const fetchCajas = async () => {
      try {
        setLoading(true);

        // Fetch cajas from DB
        const { data: cajasData, error: cajasError } = await supabase
          .from('cajas')
          .select('id, numero_economico, empresa, tipo, estado, ubicacion_actual, activo')
          .eq('activo', true)
          .order('numero_economico', { ascending: true });

        if (cajasError) {
          console.error('Error fetching cajas:', cajasError);
          setCajas([]);
          return;
        }

        // Fetch GPS data for cajas (match by numero_economico)
        const { data: gpsData } = await supabase
          .from('gps_tracking')
          .select('economico, latitud, longitud, ubicacion, ultima_actualizacion')
          .order('ultima_actualizacion', { ascending: false });

        // Create GPS lookup by economico
        const gpsMap = new Map();
        (gpsData || []).forEach((gps) => {
          if (gps.economico && !gpsMap.has(gps.economico)) {
            gpsMap.set(gps.economico, gps);
          }
        });

        const formattedCajas = (cajasData || []).map((caja) => {
          const gps = gpsMap.get(caja.numero_economico);
          return {
            id: caja.id,
            economico: caja.numero_economico || '\u2014',
            empresa: caja.empresa || '\u2014',
            tipo: caja.tipo || 'seco',
            estado: caja.estado || 'disponible',
            ubicacion: gps?.ubicacion || caja.ubicacion_actual || 'Sin ubicaci\u00f3n',
            latitud: gps?.latitud || null,
            longitud: gps?.longitud || null,
            conGPS: !!gps?.latitud,
            ultimaActualizacion: gps?.ultima_actualizacion
              ? new Date(gps.ultima_actualizacion).toLocaleString('es-MX', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                })
              : '\u2014',
          };
        });

        setCajas(formattedCajas);
      } catch (err) {
        console.error('Unexpected error:', err);
        setCajas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCajas();
  }, []);
  // Filter cajas
  const cajasFiltradas = cajas.filter(c => {
    if (filtroEstado && c.estado !== filtroEstado) return false;
    if (filtroTipo && c.tipo !== filtroTipo) return false;
    return true;
  });

  const totalCajas = cajas.length;
  const secas = cajas.filter(c => c.tipo === 'seco').length;
  const termos = cajas.filter(c => c.tipo === 'refrigerado').length;
  const conGPS = cajas.filter(c => c.conGPS).length;
  const cobertura = totalCajas > 0 ? Math.round((conGPS / totalCajas) * 100) : 0;
  const coberturaColor = cobertura >= 70 ? 'green' : cobertura >= 50 ? 'yellow' : 'red';

  const tipoLabel = (tipo: string) => tipo === 'refrigerado' ? 'Termo' : 'Seca';
  const tipoVariant = (tipo: string): 'primary' | 'gray' => tipo === 'refrigerado' ? 'primary' : 'gray';

  const estadoVariant = (estado: string): 'green' | 'primary' | 'yellow' | 'red' | 'gray' => {
    switch (estado) {
      case 'disponible': return 'green';
      case 'en_transito': return 'primary';
      case 'taller': return 'yellow';
      default: return 'gray';
    }
  };

  const estadoLabel = (estado: string) => {
    switch (estado) {
      case 'disponible': return 'Disponible';
      case 'en_transito': return 'En Tránsito';
      case 'taller': return 'Taller';
      default: return estado;
    }
  };

  const cajasColumns = [
    { key: 'economico', label: 'N° Económico' },
    { key: 'empresa', label: 'Empresa' },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (row: CajaRow) => <Badge color={tipoVariant(row.tipo)}>{tipoLabel(row.tipo)}</Badge>,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (row: CajaRow) => <Badge color={estadoVariant(row.estado)}>{estadoLabel(row.estado)}</Badge>,
    },
    {
      key: 'ubicacion',
      label: 'Ubicación GPS',
      render: (row: CajaRow) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: row.conGPS ? tokens.colors.green : tokens.colors.red,
              flexShrink: 0,
            }}
          />
          <span style={{ color: row.conGPS ? tokens.colors.textPrimary : tokens.colors.textMuted }}>
            {row.ubicacion}
          </span>
        </div>
      ),
    },
    { key: 'ultimaActualizacion', label: 'Última Señal GPS' },
  ];

  return (
    <ModuleLayout titulo="Control de Cajas">
      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.lg,
        }}
      >
        <KPICard titulo="Total Cajas" valor={totalCajas.toString()} color="primary" />
        <KPICard titulo="Secas" valor={secas.toString()} color="gray" />
        <KPICard titulo="Termos" valor={termos.toString()} color="primary" />
        <KPICard titulo="Con GPS" valor={`${conGPS} / ${totalCajas}`} color="green" />
        <KPICard titulo="Cobertura GPS" valor={`${cobertura}%`} color={coberturaColor} />
      </div>

      {/* Filtros */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.lg,
          maxWidth: '500px',
        }}
      >
        <Select
          label="Estado"
          placeholder="Todos los estados"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          options={[
            { value: '', label: 'Todos' },
            { value: 'disponible', label: 'Disponible' },
            { value: 'en_transito', label: 'En Tránsito' },
            { value: 'taller', label: 'Taller' },
          ]}
        />
        <Select
          label="Tipo"
          placeholder="Todos los tipos"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          options={[
            { value: '', label: 'Todos' },
            { value: 'seco', label: 'Secas' },
            { value: 'refrigerado', label: 'Termos (Refrigeradas)' },
          ]}
        />
      </div>

      {/* Cajas DataTable */}
      <Card>
        <div style={{ marginBottom: tokens.spacing.md, paddingBottom: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: tokens.colors.textPrimary }}>
            Inventario de Cajas — {cajasFiltradas.length} unidades
          </h3>
          {cobertura < 70 && !loading && totalCajas > 0 && (
            <span style={{ color: tokens.colors.red, fontSize: '13px', fontWeight: 600 }}>
              ⚢ Cobertura GPS por debajo del 70% objetivo
            </span>
          )}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p>Cargando inventario de cajas...</p>
          </div>
        ) : cajasFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Sin datos</p>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>Los datos se cargarán cuando estén disponibles en el sistema</p>
          </div>
        ) : (
          <DataTable columns={cajasColumns} data={cajasFiltradas} />
        )}
      </Card>
    </ModuleLayout>
  );
}
