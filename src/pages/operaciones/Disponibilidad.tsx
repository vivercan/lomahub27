import { useState } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Semaforo } from '../../components/ui/Semaforo';
import { DataTable } from '../../components/ui/DataTable';
import { tokens } from '../../lib/tokens';

interface EquipoRow {
  tipo_equipo: string;
  disponibles: number;
  en_camino: number;
  total: number;
}

interface PlazaData {
  nombre: string;
  estado: 'verde' | 'rojo';
  equipos: EquipoRow[];
}

const plazasData: PlazaData[] = [
  {
    nombre: 'Monterrey',
    estado: 'verde',
    equipos: [
      { tipo_equipo: 'Tractocamión', disponibles: 12, en_camino: 8, total: 20 },
      { tipo_equipo: 'Volteo', disponibles: 5, en_camino: 3, total: 8 },
      { tipo_equipo: 'Flatbed', disponibles: 3, en_camino: 2, total: 5 },
    ],
  },
  {
    nombre: 'CDMX',
    estado: 'verde',
    equipos: [
      { tipo_equipo: 'Tractocamión', disponibles: 18, en_camino: 6, total: 24 },
      { tipo_equipo: 'Volteo', disponibles: 8, en_camino: 2, total: 10 },
      { tipo_equipo: 'Flatbed', disponibles: 4, en_camino: 1, total: 5 },
    ],
  },
  {
    nombre: 'Guadalajara',
    estado: 'rojo',
    equipos: [
      { tipo_equipo: 'Tractocamión', disponibles: 8, en_camino: 12, total: 20 },
      { tipo_equipo: 'Volteo', disponibles: 2, en_camino: 5, total: 7 },
      { tipo_equipo: 'Flatbed', disponibles: 1, en_camino: 3, total: 4 },
    ],
  },
];

export default function Disponibilidad() {
  const [activeTab, setActiveTab] = useState<'12h' | '24h' | '48h'>('12h');

  const tabButtons = ['12h', '24h', '48h'] as const;

  const equipoColumns = [
    { key: 'tipo_equipo', label: 'Tipo de Equipo', width: '40%' },
    { key: 'disponibles', label: 'Disponibles', width: '20%' },
    { key: 'en_camino', label: 'En Camino', width: '20%' },
    { key: 'total', label: 'Total', width: '20%' },
  ];

  return (
    <ModuleLayout titulo="Disponibilidad de Flota">
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
              {tab}
            </Button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: tokens.spacing.md,
        }}
      >
        {plazasData.map((plaza) => (
          <Card key={plaza.nombre}>
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
                {plaza.nombre}
              </h3>
            </div>

            <div style={{ marginBottom: tokens.spacing.md }}>
              <DataTable columns={equipoColumns} data={plaza.equipos} />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Semaforo estado={plaza.estado} label={plaza.estado === 'verde' ? 'Suficiente' : 'Sobredisponibilidad'} />
            </div>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  );
}
