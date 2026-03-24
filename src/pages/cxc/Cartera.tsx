import { useState, useEffect } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { Semaforo } from '../../components/ui/Semaforo';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface ClienteCarteraRow {
  id: string;
  cliente: string;
  saldo_total: number;
  saldo_vencido: number;
  dias_credito: number;
  dias_prom_pago: number;
  ejecutivo_cxc: string;
  riesgo_dias: number;
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-MX')}`;
}

function getRiesgoEstado(dias: number): 'verde' | 'amarillo' | 'rojo' {
  if (dias < 30) return 'verde';
  if (dias <= 60) return 'amarillo';
  return 'rojo';
}

export default function Cartera() {
  const [clientesCartera, setClientesCartera] = useState<ClienteCarteraRow[]>([]);
  const [, setLoading] = useState(true);
  const [totalSaldo, setTotalSaldo] = useState(0);
  const [totalVencido, setTotalVencido] = useState(0);
  const [promedioDias, setPromedioDias] = useState(0);

  useEffect(() => {
    const fetchCartera = async () => {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .order('saldo_total', { ascending: false });

        if (error) {
          console.error('Error fetching cartera:', error);
          setClientesCartera([]);
        } else if (data) {
          const cartera: ClienteCarteraRow[] = data.map((cliente) => ({
            id: cliente.id,
            cliente: cliente.razon_social || 'Sin nombre',
            saldo_total: cliente.saldo_total || 0,
            saldo_vencido: cliente.saldo_vencido || 0,
            dias_credito: cliente.dias_credito || 0,
            dias_prom_pago: cliente.dias_prom_pago || 0,
            ejecutivo_cxc: cliente.ejecutivo_cxc || 'Sin asignar',
            riesgo_dias: cliente.dias_prom_pago ? Math.max(0, cliente.dias_prom_pago - cliente.dias_credito) : 0,
          }));

          setClientesCartera(cartera);
          setTotalSaldo(cartera.reduce((sum, c) => sum + c.saldo_total, 0));
          setTotalVencido(cartera.reduce((sum, c) => sum + c.saldo_vencido, 0));
          if (cartera.length > 0) {
            setPromedioDias(Math.round(cartera.reduce((sum, c) => sum + c.dias_prom_pago, 0) / cartera.length));
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setClientesCartera([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCartera();
  }, []);

  const columns = [
    { key: 'cliente', label: 'Cliente', width: '18%' },
    {
      key: 'saldo_total',
      label: 'Saldo Total',
      width: '14%',
      render: (row: ClienteCarteraRow) => formatCurrency(row.saldo_total),
    },
    {
      key: 'saldo_vencido',
      label: 'Saldo Vencido',
      width: '14%',
      render: (row: ClienteCarteraRow) => formatCurrency(row.saldo_vencido),
    },
    { key: 'dias_credito', label: 'Días Crédito', width: '10%' },
    { key: 'dias_prom_pago', label: 'Días Prom Pago', width: '12%' },
    { key: 'ejecutivo_cxc', label: 'Ejecutivo CXC', width: '15%' },
    {
      key: 'riesgo_dias',
      label: 'Semáforo Riesgo',
      width: '17%',
      render: (row: ClienteCarteraRow) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
          <Semaforo estado={getRiesgoEstado(row.riesgo_dias)} />
          <span style={{ color: tokens.colors.textSecondary }}>
            {row.riesgo_dias}d
          </span>
        </div>
      ),
    },
  ];

  return (
    <ModuleLayout titulo="CXC — Cartera de Clientes">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.lg,
        }}
      >
        <KPICard titulo="Saldo Total" valor={formatCurrency(totalSaldo)} color="gray" />
        <KPICard titulo="Vencido" valor={formatCurrency(totalVencido)} color="red" />
        <KPICard titulo="Clientes con Saldo" valor={clientesCartera.length.toString()} color="gray" />
        <KPICard titulo="Días Promedio Pago" valor={`${promedioDias}d`} color="yellow" />
      </div>

      <Card>
        {clientesCartera.length === 0 ? (
          <div style={{ textAlign: 'center', padding: tokens.spacing.lg, color: tokens.colors.textSecondary }}>
            <p style={{ fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>Sin datos</p>
            <p style={{ fontSize: '0.85rem', marginTop: tokens.spacing.sm }}>Los datos se cargarán cuando estén disponibles en el sistema</p>
          </div>
        ) : (
          <DataTable columns={columns} data={clientesCartera} />
        )}
      </Card>
    </ModuleLayout>
  );
}
