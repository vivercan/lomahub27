import { useState, useEffect, useMemo } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface Lead {
  id: string;
  empresa: string;
  estado: string;
  potencial_usd: number;
  responsable: string;
  segmento: string;
  created_at: string;
}

type VistaActiva = 'funnel' | 'vendedor';

const ETAPAS_ORDEN = [
  'Nuevo',
  'Contactado',
  'Cotizado',
  'Negociacion',
  'Cerrado Ganado',
  'Cerrado Perdido',
];

const etapaColores: Record<string, string> = {
  'Nuevo': tokens.colors.blue,
  'Contactado': '#8B5CF6',
  'Cotizado': tokens.colors.yellow,
  'Negociacion': tokens.colors.orange2,
  'Cerrado Ganado': tokens.colors.green,
  'Cerrado Perdido': tokens.colors.red,
};

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString('es-MX')}`;
}

function formatCurrencyFull(amount: number): string {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function FunnelVentas() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('funnel');

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('fecha_creacion', { ascending: false });

        if (error) {
          console.error('Error fetching leads:', error);
          setLeads([]);
        } else if (data) {
          setLeads(data.map((l) => ({
            id: l.id,
            empresa: l.empresa || 'Sin nombre',
            estado: l.estado || 'Nuevo',
            potencial_usd: (l.proyectado_usd || l.valor_estimado || 0) || 0,
            responsable: l.ejecutivo_nombre || 'Sin asignar',
            segmento: l.segmento || 'General',
            created_at: l.fecha_creacion || '',
          })));
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const etapas = useMemo(() => {
    const activos = ETAPAS_ORDEN.filter((e) => e !== 'Cerrado Perdido');
    return activos.map((etapa) => {
      const leadsEtapa = leads.filter((l) => l.estado === etapa);
      const count = leadsEtapa.length;
      const potencial = leadsEtapa.reduce((s, l) => s + l.potencial_usd, 0);
      return { etapa, count, potencial };
    });
  }, [leads]);

  const perdidos = useMemo(() => leads.filter((l) => l.estado === 'Cerrado Perdido'), [leads]);

  const totalLeads = leads.length;
  const totalPotencial = useMemo(() => leads.reduce((s, l) => s + l.potencial_usd, 0), [leads]);
  const ganados = useMemo(() => leads.filter((l) => l.estado === 'Cerrado Ganado'), [leads]);
  const tasaConversion = totalLeads > 0 ? ((ganados.length / totalLeads) * 100).toFixed(1) : '0';
  const potencialActivo = useMemo(() =>
    leads.filter((l) => l.estado !== 'Cerrado Perdido' && l.estado !== 'Cerrado Ganado')
      .reduce((s, l) => s + l.potencial_usd, 0),
    [leads]
  );

  const maxCount = useMemo(() => Math.max(...etapas.map((e) => e.count), 1), [etapas]);

  const vendedores = useMemo(() => {
    const map = new Map<string, { total: number; potencial: number; ganados: number; perdidos: number; activos: number }>();
    leads.forEach((l) => {
      const key = l.responsable;
      const existing = map.get(key) || { total: 0, potencial: 0, ganados: 0, perdidos: 0, activos: 0 };
      existing.total++;
      existing.potencial += l.potencial_usd;
      if (l.estado === 'Cerrado Ganado') existing.ganados++;
      else if (l.estado === 'Cerrado Perdido') existing.perdidos++;
      else existing.activos++;
      map.set(key, existing);
    });
    return Array.from(map.entries()).map(([nombre, data]) => ({
      nombre,
      ...data,
      conversion: data.total > 0 ? ((data.ganados / data.total) * 100) : 0,
    })).sort((a, b) => b.potencial - a.potencial);
  }, [leads]);

  const vendedorColumns = [
    { key: 'nombre', label: 'Vendedor', width: '20%' },
    {
      key: 'total',
      label: 'Leads',
      width: '10%',
      render: (row: (typeof vendedores)[0]) => (
        <span style={{ fontWeight: 700, color: tokens.colors.textPrimary }}>{row.total}</span>
      ),
    },
    {
      key: 'potencial',
      label: 'Potencial USD',
      width: '18%',
      render: (row: (typeof vendedores)[0]) => (
        <span style={{ fontWeight: 600, color: tokens.colors.blue }}>{formatCurrencyFull(row.potencial)}</span>
      ),
    },
    {
      key: 'activos',
      label: 'Activos',
      width: '10%',
      render: (row: (typeof vendedores)[0]) => (
        <span style={{ fontWeight: 600, color: tokens.colors.yellow }}>{row.activos}</span>
      ),
    },
    {
      key: 'ganados',
      label: 'Ganados',
      width: '10%',
      render: (row: (typeof vendedores)[0]) => (
        <span style={{ fontWeight: 600, color: tokens.colors.green }}>{row.ganados}</span>
      ),
    },
    {
      key: 'perdidos',
      label: 'Perdidos',
      width: '10%',
      render: (row: (typeof vendedores)[0]) => (
        <span style={{ fontWeight: 600, color: tokens.colors.red }}>{row.perdidos}</span>
      ),
    },
    {
      key: 'conversion',
      label: 'ConversiÃ³n',
      width: '22%',
      render: (row: (typeof vendedores)[0]) => {
        const color = row.conversion >= 30 ? tokens.colors.green : row.conversion >= 15 ? tokens.colors.yellow : tokens.colors.red;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              flex: 1,
              height: '8px',
              background: `${color}20`,
              borderRadius: tokens.radius.full,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.min(row.conversion, 100)}%`,
                height: '100%',
                background: color,
                borderRadius: tokens.radius.full,
              }} />
            </div>
            <span style={{ fontWeight: 700, color, fontSize: '0.85rem', minWidth: '42px', textAlign: 'right' }}>
              {row.conversion.toFixed(1)}%
            </span>
          </div>
        );
      },
    },
  ];

  const vistas: { key: VistaActiva; label: string }[] = [
    { key: 'funnel', label: 'Embudo Visual' },
    { key: 'vendedor', label: 'Por Vendedor' },
  ];

  return (
    <ModuleLayout titulo="Comercial â Funnel de Ventas">
      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: tokens.spacing.md,
        marginBottom: tokens.spacing.md,
      }}>
        <KPICard titulo="Total Leads" valor={String(totalLeads)} color="blue" />
        <KPICard titulo="Pipeline Activo" valor={formatCurrency(potencialActivo)} color="yellow" />
        <KPICard titulo="Potencial Total" valor={formatCurrency(totalPotencial)} color="primary" />
        <KPICard titulo="Tasa ConversiÃ³n" valor={`${tasaConversion}%`} color={Number(tasaConversion) >= 20 ? 'green' : Number(tasaConversion) >= 10 ? 'yellow' : 'red'} />
      </div>

      {/* Vista toggle */}
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

      {vistaActiva === 'funnel' ? (
        <Card>
          <div style={{ padding: tokens.spacing.lg }}>
            <h3 style={{
              fontFamily: tokens.fonts.heading,
              fontSize: '1rem',
              fontWeight: 600,
              color: tokens.colors.textPrimary,
              margin: `0 0 ${tokens.spacing.lg} 0`,
            }}>
              Embudo de ConversiÃ³n
            </h3>

            {loading ? (
              <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textSecondary }}>
                Cargando datos...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
                {etapas.map((item, idx) => {
                  const barWidth = Math.max((item.count / maxCount) * 100, 8);
                  const color = etapaColores[item.etapa] || tokens.colors.primary;
                  const prevCount = idx > 0 ? etapas[idx - 1].count : item.count;
                  const dropoff = idx > 0 && prevCount > 0
                    ? ((1 - item.count / prevCount) * 100).toFixed(0)
                    : null;

                  return (
                    <div key={item.etapa} style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md }}>
                      {/* Etapa label */}
                      <div style={{
                        width: '140px',
                        flexShrink: 0,
                        textAlign: 'right',
                        fontFamily: tokens.fonts.body,
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: tokens.colors.textPrimary,
                      }}>
                        {item.etapa}
                      </div>

                      {/* Bar */}
                      <div style={{ flex: 1, position: 'relative' }}>
                        <div style={{
                          width: `${barWidth}%`,
                          height: '40px',
                          background: `linear-gradient(90deg, ${color}, ${color}CC)`,
                          borderRadius: tokens.radius.md,
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: tokens.spacing.md,
                          transition: 'width 0.4s ease',
                          position: 'relative',
                        }}>
                          <span style={{
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: '1rem',
                            fontFamily: tokens.fonts.body,
                          }}>
                            {item.count}
                          </span>
                        </div>
                      </div>

                      {/* Potencial + dropoff */}
                      <div style={{
                        width: '160px',
                        flexShrink: 0,
                        textAlign: 'right',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '2px',
                      }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: tokens.colors.textPrimary,
                          fontFamily: tokens.fonts.body,
                        }}>
                          {formatCurrency(item.potencial)}
                        </span>
                        {dropoff && Number(dropoff) > 0 && (
                          <span style={{
                            fontSize: '0.72rem',
                            color: tokens.colors.red,
                            fontWeight: 500,
                          }}>
                            -{dropoff}% drop
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Perdidos (separate) */}
                {perdidos.length > 0 && (
                  <div style={{
                    marginTop: tokens.spacing.sm,
                    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                    background: tokens.colors.redBg,
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.colors.red}20`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{
                      fontFamily: tokens.fonts.body,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: tokens.colors.red,
                    }}>
                      Cerrado Perdido: {perdidos.length} leads
                    </span>
                    <span style={{
                      fontFamily: tokens.fonts.body,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: tokens.colors.red,
                    }}>
                      {formatCurrency(perdidos.reduce((s, l) => s + l.potencial_usd, 0))}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: tokens.spacing.lg, color: tokens.colors.textSecondary }}>
              Cargando datos...
            </div>
          ) : vendedores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: tokens.spacing.lg, color: tokens.colors.textSecondary }}>
              <p style={{ fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>Sin datos de vendedores</p>
            </div>
          ) : (
            <DataTable columns={vendedorColumns} data={vendedores} />
          )}
        </Card>
      )}
    </ModuleLayout>
  );
}
