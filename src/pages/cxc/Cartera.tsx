import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { Semaforo } from '../../components/ui/Semaforo';
import { tokens } from '../../lib/tokens';

interface ClienteCarteraRow {
  id: string;
  cliente: string;
  saldo_total: number;
  saldo_vencido: number;
  dias_credito: number;
  dias_prom_pago: number;
  ejecutivo_cxc: string;
  riesgo_dias: number;
}

const mockClientesCartera: ClienteCarteraRow[] = [
  {
    id: '1',
    cliente: 'Transportes García',
    saldo_total: 125000,
    saldo_vencido: 45000,
    dias_credito: 30,
    dias_prom_pago: 42,
    ejecutivo_cxc: 'Jorge Gutiérrez',
    riesgo_dias: 65,
  },
  {
    id: '2',
    cliente: 'Logística Integral',
    saldo_total: 380000,
    saldo_vencido: 0,
    dias_credito: 45,
    dias_prom_pago: 38,
    ejecutivo_cxc: 'Sandra López',
    riesgo_dias: 15,
  },
  {
    id: '3',
    cliente: 'Distribuidora México',
    saldo_total: 275000,
    saldo_vencido: 180000,
    dias_credito: 30,
    dias_prom_pago: 55,
    ejecutivo_cxc: 'Jorge Gutiérrez',
    riesgo_dias: 78,
  },
  {
    id: '4',
    cliente: 'Transportes del Norte',
    saldo_total: 420000,
    saldo_vencido: 220000,
    dias_credito: 60,
    dias_prom_pago: 72,
    ejecutivo_cxc: 'Sandra López',
    riesgo_dias: 92,
  },
  {
    id: '5',
    cliente: 'Grupo Comercial XYZ',
    saldo_total: 185000,
    saldo_vencido: 85000,
    dias_credito: 30,
    dias_prom_pago: 48,
    ejecutivo_cxc: 'Carlos Mendoza',
    riesgo_dias: 52,
  },
  {
    id: '6',
    cliente: 'Industrias Lázaro',
    saldo_total: 320000,
    saldo_vencido: 150000,
    dias_credito: 45,
    dias_prom_pago: 61,
    ejecutivo_cxc: 'Sandra López',
    riesgo_dias: 68,
  },
  {
    id: '7',
    cliente: 'Servicios Globales',
    saldo_total: 215000,
    saldo_vencido: 0,
    dias_credito: 30,
    dias_prom_pago: 28,
    ejecutivo_cxc: 'Carlos Mendoza',
    riesgo_dias: 8,
  },
  {
    id: '8',
    cliente: 'Exportaciones Nacionales',
    saldo_total: 480000,
    saldo_vencido: 0,
    dias_credito: 60,
    dias_prom_pago: 55,
    ejecutivo_cxc: 'Jorge Gutiérrez',
    riesgo_dias: 20,
  },
];

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-MX')}`;
}

function getRiesgoEstado(dias: number): 'verde' | 'amarillo' | 'rojo' {
  if (dias < 30) return 'verde';
  if (dias <= 60) return 'amarillo';
  return 'rojo';
}

export default function Cartera() {
  const columns = [
    { key: 'cliente', label: 'Cliente', width: '18%' },
    {
      key: 'saldo_total',
      label: 'Saldo Total',
      width: '14%',
      render: (row: ClienteCarteraRow) => formatCurrency(row.saldo_total),
    },
    {
      key: 'saldo_vencido',
      label: 'Saldo Vencido',
      width: '14%',
      render: (row: ClienteCarteraRow) => formatCurrency(row.saldo_vencido),
    },
    { key: 'dias_credito', label: 'Días Crédito', width: '10%' },
    { key: 'dias_prom_pago', label: 'Días Prom Pago', width: '12%' },
    { key: 'ejecutivo_cxc', label: 'Ejecutivo CXC', width: '15%' },
    {
      key: 'riesgo_dias',
      label: 'Semáforo Riesgo',
      width: '17%',
      render: (row: ClienteCarteraRow) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
          <Semaforo estado={getRiesgoEstado(row.riesgo_dias)} />
          <span style={{ color: tokens.colors.textSecondary }}>
            {row.riesgo_dias}d
          </span>
        </div>
      ),
    },
  ];

  return (
    <ModuleLayout titulo="CXC — Cartera de Clientes">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.lg,
        }}
      >
        <KPICard titulo="Saldo Total" valor="$2.4M" color="gray" />
        <KPICard titulo="Vencido" valor="$680K" color="red" />
        <KPICard titulo="Clientes con Saldo" valor="45" color="gray" />
        <KPICard titulo="Días Promedio Pago" valor="38" color="yellow" />
      </div>

      <Card>
        <DataTable columns={columns} data={mockClientesCartera} />
      </Card>
    </ModuleLayout>
  );
}
