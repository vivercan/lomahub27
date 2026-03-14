import type { ReactElement } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { tokens } from '../../lib/tokens';

export default function MapaGPS(): ReactElement {
  const currentTime = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return (
    <ModuleLayout titulo="Mapa GPS en Tiempo Real">
      {/* Filtros */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.lg,
        }}
      >
        <Select
          label="Empresa"
          placeholder="Todas las empresas"
          options={[
            { value: 'tdn', label: 'TDN México' },
            { value: 'logi', label: 'Logística Integral' },
            { value: 'tds', label: 'Transportes del Sur' },
          ]}
        />
        <Select
          label="Segmento"
          placeholder="Todos los segmentos"
          options={[
            { value: 'premium', label: 'Premium' },
            { value: 'standard', label: 'Standard' },
            { value: 'economico', label: 'Económico' },
          ]}
        />
        <Select
          label="Cliente"
          placeholder="Todos los clientes"
          options={[
            { value: 'tdn-norte', label: 'Transportes del Norte' },
            { value: 'logi-integ', label: 'Logística Integral' },
            { value: 'carga-exp', label: 'Carga Express' },
          ]}
        />
        <Select
          label="Estado"
          placeholder="Todos los estados"
          options={[
            { value: 'movimiento', label: 'En Movimiento' },
            { value: 'detenida', label: 'Detenida' },
            { value: 'sin_senal', label: 'Sin Señal' },
          ]}
        />
      </div>

      {/* Mapa Placeholder */}
      <Card>
        <div
          style={{
            marginBottom: tokens.spacing.md,
            paddingBottom: tokens.spacing.md,
            borderBottom: `1px solid ${tokens.colors.border}`,
          }}
        >
          <h3 style={{ margin: 0, color: tokens.colors.textPrimary }}>Mapa GPS</h3>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '500px',
            backgroundColor: tokens.colors.bgHover,
            borderRadius: tokens.radius.lg,
            border: `1px solid ${tokens.colors.border}`,
          }}
        >
          <div
            style={{
              textAlign: 'center',
              color: tokens.colors.textSecondary,
            }}
          >
            <p style={{ fontSize: tokens.fonts.body, fontWeight: 600, marginBottom: tokens.spacing.md }}>
              Mapa GPS — Integración con Google Maps / Leaflet pendiente
            </p>
            <p style={{ fontSize: tokens.fonts.body, color: tokens.colors.textMuted }}>
              Los datos en tiempo real se mostrarán aquí
            </p>
          </div>
        </div>
      </Card>

      {/* Footer Info */}
      <div
        style={{
          marginTop: tokens.spacing.md,
          fontSize: tokens.fonts.body,
          color: tokens.colors.textSecondary,
        }}
      >
        <span>34 unidades activas | Última actualización: {currentTime}</span>
      </div>
    </ModuleLayout>
  );
}
