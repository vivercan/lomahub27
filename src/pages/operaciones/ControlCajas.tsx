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
  segmento: string;
  velocidad: number;
}

export default function ControlCajas(): ReactElement {
  const [cajas, setCajas] = useState<CajaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    const fetchCajas = async () => {
      try {
        setLoading(true);

        // MASTER: Pull ALL cajas from gps_tracking where tipo_unidad = 'caja'
        const { data: gpsData, error: gpsError } = await supabase
          .from('gps_tracking')
          .select('*')
          .eq('tipo_unidad', 'caja')
          .order('empresa', { ascending: true });

        if (gpsError) {
          console.error('Error fetching GPS cajas:', gpsError);
          setCajas([]);
          return;
        }

        // Also fetch cajas table for enrichment (tipo seco/refrigerado, estado)
        const { data: cajasDB } = await supabase
          .from('cajas')
          .select('numero_economico, tipo, estado, empresa');

        const cajasMap = new Map<string, any>();
        (cajasDB || []).forEach((c) => {
          if (c.numero_economico) cajasMap.set(c.numero_economico, c);
        });

        const formattedCajas = (gpsData || []).map((gps, idx) => {
          const cajaInfo = cajasMap.get(gps.economico);
          const tieneCoords = gps.latitud && gps.longitud && gps.latitud !== 0;
          const velocidad = gps.velocidad || 0;
          // Determine movement status
          let estado = 'sin_senal';
          if (tieneCoords) {
            estado = velocidad > 0 ? 'en_movimiento' : 'detenida';
          }

          return {
            id: gps.id?.toString() || idx.toString(),
            economico: gps.economico || '\u2014',
            empresa: gps.empresa || '\u2014',
            tipo: cajaInfo?.tipo || (gps.segmento?.toLowerCase().includes('refriger') ? 'refrigerado' : 'seco'),
            estado,
            ubicacion: gps.ubicacion || 'Sin ubicación',
            latitud: gps.latitud || null,
            longitud: gps.longitud || null,
            conGPS: !!tieneCoords,
            ultimaActualizacion: gps.ultima_actualizacion
              ? new Date(gps.ultima_actualizacion).toLocaleString('es-MX', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                })
              : '\u2014',
            segmento: gps.segmento || '\u2014',
            velocidad,
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

  // Get unique empresas for filter
  const empresas = [...new Set(cajas.map(c => c.empresa).filter(e => e !== '\u2014'))];

  // Filter cajas
  const cajasFiltradas = cajas.filter(c => {
    if (filtroEmpresa && c.empresa !== filtroEmpresa) return false;
    if (filtroEstado && c.estado !== filtroEstado) return false;
    return true;
  });

  const totalCajas = cajas.length;
  const enMovimiento = cajas.filter(c => c.estado === 'en_movimiento').length;
  const detenidas = cajas.filter(c => c.estado === 'detenida').length;
  const sinSenal = cajas.filter(c => c.estado === 'sin_senal').length;
  const conGPS = cajas.filter(c => c.conGPS).length;

  const estadoVariant = (estado: string): 'green' | 'primary' | 'yellow' | 'red' | 'gray' => {
    switch (estado) {
      case 'en_movimiento': return 'green';
      case 'detenida': return 'yellow';
      case 'sin_senal': return 'red';
      default: return 'gray';
    }
  };

  const estadoLabel = (estado: string) => {
    switch (estado) {
      case 'en_movimiento': return 'En Movimiento';
      case 'detenida': return 'Detenida';
      case 'sin_senal': return 'Sin Señal';
      default: return estado;
    }
  };

  const cajasColumns = [
    { key: 'economico', label: 'N° Económico' },
    { key: 'empresa', label: 'Empresa' },
    { key: 'segmento', label: 'Segmento' },
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
            {row.ubicacion?.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&quot;/g, '"')}
          </span>
        </div>
      ),
    },
    {
      key: 'velocidad',
      label: 'Velocidad',
      render: (row: CajaRow) => (
        <span style={{ color: row.velocidad > 0 ? tokens.colors.green : tokens.colors.textMuted }}>
          {row.velocidad > 0 ? `${row.velocidad} km/h` : '\u2014'}
        </span>
      ),
    },
    { key: 'ultimaActualizacion', label: 'Última Señal' },
  ];

  return (
    <ModuleLayout titulo="Control de Cajas" moduloPadre={{ nombre: 'Operaciones', ruta: '/operaciones/dashboard' }}>
      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.lg,
        }}
      >
        <KPICard titulo="Total Cajas GPS" valor={totalCajas.toString()} color="primary" />
        <KPICard titulo="En Movimiento" valor={enMovimiento.toString()} color="green" />
        <KPICard titulo="Detenidas" valor={detenidas.toString()} color="yellow" />
        <KPICard titulo="Sin Señal" valor={sinSenal.toString()} color="red" />
        <KPICard titulo="Con Posición" valor={`${conGPS} / ${totalCajas}`} color="green" />
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
          label="Empresa"
          placeholder="Todas las empresas"
          value={filtroEmpresa}
          onChange={(e) => setFiltroEmpresa(e.target.value)}
          options={[
            { value: '', label: 'Todas' },
            ...empresas.map(e => ({ value: e, label: e })),
          ]}
        />
        <Select
          label="Estado"
          placeholder="Todos los estados"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          options={[
            { value: '', label: 'Todos' },
            { value: 'en_movimiento', label: 'En Movimiento' },
            { value: 'detenida', label: 'Detenida' },
            { value: 'sin_senal', label: 'Sin Señal' },
          ]}
        />
      </div>

      {/* Cajas DataTable */}
      <Card>
        <div style={{ marginBottom: tokens.spacing.md, paddingBottom: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: tokens.colors.textPrimary }}>
            Cajas GPS — {cajasFiltradas.length} unidades
          </h3>
          <span style={{ color: tokens.colors.textMuted, fontSize: '13px' }}>
            Fuente: GPS Master (tipo_unidad = caja)
          </span>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p>Cargando cajas desde GPS Master...</p>
          </div>
        ) : cajasFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Sin datos</p>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>No se encontraron cajas en el GPS Master</p>
          </div>
        ) : (
          <DataTable columns={cajasColumns} data={cajasFiltradas} />
        )}
      </Card>
    </ModuleLayout>
  );
}
