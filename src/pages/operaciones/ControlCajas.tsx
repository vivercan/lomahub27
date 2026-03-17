import type { ReactElement } from 'react';
import { useState, useEffect } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface Caja {
  economico: string;
  empresa: string;
  tipo: string;
  estado: string;
  ubicacion: string;
  tiempoEnEstado: string;
  clienteActual: string;
}

export default function ControlCajas(): ReactElement {
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCajas = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('cajas')
          .select('*');

        if (error) {
          console.error('Error fetching cajas:', error);
          setCajas([]);
          return;
        }

        const formattedCajas = (data || []).map((caja: any) => ({
          economico: caja.economico || '',
          empresa: caja.empresa || '',
          tipo: caja.tipo || 'seco',
          estado: caja.estado || 'disponible',
          ubicacion: caja.ubicacion || '',
          tiempoEnEstado: caja.tiempo_en_estado || '0h',
          clienteActual: caja.cliente_actual || 'Sin asignar',
        }));

        setCajas(formattedCajas);
      } catch (err) {
        console.error('Unexpected error:', err);
        setCajas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCajas();
  }, []);

  const tipoVariant = (tipo: string): 'primary' | 'gray' => {
    return tipo === 'refri' ? 'primary' : 'gray';
  };

  const estadoVariant = (estado: string): 'green' | 'primary' | 'yellow' | 'gray' => {
    switch (estado) {
      case 'disponible':
        return 'green';
      case 'en_transito':
        return 'primary';
      case 'taller':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const estadoLabel = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return 'Disponible';
      case 'en_transito':
        return 'En Tránsito';
      case 'taller':
        return 'Taller';
      default:
        return estado;
    }
  };

  const cajasColumns = [
    { key: 'economico', label: 'Económico' },
    { key: 'empresa', label: 'Empresa' },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (row: Caja) => <Badge color={tipoVariant(row.tipo)}>{row.tipo === 'refri' ? 'Refrigerada' : 'Seco'}</Badge>,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (row: Caja) => <Badge color={estadoVariant(row.estado)}>{estadoLabel(row.estado)}</Badge>,
    },
    { key: 'ubicacion', label: 'Ubicación' },
    { key: 'tiempoEnEstado', label: 'Tiempo en Estado' },
    { key: 'clienteActual', label: 'Cliente Actual' },
  ];

  return (
    <ModuleLayout titulo="Control de Cajas">
      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.lg,
        }}
      >
        <KPICard titulo="Total Cajas" valor={cajas.length.toString()} color="primary" />
        <KPICard titulo="Disponibles" valor={cajas.filter(c => c.estado === 'disponible').length.toString()} color="green" />
        <KPICard titulo="En Tránsito" valor={cajas.filter(c => c.estado === 'en_transito').length.toString()} color="primary" />
        <KPICard titulo="Taller" valor={cajas.filter(c => c.estado === 'taller').length.toString()} color="yellow" />
      </div>

      {/* Filtro Estado */}
      <div style={{ marginBottom: tokens.spacing.lg, maxWidth: '300px' }}>
        <Select
          label="Estado"
          placeholder="Filtrar por estado"
          options={[
            { value: 'disponible', label: 'Disponible' },
            { value: 'en_transito', label: 'En Tránsito' },
            { value: 'taller', label: 'Taller' },
          ]}
        />
      </div>

      {/* Cajas DataTable */}
      <Card>
        <div style={{ marginBottom: tokens.spacing.md, paddingBottom: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.border}` }}>
          <h3 style={{ margin: 0, color: tokens.colors.textPrimary }}>Inventario de Cajas</h3>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p>Cargando...</p>
          </div>
        ) : cajas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: tokens.colors.textSecondary }}>
            <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Sin datos</p>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>Los datos se cargarán cuando estén disponibles en el sistema</p>
          </div>
        ) : (
          <DataTable columns={cajasColumns} data={cajas} />
        )}
      </Card>
    </ModuleLayout>
  );
}
