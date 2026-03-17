import { useState, useEffect } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

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
  const [tractos, setTractos] = useState<TractoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTractos = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tractos')
          .select('*');

        if (error) {
          console.error('Error fetching tractos:', error);
          setTractos([]);
          return;
        }

        const formattedTractos = (data || []).map((tracto: any) => ({
          id: tracto.id?.toString() || '',
          economico: tracto.economico || '',
          empresa: tracto.empresa || '',
          segmento: tracto.segmento || '',
          estado: tracto.estado || 'disponible',
          operador: tracto.operador || '—',
          km_acumulados: tracto.km_acumulados || 0,
          horas_ociosas: tracto.horas_ociosas || 0,
          viaje_actual: tracto.viaje_actual || '—',
        }));

        setTractos(formattedTractos);
      } catch (err) {
        console.error('Unexpected error:', err);
        setTractos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTractos();
  }, []);

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
        <KPICard titulo="Total" valor={tractos.length.toString()} color="gray" />
        <KPICard titulo="Disponibles" valor={tractos.filter(t => t.estado === 'disponible').length.toString()} color="green" />
        <KPICard titulo="En Viaje" valor={tractos.filter(t => t.estado === 'en_viaje').length.toString()} color="blue" />
        <KPICard titulo="Taller" valor={tractos.filter(t => t.estado === 'taller').length.toString()} color="yellow" />
      </div>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p>Cargando...</p>
          </div>
        ) : tractos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Sin datos</p>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>Los datos se cargarán cuando estén disponibles en el sistema</p>
          </div>
        ) : (
          <DataTable columns={columns} data={tractos} />
        )}
      </Card>
    </ModuleLayout>
  );
}
