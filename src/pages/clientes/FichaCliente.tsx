import type { ReactElement } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Semaforo } from '../../components/ui/Semaforo';
import { tokens } from '../../lib/tokens';

export default function FichaCliente(): ReactElement {
  const datosMaestros = [
    { label: 'Razón Social', value: 'Transportes del Norte S.A.' },
    { label: 'RFC', value: 'TDN890101ABC' },
    { label: 'Tipo', value: 'Transportista' },
    { label: 'Segmento', value: 'Premium' },
    { label: 'Ejecutivo', value: 'Carlos Mendoza' },
    { label: 'Empresa', value: 'TDN México' },
    { label: 'Fecha de Alta', value: '15 de Enero, 2023' },
  ];

  const viajesActivos = [
    { id: 'VJ-2024-001', origen: 'CDMX', destino: 'GTO', estado: 'en_transito', eta: '15:30' },
    { id: 'VJ-2024-002', origen: 'MTY', destino: 'CDMX', estado: 'en_transito', eta: '18:45' },
    { id: 'VJ-2024-003', origen: 'QRO', destino: 'SLP', estado: 'programado', eta: '22:00' },
  ];

  const historialInteracciones = [
    { fecha: '13 Mar 2024', tipo: 'Llamada', usuario: 'Carlos M.', notas: 'Consulta sobre retardo en viaje VJ-001' },
    { fecha: '12 Mar 2024', tipo: 'Email', usuario: 'Sistema', notas: 'Documento de factura enviado' },
    { fecha: '11 Mar 2024', tipo: 'Reunión', usuario: 'Director Ventas', notas: 'Revisión de contrato anual' },
  ];

  const viajesColumns = [
    { key: 'id', label: 'ID Viaje' },
    { key: 'origen', label: 'Origen' },
    { key: 'destino', label: 'Destino' },
    { key: 'estado', label: 'Estado', render: (row: typeof viajesActivos[0]) => <Semaforo estado={row.estado as 'verde' | 'amarillo' | 'rojo'} /> },
    { key: 'eta', label: 'ETA' },
  ];

  const interaccionesColumns = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'notas', label: 'Notas' },
  ];

  return (
    <ModuleLayout titulo="Cliente — Transportes del Norte S.A.">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.lg }}>
        {/* Left Column: Datos Maestros */}
        <Card>
          <div style={{ marginBottom: tokens.spacing.md, paddingBottom: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.border}` }}>
            <h3 style={{ margin: 0, color: tokens.colors.textPrimary }}>Datos Maestros</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
            {datosMaestros.map((item) => (
              <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: tokens.spacing.md }}>
                <span style={{ fontWeight: 600, color: tokens.colors.textSecondary }}>
                  {item.label}
                </span>
                <span style={{ color: tokens.colors.textPrimary }}>
                  {item.label === 'Tipo' ? <Badge color="primary">{item.value}</Badge> : item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
          {/* Radiografía Financiera */}
          <Card>
            <div style={{ marginBottom: tokens.spacing.md, paddingBottom: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.border}` }}>
              <h3 style={{ margin: 0, color: tokens.colors.textPrimary }}>Radiografía Financiera</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: tokens.spacing.md }}>
              <KPICard titulo="Facturación Mensual" valor="$450K" color="primary" />
              <KPICard titulo="Saldo CXC" valor="$120K" color="red" />
              <KPICard titulo="Días Crédito" valor="30" color="primary" />
            </div>
          </Card>

          {/* Viajes Activos */}
          <Card>
            <div style={{ marginBottom: tokens.spacing.md, paddingBottom: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.border}` }}>
              <h3 style={{ margin: 0, color: tokens.colors.textPrimary }}>Viajes Activos</h3>
            </div>
            <DataTable columns={viajesColumns} data={viajesActivos} />
          </Card>
        </div>
      </div>

      {/* Historial de Interacciones */}
      <div style={{ marginTop: tokens.spacing.lg }}>
        <Card>
          <div style={{ marginBottom: tokens.spacing.md, paddingBottom: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.border}` }}>
            <h3 style={{ margin: 0, color: tokens.colors.textPrimary }}>Historial de Interacciones</h3>
          </div>
          <DataTable columns={interaccionesColumns} data={historialInteracciones} />
        </Card>
      </div>
    </ModuleLayout>
  );
}
