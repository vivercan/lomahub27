// V3 (28/Abr/2026) — FichaCliente con radiografía total + historial 2022+
// JJ pidió: opción para ver historial de viajes y ventas por semana/mes/año
// desde 2022 + tendencia + radiografía total.
// Backend: RPC cliente_radiografia(uuid) devuelve totales + series + breakdowns.

import type { ReactElement } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { KPICard } from '../../components/ui/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Truck, MapPin, Activity, Calendar } from 'lucide-react';

interface Cliente {
  id: string;
  razon_social: string;
  rfc: string | null;
  tipo: string | null;
  empresa: string | null;
  ejecutivo_email: string | null;
  ejecutiva_cs: string | null;
  fecha_alta: string | null;
}

interface Totales {
  total_viajes: number;
  viajes_12m: number;
  viajes_6m: number;
  viajes_periodo: number;
  viajes_periodo_anterior: number;
  km_historico: number;
  primer_viaje: string | null;
  ultimo_viaje: string | null;
}

interface Radiografia {
  totales: Totales;
  por_anio: { anio: number; viajes: number; km_total: number }[];
  por_mes: { mes: string; viajes: number; km_total: number }[];
  por_semana: { semana: string; viajes: number }[];
  por_tipo: { tipo: string; viajes: number }[];
  top_rutas: { origen: string; destino: string; viajes: number }[];
  ultimos_viajes: any[];
}

const fmtN = (n: number) => (n || 0).toLocaleString('en-US');
const fmtFecha = (iso: string | null) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }); }
  catch { return '—'; }
};

const COLORES_TIPO: Record<string, string> = {
  IMPO: '#3B82F6',
  EXPO: '#10B981',
  NAC: '#F59E0B',
  DEDICADO: '#8B5CF6',
  VACIO: '#6B7280',
  OTROS: '#9CA3AF',
};

export default function FichaCliente(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [radio, setRadio] = useState<Radiografia | null>(null);
  const [loading, setLoading] = useState(true);
  const [granularidad, setGranularidad] = useState<'anio' | 'mes' | 'semana'>('mes');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        if (!id) { setLoading(false); return; }
        const [cliRes, radioRes] = await Promise.all([
          supabase.from('clientes').select('*').eq('id', id).single(),
          supabase.rpc('cliente_radiografia', { p_cliente_id: id }),
        ]);
        if (cliRes.data) setCliente(cliRes.data as Cliente);
        if (radioRes.data) setRadio(radioRes.data as Radiografia);
      } catch (e) {
        console.error('FichaCliente:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const tendencia = useMemo(() => {
    if (!radio?.totales) return { pct: 0, tipo: 'estable' as const };
    const { viajes_periodo, viajes_periodo_anterior } = radio.totales;
    if (viajes_periodo_anterior === 0) return { pct: viajes_periodo > 0 ? 100 : 0, tipo: 'alza' as const };
    const pct = Math.round(((viajes_periodo - viajes_periodo_anterior) / viajes_periodo_anterior) * 100);
    return { pct, tipo: pct > 5 ? 'alza' as const : pct < -5 ? 'baja' as const : 'estable' as const };
  }, [radio]);

  const serieData = useMemo(() => {
    if (!radio) return [];
    if (granularidad === 'anio') return radio.por_anio.map(d => ({ label: String(d.anio), viajes: d.viajes }));
    if (granularidad === 'mes') return radio.por_mes.map(d => ({ label: d.mes, viajes: d.viajes }));
    return radio.por_semana.map(d => ({ label: d.semana.slice(5), viajes: d.viajes }));
  }, [radio, granularidad]);

  if (loading) {
    return <ModuleLayout titulo="Cliente"><Card><div style={{ padding: tokens.spacing.xl, textAlign: 'center', color: tokens.colors.textSecondary }}>Cargando radiografía…</div></Card></ModuleLayout>;
  }
  if (!cliente) {
    return <ModuleLayout titulo="Cliente"><Card><div style={{ padding: tokens.spacing.xl, textAlign: 'center' }}><p style={{ color: tokens.colors.textPrimary, fontSize: '18px' }}>Cliente no encontrado</p></div></Card></ModuleLayout>;
  }

  const t = radio?.totales;

  return (
    <ModuleLayout titulo={`Cliente — ${cliente.razon_social}`}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPICard titulo="Viajes históricos" valor={fmtN(t?.total_viajes || 0)} subtitulo={`Desde ${fmtFecha(t?.primer_viaje || null)}`} color="primary" icono={<Truck size={20} />} />
        <KPICard titulo="Últimos 12 meses" valor={fmtN(t?.viajes_12m || 0)} subtitulo={`Último: ${fmtFecha(t?.ultimo_viaje || null)}`} color="blue" icono={<Calendar size={20} />} />
        <KPICard
          titulo="Tendencia 6m vs anterior"
          valor={`${tendencia.pct > 0 ? '+' : ''}${tendencia.pct}%`}
          subtitulo={`${fmtN(t?.viajes_periodo || 0)} vs ${fmtN(t?.viajes_periodo_anterior || 0)}`}
          color={tendencia.tipo === 'alza' ? 'green' : tendencia.tipo === 'baja' ? 'red' : 'gray'}
          icono={tendencia.tipo === 'baja' ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
        />
        <KPICard titulo="KM acumulados 12m" valor={fmtN(Math.round(t?.km_historico || 0))} subtitulo="kilómetros recorridos" color="orange" icono={<Activity size={20} />} />
      </div>

      {/* Datos del cliente */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.lg, marginBottom: tokens.spacing.lg }}>
        <Card>
          <h3 style={{ margin: 0, marginBottom: tokens.spacing.md, color: tokens.colors.textPrimary, fontSize: '15px' }}>Datos del cliente</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: tokens.spacing.sm, fontSize: '13px' }}>
            <span style={{ color: tokens.colors.textSecondary }}>RFC</span>
            <span style={{ color: tokens.colors.textPrimary }}>{cliente.rfc || '—'}</span>
            <span style={{ color: tokens.colors.textSecondary }}>Tipo</span>
            <span>{cliente.tipo ? <Badge color={cliente.tipo === 'activo' ? 'green' : 'gray'}>{cliente.tipo}</Badge> : '—'}</span>
            <span style={{ color: tokens.colors.textSecondary }}>Empresa</span>
            <span style={{ color: tokens.colors.textPrimary, fontWeight: 600 }}>{(cliente.empresa || '—').toUpperCase()}</span>
            <span style={{ color: tokens.colors.textSecondary }}>Vendedor</span>
            <span style={{ color: tokens.colors.textPrimary }}>{cliente.ejecutivo_email || '—'}</span>
            <span style={{ color: tokens.colors.textSecondary }}>Fecha alta</span>
            <span style={{ color: tokens.colors.textPrimary }}>{fmtFecha(cliente.fecha_alta)}</span>
          </div>
        </Card>

        <Card>
          <h3 style={{ margin: 0, marginBottom: tokens.spacing.md, color: tokens.colors.textPrimary, fontSize: '15px' }}>Distribución por tipo (12m)</h3>
          {radio && radio.por_tipo.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={radio.por_tipo} dataKey="viajes" nameKey="tipo" cx="50%" cy="50%" outerRadius={70} label={(e: any) => `${e.tipo}: ${e.viajes}`}>
                  {radio.por_tipo.map((entry, idx) => (
                    <Cell key={idx} fill={COLORES_TIPO[entry.tipo] || '#9CA3AF'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: tokens.spacing.lg, color: tokens.colors.textMuted }}>Sin datos</div>
          )}
        </Card>
      </div>

      {/* Serie temporal con selector granularidad */}
      <Card style={{ marginBottom: tokens.spacing.lg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.md }}>
          <h3 style={{ margin: 0, color: tokens.colors.textPrimary, fontSize: '15px' }}>Historial de viajes</h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['semana', 'mes', 'anio'] as const).map(g => (
              <button key={g}
                onClick={() => setGranularidad(g)}
                style={{
                  padding: '6px 14px', borderRadius: tokens.radius.md,
                  border: `1px solid ${granularidad === g ? tokens.colors.primary : tokens.colors.border}`,
                  background: granularidad === g ? tokens.colors.primary : 'transparent',
                  color: granularidad === g ? '#FFFFFF' : tokens.colors.textPrimary,
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                {g === 'anio' ? 'Año (2022+)' : g === 'mes' ? 'Mes (24m)' : 'Semana (12s)'}
              </button>
            ))}
          </div>
        </div>
        {serieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={serieData}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="viajes" fill={tokens.colors.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textMuted }}>
            Sin viajes en el período
          </div>
        )}
      </Card>

      {/* Top rutas + últimos viajes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: tokens.spacing.lg }}>
        <Card>
          <h3 style={{ margin: 0, marginBottom: tokens.spacing.md, color: tokens.colors.textPrimary, fontSize: '15px' }}>
            <MapPin size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            Top 10 rutas (12m)
          </h3>
          {radio && radio.top_rutas.length > 0 ? (
            <DataTable
              columns={[
                { key: 'origen', label: 'Origen', render: (r: any) => <span style={{ fontSize: '12px' }}>{r.origen}</span> },
                { key: 'destino', label: 'Destino', render: (r: any) => <span style={{ fontSize: '12px' }}>{r.destino}</span> },
                { key: 'viajes', label: 'Viajes', align: 'right' as const, render: (r: any) => <span style={{ fontWeight: 700, color: tokens.colors.green }}>{r.viajes}</span> },
              ]}
              data={radio.top_rutas}
            />
          ) : <div style={{ color: tokens.colors.textMuted, padding: tokens.spacing.md }}>Sin datos</div>}
        </Card>

        <Card>
          <h3 style={{ margin: 0, marginBottom: tokens.spacing.md, color: tokens.colors.textPrimary, fontSize: '15px' }}>Últimos 30 viajes</h3>
          {radio && radio.ultimos_viajes.length > 0 ? (
            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <DataTable
                columns={[
                  { key: 'inicia_viaje', label: 'Fecha', render: (r: any) => <span style={{ fontSize: '11px' }}>{fmtFecha(r.inicia_viaje)}</span> },
                  { key: 'tipo', label: 'Tipo', render: (r: any) => <Badge color={r.tipo === 'IMPO' ? 'blue' : r.tipo === 'EXPO' ? 'green' : 'gray'}>{r.tipo}</Badge> },
                  { key: 'origen', label: 'Origen', render: (r: any) => <span style={{ fontSize: '11px' }}>{r.origen || '—'}</span> },
                  { key: 'destino', label: 'Destino', render: (r: any) => <span style={{ fontSize: '11px' }}>{r.destino || '—'}</span> },
                  { key: 'tracto', label: 'Tracto', render: (r: any) => <span style={{ fontSize: '11px', fontWeight: 600 }}>{r.tracto || '—'}</span> },
                  { key: 'kms_viaje', label: 'KM', align: 'right' as const, render: (r: any) => <span style={{ fontSize: '11px' }}>{fmtN(Math.round(r.kms_viaje || 0))}</span> },
                  { key: 'estado', label: 'Estado', render: (r: any) => r.llega_destino ? <Badge color="green">Entregado</Badge> : <Badge color="orange">En vuelo</Badge> },
                ]}
                data={radio.ultimos_viajes}
                onRowClick={(row: any) => navigate(`/operaciones/trazabilidad/${row.id}`)}
              />
            </div>
          ) : <div style={{ color: tokens.colors.textMuted, padding: tokens.spacing.md }}>Sin viajes</div>}
        </Card>
      </div>
    </ModuleLayout>
  );
}
