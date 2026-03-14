import type { ReactElement } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { Select } from '../../components/ui/Select';
import { Semaforo } from '../../components/ui/Semaforo';
import type { SemaforoEstado } from '../../lib/tokens';
import { tokens } from '../../lib/tokens';

export default function TorreControl(): ReactElement {
  const viajes = [
    {
      folio: 'VJ-2024-001',
      cliente: 'Transportes del Norte',
      ruta: 'CDMX → GTO',
      tracto: 'TAC-001',
      eta: '15:30',
      cita: '15:45',
      diferencia: -15,
      estado: 'en_transito',
    },
    {
      folio: 'VJ-2024-002',
      cliente: 'Logística Integral',
      ruta: 'MTY → CDMX',
      tracto: 'TAC-002',
      eta: '18:45',
      cita: '18:30',
      diferencia: 15,
      estado: 'en_transito',
    },
    {
      folio: 'VJ-2024-003',
      cliente: 'Transportes del Sur',
      ruta: 'QRO → SLP',
      tracto: 'TAC-003',
      eta: '22:00',
      cita: '21:00',
      diferencia: 60,
      estado: 'en_riesgo',
    },
    {
      folio: 'VJ-2024-004',
      cliente: 'Carga Express',
      ruta: 'CDMX → VERACRUZ',
      tracto: 'TAC-004',
      eta: '14:00',
      cita: '14:00',
      diferencia: 0,
      estado: 'cargando',
    },
    {
      folio: 'VJ-2024-005',
      cliente: 'Transportes del Centro',
      ruta: 'GTO → MONTERREY',
      tracto: 'TAC-005',
      eta: '19:30',
      cita: '18:15',
      diferencia: 75,
      estado: 'retrasado',
    },
    {
      folio: 'VJ-2024-006',
      cliente: 'Logística Premium',
      ruta: 'LAREDO → CDMX',
      tracto: 'TAC-006',
      eta: '20:30',
      cita: '20:30',
      diferencia: 0,
      estado: 'en_transito',
    },
    {
      folio: 'VJ-2024-007',
      cliente: 'Transportes del Golfo',
      ruta: 'VERACRUZ → CDMX',
      tracto: 'TAC-007',
      eta: '16:15',
      cita: '16:00',
      diferencia: 15,
      estado: 'en_transito',
    },
    {
      folio: 'VJ-2024-008',
      cliente: 'Carga Global',
      ruta: 'NUEVO LAREDO → MTY',
      tracto: 'TAC-008',
      eta: '17:45',
      cita: '17:30',
      diferencia: 15,
      estado: 'programado',
    },
  ];

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
      render: (row: typeof viajes[0]) => (
        <span style={{ color: getDiferenciaColor(row.diferencia), fontWeight: 600 }}>
          {row.diferencia > 0 ? '+' : ''}{row.diferencia} min
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (row: typeof viajes[0]) => <Semaforo estado={row.estado as SemaforoEstado} />,
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
        <KPICard titulo="En Tránsito" valor="34" color="green" />
        <KPICard titulo="En Riesgo" valor="6" color="yellow" />
        <KPICard titulo="Retrasados" valor="3" color="red" />
        <KPICard titulo="Programados" valor="12" color="primary" />
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
        <DataTable columns={viajesColumns} data={viajes} />
      </Card>
    </ModuleLayout>
  );
}
