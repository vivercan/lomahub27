import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { tokens } from '../../lib/tokens';

interface EjecutivaRow {
  id: string;
  nombre: string;
  mensajes_respondidos: number;
  tiempo_promedio: string;
  porcentaje_sla: number;
  clientes_atendidos: number;
}

const mockEjecutivas: EjecutivaRow[] = [
  {
    id: '1',
    nombre: 'María García',
    mensajes_respondidos: 142,
    tiempo_promedio: '6m 30s',
    porcentaje_sla: 95,
    clientes_atendidos: 18,
  },
  {
    id: '2',
    nombre: 'Laura Rodríguez',
    mensajes_respondidos: 128,
    tiempo_promedio: '7m 45s',
    porcentaje_sla: 91,
    clientes_atendidos: 15,
  },
  {
    id: '3',
    nombre: 'Andrea López',
    mensajes_respondidos: 156,
    tiempo_promedio: '8m 15s',
    porcentaje_sla: 88,
    clientes_atendidos: 21,
  },
  {
    id: '4',
    nombre: 'Sofía Martínez',
    mensajes_respondidos: 134,
    tiempo_promedio: '7m 00s',
    porcentaje_sla: 93,
    clientes_atendidos: 17,
  },
];

export default function MetricasServicio() {
  const ejecutivaColumns = [
    { key: 'nombre', label: 'Nombre', width: '20%' },
    { key: 'mensajes_respondidos', label: 'Mensajes Respondidos', width: '20%' },
    { key: 'tiempo_promedio', label: 'Tiempo Promedio', width: '20%' },
    {
      key: 'porcentaje_sla',
      label: '% en SLA',
      width: '20%',
      render: (row: EjecutivaRow) => `${row.porcentaje_sla}%`,
    },
    { key: 'clientes_atendidos', label: 'Clientes Atendidos', width: '20%' },
  ];

  return (
    <ModuleLayout titulo="Métricas de Servicio">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.lg,
        }}
      >
        <KPICard titulo="Tiempo Resp Promedio" valor="8min" color="green" />
        <KPICard titulo="% en SLA" valor="92%" color="green" />
        <KPICard titulo="Escalamientos Hoy" valor="3" color="yellow" />
        <KPICard titulo="Cierre Diario" valor="85%" color="yellow" />
      </div>

      <div
        style={{
          marginBottom: tokens.spacing.lg,
        }}
      >
        <Card>
        <div
          style={{
            marginBottom: tokens.spacing.md,
            paddingBottom: tokens.spacing.md,
            borderBottom: `1px solid ${tokens.colors.border}`,
          }}
        >
          <h3
            style={{
              color: tokens.colors.textPrimary,
              margin: 0,
            }}
          >
            Rendimiento por Ejecutiva
          </h3>
        </div>
        <DataTable columns={ejecutivaColumns} data={mockEjecutivas} />
        </Card>
      </div>

      <Card>
        <div
          style={{
            marginBottom: tokens.spacing.md,
            paddingBottom: tokens.spacing.md,
            borderBottom: `1px solid ${tokens.colors.border}`,
          }}
        >
          <h3
            style={{
              color: tokens.colors.textPrimary,
              margin: 0,
            }}
          >
            Tendencia Semanal
          </h3>
        </div>

        <div
          style={{
            height: '300px',
            backgroundColor: tokens.colors.bgHover,
            borderRadius: tokens.radius.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: tokens.colors.textSecondary,
          }}
        >
          Gráfico de tendencia (implementar con librería de gráficos)
        </div>
      </Card>
    </ModuleLayout>
  );
}
