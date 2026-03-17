import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Select } from '../../components/ui/Select';
import { Semaforo } from '../../components/ui/Semaforo';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface Tracto {
  id: string;
  numero_economico: string;
  empresa: string;
  segmento: string;
  ubicacion: string;
  velocidad: number;
  ultimo_reporte: string;
  estado: string;
  cliente_asignado: string;
}

export default function Dedicados(): ReactElement {
  const [dedicados, setDedicados] = useState<Tracto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDedicados = async () => {
      try {
        const { data, error } = await supabase
          .from('tractos')
          .select('*');

        if (error) throw error;

        setDedicados(data || []);
      } catch (err) {
        console.error('Error fetching dedicados:', err);
        setDedicados([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDedicados();
  }, []);

  const dedicadosColumns = [
    { key: 'numero_economico', label: 'Económico' },
    { key: 'empresa', label: 'Empresa' },
    { key: 'segmento', label: 'Segmento' },
    { key: 'ubicacion', label: 'Ubicación' },
    { key: 'velocidad', label: 'Velocidad' },
    { key: 'ultimo_reporte', label: 'Último Reporte' },
    {
      key: 'estado',
      label: 'Estado',
      render: (_row: Tracto) => <Semaforo estado={'verde' as const} />,
    },
    { key: 'cliente_asignado', label: 'Cliente Asignado' },
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textMuted }}>
            <p>Cargando...</p>
          </div>
        ) : dedicados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textMuted }}>
            <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Sin datos</p>
            <p style={{ fontSize: '14px', marginTop: tokens.spacing.sm }}>Los datos se cargarán cuando estén disponibles en el sistema</p>
          </div>
        ) : (
          <DataTable columns={dedicadosColumns} data={dedicados} />
        )}
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
