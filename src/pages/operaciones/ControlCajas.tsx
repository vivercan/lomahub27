import type { ReactElement } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { tokens } from '../../lib/tokens';

export default function ControlCajas(): ReactElement {
  const cajas = [
    {
      economico: 'CAJ-045',
      empresa: 'TDN México',
      tipo: 'seco',
      estado: 'en_transito',
      ubicacion: 'CDMX - México',
      tiempoEnEstado: '2h 30min',
      clienteActual: 'Transportes del Norte',
    },
    {
      economico: 'CAJ-052',
      empresa: 'Logística Integral',
      tipo: 'refri',
      estado: 'disponible',
      ubicacion: 'Monterrey - NL',
      tiempoEnEstado: '5h 15min',
      clienteActual: 'Logística Integral',
    },
    {
      economico: 'CAJ-068',
      empresa: 'TDN México',
      tipo: 'seco',
      estado: 'en_transito',
      ubicacion: 'Querétaro - QRO',
      tiempoEnEstado: '3h 45min',
      clienteActual: 'Carga Express',
    },
    {
      economico: 'CAJ-071',
      empresa: 'Carga Global',
      tipo: 'refri',
      estado: 'disponible',
      ubicacion: 'Veracruz - VER',
      tiempoEnEstado: '1h 30min',
      clienteActual: 'Transportes del Centro',
    },
    {
      economico: 'CAJ-083',
      empresa: 'TDN México',
      tipo: 'seco',
      estado: 'taller',
      ubicacion: 'Servicio Técnico - CDMX',
      tiempoEnEstado: '6h 20min',
      clienteActual: 'Mantenimiento',
    },
    {
      economico: 'CAJ-091',
      empresa: 'Logística Premium',
      tipo: 'refri',
      estado: 'en_transito',
      ubicacion: 'Laredo - TAMPS',
      tiempoEnEstado: '4h 10min',
      clienteActual: 'Logística Premium',
    },
    {
      economico: 'CAJ-107',
      empresa: 'Transportes Global',
      tipo: 'seco',
      estado: 'disponible',
      ubicacion: 'Almacén Central - CDMX',
      tiempoEnEstado: '8h 45min',
      clienteActual: 'Disponible',
    },
    {
      economico: 'CAJ-115',
      empresa: 'Carga Express',
      tipo: 'refri',
      estado: 'taller',
      ubicacion: 'Servicio Técnico - MTY',
      tiempoEnEstado: '12h 30min',
      clienteActual: 'Mantenimiento',
    },
  ];

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
      render: (row: typeof cajas[0]) => <Badge color={tipoVariant(row.tipo)}>{row.tipo === 'refri' ? 'Refrigerada' : 'Seco'}</Badge>,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (row: typeof cajas[0]) => <Badge color={estadoVariant(row.estado)}>{estadoLabel(row.estado)}</Badge>,
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
        <KPICard titulo="Total Cajas" valor="186" color="primary" />
        <KPICard titulo="Disponibles" valor="42" color="green" />
        <KPICard titulo="En Tránsito" valor="98" color="primary" />
        <KPICard titulo="Taller" valor="12" color="yellow" />
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
        <DataTable columns={cajasColumns} data={cajas} />
      </Card>
    </ModuleLayout>
  );
}
