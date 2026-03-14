import type { ReactElement } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Select } from '../../components/ui/Select';
import { Semaforo } from '../../components/ui/Semaforo';
import { tokens } from '../../lib/tokens';

export default function Dedicados(): ReactElement {
  const dedicados = [
    {
      economico: 'TAC-001',
      empresa: 'TDN México',
      segmento: 'Premium',
      ubicacion: 'CDMX - México',
      velocidad: '85 km/h',
      ultimoReporte: '13 Mar - 14:30',
      estado: 'movimiento',
      clienteAsignado: 'Transportes del Norte',
    },
    {
      economico: 'TAC-002',
      empresa: 'Logística Integral',
      segmento: 'Standard',
      ubicacion: 'Monterrey - NL',
      velocidad: '0 km/h',
      ultimoReporte: '13 Mar - 14:25',
      estado: 'detenida_menos60',
      clienteAsignado: 'Logística Integral',
    },
    {
      economico: 'TAC-003',
      empresa: 'TDN México',
      segmento: 'Premium',
      ubicacion: 'Querétaro - QRO',
      velocidad: '92 km/h',
      ultimoReporte: '13 Mar - 14:28',
      estado: 'movimiento',
      clienteAsignado: 'Carga Express',
    },
    {
      economico: 'TAC-004',
      empresa: 'Carga Global',
      segmento: 'Económico',
      ubicacion: 'Veracruz - VER',
      velocidad: '0 km/h',
      ultimoReporte: '13 Mar - 13:45',
      estado: 'detenida_mas60',
      clienteAsignado: 'Transportes del Centro',
    },
    {
      economico: 'TAC-005',
      empresa: 'TDN México',
      segmento: 'Premium',
      ubicacion: 'Tampico - TAMPS',
      velocidad: '78 km/h',
      ultimoReporte: '13 Mar - 14:32',
      estado: 'movimiento',
      clienteAsignado: 'Logística Premium',
    },
    {
      economico: 'TAC-006',
      empresa: 'Logística Integral',
      segmento: 'Standard',
      ubicacion: 'Guadalajara - JAL',
      velocidad: '0 km/h',
      ultimoReporte: '13 Mar - 12:00',
      estado: 'sin_senal',
      clienteAsignado: 'Transportes del Golfo',
    },
    {
      economico: 'TAC-007',
      empresa: 'Carga Express',
      segmento: 'Económico',
      ubicacion: 'Saltillo - COAH',
      velocidad: '88 km/h',
      ultimoReporte: '13 Mar - 14:29',
      estado: 'movimiento',
      clienteAsignado: 'Carga Global',
    },
    {
      economico: 'TAC-008',
      empresa: 'Translogística',
      segmento: 'Standard',
      ubicacion: 'San Luis Potosí - SLP',
      velocidad: '0 km/h',
      ultimoReporte: '13 Mar - 14:10',
      estado: 'detenida_menos60',
      clienteAsignado: 'Transportes de Occidente',
    },
  ];

  const dedicadosColumns = [
    { key: 'economico', label: 'Económico' },
    { key: 'empresa', label: 'Empresa' },
    { key: 'segmento', label: 'Segmento' },
    { key: 'ubicacion', label: 'Ubicación' },
    { key: 'velocidad', label: 'Velocidad' },
    { key: 'ultimoReporte', label: 'Último Reporte' },
    {
      key: 'estado',
      label: 'Estado',
      render: (_row: typeof dedicados[0]) => <Semaforo estado={'verde' as const} />,
    },
    { key: 'clienteAsignado', label: 'Cliente Asignado' },
  ];

  return (
    <ModuleLayout titulo="Monitor Dedicados / GPS">
      {/* Filtro Segmento */}
      <div style={{ marginBottom: tokens.spacing.lg, maxWidth: '300px' }}>
        <Select
          label="Segmento"
          placeholder="Filtrar por segmento"
          options={[
            { value: 'premium', label: 'Premium' },
            { value: 'standard', label: 'Standard' },
            { value: 'economico', label: 'Económico' },
          ]}
        />
      </div>

      {/* Dedicados DataTable */}
      <Card>
        <div style={{ marginBottom: tokens.spacing.md, paddingBottom: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.border}` }}>
          <h3 style={{ margin: 0, color: tokens.colors.textPrimary }}>Unidades Dedicadas</h3>
        </div>
        <DataTable columns={dedicadosColumns} data={dedicados} />
      </Card>

      {/* Leyenda de Estados */}
      <div
        style={{
          marginTop: tokens.spacing.lg,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: tokens.spacing.md,
          padding: tokens.spacing.md,
          backgroundColor: tokens.colors.bgHover,
          borderRadius: tokens.radius.lg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
          <Semaforo estado="verde" />
          <span>En Movimiento</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
          <Semaforo estado="amarillo" />
          <span>Detenida &lt; 60 min</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
          <Semaforo estado="naranja" />
          <span>Detenida &gt; 60 min</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
          <Semaforo estado="rojo" />
          <span>Sin Señal</span>
        </div>
      </div>
    </ModuleLayout>
  );
}
