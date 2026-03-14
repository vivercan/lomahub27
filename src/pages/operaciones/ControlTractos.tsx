import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { tokens } from '../../lib/tokens';

interface TractoRow {
  id: string;
  economico: string;
  empresa: string;
  segmento: string;
  estado: 'disponible' | 'en_viaje' | 'taller';
  operador: string;
  km_acumulados: number;
  horas_ociosas: number;
  viaje_actual: string;
}

const mockTractos: TractoRow[] = [
  {
    id: '1',
    economico: 'MX-001',
    empresa: 'Transportes García',
    segmento: 'Full Truckload',
    estado: 'en_viaje',
    operador: 'Juan Pérez',
    km_acumulados: 245000,
    horas_ociosas: 2.5,
    viaje_actual: 'Monterrey → CDMX',
  },
  {
    id: '2',
    economico: 'MX-002',
    empresa: 'Transportes García',
    segmento: 'Full Truckload',
    estado: 'en_viaje',
    operador: 'Carlos López',
    km_acumulados: 198500,
    horas_ociosas: 4.2,
    viaje_actual: 'Guadalajara → Monterrey',
  },
  {
    id: '3',
    economico: 'MX-003',
    empresa: 'Logística Integral',
    segmento: 'LTL',
    estado: 'disponible',
    operador: 'Roberto Sánchez',
    km_acumulados: 156200,
    horas_ociosas: 8.5,
    viaje_actual: '—',
  },
  {
    id: '4',
    economico: 'MX-004',
    empresa: 'Transportes García',
    segmento: 'Full Truckload',
    estado: 'taller',
    operador: '—',
    km_acumulados: 289100,
    horas_ociosas: 0,
    viaje_actual: '—',
  },
  {
    id: '5',
    economico: 'MX-005',
    empresa: 'Logística Integral',
    segmento: 'Full Truckload',
    estado: 'en_viaje',
    operador: 'Miguel Hernández',
    km_acumulados: 312400,
    horas_ociosas: 1.8,
    viaje_actual: 'CDMX → Veracruz',
  },
  {
    id: '6',
    economico: 'MX-006',
    empresa: 'Transportes García',
    segmento: 'LTL',
    estado: 'disponible',
    operador: 'David Torres',
    km_acumulados: 124500,
    horas_ociosas: 6.3,
    viaje_actual: '—',
  },
  {
    id: '7',
    economico: 'MX-007',
    empresa: 'Logística Integral',
    segmento: 'Full Truckload',
    estado: 'en_viaje',
    operador: 'Fernando Ruiz',
    km_acumulados: 267800,
    horas_ociosas: 3.1,
    viaje_actual: 'Monterrey → CDMX',
  },
  {
    id: '8',
    economico: 'MX-008',
    empresa: 'Transportes García',
    segmento: 'Full Truckload',
    estado: 'taller',
    operador: '—',
    km_acumulados: 198700,
    horas_ociosas: 0,
    viaje_actual: '—',
  },
];

function getEstadoBadgeColor(estado: string): 'gray' | 'green' | 'blue' | 'yellow' {
  switch (estado) {
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

function getHorasOciosasBgColor(horas: number): string {
  if (horas < 3) return tokens.colors.green;
  if (horas <= 8) return tokens.colors.yellow;
  return tokens.colors.red;
}

function formatNumber(num: number): string {
  return num.toLocaleString('es-MX');
}

export default function ControlTractos() {
  const columns = [
    { key: 'economico', label: 'Económico', width: '12%' },
    { key: 'empresa', label: 'Empresa', width: '18%' },
    { key: 'segmento', label: 'Segmento', width: '12%' },
    {
      key: 'estado',
      label: 'Estado',
      width: '12%',
      render: (row: TractoRow) => (
        <Badge color={getEstadoBadgeColor(row.estado)}>
          {row.estado === 'en_viaje' ? 'En Viaje' : row.estado === 'taller' ? 'Taller' : 'Disponible'}
        </Badge>
      ),
    },
    { key: 'operador', label: 'Operador', width: '15%' },
    {
      key: 'km_acumulados',
      label: 'Km Acumulados',
      width: '12%',
      render: (row: TractoRow) => formatNumber(row.km_acumulados),
    },
    {
      key: 'horas_ociosas',
      label: 'Horas Ociosas',
      width: '12%',
      render: (row: TractoRow) => (
        <div
          style={{
            backgroundColor: getHorasOciosasBgColor(row.horas_ociosas),
            color: '#fff',
            padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
            borderRadius: tokens.radius.lg,
            textAlign: 'center',
          }}
        >
          {row.horas_ociosas.toFixed(1)}h
        </div>
      ),
    },
    { key: 'viaje_actual', label: 'Viaje Actual', width: '15%' },
  ];

  return (
    <ModuleLayout titulo="Control de Tractos">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.lg,
        }}
      >
        <KPICard titulo="Total" valor="142" color="gray" />
        <KPICard titulo="Disponibles" valor="28" color="green" />
        <KPICard titulo="En Viaje" valor="96" color="blue" />
        <KPICard titulo="Taller" valor="18" color="yellow" />
      </div>

      <Card>
        <DataTable columns={columns} data={mockTractos} />
      </Card>
    </ModuleLayout>
  );
}
