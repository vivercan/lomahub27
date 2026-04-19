import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthContext } from '../../hooks/AuthContext';

interface Lead {
  id: string;
  empresa: string;
  estado: string;
  potencial_usd: number;
  responsable: string;
  ejecutivo_nombre: string;
  ejecutivo_id: string;
  segmento: string;
  created_at: string;
}

interface Ejecutivo {
  id: string;
  nombre: string;
}

type VistaActiva = 'funnel' | 'vendedor';
type FilterMode = 'individual' | 'agrupado';

const ETAPAS_ORDEN = [
  'Nuevo',
  'Contactado',
  'Cotizado',
  'Negociación',
  'Cerrado Ganado',
  'Cerrado Perdido',
];

const etapaColores: Record<string, string> = {
  'Nuevo': tokens.colors.blue,
  'Contactado': '#8B5CF6',
  'Cotizado': tokens.colors.yellow,
  'Negociación': tokens.colors.orange2,
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
  const { user } = useAuthContext();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('funnel');
  const [ejecutivos, setEjecutivos] = useState<Ejecutivo[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>('individual');
  const [selectedVendedor, setSelectedVendedor] = useState<string>('todos');
  const [selectedVendedores, setSelectedVendedores] = useState<Set<string>>(new Set());
  const [showVendedorDropdown, setShowVendedorDropdown] = useState(false);
  const vendedorDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (vendedorDropdownRef.current && !vendedorDropdownRef.current.contains(e.target as Node)) {
        setShowVendedorDropdown(false);
      }
    };
    if (showVendedorDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showVendedorDropdown]);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        let query = supabase.from('leads').select('*');

        // Permission logic: if vendedor role, filter by their leads
        if (user?.rol === 'ventas' && user?.id) {
          query = query.eq('ejecutivo_id', user.id);
        }

        const { data, error } = await query.order('fecha_creacion', { ascending: false });

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
            ejecutivo_nombre: l.ejecutivo_nombre || 'Sin asignar',
            ejecutivo_id: l.ejecutivo_id || '',
            segmento: l.segmento || 'General',
            created_at: l.fecha_creacion || '',
          })));
        }

        // Fetch ejecutivos for the filter dropdown
        const { data: usuariosData } = await supabase
          .from('usuarios_autorizados')
          .select('id, nombre, email, rol')
          .eq('activo', true)
          .in('rol', ['ventas', 'superadmin'])
          .order('nombre', { ascending: true });

        const parsed = (usuariosData || []).map((u: any) => ({
          id: u.id,
          nombre: u.nombre && u.nombre.trim()
            ? u.nombre
            : (u.email ? u.email.split('@')[0].split(/[._-]/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Sin nombre'),
        }));
        setEjecutivos(parsed);
      } catch (err) {
        console.error('Unexpected error:', err);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, [user?.rol, user?.id]);

  // Filter leads based on selected vendedor filter
  const filteredLeads = useMemo(() => {
    if (user?.rol === 'ventas') {
      // Vendedor can only see their own leads
      return leads;
    }

    // Admin/superadmin can filter
    if (filterMode === 'individual') {
      if (selectedVendedor === 'todos') {
        return leads;
      }
      return leads.filter((l) => l.ejecutivo_id === selectedVendedor);
    } else {
      // agrupado mode
      if (selectedVendedores.size === 0) {
        return leads;
      }
      return leads.filter((l) => selectedVendedores.has(l.ejecutivo_id));
    }
  }, [leads, filterMode, selectedVendedor, selectedVendedores, user?.rol]);

  const etapas = useMemo(() => {
    const activos = ETAPAS_ORDEN.filter((e) => e !== 'Cerrado Perdido');
    return activos.map((etapa, idx) => {
      const leadsEtapa = filteredLeads.filter((l) => l.estado === etapa);
      const count = leadsEtapa.length;
      const potencial = leadsEtapa.reduce((s, l) => s + l.potencial_usd, 0);

      // Calculate conversion rate to next stage
      let conversionRate: number | null = null;
      if (idx < activos.length - 1) {
        const nextStageName = activos[idx + 1];
        const leadsInNextStage = filteredLeads.filter((l) => l.estado === nextStageName);
        if (count > 0) {
          conversionRate = (leadsInNextStage.length / count) * 100;
        }
      }

      return { etapa, count, potencial, conversionRate };
    });
  }, [filteredLeads]);

  const perdidos = useMemo(() => filteredLeads.filter((l) => l.estado === 'Cerrado Perdido'), [filteredLeads]);

  // KPI calculations based on filtered leads
  const totalLeads = filteredLeads.length;
  const totalPotencial = useMemo(() => filteredLeads.reduce((s, l) => s + l.potencial_usd, 0), [filteredLeads]);
  const ganados = useMemo(() => filteredLeads.filter((l) => l.estado === 'Cerrado Ganado'), [filteredLeads]);
  const tasaConversion = totalLeads > 0 ? ((ganados.length / totalLeads) * 100).toFixed(1) : '0';
  const potencialActivo = useMemo(() =>
    filteredLeads.filter((l) => l.estado !== 'Cerrado Perdido' && l.estado !== 'Cerrado Ganado')
      .reduce((s, l) => s + l.potencial_usd, 0),
    [filteredLeads]
  );

  const ticketPromedio = totalLeads > 0 ? totalPotencial / totalLeads : 0;
  const cotizados = useMemo(() => filteredLeads.filter((l) => l.estado === 'Cotizado'), [filteredLeads]);

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

  // Toggle vendedor selection in agrupado mode
  const toggleVendedor = (vendedorId: string) => {
    const newSelection = new Set(selectedVendedores);
    if (newSelection.has(vendedorId)) {
      newSelection.delete(vendedorId);
    } else {
      newSelection.add(vendedorId);
    }
    setSelectedVendedores(newSelection);
  };

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
      label: 'Conversión',
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
    <ModuleLayout titulo="Comercial — Funnel de Ventas" moduloPadre={{ nombre: 'Comercial', ruta: '/ventas/dashboard' }}>
      {/* Vendedor Filter - only show for admin/superadmin */}
      {(user?.rol === 'superadmin' || user?.rol === 'admin') && (
        <div style={{
          marginBottom: tokens.spacing.md,
          display: 'flex',
          gap: tokens.spacing.sm,
          alignItems: 'center',
        }}>
          <div ref={vendedorDropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowVendedorDropdown(!showVendedorDropdown)}
              style={{
                padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.colors.borderLight}`,
                background: tokens.colors.bgCard,
                color: tokens.colors.textPrimary,
                fontSize: '0.85rem',
                fontWeight: 600,
                fontFamily: tokens.fonts.body,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing.xs,
              }}
            >
              {filterMode === 'individual'
                ? (selectedVendedor === 'todos' ? 'Todos los vendedores' : ejecutivos.find(e => e.id === selectedVendedor)?.nombre || 'Seleccionar')
                : `${selectedVendedores.size} vendedores`}
              <ChevronDown size={16} />
            </button>

            {showVendedorDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: tokens.spacing.xs,
                background: tokens.colors.bgCard,
                border: `1px solid ${tokens.colors.borderLight}`,
                borderRadius: tokens.radius.md,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '240px',
                maxHeight: '320px',
                overflowY: 'auto',
              }}>
                {/* Mode selector */}
                <div style={{
                  padding: tokens.spacing.sm,
                  borderBottom: `1px solid ${tokens.colors.borderLight}`,
                  display: 'flex',
                  gap: tokens.spacing.xs,
                }}>
                  <button
                    onClick={() => {
                      setFilterMode('individual');
                      setSelectedVendedores(new Set());
                    }}
                    style={{
                      flex: 1,
                      padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                      borderRadius: tokens.radius.sm,
                      border: 'none',
                      background: filterMode === 'individual' ? tokens.colors.primary : tokens.colors.bgInput,
                      color: filterMode === 'individual' ? '#fff' : tokens.colors.textSecondary,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: tokens.fonts.body,
                    }}
                  >
                    Individual
                  </button>
                  <button
                    onClick={() => {
                      setFilterMode('agrupado');
                      setSelectedVendedor('todos');
                    }}
                    style={{
                      flex: 1,
                      padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                      borderRadius: tokens.radius.sm,
                      border: 'none',
                      background: filterMode === 'agrupado' ? tokens.colors.primary : tokens.colors.bgInput,
                      color: filterMode === 'agrupado' ? '#fff' : tokens.colors.textSecondary,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: tokens.fonts.body,
                    }}
                  >
                    Agrupado
                  </button>
                </div>

                {filterMode === 'individual' ? (
                  <>
                    <button
                      onClick={() => {
                        setSelectedVendedor('todos');
                        setShowVendedorDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                        border: 'none',
                        background: selectedVendedor === 'todos' ? `${tokens.colors.primary}20` : 'transparent',
                        color: selectedVendedor === 'todos' ? tokens.colors.primary : tokens.colors.textPrimary,
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: selectedVendedor === 'todos' ? 600 : 400,
                        fontFamily: tokens.fonts.body,
                      }}
                    >
                      Todos los vendedores
                    </button>
                    {ejecutivos.map((ej) => (
                      <button
                        key={ej.id}
                        onClick={() => {
                          setSelectedVendedor(ej.id);
                          setShowVendedorDropdown(false);
                        }}
                        style={{
                          width: '100%',
                          padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                          border: 'none',
                          background: selectedVendedor === ej.id ? `${tokens.colors.primary}20` : 'transparent',
                          color: selectedVendedor === ej.id ? tokens.colors.primary : tokens.colors.textPrimary,
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: selectedVendedor === ej.id ? 600 : 400,
                          fontFamily: tokens.fonts.body,
                        }}
                      >
                        {ej.nombre}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {ejecutivos.map((ej) => (
                      <div
                        key={ej.id}
                        style={{
                          padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                          borderBottom: `1px solid ${tokens.colors.borderLight}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: tokens.spacing.sm,
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleVendedor(ej.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedVendedores.has(ej.id)}
                          onChange={() => { }}
                          style={{
                            cursor: 'pointer',
                            width: '16px',
                            height: '16px',
                            accentColor: tokens.colors.primary,
                          }}
                        />
                        <span style={{
                          fontSize: '0.85rem',
                          fontFamily: tokens.fonts.body,
                          color: tokens.colors.textPrimary,
                        }}>
                          {ej.nombre}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: tokens.spacing.md,
        marginBottom: tokens.spacing.md,
      }}>
        <KPICard titulo="Pipeline Total" valor={formatCurrency(totalPotencial)} color="primary" />
        <KPICard titulo="Leads Activos" valor={String(totalLeads)} color="blue" />
        <KPICard titulo="Tasa Conversión" valor={`${tasaConversion}%`} color={Number(tasaConversion) >= 20 ? 'green' : Number(tasaConversion) >= 10 ? 'yellow' : 'red'} />
        <KPICard titulo="Ticket Promedio" valor={formatCurrency(ticketPromedio)} color="yellow" />
        <KPICard titulo="Cotizaciones" valor={String(cotizados.length)} color="orange" />
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
              Embudo de Conversión
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

                      {/* Potencial + metrics */}
                      <div style={{
                        width: '220px',
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
                        <div style={{
                          display: 'flex',
                          gap: tokens.spacing.sm,
                          fontSize: '0.72rem',
                          fontWeight: 500,
                        }}>
                          {dropoff && Number(dropoff) > 0 && (
                            <span style={{ color: tokens.colors.red }}>
                              ↓ {dropoff}%
                            </span>
                          )}
                          {item.conversionRate !== null && (
                            <span style={{ color: tokens.colors.green }}>
                              → {item.conversionRate.toFixed(0)}%
                            </span>
                          )}
                        </div>
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
