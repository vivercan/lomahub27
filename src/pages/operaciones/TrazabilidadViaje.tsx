import type { ReactElement } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { Semaforo } from '../../components/ui/Semaforo';
import type { SemaforoEstado } from '../../lib/tokens';
import { tokens } from '../../lib/tokens';

export default function TrazabilidadViaje(): ReactElement {
  const eventos = [
    { evento: 'Salida del Origin', hora: '08:00', estado: 'completado' },
    { evento: 'Paso por Caseta Toluca', hora: '09:15', estado: 'completado' },
    { evento: 'Detenido 15 min (descanso)', hora: '11:30', estado: 'completado' },
    { evento: 'Cruce Frontera', hora: '13:45', estado: 'en_transito' },
    { evento: 'En Destino', hora: '15:30 (ETA)', estado: 'programado' },
  ];

  const datosViaje = [
    { label: 'Cliente', value: 'Transportes del Norte S.A.' },
    { label: 'Origen', value: 'CDMX - México' },
    { label: 'Destino', value: 'Guanajuato - GTO' },
    { label: 'Tracto', value: 'TAC-001' },
    { label: 'Caja', value: 'CAJ-045' },
    { label: 'Operador', value: 'Juan García' },
    { label: 'Estado', value: 'En Tránsito' },
    { label: 'ETA', value: '15:30' },
  ];

  return (
    <ModuleLayout titulo="Trazabilidad — Viaje #VJ-2024-001">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.lg }}>
        {/* Left: Timeline */}
        <Card>
          <h3>Timeline de Eventos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
            {eventos.map((evento, index) => (
              <div key={index} style={{ display: 'flex', gap: tokens.spacing.md }}>
                {/* Timeline Dot and Line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: tokens.spacing.sm }}>
                  <Semaforo estado={evento.estado as SemaforoEstado} />
                  {index < eventos.length - 1 && (
                    <div
                      style={{
                        width: '2px',
                        height: '40px',
                        backgroundColor: tokens.colors.border,
                      }}
                    />
                  )}
                </div>

                {/* Event Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.xs }}>
                  <span style={{ fontWeight: 600, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body }}>
                    {evento.evento}
                  </span>
                  <span style={{ fontSize: '12px', color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
                    {evento.hora}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
          {/* Datos del Viaje */}
          <Card>
            <h3>Datos del Viaje</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
              {datosViaje.map((item) => (
                <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: tokens.spacing.md }}>
                  <span style={{ fontWeight: 600, color: tokens.colors.textSecondary, fontSize: '12px', fontFamily: tokens.fonts.body }}>
                    {item.label}
                  </span>
                  <span style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Mapa de Ruta */}
          <Card>
            <h3>Mapa de Ruta</h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                backgroundColor: tokens.colors.bgHover,
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.colors.border}`,
                color: tokens.colors.textSecondary,
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: tokens.spacing.sm, fontFamily: tokens.fonts.body }}>Mapa de Ruta</p>
                <p style={{ fontSize: '12px', fontFamily: tokens.fonts.body }}>
                  CDMX → Toluca → Querétaro → Guanajuato
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ModuleLayout>
  );
}
