import type { ReactElement } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { Semaforo } from '../../components/ui/Semaforo';
import type { SemaforoEstado } from '../../lib/tokens';
import { tokens } from '../../lib/tokens';

export default function DashboardCS(): ReactElement {
  const resumen =
    'Viajes en tránsito: 12 | Retrasados: 2 | Cajas sin plan: 3 | Clientes pendientes de contacto: 4';

  const misClientes = [
    {
      cliente: 'Transportes del Norte',
      estado: 'contactado',
      ultimoContacto: '13 Mar - 10:30 AM',
      viajesActivos: 3,
    },
    {
      cliente: 'Logística Integral',
      estado: 'pendiente',
      ultimoContacto: '11 Mar - 2:15 PM',
      viajesActivos: 1,
    },
    {
      cliente: 'Transportes del Sur',
      estado: 'en_seguimiento',
      ultimoContacto: 'Hoy - 8:45 AM',
      viajesActivos: 2,
    },
    {
      cliente: 'Carga Express',
      estado: 'riesgo',
      ultimoContacto: '10 Mar - 4:00 PM',
      viajesActivos: 0,
    },
  ];

  const clientesColumns = [
    { key: 'cliente', label: 'Cliente' },
    {
      key: 'estado',
      label: 'Estado Interacción',
      render: (row: typeof misClientes[0]) => <Semaforo estado={row.estado as SemaforoEstado} />,
    },
    { key: 'ultimoContacto', label: 'Último Contacto' },
    { key: 'viajesActivos', label: 'Viajes Activos' },
  ];

  return (
    <ModuleLayout titulo="Dashboard CS">
      {/* Resumen 8AM */}
      <Card>
        <h3>Resumen 8AM</h3>
        <div
          style={{
            padding: tokens.spacing.md,
            backgroundColor: tokens.colors.bgHover,
            borderRadius: tokens.radius.md,
            color: tokens.colors.textPrimary,
            lineHeight: 1.6,
          }}
        >
          {resumen}
        </div>
      </Card>

      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: tokens.spacing.md,
          marginTop: tokens.spacing.lg,
        }}
      >
        <KPICard titulo="Clientes Asignados" valor="15" color="primary" />
        <KPICard titulo="Contactados Hoy" valor="8" color="green" />
        <KPICard titulo="Pendientes" valor="7" color="red" />
        <KPICard titulo="Escalamientos" valor="2" color="yellow" />
      </div>

      {/* Mis Clientes Hoy */}
      <div style={{ marginTop: tokens.spacing.lg }}>
        <Card>
          <h3>Mis Clientes Hoy</h3>
          <DataTable columns={clientesColumns} data={misClientes} />
        </Card>
      </div>
    </ModuleLayout>
  );
}
