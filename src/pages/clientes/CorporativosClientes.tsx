import type { ReactElement } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import {
  Building2,
  GitBranch,
  Users,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Plus,
  Link2,
  Unlink,
  Search,
  X,
} from 'lucide-react';

/* ───────── types ───────── */
interface Cliente {
  id: string;
  razon_social: string;
  rfc: string;
  tipo: string;
  segmento: string;
  ejecutivo: string;
  empresa: string;
  corporativo_id: string | null;
  fecha_alta: string;
  ciudad: string | null;
  telefono: string | null;
  email: string | null;
}

interface CXCResumen {
  cliente_id: string;
  saldo_total: number;
  facturas_pendientes: number;
}

interface ViajeResumen {
  cliente_id: string;
  viajes_activos: number;
  viajes_total: number;
}

interface GrupoCorporativo {
  matriz: Cliente;
  subsidiarias: Cliente[];
  kpis: {
    totalEmpresas: number;
    viajesActivos: number;
    saldoCXC: number;
    facturasPendientes: number;
  };
}

/* ───────── styles ───────── */
const sCard: React.CSSProperties = {
  background: tokens.colors.bgCard,
  borderRadius: tokens.radius.lg,
  border: `1px solid ${tokens.colors.border}`,
  padding: tokens.spacing.lg,
};

const sBtn = (variant: 'primary' | 'ghost' = 'primary'): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: variant === 'primary' ? '9px 18px' : '6px 10px',
  borderRadius: tokens.radius.md,
  border: variant === 'primary' ? 'none' : `1px solid ${tokens.colors.border}`,
  background: variant === 'primary'
    ? `linear-gradient(180deg, #4A7AF0 0%, ${tokens.colors.primary} 50%, #2F5BC4 100%)`
    : 'linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)',
  color: variant === 'primary' ? '#fff' : tokens.colors.textSecondary,
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 600,
  fontFamily: tokens.fonts.heading,
  transition: 'all 0.18s ease',
  boxShadow: variant === 'primary'
    ? '0 2px 4px rgba(59,108,231,0.30), 0 6px 14px -3px rgba(59,108,231,0.25), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.18)'
    : '0 1px 3px rgba(0,0,0,0.10), 0 3px 8px -2px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.80), inset 0 -1px 0 rgba(0,0,0,0.05)',
  textShadow: variant === 'primary' ? '0 1px 2px rgba(0,0,0,0.20)' : 'none',
});

const sInput: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px 10px 38px',
  background: tokens.colors.bgMain,
  border: `1px solid ${tokens.colors.border}`,
  borderRadius: tokens.radius.md,
  color: tokens.colors.textPrimary,
  fontSize: '14px',
  fontFamily: tokens.fonts.body,
  outline: 'none',
};

/* ───────── component ───────── */
export default function CorporativosClientes(): ReactElement {
  const navigate = useNavigate();

  /* state */
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cxcMap, setCxcMap] = useState<Record<string, CXCResumen>>({});
  const [viajesMap, setViajesMap] = useState<Record<string, ViajeResumen>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  /* modal vincular */
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkMatrizId, setLinkMatrizId] = useState<string | null>(null);
  const [linkSearch, setLinkSearch] = useState('');
  const [corpMap, setCorpMap] = useState<Record<string, string>>({});

  /* ───── fetch ───── */
  useEffect(() => {
    const load = async () => {
      try {
        /* clientes */
        const { data: clientesData } = await supabase
          .from('clientes')
          .select('id,razon_social,rfc,tipo,segmento,ejecutivo_asignado,empresa,fecha_alta')
          .is('deleted_at', null)
          .order('razon_social');

        if (clientesData) setClientes(clientesData);

        /* cxc resumen */
        const { data: cxcData } = await supabase
          .from('cxc_cartera')
          .select('cliente_id,saldo_total,saldo_vencido');

        if (cxcData) {
          const map: Record<string, CXCResumen> = {};
          for (const row of cxcData) {
            map[row.cliente_id] = {
              cliente_id: row.cliente_id,
              saldo_total: row.saldo_total || 0,
              facturas_pendientes: 0,
            };
          }
          setCxcMap(map);
        }

        /* viajes resumen — viajes_anodos por nombre cliente (texto) */
        const desde90d = new Date(); desde90d.setDate(desde90d.getDate() - 90);
        const conteoPorNombre = new Map<string, { total: number; activos: number }>();
        let off = 0; const PAGE = 1000;
        while (true) {
          const { data: vData, error: vErr } = await supabase
            .from('viajes_anodos')
            .select('cliente, llega_destino, inicia_viaje')
            .gte('inicia_viaje', desde90d.toISOString())
            .neq('tipo', 'VACIO')
            .range(off, off + PAGE - 1);
          if (vErr || !vData || vData.length === 0) break;
          for (const v of vData) {
            const nombre = (v.cliente || '').trim().toUpperCase();
            if (!nombre) continue;
            const cur = conteoPorNombre.get(nombre) || { total: 0, activos: 0 };
            cur.total += 1;
            if (!v.llega_destino) cur.activos += 1;
            conteoPorNombre.set(nombre, cur);
          }
          if (vData.length < PAGE) break;
          off += PAGE;
        }
        if (clientesData && conteoPorNombre.size > 0) {
          const vmap: Record<string, ViajeResumen> = {};
          for (const cl of clientesData) {
            const key = (cl.razon_social || '').trim().toUpperCase();
            const conteo = conteoPorNombre.get(key);
            if (conteo) {
              vmap[cl.id] = { cliente_id: cl.id, viajes_total: conteo.total, viajes_activos: conteo.activos };
            }
          }
          setViajesMap(vmap);
        }

        /* corporativos — relación matriz↔subsidiaria */
        const { data: corpData } = await supabase
          .from('corporativos')
          .select('corporativo_id, subsidiaria_id');
        if (corpData) {
          const cmap: Record<string, string> = {};
          for (const row of corpData) {
            cmap[row.subsidiaria_id] = row.corporativo_id;
          }
          setCorpMap(cmap);
        }
      } catch (err) {
        console.error('Error loading corporativos:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ───── build groups ───── */
  const grupos: GrupoCorporativo[] = useMemo(() => {
    const matrices = clientes.filter(
      (c) => c.tipo === 'corporativo' || Object.values(corpMap).includes(c.id)
    );

    /* deduplicate — a corporativo is either tipo=corporativo OR has subsidiaries pointing to it */
    const matrizIds = new Set<string>();
    for (const c of clientes) {
      if (c.tipo === 'corporativo') matrizIds.add(c.id);
      if (corpMap[c.id]) matrizIds.add(corpMap[c.id]);
    }

    const result: GrupoCorporativo[] = [];
    for (const matrizId of matrizIds) {
      const matriz = clientes.find((c) => c.id === matrizId);
      if (!matriz) continue;

      const subIds = Object.entries(corpMap).filter(([,mid]) => mid === matrizId).map(([sid]) => sid);
      const subsidiarias = clientes.filter((c) => subIds.includes(c.id) && c.id !== matrizId);

      const allIds = [matrizId, ...subsidiarias.map((s) => s.id)];
      let viajesActivos = 0;
      let saldoCXC = 0;
      let facturasPendientes = 0;

      for (const cid of allIds) {
        viajesActivos += viajesMap[cid]?.viajes_activos || 0;
        saldoCXC += cxcMap[cid]?.saldo_total || 0;
        facturasPendientes += cxcMap[cid]?.facturas_pendientes || 0;
      }

      result.push({
        matriz,
        subsidiarias,
        kpis: {
          totalEmpresas: 1 + subsidiarias.length,
          viajesActivos,
          saldoCXC,
          facturasPendientes,
        },
      });
    }

    return result.sort((a, b) => b.kpis.totalEmpresas - a.kpis.totalEmpresas);
  }, [clientes, cxcMap, viajesMap]);

  /* ───── filtered ───── */
  const filtered = useMemo(() => {
    if (!search.trim()) return grupos;
    const q = search.toLowerCase();
    return grupos.filter(
      (g) =>
        g.matriz.razon_social.toLowerCase().includes(q) ||
        g.subsidiarias.some((s) => s.razon_social.toLowerCase().includes(q))
    );
  }, [grupos, search]);

  /* ───── global KPIs ───── */
  const globalKPIs = useMemo(() => {
    const totalGrupos = grupos.length;
    const totalSubsidiarias = grupos.reduce((sum, g) => sum + g.subsidiarias.length, 0);
    const totalViajes = grupos.reduce((sum, g) => sum + g.kpis.viajesActivos, 0);
    const totalCXC = grupos.reduce((sum, g) => sum + g.kpis.saldoCXC, 0);
    return { totalGrupos, totalSubsidiarias, totalViajes, totalCXC };
  }, [grupos]);

  /* ───── link / unlink ───── */
  const handleLink = async (subsidiariaId: string) => {
    if (!linkMatrizId) return;
    const { error } = await supabase
      .from('corporativos')
      .insert({ corporativo_id: linkMatrizId, subsidiaria_id: subsidiariaId });
    if (!error) {
      setCorpMap((prev) => ({ ...prev, [subsidiariaId]: linkMatrizId }));
      setShowLinkModal(false);
      setLinkSearch('');
    }
  };

  const handleUnlink = async (subsidiariaId: string) => {
    const { error } = await supabase
      .from('corporativos')
      .delete()
      .eq('subsidiaria_id', subsidiariaId);
    if (!error) {
      setCorpMap((prev) => {
        const next = { ...prev };
        delete next[subsidiariaId];
        return next;
      });
    }
  };

  /* ───── toggle expand ───── */
  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ───── candidates for linking ───── */
  const linkCandidates = useMemo(() => {
    if (!linkMatrizId) return [];
    const q = linkSearch.toLowerCase();
    return clientes.filter(
      (c) =>
        c.id !== linkMatrizId &&
        !corpMap[c.id] &&
        c.tipo !== 'corporativo' &&
        (c.razon_social.toLowerCase().includes(q) || (c.rfc && c.rfc.toLowerCase().includes(q)))
    );
  }, [clientes, linkMatrizId, linkSearch]);

  /* ───── format $ ───── */
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}K`
        : `$${n.toFixed(0)}`;

  /* ───── render ───── */
  if (loading) {
    return (
      <ModuleLayout titulo="Clientes Corporativos">
        <Card>
          <div style={{ textAlign: 'center', padding: tokens.spacing.xl }}>
            <p style={{ color: tokens.colors.textSecondary }}>Cargando grupos corporativos...</p>
          </div>
        </Card>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout titulo="Clientes Corporativos — Subsidiarias">
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="Grupos Corporativos" valor={String(globalKPIs.totalGrupos)} color="primary" icono={<Building2 size={20} />} />
        <KPICard titulo="Subsidiarias" valor={String(globalKPIs.totalSubsidiarias)} color="blue" icono={<GitBranch size={20} />} />
        <KPICard titulo="Viajes Activos" valor={String(globalKPIs.totalViajes)} color="green" icono={<TrendingUp size={20} />} />
        <KPICard titulo="Saldo CXC Consolidado" valor={fmt(globalKPIs.totalCXC)} color="red" icono={<DollarSign size={20} />} />
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: tokens.spacing.lg, maxWidth: 400 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: tokens.colors.textMuted }} />
        <input
          style={sInput}
          placeholder="Buscar grupo o subsidiaria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Groups */}
      {filtered.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: tokens.spacing.xl }}>
            <Building2 size={48} style={{ color: tokens.colors.textMuted, marginBottom: tokens.spacing.md }} />
            <p style={{ color: tokens.colors.textPrimary, fontSize: '16px', fontWeight: 600, fontFamily: tokens.fonts.heading }}>
              Sin grupos corporativos
            </p>
            <p style={{ color: tokens.colors.textSecondary, marginTop: tokens.spacing.sm, fontSize: '14px' }}>
              {clientes.length > 0
                ? 'Marca un cliente como tipo "corporativo" y vincula subsidiarias con el botón +'
                : 'Vincula clientes como subsidiarias para crear grupos corporativos'}
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
          {filtered.map((grupo) => {
            const expanded = expandedGroups.has(grupo.matriz.id);
            return (
              <div key={grupo.matriz.id} style={sCard}>
                {/* Header row */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md, cursor: 'pointer' }}
                  onClick={() => toggleGroup(grupo.matriz.id)}
                >
                  {expanded ? (
                    <ChevronDown size={20} style={{ color: tokens.colors.primary }} />
                  ) : (
                    <ChevronRight size={20} style={{ color: tokens.colors.textMuted }} />
                  )}
                  <Building2 size={22} style={{ color: tokens.colors.primary }} />
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        color: tokens.colors.textPrimary,
                        fontSize: '16px',
                        fontWeight: 700,
                        fontFamily: tokens.fonts.heading,
                        cursor: 'pointer',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/clientes/${grupo.matriz.id}`);
                      }}
                    >
                      {grupo.matriz.razon_social}
                    </span>
                    <span style={{ color: tokens.colors.textMuted, fontSize: '13px', marginLeft: 12 }}>
                      {grupo.matriz.rfc}
                    </span>
                  </div>

                  {/* Mini KPIs */}
                  <div style={{ display: 'flex', gap: tokens.spacing.lg, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: tokens.colors.primary, fontSize: '18px', fontWeight: 700, fontFamily: tokens.fonts.heading }}>
                        {grupo.kpis.totalEmpresas}
                      </div>
                      <div style={{ color: tokens.colors.textMuted, fontSize: '11px' }}>empresas</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: tokens.colors.green, fontSize: '18px', fontWeight: 700, fontFamily: tokens.fonts.heading }}>
                        {grupo.kpis.viajesActivos}
                      </div>
                      <div style={{ color: tokens.colors.textMuted, fontSize: '11px' }}>viajes</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: tokens.colors.red, fontSize: '18px', fontWeight: 700, fontFamily: tokens.fonts.heading }}>
                        {fmt(grupo.kpis.saldoCXC)}
                      </div>
                      <div style={{ color: tokens.colors.textMuted, fontSize: '11px' }}>CXC</div>
                    </div>
                  </div>

                  {/* Add subsidiaria button */}
                  <button
                    style={sBtn('ghost')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLinkMatrizId(grupo.matriz.id);
                      setShowLinkModal(true);
                    }}
                    title="Vincular subsidiaria"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Expanded: subsidiaries table */}
                {expanded && (
                  <div style={{ marginTop: tokens.spacing.md, paddingLeft: 42 }}>
                    {grupo.subsidiarias.length === 0 ? (
                      <p style={{ color: tokens.colors.textMuted, fontSize: '13px', fontStyle: 'italic' }}>
                        Sin subsidiarias vinculadas — usa el botón + para agregar
                      </p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              {['Razón Social', 'RFC', 'Tipo', 'Ejecutivo', 'Ciudad', 'Viajes', 'CXC', ''].map((h) => (
                                <th
                                  key={h}
                                  style={{
                                    textAlign: 'left',
                                    padding: '8px 12px',
                                    color: tokens.colors.textMuted,
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    borderBottom: `1px solid ${tokens.colors.border}`,
                                    fontFamily: tokens.fonts.heading,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {grupo.subsidiarias.map((sub) => (
                              <tr
                                key={sub.id}
                                style={{ borderBottom: `1px solid ${tokens.colors.border}` }}
                              >
                                <td style={{ padding: '10px 12px' }}>
                                  <span
                                    style={{ color: tokens.colors.primary, cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
                                    onClick={() => navigate(`/clientes/${sub.id}`)}
                                  >
                                    {sub.razon_social}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 12px', color: tokens.colors.textSecondary, fontSize: '13px' }}>
                                  {sub.rfc || '—'}
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                  <Badge color={sub.tipo === 'activo' ? 'green' : sub.tipo === 'estrategico' ? 'blue' : 'gray'}>
                                    {sub.tipo}
                                  </Badge>
                                </td>
                                <td style={{ padding: '10px 12px', color: tokens.colors.textSecondary, fontSize: '13px' }}>
                                  {sub.ejecutivo || '—'}
                                </td>
                                <td style={{ padding: '10px 12px', color: tokens.colors.textSecondary, fontSize: '13px' }}>
                                  {sub.ciudad || '—'}
                                </td>
                                <td style={{ padding: '10px 12px', color: tokens.colors.green, fontWeight: 600, fontSize: '14px' }}>
                                  {viajesMap[sub.id]?.viajes_activos || 0}
                                </td>
                                <td style={{ padding: '10px 12px', color: tokens.colors.red, fontWeight: 600, fontSize: '14px' }}>
                                  {fmt(cxcMap[sub.id]?.saldo_total || 0)}
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                  <button
                                    style={sBtn('ghost')}
                                    onClick={() => handleUnlink(sub.id)}
                                    title="Desvincular subsidiaria"
                                  >
                                    <Unlink size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ───── Link Modal ───── */}
      {showLinkModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => {
            setShowLinkModal(false);
            setLinkSearch('');
          }}
        >
          <div
            style={{
              background: tokens.colors.bgCard,
              borderRadius: tokens.radius.lg,
              border: `1px solid ${tokens.colors.border}`,
              padding: tokens.spacing.lg,
              width: 520,
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.md }}>
              <h3 style={{ margin: 0, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, fontSize: '16px' }}>
                Vincular Subsidiaria
              </h3>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.colors.textMuted }}
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkSearch('');
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ position: 'relative', marginBottom: tokens.spacing.md }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: tokens.colors.textMuted }} />
              <input
                style={sInput}
                placeholder="Buscar por razón social o RFC..."
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 350 }}>
              {linkCandidates.length === 0 ? (
                <p style={{ color: tokens.colors.textMuted, textAlign: 'center', padding: tokens.spacing.lg, fontSize: '14px' }}>
                  {linkSearch ? 'Sin resultados' : 'Todos los clientes ya están vinculados'}
                </p>
              ) : (
                linkCandidates.slice(0, 20).map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderBottom: `1px solid ${tokens.colors.border}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => handleLink(c.id)}
                  >
                    <div>
                      <div style={{ color: tokens.colors.textPrimary, fontWeight: 600, fontSize: '14px' }}>
                        {c.razon_social}
                      </div>
                      <div style={{ color: tokens.colors.textMuted, fontSize: '12px' }}>
                        {c.rfc} · {c.tipo} · {c.ejecutivo_asignado || 'Sin ejecutivo'}
                      </div>
                    </div>
                    <Link2 size={16} style={{ color: tokens.colors.primary }} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </ModuleLayout>
  );
}
