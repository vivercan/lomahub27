import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { tokens } from '../../lib/tokens';
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import { Save, Plus, Trash2, DollarSign, Truck, Ship, MapPin } from 'lucide-react';

/* âââââââââ types âââââââââ */
interface Tarifa {
  id?: string;
  categoria: string;
  concepto: string;
  unidad: string;
  valor: number;
  moneda: string;
  notas: string;
}

const CATEGORIAS = [
  { key: 'km_mexico', label: 'Costo por Kilómetro (México)', icon: Truck, color: '#3B6CE7' },
  { key: 'milla_usa', label: 'Costo por Milla (USA)', icon: Truck, color: '#0D9668' },
  { key: 'cruces', label: 'Cruces Fronterizos', icon: MapPin, color: '#F59E0B' },
  { key: 'accesoriales', label: 'Accesoriales', icon: DollarSign, color: '#8B5CF6' },
  { key: 'importacion', label: 'Importación', icon: Ship, color: '#C53030' },
  { key: 'exportacion', label: 'Exportación', icon: Ship, color: '#06B6D4' },
];

const DEFAULT_TARIFAS: Tarifa[] = [
  { categoria: 'km_mexico', concepto: 'Full Truck Load (FTL)', unidad: 'MXN/km', valor: 0, moneda: 'MXN', notas: '' },
  { categoria: 'km_mexico', concepto: 'Less Than Truckload (LTL)', unidad: 'MXN/km', valor: 0, moneda: 'MXN', notas: '' },
  { categoria: 'km_mexico', concepto: 'Dedicado', unidad: 'MXN/km', valor: 0, moneda: 'MXN', notas: '' },
  { categoria: 'milla_usa', concepto: 'FTL Interstate', unidad: 'USD/mi', valor: 0, moneda: 'USD', notas: '' },
  { categoria: 'milla_usa', concepto: 'LTL Interstate', unidad: 'USD/mi', valor: 0, moneda: 'USD', notas: '' },
  { categoria: 'milla_usa', concepto: 'Drayage', unidad: 'USD/mi', valor: 0, moneda: 'USD', notas: '' },
  { categoria: 'cruces', concepto: 'Cruce Laredo', unidad: 'USD', valor: 0, moneda: 'USD', notas: '' },
  { categoria: 'cruces', concepto: 'Cruce El Paso', unidad: 'USD', valor: 0, moneda: 'USD', notas: '' },
  { categoria: 'cruces', concepto: 'Cruce Nogales', unidad: 'USD', valor: 0, moneda: 'USD', notas: '' },
  { categoria: 'cruces', concepto: 'Cruce Otay/Tijuana', unidad: 'USD', valor: 0, moneda: 'USD', notas: '' },
  { categoria: 'accesoriales', concepto: 'Estadía (por hora)', unidad: 'MXN/hr', valor: 0, moneda: 'MXN', notas: '' },
  { categoria: 'accesoriales', concepto: 'Maniobras carga/descarga', unidad: 'MXN', valor: 0, moneda: 'MXN', notas: '' },
  { categoria: 'accesoriales', concepto: 'Stop-off adicional', unidad: 'MXN', valor: 0, moneda: 'MXN', notas: '' },
  { categoria: 'accesoriales', concepto: 'Seguro de carga', unidad: '% valor', valor: 0, moneda: 'MXN', notas: '' },
  { categoria: 'importacion', concepto: 'Pedimento aduanal', unidad: 'MXN', valor: 0, moneda: 'MXN', notas: '' },
  { categoria: 'importacion', concepto: 'Previo en aduana', unidad: 'MXN', valor: 0, moneda: 'MXN', notas: '' },
  { categoria: 'exportacion', concepto: 'Despacho aduanal EXPO', unidad: 'USD', valor: 0, moneda: 'USD', notas: '' },
  { categoria: 'exportacion', concepto: 'Certificado de origen', unidad: 'USD', valor: 0, moneda: 'USD', notas: '' },
];

/* âââââââââ component âââââââââ */
export default function ParametrosConfig() {
  const [tarifas, setTarifas] = useState<Tarifa[]>(DEFAULT_TARIFAS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('km_mexico');

  useEffect(() => {
    const loadTarifas = async () => {
      try {
        const { data } = await supabase
          .from('parametros_tarifas')
          .select('*')
          .is('deleted_at', null)
          .order('categoria');
        if (data && data.length > 0) setTarifas(data as Tarifa[]);
      } catch (err) {
        console.log('Using defaults — table may not exist yet:', err);
      }
    };
    loadTarifas();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const t of tarifas) {
        if (t.id) {
          await supabase.from('parametros_tarifas').update({
            valor: t.valor, notas: t.notas
          }).eq('id', t.id);
        } else {
          await supabase.from('parametros_tarifas').insert(t);
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Save error:', err);
    }
    setSaving(false);
  };

  const updateTarifa = (idx: number, field: keyof Tarifa, value: string | number) => {
    setTarifas(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const filteredTarifas = tarifas
    .map((t, idx) => ({ ...t, _idx: idx }))
    .filter(t => t.categoria === activeTab);

  const activeCat = CATEGORIAS.find(c => c.key === activeTab);

  /* âââââââââ styles âââââââââ */
  const S = {
    container: {
      minHeight: '100vh',
      background: tokens.colors.bgMain,
    } as React.CSSProperties,
    header: {
      padding: '32px 48px 0',
    } as React.CSSProperties,
    title: {
      fontFamily: tokens.fonts.heading,
      fontSize: '26px',
      fontWeight: 700,
      color: tokens.colors.textPrimary,
      margin: 0,
    } as React.CSSProperties,
    subtitle: {
      fontFamily: tokens.fonts.body,
      fontSize: '14px',
      color: tokens.colors.textSecondary,
      margin: '6px 0 0',
    } as React.CSSProperties,
    tabs: {
      display: 'flex',
      gap: '8px',
      padding: '24px 48px 0',
      flexWrap: 'wrap' as const,
    } as React.CSSProperties,
    tab: (isActive: boolean, color: string) => ({
      fontFamily: tokens.fonts.body,
      fontSize: '13px',
      fontWeight: isActive ? 600 : 400,
      color: isActive ? '#FFFFFF' : tokens.colors.textSecondary,
      background: isActive ? color : tokens.colors.bgCard,
      border: isActive ? 'none' : tokens.effects.glassmorphism.border,
      borderRadius: '10px',
      padding: '10px 18px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: isActive ? `0 2px 8px ${color}40` : 'none',
    }),
    tableWrap: {
      padding: '24px 48px',
    } as React.CSSProperties,
    table: {
      width: '100%',
      background: tokens.colors.bgCard,
      borderRadius: '16px',
      border: tokens.effects.glassmorphism.border,
      boxShadow: tokens.effects.cardShadow,
      overflow: 'hidden',
    } as React.CSSProperties,
    th: {
      fontFamily: tokens.fonts.heading,
      fontSize: '12px',
      fontWeight: 600,
      color: tokens.colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      padding: '14px 16px',
      textAlign: 'left' as const,
      borderBottom: `1px solid ${tokens.colors.border}`,
      background: tokens.colors.bgHover,
    } as React.CSSProperties,
    td: {
      fontFamily: tokens.fonts.body,
      fontSize: '14px',
      color: tokens.colors.textPrimary,
      padding: '12px 16px',
      borderBottom: `1px solid ${tokens.colors.border}`,
    } as React.CSSProperties,
    input: {
      fontFamily: tokens.fonts.body,
      fontSize: '14px',
      color: tokens.colors.textPrimary,
      background: tokens.colors.bgMain,
      border: `1px solid ${tokens.colors.border}`,
      borderRadius: '8px',
      padding: '8px 12px',
      width: '100%',
      outline: 'none',
      transition: 'border 0.2s',
    } as React.CSSProperties,
    numInput: {
      fontFamily: tokens.fonts.body,
      fontSize: '14px',
      fontWeight: 600,
      color: tokens.colors.textPrimary,
      background: tokens.colors.bgMain,
      border: `1px solid ${tokens.colors.border}`,
      borderRadius: '8px',
      padding: '8px 12px',
      width: '120px',
      textAlign: 'right' as const,
      outline: 'none',
    } as React.CSSProperties,
    saveBtn: {
      fontFamily: tokens.fonts.heading,
      fontSize: '14px',
      fontWeight: 600,
      color: '#FFFFFF',
      background: saved ? '#0D9668' : tokens.colors.primary,
      border: 'none',
      borderRadius: '12px',
      padding: '12px 28px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      marginLeft: 'auto',
    } as React.CSSProperties,
    actions: {
      display: 'flex',
      padding: '0 48px 32px',
      justifyContent: 'flex-end',
    } as React.CSSProperties,
  };

  return (
    <ModuleLayout titulo="Parámetros" moduloPadre={{ nombre: 'Configuración', ruta: '/admin/configuracion' }}>
      <div style={S.container}>
        <div style={S.header}>
          <h1 style={S.title}>Parámetros de Cotización</h1>
          <p style={S.subtitle}>Tarifas base por km/milla, costos de cruce fronterizo y accesoriales para el módulo de cotización</p>
        </div>

        <div style={S.tabs}>
          {CATEGORIAS.map(cat => (
            <button
              key={cat.key}
              style={S.tab(activeTab === cat.key, cat.color)}
              onClick={() => setActiveTab(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div style={S.tableWrap}>
          <table style={S.table} cellSpacing={0}>
            <thead>
              <tr>
                <th style={S.th}>Concepto</th>
                <th style={S.th}>Unidad</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Valor</th>
                <th style={S.th}>Moneda</th>
                <th style={S.th}>Notas</th>
              </tr>
            </thead>
            <tbody>
              {filteredTarifas.map((t) => (
                <tr key={t._idx}>
                  <td style={S.td}>{t.concepto}</td>
                  <td style={{ ...S.td, color: tokens.colors.textMuted, fontSize: '13px' }}>{t.unidad}</td>
                  <td style={{ ...S.td, textAlign: 'right' }}>
                    <input
                      type="number"
                      style={S.numInput}
                      value={t.valor || ''}
                      onChange={(e) => updateTarifa(t._idx, 'valor', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </td>
                  <td style={{ ...S.td, fontWeight: 600, fontSize: '13px' }}>{t.moneda}</td>
                  <td style={S.td}>
                    <input
                      type="text"
                      style={S.input}
                      value={t.notas}
                      onChange={(e) => updateTarifa(t._idx, 'notas', e.target.value)}
                      placeholder="Notas..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={S.actions}>
          <button style={S.saveBtn} onClick={handleSave} disabled={saving}>
            <Save size={16} />
            {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </ModuleLayout>
  );
}
