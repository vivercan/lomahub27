import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { Semaforo } from '../../components/ui/Semaforo';
import type { SemaforoEstado } from '../../lib/tokens';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface Cliente {
  id: string;
  cliente: string;
  estado: SemaforoEstado;
  ultimoContacto: string;
  viajesActivos: number;
}

export default function DashboardCS(): ReactElement {
  const [resumen, setResumen] = useState('Viajes en tránsito: 0 | Retrasados: 0 | Cajas sin plan: 0 | Clientes pendientes de contacto: 0');
  const [misClientes, setMisClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: clientesData, error: clientesError } = await supabase
          .from('clientes')
          .select('*');

        if (clientesError) throw clientesError;

        const formattedClientes = (clientesData || []).map((cliente: any) => ({
          id: cliente.id,
          cliente: cliente.nombre,
          estado: 'verde' as SemaforoEstado,
          ultimoContacto: 'N/A',
          viajesActivos: 0,
        }));

        setMisClientes(formattedClientes);
        setResumen(`Viajes en tránsito: 0 | Retrasados: 0 | Cajas sin plan: 0 | Clientes pendientes de contacto: ${formattedClientes.length}`);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setMisClientes([]);
        setResumen('Viajes en tránsito: 0 | Retrasados: 0 | Cajas sin plan: 0 | Clientes pendientes de contacto: 0');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const clientesColumns = [
    { key: 'cliente', label: 'Cliente' },
    {
      key: 'estado',
      label: 'Estado Interacción',
      render: (row: Cliente) => <Semaforo estado={row.estado} />,
    },
    { key: 'ultimoContacto', label: 'Último Contacto' },
    { key: 'viajesActivos', label: 'Viajes Activos' },
  ];

  return (
    <ModuleLayout titulo="Dashboard CS">
      {/* Resumen 8AM */}
      <Card>
        <h3>Resumen 8AM</h3>
        <div
          style={{
            padding: tokens.spacing.md,
            backgroundColor: tokens.colors.bgHover,
            borderRadius: tokens.radius.md,
            color: tokens.colors.textPrimary,
            lineHeight: 1.6,
          }}
        >
          {resumen}
        </div>
      </Card>

      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: tokens.spacing.md,
          marginTop: tokens.spacing.lg,
        }}
      >
        <KPICard titulo="Clientes Asignados" valor={misClientes.length.toString()} color="primary" />
        <KPICard titulo="Contactados Hoy" valor="0" color="green" />
        <KPICard titulo="Pendientes" valor="0" color="red" />
        <KPICard titulo="Escalamientos" valor="0" color="yellow" />
      </div>

      {/* Mis Clientes Hoy */}
      <div style={{ marginTop: tokens.spacing.lg }}>
        <Card>
          <h3>Mis Clientes Hoy</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textMuted }}>
              <p>Cargando...</p>
            </div>
          ) : misClientes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textMuted }}>
              <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>Sin datos</p>
              <p style={{ fontSize: '14px', marginTop: tokens.spacing.sm }}>Los datos se cargarán cuando estén disponibles en el sistema</p>
            </div>
          ) : (
            <DataTable columns={clientesColumns} data={misClientes} />
          )}
        </Card>
      </div>
    </ModuleLayout>
  );
          }
