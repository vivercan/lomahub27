import { useState, useEffect, useMemo } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface ClienteCXC {
  id: string;
  razon_social: string;
  saldo_total: number;
  saldo_vencido: number;
  dias_credito: number;
  dias_prom_pago: number;
  ejecutivo_cxc: string;
}

interface AgingBucket {
  label: string;
  min: number;
  max: number;
  color: string;
  bgColor: string;
  clientes: number;
  monto: number;
}

interface EjecutivoDSO {
  ejecutivo: string;
  clientes: number;
  saldoTotal: number;
  saldoVencido: number;
  dsoPromedio: number;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString('es-MX')}`;
}

function formatCurrencyFull(amount: number): string {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function AgingReport() {
  const [clientes, setClientes] = useState<ClienteCXC[]>([]);
  const [loading, setLoading] = useState(true);
  const [vistaActiva, setVistaActiva] = useState<'aging' | 'ejecutivos'>('aging');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('cxc_cartera')
          .select('id, saldo_total, saldo_vencido, dias_credito_pactados, dias_promedio_pago, ejecutivo_cxc_id, clientes(razon_social)')
          .gt('saldo_total', 0)
          .order('saldo_vencido', { ascending: false });

        if (error) {
          console.error('Error fetching aging data:', error);
          setClientes([]);
        } else if (data) {
          setClientes(data.map((c: any) => ({
            id: c.id,
            razon_social: c.clientes?.razon_social || 'Sin nombre',
            saldo_total: c.saldo_total || 0,
            saldo_vencido: c.saldo_vencido || 0,
            dias_credito: c.dias_credito_pactados || 0,
            dias_prom_pago: c.dias_promedio_pago || 0,
            ejecutivo_cxc: c.ejecutivo_cxc_id || 'Sin asignar',
          })));
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setClientes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const buckets: AgingBucket[] = useMemo(() => {
    const ranges = [
      { label: '0-30 días', min: 0, max: 30, color: tokens.colors.green, bgColor: tokens.colors.greenBg },
      { label: '31-60 días', min: 31, max: 60, color: tokens.colors.yellow, bgColor: tokens.colors.yellowBg },
      { label: '61-90 días', min: 61, max: 90, color: tokens.colors.orange2, bgColor: 'rgba(249, 115, 22, 0.1)' },
      { label: '90+ días', min: 91, max: 9999, color: tokens.colors.red, bgColor: tokens.colors.redBg },
    ];

    return ranges.map((r) => {
      const matched = clientes.filter((c) => {
        const diasVencido = Math.max(0, c.dias_prom_pago - c.dias_credito);
        return diasVencido >= r.min && diasVencido <= r.max;
      });
      return {
        ...r,
        clientes: matched.length,
        monto: matched.reduce((sum, c) => sum + c.saldo_vencido, 0),
      };
    });
  }, [clientes]);

  const ejecutivosDSO: EjecutivoDSO[] = useMemo(() => {
    const map = new Map<string, ClienteCXC[]>();
    clientes.forEach((c) => {
      const key = c.ejecutivo_cxc;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    });

    return Array.from(map.entries())
      .map(([ejecutivo, lista]) => ({
        ejecutivo,
        clientes: lista.length,
        saldoTotal: lista.reduce((s, c) => s + c.saldo_total, 0),
        saldoVencido: lista.reduce((s, c) => s + c.saldo_vencido, 0),
        dsoPromedio: lista.length > 0
          ? Math.round(lista.reduce((s, c) => s + c.dias_prom_pago, 0) / lista.length)
          : 0,
      }))
      .sort((a, b) => b.saldoVencido - a.saldoVencido);
  }, [clientes]);

  const totalSaldo = useMemo(() => clientes.reduce((s, c) => s + c.saldo_total, 0), [clientes]);
  const totalVencido = useMemo(() => clientes.reduce((s, c) => s + c.saldo_vencido, 0), [clientes]);
  const dsoGlobal = useMemo(() => {
    if (clientes.length === 0) return 0;
    return Math.round(clientes.reduce((s, c) => s + c.dias_prom_pago, 0) / clientes.length);
  }, [clientes]);
  const pctVencido = useMemo(() => totalSaldo > 0 ? Math.round((totalVencido / totalSaldo) * 100) : 0, [totalSaldo, totalVencido]);
  const maxBucketMonto = useMemo(() => Math.max(...buckets.map((b) => b.monto), 1), [buckets]);

  const agingColumns = [
    { key: 'razon_social', label: 'Cliente', width: '22%' },
    {
      key: 'saldo_total',
      label: 'Saldo Total',
      width: '15%',
      render: (row: ClienteCXC) => (
        <span style={{ color: tokens.colors.textPrimary, fontWeight: 500 }}>
          {formatCurrencyFull(row.saldo_total)}
        </span>
      ),
    },
    {
      key: 'saldo_vencido',
      label: 'Vencido',
      width: '15%',
      render: (row: ClienteCXC) => (
        <span style={{ color: row.saldo_vencido > 0 ? tokens.colors.red : tokens.colors.green, fontWeight: 500 }}>
          {formatCurrencyFull(row.saldo_vencido)}
        </span>
      ),
    },
    { key: 'dias_credito', label: 'Crédito', width: '10%' },
    { key: 'dias_prom_pago', label: 'DSO', width: '8%' },
    {
      key: 'rango',
      label: 'Antigüedad',
      width: '15%',
      render: (row: ClienteCXC) => {
        const dias = Math.max(0, row.dias_prom_pago - row.dias_credito);
        const bucket = buckets.find((b) => dias >= b.min && dias <= b.max);
        return (
          <span style={{
            padding: '2px 10px',
            borderRadius: tokens.radius.full,
            fontSize: '0.8rem',
            fontWeight: 600,
            background: bucket?.bgColor || tokens.colors.bgHover,
            color: bucket?.color || tokens.colors.textMuted,
          }}>
            {dias}d — {bucket?.label || 'N/A'}
          </span>
        );
      },
    },
    { key: 'ejecutivo_cxc', label: 'Ejecutivo', width: '15%' },
  ];

  const ejecutivoColumns = [
    { key: 'ejecutivo', label: 'Ejecutivo CXC', width: '22%' },
    { key: 'clientes', label: 'Clientes', width: '10%' },
    {
      key: 'saldoTotal',
      label: 'Saldo Total',
      width: '18%',
      render: (row: EjecutivoDSO) => (
        <span style={{ color: tokens.colors.textPrimary, fontWeight: 500 }}>
          {formatCurrencyFull(row.saldoTotal)}
        </span>
      ),
    },
    {
      key: 'saldoVencido',
      label: 'Vencido',
      width: '18%',
      render: (row: EjecutivoDSO) => (
        <span style={{ color: row.saldoVencido > 0 ? tokens.colors.red : tokens.colors.green, fontWeight: 500 }}>
          {formatCurrencyFull(row.saldoVencido)}
        </span>
      ),
    },
    {
      key: 'dsoPromedio',
      label: 'DSO Promedio',
      width: '15%',
      render: (row: EjecutivoDSO) => {
        const color = row.dsoPromedio > 60 ? tokens.colors.red : row.dsoPromedio > 30 ? tokens.colors.yellow : tokens.colors.green;
        return (
          <span style={{ color, fontWeight: 600 }}>{row.dsoPromedio}d</span>
        );
      },
    },
    {
      key: 'pctVencido',
      label: '% Vencido',
      width: '17%',
      render: (row: EjecutivoDSO) => {
        const pct = row.saldoTotal > 0 ? Math.round((row.saldoVencido / row.saldoTotal) * 100) : 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
            <div style={{
              flex: 1,
              height: '6px',
              borderRadius: tokens.radius.full,
              background: tokens.colors.bgHover,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.min(pct, 100)}%`,
                height: '100%',
                borderRadius: tokens.radius.full,
                background: pct > 50 ? tokens.colors.red : pct > 25 ? tokens.colors.yellow : tokens.colors.green,
              }} />
            </div>
            <span style={{ color: tokens.colors.textSecondary, fontSize: '0.8rem', minWidth: '36px' }}>{pct}%</span>
          </div>
        );
      },
    },
  ];

  return (
    <ModuleLayout titulo="CXC — Antigüedad de Cartera" moduloPadre={{ nombre: 'Comercial', ruta: '/ventas/dashboard' }}>
      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: tokens.spacing.md,
        marginBottom: tokens.spacing.md,
      }}>
        <KPICard titulo="Cartera Total" valor={formatCurrency(totalSaldo)} color="blue" />
        <KPICard titulo="Total Vencido" valor={formatCurrency(totalVencido)} color="red" />
        <KPICard titulo="DSO Global" valor={`${dsoGlobal}d`} color="yellow" />
        <KPICard titulo="% Vencido" valor={`${pctVencido}%`} color={pctVencido > 50 ? 'red' : pctVencido > 25 ? 'yellow' : 'green'} />
      </div>

      {/* Aging Buckets — barras horizontales */}
      <Card>
        <div style={{ padding: tokens.spacing.md }}>
          <h3 style={{
            fontFamily: tokens.fonts.heading,
            fontSize: '0.95rem',
            fontWeight: 600,
            color: tokens.colors.textPrimary,
            margin: `0 0 ${tokens.spacing.md} 0`,
          }}>
            Distribución por Antigüedad
          </h3>
          <div style={{ display: 'flex', gap: tokens.spacing.lg }}>
            {buckets.map((bucket) => (
              <div key={bucket.label} style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: tokens.spacing.xs,
                }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: bucket.color,
                  }}>
                    {bucket.label}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    color: tokens.colors.textMuted,
                  }}>
                    {bucket.clientes} clientes
                  </span>
                </div>
                <div style={{
                  height: '28px',
                  borderRadius: tokens.radius.md,
                  background: tokens.colors.bgHover,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <div style={{
                    width: `${maxBucketMonto > 0 ? (bucket.monto / maxBucketMonto) * 100 : 0}%`,
                    height: '100%',
                    borderRadius: tokens.radius.md,
                    background: bucket.color,
                    opacity: 0.7,
                    transition: 'width 0.5s ease',
                  }} />
                  <span style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: tokens.colors.textPrimary,
                  }}>
                    {formatCurrency(bucket.monto)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Vista toggle + tabla */}
      <div style={{ marginTop: tokens.spacing.md }}>
        <div style={{
          display: 'flex',
          gap: tokens.spacing.sm,
          marginBottom: tokens.spacing.md,
        }}>
          <button
            onClick={() => setVistaActiva('aging')}
            style={{
              padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
              borderRadius: tokens.radius.full,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              fontFamily: tokens.fonts.body,
              background: vistaActiva === 'aging' ? tokens.colors.primary : tokens.colors.bgCard,
              color: vistaActiva === 'aging' ? '#fff' : tokens.colors.textSecondary,
            }}
          >
            Por Cliente
          </button>
          <button
            onClick={() => setVistaActiva('ejecutivos')}
            style={{
              padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
              borderRadius: tokens.radius.full,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              fontFamily: tokens.fonts.body,
              background: vistaActiva === 'ejecutivos' ? tokens.colors.primary : tokens.colors.bgCard,
              color: vistaActiva === 'ejecutivos' ? '#fff' : tokens.colors.textSecondary,
            }}
          >
            Por Ejecutivo CXC
          </button>
        </div>

        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: tokens.spacing.lg, color: tokens.colors.textSecondary }}>
              Cargando datos...
            </div>
          ) : clientes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: tokens.spacing.lg, color: tokens.colors.textSecondary }}>
              <p style={{ fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>Sin datos de cartera</p>
              <p style={{ fontSize: '0.85rem', marginTop: tokens.spacing.sm }}>
                Los datos se cargarán cuando haya clientes con saldo en el sistema
              </p>
            </div>
          ) : vistaActiva === 'aging' ? (
            <DataTable columns={agingColumns} data={clientes} />
          ) : (
            <DataTable columns={ejecutivoColumns} data={ejecutivosDSO} />
          )}
        </Card>
      </div>
    </ModuleLayout>
  );
}
