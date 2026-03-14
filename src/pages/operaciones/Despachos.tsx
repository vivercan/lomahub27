import type { ReactElement } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Semaforo } from '../../components/ui/Semaforo';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { tokens } from '../../lib/tokens';

export default function Despachos(): ReactElement {
  const viajes = [
    {
      folio: 'VJ-2024-001',
      cliente: 'Transportes del Norte',
      ruta: 'CDMX → GTO',
      tipo: 'IMPO',
      tracto: 'TAC-001',
      caja: 'CAJ-045',
      operador: 'Juan García',
      estado: 'en_transito',
      citaDescarga: '15:30',
    },
    {
      folio: 'VJ-2024-002',
      cliente: 'Logística Integral',
      ruta: 'MTY → CDMX',
      tipo: 'EXPO',
      tracto: 'TAC-002',
      caja: 'CAJ-052',
      operador: 'Carlos López',
      estado: 'en_transito',
      citaDescarga: '18:45',
    },
    {
      folio: 'VJ-2024-003',
      cliente: 'Transportes del Sur',
      ruta: 'QRO → SLP',
      tipo: 'NAC',
      tracto: 'TAC-003',
      caja: 'CAJ-068',
      operador: 'Miguel Rodríguez',
      estado: 'programado',
      citaDescarga: '22:00',
    },
    {
      folio: 'VJ-2024-004',
      cliente: 'Carga Express',
      ruta: 'CDMX → VERACRUZ',
      tipo: 'IMPO',
      tracto: 'TAC-004',
      caja: 'CAJ-071',
      operador: 'Fernando Díaz',
      estado: 'cargando',
      citaDescarga: '14:00',
    },
    {
      folio: 'VJ-2024-005',
      cliente: 'Transportes del Centro',
      ruta: 'GTO → MONTERREY',
      tipo: 'NAC',
      tracto: 'TAC-005',
      caja: 'CAJ-083',
      operador: 'Antonio Morales',
      estado: 'completado',
      citaDescarga: '10:15',
    },
    {
      folio: 'VJ-2024-006',
      cliente: 'Logística Premium',
      ruta: 'LAREDO → CDMX',
      tipo: 'EXPO',
      tracto: 'TAC-006',
      caja: 'CAJ-091',
      operador: 'Roberto Sánchez',
      estado: 'en_transito',
      citaDescarga: '20:30',
    },
  ];

  const tipoColor = (tipo: string): 'primary' | 'green' | 'yellow' | 'orange' | 'red' | 'gray' | 'blue' => {
    switch (tipo) {
      case 'IMPO':
        return 'blue';
      case 'EXPO':
        return 'green';
      case 'NAC':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const estadoToSemaforo = (estado: string): 'verde' | 'amarillo' | 'naranja' | 'rojo' | 'gris' | 'azul' => {
    switch (estado) {
      case 'en_transito':
        return 'verde';
      case 'programado':
        return 'amarillo';
      case 'cargando':
        return 'azul';
      case 'completado':
        return 'verde';
      default:
        return 'gris';
    }
  };

  const viajesColumns = [
    { key: 'folio', label: 'Folio' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'ruta', label: 'Origen → Destino' },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (row: typeof viajes[0]) => <Badge color={tipoColor(row.tipo)}>{row.tipo}</Badge>,
    },
    { key: 'tracto', label: 'Tracto' },
    { key: 'caja', label: 'Caja' },
    { key: 'operador', label: 'Operador' },
    { key: 'estado', label: 'Estado', render: (row: typeof viajes[0]) => <Semaforo estado={estadoToSemaforo(row.estado)} /> },
    { key: 'citaDescarga', label: 'Cita Descarga' },
  ];

  return (
    <ModuleLayout titulo="Despachos">
      {/* Nuevo Viaje Button */}
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <Button variant="primary">Nuevo Viaje</Button>
      </div>

      {/* Filtros */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.lg,
        }}
      >
        <Select
          label="Estado"
          placeholder="Filtrar por estado"
          options={[
            { value: 'programado', label: 'Programado' },
            { value: 'cargando', label: 'Cargando' },
            { value: 'en_transito', label: 'En Tránsito' },
            { value: 'completado', label: 'Completado' },
          ]}
        />
        <Select
          label="Tipo"
          placeholder="Filtrar por tipo"
          options={[
            { value: 'IMPO', label: 'Importación' },
            { value: 'EXPO', label: 'Exportación' },
            { value: 'NAC', label: 'Nacional' },
          ]}
        />
      </div>

      {/* Viajes del Día */}
      <Card>
        <div
          style={{
            marginBottom: tokens.spacing.md,
            paddingBottom: tokens.spacing.md,
            borderBottom: `1px solid ${tokens.colors.border}`,
          }}
        >
          <h3 style={{ margin: 0, color: tokens.colors.textPrimary }}>Viajes del Día</h3>
        </div>
        <DataTable columns={viajesColumns} data={viajes} />
      </Card>
    </ModuleLayout>
  );
}
