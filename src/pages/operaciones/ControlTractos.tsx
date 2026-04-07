import { useState, useEffect } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface TractoRow {
  id: string;
  economico: string;
  empresa: string;
  segmento: string;
  estado: string;
  operador: string;
  ubicacion: string;
  latitud: number | null;
  longitud: number | null;
  conGPS: boolean;
  velocidad: number;
  ultimaSenal: string;
}

function getEstadoBadgeColor(estado: string): 'gray' | 'green' | 'blue' | 'yellow' | 'red' {
  switch (estado) {
    case 'en_movimiento':
      return 'green';
    case 'detenido':
      return 'yellow';
    case 'sin_senal':
      return 'red';
    case 'disponible':
      return 'green';
    case 'en_viaje':
      return 'blue';
    case 'taller':
      return 'yellow';
    default:
      return 'gray';
  }
}

function getEstadoLabel(estado: string): string {
  switch (estado) {
    case 'en_movimiento': return 'En Movimiento';
    case 'detenido': return 'Detenido';
    case 'sin_senal': return 'Sin Señal';
    case 'disponible': return 'Disponible';
    case 'en_viaje': return 'En Viaje';
    case 'taller': return 'Taller';
    default: return estado;
  }
}

export default function ControlTractos() {
  const [tractos, setTractos] = useState<TractoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    const fetchTractos = async () => {
      try {
        setLoading(true);

        // MASTER: Pull ALL tractos from gps_tracking where tipo_unidad = 'tracto'
        const { data: gpsData, error: gpsError } = await supabase
          .from('gps_tracking')
          .select('*')
          .eq('tipo_unidad', 'tracto')
          .order('empresa', { ascending: true });

        if (gpsError) {
          console.error('Error fetching GPS tractos:', gpsError);
          setTractos([]);
          return;
        }

        // Enrich with tractos table (operador_actual_id, estado_operativo, segmento)
        const { data: tractosDB } = await supabase
          .from('tractos')
          .select('numero_economico, operador_actual_id, estado_operativo, segmento');

        const tractosMap = new Map<string, any>();
        (tractosDB || []).forEach((t) => {
          if (t.numero_economico) tractosMap.set(t.numero_economico, t);
        });

        const formattedTractos = (gpsData || []).map((gps, idx) => {
          const tractoInfo = tractosMap.get(gps.economico);
          const tieneCoords = gps.latitud && gps.longitud && gps.latitud !== 0;
          const velocidad = gps.velocidad || 0;

          let estado = 'sin_senal';
          if (tieneCoords) {
            estado = velocidad > 0 ? 'en_movimiento' : 'detenido';
          }

          return {
            id: gps.id?.toString() || idx.toString(),
            economico: gps.economico || '\u2014',
            empresa: gps.empresa || '\u2014',
            segmento: gps.segmento || '\u2014',
            estado,
            operador: tractoInfo?.operador_actual_id ? 'Asignado' : '\u2014',
            ubicacion: gps.ubicacion || 'Sin ubicación',
            latitud: gps.latitud || null,
            longitud: gps.longitud || null,
            conGPS: !!tieneCoords,
            velocidad,
            ultimaSenal: gps.ultima_actualizacion
              ? new Date(gps.ultima_actualizacion).toLocaleString('es-MX', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                })
              : '\u2014',
          };
        });

        setTractos(formattedTractos);
      } catch (err) {
        console.error('Unexpected error:', err);
        setTractos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTractos();
  }, []);

  // Get unique empresas for filter
  const empresas = [...new Set(tractos.map(t => t.empresa).filter(e => e !== '\u2014'))];

  // Filter
  const tractosFiltrados = tractos.filter(t => {
    if (filtroEmpresa && t.empresa !== filtroEmpresa) return false;
    if (filtroEstado && t.estado !== filtroEstado) return false;
    return true;
  });

  const total = tractos.length;
  const enMovimiento = tractos.filter(t => t.estado === 'en_movimiento').length;
  const detenidos = tractos.filter(t => t.estado === 'detenido').length;
  const sinSenal = tractos.filter(t => t.estado === 'sin_senal').length;
  const conGPS = tractos.filter(t => t.conGPS).length;

  const columns = [
    { key: 'economico', label: 'Económico' },
    { key: 'empresa', label: 'Empresa' },
    { key: 'segmento', label: 'Segmento' },
    {
      key: 'estado',
      label: 'Estado',
      render: (row: TractoRow) => (
        <Badge color={getEstadoBadgeColor(row.estado)}>
          {getEstadoLabel(row.estado)}
        </Badge>
      ),
    },
    { key: 'operador', label: 'Operador' },
    {
      key: 'ubicacion',
      label: 'Ubicación GPS',
      render: (row: TractoRow) => (
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
    {
      key: 'velocidad',
      label: 'Velocidad',
      render: (row: TractoRow) => (
        <span style={{ color: row.velocidad > 0 ? tokens.colors.green : tokens.colors.textMuted }}>
          {row.velocidad > 0 ? `${row.velocidad} km/h` : '\u2014'}
        </span>
      ),
    },
    { key: 'ultimaSenal', label: 'Última Señal' },
  ];

  return (
    <ModuleLayout titulo="Control de Tractos">
      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.lg,
        }}
      >
        <KPICard titulo="Total Tractos GPS" valor={total.toString()} color="primary" />
        <KPICard titulo="En Movimiento" valor={enMovimiento.toString()} color="green" />
        <KPICard titulo="Detenidos" valor={detenidos.toString()} color="yellow" />
        <KPICard titulo="Sin Señal" valor={sinSenal.toString()} color="red" />
        <KPICard titulo="Con Posición" valor={`${conGPS} / ${total}`} color="green" />
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
        <select
          value={filtroEmpresa}
          onChange={(e) => setFiltroEmpresa(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.colors.border}`,
            background: tokens.colors.bgCard,
            color: tokens.colors.textPrimary,
            fontSize: '14px',
          }}
        >
          <option value="">Todas las empresas</option>
          {empresas.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.colors.border}`,
            background: tokens.colors.bgCard,
            color: tokens.colors.textPrimary,
            fontSize: '14px',
          }}
        >
          <option value="">Todos los estados</option>
          <option value="en_movimiento">En Movimiento</option>
          <option value="detenido">Detenido</option>
          <option value="sin_senal">Sin Señal</option>
        </select>
      </div>

      {/* Tractos DataTable */}
      <Card>
        <div style={{ marginBottom: tokens.spacing.md, paddingBottom: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: tokens.colors.textPrimary }}>
            Tractos GPS — {tractosFiltrados.length} unidades
          </h3>
          <span style={{ color: tokens.colors.textMuted, fontSize: '13px' }}>
            Fuente: GPS Master (tipo_unidad = tracto)
          </span>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p>Cargando tractos desde GPS Master...</p>
          </div>
        ) : tractosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Sin datos</p>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>No se encontraron tractos en el GPS Master</p>
          </div>
        ) : (
          <DataTable columns={columns} data={tractosFiltrados} />
        )}
      </Card>
    </ModuleLayout>
  );
}
