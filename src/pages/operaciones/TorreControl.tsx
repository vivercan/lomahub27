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
  estado: SemaforoEstado;
}

export default function TorreControl(): ReactElement {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchViajes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('viajes')
          .select(`
            id,
            origen,
            destino,
            estado,
            eta_calculado,
            cita_descarga,
            notas,
            cliente:clientes(razon_social),
            tracto:tractos(numero_economico)
          `)
          .not('estado', 'eq', 'cancelado')
          .order('cita_descarga', { ascending: true });

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
            folio: viaje.id?.substring(0, 8)?.toUpperCase() || '—',
            cliente: viaje.cliente?.razon_social || '—',
            ruta: `${viaje.origen || '?'} → ${viaje.destino || '?'}`,
            tracto: viaje.tracto?.numero_economico || '—',
            eta: eta ? eta.toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
            cita: cita ? cita.toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
            diferencia: diffMin,
            estado: (viaje.estado || 'programado') as SemaforoEstado,
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
      key: 'estado',
      label: 'Estado',
      render: (row: Viaje) => <Semaforo estado={row.estado} />,
    },
  ];

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
        <KPICard titulo="En Tránsito" valor={viajes.filter(v => v.estado === 'en_transito').length.toString()} color="green" />
        <KPICard titulo="En Riesgo" valor={viajes.filter(v => v.estado === 'en_riesgo').length.toString()} color="yellow" />
        <KPICard titulo="Retrasados" valor={viajes.filter(v => v.estado === 'retrasado').length.toString()} color="red" />
        <KPICard titulo="Programados" valor={viajes.filter(v => v.estado === 'programado').length.toString()} color="primary" />
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
          options={[
            { value: 'tdn', label: 'TDN México' },
            { value: 'logi', label: 'Logística Integral' },
            { value: 'tds', label: 'Transportes del Sur' },
          ]}
        />
        <Select
          label="CS Asignada"
          placeholder="Todos los CS"
          options={[
            { value: 'carlos', label: 'Carlos M.' },
            { value: 'maria', label: 'María G.' },
            { value: 'juan', label: 'Juan R.' },
          ]}
        />
        <Select
          label="Estado"
          placeholder="Todos los estados"
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
        <h3>Monitoreo de Viajes</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p>Cargando...</p>
          </div>
        ) : viajes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Sin datos</p>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>Los datos se cargarán cuando estén disponibles en el sistema</p>
          </div>
        ) : (
          <DataTable columns={viajesColumns} data={viajes} />
        )}
      </Card>
    </ModuleLayout>
  );
}
