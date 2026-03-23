import type { ReactElement } from 'react';
import { useState, useEffect } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { Select } from '../../components/ui/Select';
import { Semaforo } from '../../components/ui/Semaforo';
import type { SemaforoEstado } from '../../lib/tokens';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface Viaje {
  folio: string;
  cliente: string;
  ruta: string;
  tracto: string;
  eta: string;
  cita: string;
  diferencia: number;
  estadoViaje: string;
  semaforo: SemaforoEstado;
}

const estadoToSemaforo = (estado: string): SemaforoEstado => {
  switch (estado) {
    case 'en_transito': return 'verde';
    case 'programado': return 'azul';
    case 'en_riesgo': return 'amarillo';
    case 'retrasado': return 'rojo';
    case 'entregado': return 'gris';
    default: return 'azul';
  }
};

const estadoLabel = (estado: string): string => {
  switch (estado) {
    case 'en_transito': return 'En Tránsito';
    case 'programado': return 'Programado';
    case 'en_riesgo': return 'En Riesgo';
    case 'retrasado': return 'Retrasado';
    case 'entregado': return 'Entregado';
    default: return estado || 'Sin estado';
  }
};

export default function TorreControl(): ReactElement {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    const fetchViajes = async () => {
      try {
        setLoading(true);
        // Query WITHOUT joins — avoids FK relationship errors
        const { data, error } = await supabase
          .from('viajes')
          .select('*')
          .not('estado', 'eq', 'cancelado')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching viajes:', error);
          setViajes([]);
          return;
        }

        const formattedViajes = (data || []).map((viaje: any) => {
          const eta = viaje.eta_calculado ? new Date(viaje.eta_calculado) : null;
          const cita = viaje.cita_descarga ? new Date(viaje.cita_descarga) : null;
          const diffMin = eta && cita ? Math.round((eta.getTime() - cita.getTime()) / 60000) : 0;

          return {
            folio: viaje.folio || viaje.id?.substring(0, 8)?.toUpperCase() || '—',
            cliente: viaje.cliente_nombre || viaje.cliente || '—',
            ruta: `${viaje.origen || '?'} → ${viaje.destino || '?'}`,
            tracto: viaje.tracto_numero || viaje.tracto || '—',
            eta: eta
              ? eta.toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : '—',
            cita: cita
              ? cita.toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : '—',
            diferencia: diffMin,
            estadoViaje: viaje.estado || 'programado',
            semaforo: estadoToSemaforo(viaje.estado || 'programado'),
          };
        });

        setViajes(formattedViajes);
      } catch (err) {
        console.error('Unexpected error:', err);
        setViajes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchViajes();
  }, []);

  const getDiferenciaColor = (diferencia: number) => {
    if (diferencia <= 0) return tokens.colors.green;
    if (diferencia <= 60) return tokens.colors.yellow;
    return tokens.colors.red;
  };

  // Apply filters
  const filteredViajes = viajes.filter(v => {
    if (filtroEstado && v.estadoViaje !== filtroEstado) return false;
    if (filtroEmpresa && !v.cliente.toLowerCase().includes(filtroEmpresa.toLowerCase())) return false;
    return true;
  });

  // Compute KPIs from all viajes (not filtered)
  const enTransito = viajes.filter(v => v.estadoViaje === 'en_transito').length;
  const enRiesgo = viajes.filter(v => v.estadoViaje === 'en_riesgo').length;
  const retrasados = viajes.filter(v => v.estadoViaje === 'retrasado').length;
  const programados = viajes.filter(v => v.estadoViaje === 'programado').length;

  const viajesColumns = [
    { key: 'folio', label: 'Folio' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'ruta', label: 'Origen → Destino' },
    { key: 'tracto', label: 'Tracto' },
    { key: 'eta', label: 'ETA' },
    { key: 'cita', label: 'Cita' },
    {
      key: 'diferencia',
      label: 'Diferencia',
      render: (row: Viaje) => (
        <span style={{ color: getDiferenciaColor(row.diferencia), fontWeight: 600 }}>
          {row.diferencia > 0 ? '+' : ''}{row.diferencia} min
        </span>
      ),
    },
    {
      key: 'estadoViaje',
      label: 'Estado',
      render: (row: Viaje) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Semaforo estado={row.semaforo} />
          <span>{estadoLabel(row.estadoViaje)}</span>
        </div>
      ),
    },
  ];

  // Extract unique empresas for filter
  const empresasUnicas = [...new Set(viajes.map(v => v.cliente).filter(c => c !== '—'))];

  return (
    <ModuleLayout titulo="Torre de Control">
      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.lg,
        }}
      >
        <KPICard
          titulo="En Tránsito"
          valor={enTransito.toString()}
          color="green"
        />
        <KPICard
          titulo="En Riesgo"
          valor={enRiesgo.toString()}
          color="yellow"
        />
        <KPICard
          titulo="Retrasados"
          valor={retrasados.toString()}
          color="red"
        />
        <KPICard
          titulo="Programados"
          valor={programados.toString()}
          color="primary"
        />
      </div>

      {/* Filtros */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.lg,
        }}
      >
        <Select
          label="Empresa"
          placeholder="Todas las empresas"
          value={filtroEmpresa}
          onChange={(val) => setFiltroEmpresa(val)}
          options={empresasUnicas.map(e => ({ value: e, label: e }))}
        />
        <Select
          label="CS Asignada"
          placeholder="Todos los CS"
          options={[]}
        />
        <Select
          label="Estado"
          placeholder="Todos los estados"
          value={filtroEstado}
          onChange={(val) => setFiltroEstado(val)}
          options={[
            { value: 'en_transito', label: 'En Tránsito' },
            { value: 'en_riesgo', label: 'En Riesgo' },
            { value: 'retrasado', label: 'Retrasado' },
            { value: 'programado', label: 'Programado' },
          ]}
        />
      </div>

      {/* Viajes DataTable */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.md }}>
          <h3 style={{ margin: 0 }}>Monitoreo de Viajes</h3>
          {!loading && viajes.length > 0 && (
            <span style={{ fontSize: '13px', color: tokens.colors.textSecondary }}>
              {filteredViajes.length} de {viajes.length} viajes
            </span>
          )}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p>Cargando viajes...</p>
          </div>
        ) : filteredViajes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Sin datos</p>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>
              {viajes.length > 0 ? 'No hay viajes que coincidan con los filtros' : 'Los datos se cargarán cuando estén disponibles en el sistema'}
            </p>
          </div>
        ) : (
          <DataTable columns={viajesColumns} data={filteredViajes} />
        )}
      </Card>
    </ModuleLayout>
  );
}
