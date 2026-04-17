import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Card } from '../../components/ui/Card';
import { tokens } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

interface DedicadoRow {
  id: string;
  [key: string]: unknown;
}

const statusDot = (val: string): string => {
  const v = (val || '').toLowerCase();
  if (v === 'activo' || v === 'en_ruta' || v === 'en movimiento' || v === 'operando') return '#2D6A4F';
  if (v === 'detenido' || v === 'pausa' || v === 'standby' || v === 'inactivo') return '#92400E';
  if (v === 'sin_senal' || v === 'fuera_servicio' || v === 'baja') return '#991B1B';
  return '#4B5563';
};

const fmtVal = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '-';
  if (typeof v === 'number') return v.toLocaleString('es-MX');
  return String(v);
};

export default function Dedicados(): ReactElement {
  const [rows, setRows] = useState<DedicadoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [colKeys, setColKeys] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('formatos_venta')
          .select('*').eq('tipo_servicio', 'DEDICADO');
        if (error) throw error;
        const d = data || [];
        setRows(d);
        if (d.length > 0) {
          const skip = new Set(['id', 'created_at', 'updated_at', 'deleted_at']);
          const keys = Object.keys(d[0]).filter(k => !skip.has(k)).slice(0, 10);
          setColKeys(keys);
        }
      } catch (err) {
        console.error('Error:', err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const segmentos = [...new Set(rows.map(r => String(r.destino || r.tipo_servicio || '')).filter(Boolean))];

  const filtered = filtro === 'todos' ? rows : rows.filter(r => {
    const seg = String(r.destino || r.tipo_servicio || '');
    return seg === filtro;
  });

  const thStyle: React.CSSProperties = {
    padding: '10px 12px', textAlign: 'left', color: tokens.colors.textSecondary,
    fontWeight: 600, fontSize: '11px', textTransform: 'uppercase',
    letterSpacing: '0.05em', fontFamily: tokens.fonts.body, whiteSpace: 'nowrap',
  };
  const tdStyle: React.CSSProperties = {
    padding: '10px 12px', color: tokens.colors.textSecondary,
    fontSize: '13px', fontFamily: tokens.fonts.body, whiteSpace: 'nowrap',
  };

  const prettyLabel = (k: string): string =>
    k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <ModuleLayout titulo="Monitor Dedicados" moduloPadre={{ nombre: 'Operaciones', ruta: '/operaciones/dashboard' }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        {[
          { label: 'Rutas Dedicadas', value: rows.length, color: '#1E3A5F' },
          { label: 'Filtrados', value: filtered.length, color: '#2D6A4F' },
          { label: 'Clientes Únicos', value: segmentos.length, color: '#92400E' },
        ].map((kpi) => (
          <div key={kpi.label} style={{
            background: tokens.colors.bgCard, borderRadius: tokens.radius.lg,
            padding: tokens.spacing.md, borderLeft: `4px solid ${kpi.color}`,
          }}>
            <div style={{ fontSize: '12px', color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>{kpi.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, marginTop: '4px' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: tokens.spacing.md, marginBottom: tokens.spacing.md, alignItems: 'center' }}>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{
            background: tokens.colors.bgCard, color: tokens.colors.textPrimary,
            border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md,
            padding: '8px 12px', fontFamily: tokens.fonts.body, fontSize: '13px', minWidth: '220px',
          }}
        >
          <option value="todos">Todos los destinos</option>
          {segmentos.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', color: tokens.colors.textMuted, fontSize: '13px', fontFamily: tokens.fonts.body }}>
          {filtered.length} de {rows.length} registros
        </span>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textMuted }}>
            <p>Cargando segmentos dedicados...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: tokens.spacing.xl, color: tokens.colors.textMuted }}>
            <p style={{ fontSize: '16px', fontWeight: 500, margin: 0 }}>Sin rutas dedicadas</p>
            <p style={{ fontSize: '13px', marginTop: tokens.spacing.sm }}>Los datos se cargarán cuando estén disponibles</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${tokens.colors.border}` }}>
                  {colKeys.map(k => (
                    <th key={k} style={thStyle}>{prettyLabel(k)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <tr key={String(row.id || idx)} style={{ borderBottom: `1px solid ${tokens.colors.border}` }}>
                    {colKeys.map(k => {
                      const val = row[k];
                      const isStatus = k === 'estado' || k === 'status';
                      return (
                        <td key={k} style={tdStyle}>
                          {isStatus ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: statusDot(String(val || '')) }} />
                              {fmtVal(val)}
                            </span>
                          ) : (
                            <span style={{ color: k === 'cliente' || k === 'nombre' || k === 'razon_social' ? tokens.colors.textPrimary : tokens.colors.textSecondary, fontWeight: k === 'cliente' || k === 'nombre' || k === 'razon_social' ? 500 : 400 }}>
                              {fmtVal(val)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </ModuleLayout>
  );
}
