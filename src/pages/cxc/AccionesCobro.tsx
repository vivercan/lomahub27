import { useState, useEffect, useMemo } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface AccionCobro {
  id: string;
  razon_social: string;
  saldo_vencido: number;
  dias_credito: number;
  dias_prom_pago: number;
  ejecutivo_cxc: string;
  ultimo_contacto: string | null;
  estatus_cobro: string;
}

type VistaActiva = 'pendientes' | 'criticos' | 'todos';

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString('es-MX')}`;
}

function formatCurrencyFull(amount: number): string {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function diasDesde(fecha: string | null): number {
  if (!fecha) return 999;
  const diff = Date.now() - new Date(fecha).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function prioridadCobro(diasVencido: number, saldo: number): { label: string; color: string; bg: string; orden: number } {
  if (diasVencido > 90 || saldo > 500_000) return { label: 'CRÍTICO', color: tokens.colors.red, bg: tokens.colors.redBg, orden: 1 };
  if (diasVencido > 60 || saldo > 200_000) return { label: 'ALTO', color: tokens.colors.orange2, bg: 'rgba(249, 115, 22, 0.1)', orden: 2 };
  if (diasVencido > 30 || saldo > 50_000) return { label: 'MEDIO', color: tokens.colors.yellow, bg: tokens.colors.yellowBg, orden: 3 };
  return { label: 'BAJO', color: tokens.colors.green, bg: tokens.colors.greenBg, orden: 4 };
}

export default function AccionesCobro() {
  const [cuentas, setCuentas] = useState<AccionCobro[]>([]);
  const [loading, setLoading] = useState(true);
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('pendientes');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .gt('saldo_vencido', 0)
          .order('saldo_vencido', { ascending: false });

        if (error) {
          console.error('Error fetching acciones cobro:', error);
          setCuentas([]);
        } else if (data) {
          setCuentas(data.map((c) => ({
            id: c.id,
            razon_social: c.razon_social || 'Sin nombre',
            saldo_vencido: c.saldo_vencido || 0,
            dias_credito: c.dias_credito || 0,
            dias_prom_pago: c.dias_prom_pago || 0,
            ejecutivo_cxc: c.ejecutivo_cxc || 'Sin asignar',
            ultimo_contacto: c.ultimo_contacto || null,
            estatus_cobro: c.estatus_cobro || 'Pendiente',
          })));
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setCuentas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cuentasConPrioridad = useMemo(() => {
    return cuentas.map((c) => {
      const diasVencido = Math.max(0, c.dias_prom_pago - c.dias_credito);
      const prioridad = prioridadCobro(diasVencido, c.saldo_vencido);
      const diasSinContacto = diasDesde(c.ultimo_contacto);
      return { ...c, diasVencido, prioridad, diasSinContacto };
    }).sort((a, b) => a.prioridad.orden - b.prioridad.orden || b.saldo_vencido - a.saldo_vencido);
  }, [cuentas]);

  const filtrados = useMemo(() => {
    if (vistaActiva === 'criticos') return cuentasConPrioridad.filter((c) => c.prioridad.orden <= 2);
    if (vistaActiva === 'pendientes') return cuentasConPrioridad.filter((c) => c.estatus_cobro === 'Pendiente' || c.estatus_cobro === 'En gestión');
    return cuentasConPrioridad;
  }, [cuentasConPrioridad, vistaActiva]);

  const totalVencido = useMemo(() => cuentas.reduce((s, c) => s + c.saldo_vencido, 0), [cuentas]);
  const criticos = useMemo(() => cuentasConPrioridad.filter((c) => c.prioridad.orden <= 2).length, [cuentasConPrioridad]);
  const sinContacto7d = useMemo(() => cuentasConPrioridad.filter((c) => c.diasSinContacto > 7).length, [cuentasConPrioridad]);
  const promDiasVencido = useMemo(() => {
    if (cuentasConPrioridad.length === 0) return 0;
    return Math.round(cuentasConPrioridad.reduce((s, c) => s + c.diasVencido, 0) / cuentasConPrioridad.length);
  }, [cuentasConPrioridad]);

  const columns = [
    {
      key: 'prioridad',
      label: 'Prioridad',
      width: '10%',
      render: (row: (typeof cuentasConPrioridad)[0]) => (
        <span style={{
          padding: '2px 10px',
          borderRadius: tokens.radius.full,
          fontSize: '0.75rem',
          fontWeight: 700,
          background: row.prioridad.bg,
          color: row.prioridad.color,
          letterSpacing: '0.5px',
        }}>
          {row.prioridad.label}
        </span>
      ),
    },
    { key: 'razon_social', label: 'Cliente', width: '20%' },
    {
      key: 'saldo_vencido',
      label: 'Saldo Vencido',
      width: '14%',
      render: (row: (typeof cuentasConPrioridad)[0]) => (
        <span style={{ color: tokens.colors.red, fontWeight: 600 }}>
          {formatCurrencyFull(row.saldo_vencido)}
        </span>
      ),
    },
    {
      key: 'diasVencido',
      label: 'Días Vencido',
      width: '10%',
      render: (row: (typeof cuentasConPrioridad)[0]) => {
        const color = row.diasVencido > 90 ? tokens.colors.red : row.diasVencido > 60 ? tokens.colors.orange2 : row.diasVencido > 30 ? tokens.colors.yellow : tokens.colors.green;
        return <span style={{ color, fontWeight: 600 }}>{row.diasVencido}d</span>;
      },
    },
    {
      key: 'estatus_cobro',
      label: 'Estatus',
      width: '12%',
      render: (row: (typeof cuentasConPrioridad)[0]) => {
        const statusColors: Record<string, string> = {
          'Pendiente': tokens.colors.yellow,
          'En gestión': tokens.colors.blue,
          'Promesa de pago': tokens.colors.green,
          'Escalado': tokens.colors.red,
        };
        const color = statusColors[row.estatus_cobro] || tokens.colors.textMuted;
        return (
          <span style={{
            padding: '2px 10px',
            borderRadius: tokens.radius.full,
            fontSize: '0.78rem',
            fontWeight: 600,
            background: `${color}15`,
            color,
          }}>
            {row.estatus_cobro}
          </span>
        );
      },
    },
    {
      key: 'diasSinContacto',
      label: 'Último Contacto',
      width: '12%',
      render: (row: (typeof cuentasConPrioridad)[0]) => {
        const alerta = row.diasSinContacto > 7;
        return (
          <span style={{
            color: alerta ? tokens.colors.red : tokens.colors.textSecondary,
            fontWeight: alerta ? 600 : 400,
          }}>
            {row.diasSinContacto >= 999 ? 'Sin registro' : `hace ${row.diasSinContacto}d`}
          </span>
        );
      },
    },
    { key: 'ejecutivo_cxc', label: 'Ejecutivo', width: '14%' },
  ];

  const vistas: { key: VistaActiva; label: string }[] = [
    { key: 'pendientes', label: 'Pendientes' },
    { key: 'criticos', label: 'Críticos' },
    { key: 'todos', label: 'Todos' },
  ];

  return (
    <ModuleLayout titulo="CXC — Acciones de Cobro">
      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: tokens.spacing.md,
        marginBottom: tokens.spacing.md,
      }}>
        <KPICard titulo="Total Vencido" valor={formatCurrency(totalVencido)} color="red" />
        <KPICard titulo="Cuentas Críticas" valor={String(criticos)} color="red" />
        <KPICard titulo="Sin Contacto +7d" valor={String(sinContacto7d)} color="yellow" />
        <KPICard titulo="Prom. Días Vencido" valor={`${promDiasVencido}d`} color={promDiasVencido > 60 ? 'red' : promDiasVencido > 30 ? 'yellow' : 'green'} />
      </div>

      {/* Resumen de prioridades */}
      <Card>
        <div style={{ padding: tokens.spacing.md }}>
          <h3 style={{
            fontFamily: tokens.fonts.heading,
            fontSize: '0.95rem',
            fontWeight: 600,
            color: tokens.colors.textPrimary,
            margin: `0 0 ${tokens.spacing.md} 0`,
          }}>
            Resumen por Prioridad
          </h3>
          <div style={{ display: 'flex', gap: tokens.spacing.lg }}>
            {[
              { label: 'CRÍTICO', color: tokens.colors.red, bg: tokens.colors.redBg, count: cuentasConPrioridad.filter((c) => c.prioridad.orden === 1).length, monto: cuentasConPrioridad.filter((c) => c.prioridad.orden === 1).reduce((s, c) => s + c.saldo_vencido, 0) },
              { label: 'ALTO', color: tokens.colors.orange2, bg: 'rgba(249, 115, 22, 0.1)', count: cuentasConPrioridad.filter((c) => c.prioridad.orden === 2).length, monto: cuentasConPrioridad.filter((c) => c.prioridad.orden === 2).reduce((s, c) => s + c.saldo_vencido, 0) },
              { label: 'MEDIO', color: tokens.colors.yellow, bg: tokens.colors.yellowBg, count: cuentasConPrioridad.filter((c) => c.prioridad.orden === 3).length, monto: cuentasConPrioridad.filter((c) => c.prioridad.orden === 3).reduce((s, c) => s + c.saldo_vencido, 0) },
              { label: 'BAJO', color: tokens.colors.green, bg: tokens.colors.greenBg, count: cuentasConPrioridad.filter((c) => c.prioridad.orden === 4).length, monto: cuentasConPrioridad.filter((c) => c.prioridad.orden === 4).reduce((s, c) => s + c.saldo_vencido, 0) },
            ].map((p) => (
              <div key={p.label} style={{
                flex: 1,
                padding: tokens.spacing.md,
                borderRadius: tokens.radius.lg,
                background: p.bg,
                border: `1px solid ${p.color}20`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: p.color, letterSpacing: '0.5px', marginBottom: tokens.spacing.xs }}>
                  {p.label}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: tokens.colors.textPrimary, marginBottom: '2px' }}>
                  {p.count}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: tokens.colors.textSecondary }}>
                  {formatCurrency(p.monto)}
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
          {vistas.map((v) => (
            <button
              key={v.key}
              onClick={() => setVistaActiva(v.key)}
              style={{
                padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
                borderRadius: tokens.radius.full,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                fontFamily: tokens.fonts.body,
                background: vistaActiva === v.key ? tokens.colors.primary : tokens.colors.bgCard,
                color: vistaActiva === v.key ? '#fff' : tokens.colors.textSecondary,
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: tokens.spacing.lg, color: tokens.colors.textSecondary }}>
              Cargando datos...
            </div>
          ) : filtrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: tokens.spacing.lg, color: tokens.colors.textSecondary }}>
              <p style={{ fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>Sin acciones pendientes</p>
              <p style={{ fontSize: '0.85rem', marginTop: tokens.spacing.sm }}>
                No hay cuentas vencidas en esta vista
              </p>
            </div>
          ) : (
            <DataTable columns={columns} data={filtrados} />
          )}
        </Card>
      </div>
    </ModuleLayout>
  );
}
