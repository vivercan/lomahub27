import { useState } from 'react';
import { ModuleLayout } from '../components/layout/ModuleLayout';
import { Card } from '../components/ui/Card';
import { KPICard } from '../components/ui/KPICard';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { tokens } from '../lib/tokens';

interface RankingRow {
  id: string;
  posicion: number;
  cliente_unidad: string;
  metrica_principal: string;
  valor: string | number;
  vs_semana: 'up' | 'down' | 'equal';
  porcentaje: number;
}

const mockRankings: RankingRow[] = [
  {
    id: '1',
    posicion: 1,
    cliente_unidad: 'Transportes García',
    metrica_principal: 'Viajes Completados',
    valor: 45,
    vs_semana: 'up',
    porcentaje: 12,
  },
  {
    id: '2',
    posicion: 2,
    cliente_unidad: 'Logística Integral',
    metrica_principal: 'Viajes Completados',
    valor: 38,
    vs_semana: 'up',
    porcentaje: 8,
  },
  {
    id: '3',
    posicion: 3,
    cliente_unidad: 'Distribuidora México',
    metrica_principal: 'Viajes Completados',
    valor: 35,
    vs_semana: 'down',
    porcentaje: 5,
  },
  {
    id: '4',
    posicion: 4,
    cliente_unidad: 'Transportes del Norte',
    metrica_principal: 'Viajes Completados',
    valor: 32,
    vs_semana: 'up',
    porcentaje: 3,
  },
  {
    id: '5',
    posicion: 5,
    cliente_unidad: 'MX-001',
    metrica_principal: 'Km Recorridos',
    valor: '12,450 km',
    vs_semana: 'equal',
    porcentaje: 0,
  },
  {
    id: '6',
    posicion: 6,
    cliente_unidad: 'MX-002',
    metrica_principal: 'Km Recorridos',
    valor: '11,890 km',
    vs_semana: 'up',
    porcentaje: 6,
  },
  {
    id: '7',
    posicion: 7,
    cliente_unidad: 'MX-003',
    metrica_principal: 'Km Recorridos',
    valor: '10,560 km',
    vs_semana: 'down',
    porcentaje: 4,
  },
  {
    id: '8',
    posicion: 8,
    cliente_unidad: 'MX-004',
    metrica_principal: 'Km Recorridos',
    valor: '9,870 km',
    vs_semana: 'up',
    porcentaje: 9,
  },
  {
    id: '9',
    posicion: 9,
    cliente_unidad: 'María García',
    metrica_principal: 'Mensajes Respondidos',
    valor: 156,
    vs_semana: 'up',
    porcentaje: 7,
  },
  {
    id: '10',
    posicion: 10,
    cliente_unidad: 'Laura Rodríguez',
    metrica_principal: 'Mensajes Respondidos',
    valor: 142,
    vs_semana: 'down',
    porcentaje: 2,
  },
];

interface ComparativaRow {
  id: string;
  concepto: string;
  valor: number;
}

const mockComparativas: ComparativaRow[] = [
  { id: '1', concepto: 'vs Meta', valor: 92 },
  { id: '2', concepto: 'vs Semana Anterior', valor: 105 },
  { id: '3', concepto: 'vs Presupuesto', valor: 88 },
];

export default function Inteligencia() {
  const [activeTab, setActiveTab] = useState<'diario' | 'semanal' | 'mensual' | 'acumulado'>('diario');

  const tabButtons = ['diario', 'semanal', 'mensual', 'acumulado'] as const;

  const rankingColumns = [
    {
      key: 'posicion',
      label: 'Posición',
      width: '10%',
    },
    {
      key: 'cliente_unidad',
      label: 'Cliente / Unidad',
      width: '20%',
    },
    {
      key: 'metrica_principal',
      label: 'Métrica Principal',
      width: '20%',
    },
    {
      key: 'valor',
      label: 'Valor',
      width: '20%',
    },
    {
      key: 'vs_semana',
      label: 'vs Semana Anterior',
      width: '30%',
      render: (row: RankingRow) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs }}>
          {row.vs_semana === 'up' && (
            <>
              <ArrowUp size={16} color={tokens.colors.green} />
              <span style={{ color: tokens.colors.green }}>+{row.porcentaje}%</span>
            </>
          )}
          {row.vs_semana === 'down' && (
            <>
              <ArrowDown size={16} color={tokens.colors.red} />
              <span style={{ color: tokens.colors.red }}>-{row.porcentaje}%</span>
            </>
          )}
          {row.vs_semana === 'equal' && (
            <span style={{ color: tokens.colors.textSecondary }}>—</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <ModuleLayout titulo="Inteligencia de Negocio">
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <div
          style={{
            display: 'flex',
            gap: tokens.spacing.sm,
          }}
        >
          {tabButtons.map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant={activeTab === tab ? 'primary' : 'secondary'}
              size="sm"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.lg,
        }}
      >
        <KPICard titulo="Viajes Completados" valor="23" color="gray" />
        <KPICard titulo="Facturación" valor="$890K" color="gray" />
        <KPICard titulo="Flota Activa" valor="89%" color="gray" />
        <KPICard titulo="Clientes Atendidos" valor="45" color="gray" />
        <KPICard titulo="Margen Promedio" valor="18%" color="green" />
        <KPICard titulo="NPS" valor="82" color="blue" />
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
              fontSize: tokens.fonts.body,
              color: tokens.colors.textPrimary,
              margin: 0,
            }}
          >
            Rankings Top 10
          </h3>
        </div>
        <DataTable columns={rankingColumns} data={mockRankings} />
      </Card>

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
              fontSize: tokens.fonts.body,
              color: tokens.colors.textPrimary,
              margin: 0,
            }}
          >
            Comparativas
          </h3>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: tokens.spacing.md,
          }}
        >
          {mockComparativas.map((comp) => (
            <div key={comp.id}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: tokens.spacing.xs,
                }}
              >
                <span
                  style={{
                    color: tokens.colors.textPrimary,
                  }}
                >
                  {comp.concepto}
                </span>
                <span
                  style={{
                    color: tokens.colors.textPrimary,
                  }}
                >
                  {comp.valor}%
                </span>
              </div>

              <div
                style={{
                  height: '20px',
                  backgroundColor: tokens.colors.bgHover,
                  borderRadius: tokens.radius.lg,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${comp.valor}%`,
                    backgroundColor: comp.valor >= 95 ? tokens.colors.green : tokens.colors.yellow,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </ModuleLayout>
  );
}
