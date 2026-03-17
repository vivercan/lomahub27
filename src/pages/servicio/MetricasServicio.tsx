import { useState, useEffect } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface EjecutivaRow {
  id: string;
  nombre: string;
  mensajes_respondidos: number;
  tiempo_promedio: string;
  porcentaje_sla: number;
  clientes_atendidos: number;
}

export default function MetricasServicio() {
  const [ejecutivas, setEjecutivas] = useState<EjecutivaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEjecutivas = async () => {
      try {
        const { data, error } = await supabase
          .from('ejecutivas_cs')
          .select('*');

        if (error) throw error;
        setEjecutivas(data || []);
      } catch (error) {
        console.error('Error fetching ejecutivas:', error);
        setEjecutivas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEjecutivas();
  }, []);
  const ejecutivaColumns = [
    { key: 'nombre', label: 'Nombre', width: '20%' },
    { key: 'mensajes_respondidos', label: 'Mensajes Respondidos', width: '20%' },
    { key: 'tiempo_promedio', label: 'Tiempo Promedio', width: '20%' },
    {
      key: 'porcentaje_sla',
      label: '% en SLA',
      width: '20%',
      render: (row: EjecutivaRow) => `${row.porcentaje_sla}%`,
    },
    { key: 'clientes_atendidos', label: 'Clientes Atendidos', width: '20%' },
  ];

  return (
    <ModuleLayout titulo="Métricas de Servicio">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.lg,
        }}
      >
        <KPICard titulo="Tiempo Resp Promedio" valor="8min" color="green" />
        <KPICard titulo="% en SLA" valor="92%" color="green" />
        <KPICard titulo="Escalamientos Hoy" valor="3" color="yellow" />
        <KPICard titulo="Cierre Diario" valor="85%" color="yellow" />
      </div>

      <div
        style={{
          marginBottom: tokens.spacing.lg,
        }}
      >
        <Card>
        <div
          style={{
            marginBottom: tokens.spacing.md,
            paddingBottom: tokens.spacing.md,
            borderBottom: `1px solid ${tokens.colors.border}`,
          }}
        >
          <h3
            style={{
              color: tokens.colors.textPrimary,
              margin: 0,
            }}
          >
            Rendimiento por Ejecutiva
          </h3>
        </div>
        {ejecutivas.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg font-medium">Sin datos</p>
            <p className="text-sm mt-1">Los datos se cargarán cuando estén disponibles en el sistema</p>
          </div>
        ) : (
          <DataTable columns={ejecutivaColumns} data={ejecutivas} />
        )}
        </Card>
      </div>

      <Card>
        <div
          style={{
            marginBottom: tokens.spacing.md,
            paddingBottom: tokens.spacing.md,
            borderBottom: `1px solid ${tokens.colors.border}`,
          }}
        >
          <h3
            style={{
              color: tokens.colors.textPrimary,
              margin: 0,
            }}
          >
            Tendencia Semanal
          </h3>
        </div>

        <div
          style={{
            height: '300px',
            backgroundColor: tokens.colors.bgHover,
            borderRadius: tokens.radius.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: tokens.colors.textSecondary,
          }}
        >
          Gráfico de tendencia (implementar con librería de gráficos)
        </div>
      </Card>
    </ModuleLayout>
  );
}
