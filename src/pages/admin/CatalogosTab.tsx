import { tokens } from '../../lib/tokens'
import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/ui/Toast'
import { ModuleLayout } from '../../components/layout/ModuleLayout';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Building2,
  Layers,
  MapPin,
  Truck,
  Container,
  Users,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Headphones,
  BadgeDollarSign,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────── */

interface ColumnDef {
  key: string;
  label: string;
  type?: 'text' | 'select' | 'boolean' | 'number';
  options?: string[];
  required?: boolean;
  editable?: boolean;
  width?: string;
}

interface CatalogConfig {
  key: string;
  table: string;
  title: string;
  icon: FC<{ size?: number; className?: string }>;
  description: string;
  columns: ColumnDef[];
  defaultSort?: string;
  color: string;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

/* ─── Catalog Configurations ─────────────────────────────── */

const CATALOGS: CatalogConfig[] = [
  {
    key: 'empresas',
    table: 'empresas',
    title: 'Empresas',
    icon: Building2,
    description: 'TROB, WExpress, SpeedyHaul, TROB USA',
    color: '#3B6CE7',
    columns: [
      { key: 'nombre', label: 'Nombre', type: 'text', required: true, editable: true },
      { key: 'codigo', label: 'Código', type: 'text', required: true, editable: true },
      { key: 'activo', label: 'Activo', type: 'boolean', editable: true },
    ],
    defaultSort: 'nombre',
  },
  {
    key: 'segmentos',
    table: 'segmentos',
    title: 'Segmentos',
    icon: Layers,
    description: 'Segmentos de negocio por empresa',
    color: '#8B5CF6',
    columns: [
      { key: 'nombre', label: 'Nombre', type: 'text', required: true, editable: true },
      { key: 'empresa_id', label: 'Empresa', type: 'select', editable: true },
      { key: 'activo', label: 'Activo', type: 'boolean', editable: true },
    ],
    defaultSort: 'nombre',
  },
  {
    key: 'plazas',
    table: 'plazas',
    title: 'Plazas',
    icon: MapPin,
    description: 'Plazas de operación por estado',
    color: '#0D9668',
    columns: [
      { key: 'nombre', label: 'Nombre', type: 'text', required: true, editable: true },
      { key: 'estado', label: 'Estado', type: 'text', editable: true },
      { key: 'activo', label: 'Activo', type: 'boolean', editable: true },
    ],
    defaultSort: 'nombre',
  },
  {
    key: 'tractos',
    table: 'tractos',
    title: 'Tractocamiones',
    icon: Truck,
    description: 'Flota de tractocamiones registrados',
    color: '#B8860B',
    columns: [
      { key: 'numero_economico', label: '# Económico', type: 'text', required: true, editable: true },
      { key: 'empresa', label: 'Empresa', type: 'text', required: true, editable: true },
      { key: 'segmento', label: 'Segmento', type: 'text', editable: true },
      { key: 'estado_operativo', label: 'Estado', type: 'select', editable: true, options: ['disponible', 'en_viaje', 'mantenimiento', 'siniestrado', 'baja'] },
      { key: 'km_acumulados', label: 'KM Acum.', type: 'number', editable: true },
      { key: 'activo', label: 'Activo', type: 'boolean', editable: true },
    ],
    defaultSort: 'numero_economico',
  },
  {
    key: 'cajas',
    table: 'cajas',
    title: 'Cajas / Remolques',
    icon: Container,
    description: 'Cajas secas y refrigeradas',
    color: '#C53030',
    columns: [
      { key: 'numero_economico', label: '# Económico', type: 'text', required: true, editable: true },
      { key: 'empresa', label: 'Empresa', type: 'text', required: true, editable: true },
      { key: 'tipo', label: 'Tipo', type: 'select', editable: true, options: ['seco', 'refrigerado'] },
      { key: 'estado', label: 'Estado', type: 'select', editable: true, options: ['disponible', 'en_uso', 'mantenimiento', 'baja'] },
      { key: 'ubicacion_actual', label: 'Ubicación', type: 'text', editable: true },
      { key: 'activo', label: 'Activo', type: 'boolean', editable: true },
    ],
    defaultSort: 'numero_economico',
  },
  {
    key: 'operadores',
    table: 'operadores',
    title: 'Operadores',
    icon: Users,
    description: 'Operadores de tractocamiones',
    color: '#6366F1',
    columns: [
      { key: 'nombre', label: 'Nombre', type: 'text', required: true, editable: true },
      { key: 'licencia', label: 'Licencia', type: 'text', editable: true },
      { key: 'telefono', label: 'Teléfono', type: 'text', editable: true },
      { key: 'empresa', label: 'Empresa', type: 'text', editable: true },
      { key: 'estado', label: 'Estado', type: 'select', editable: true, options: ['disponible', 'en_viaje', 'descanso', 'incapacidad', 'baja'] },
      { key: 'activo', label: 'Activo', type: 'boolean', editable: true },
    ],
    defaultSort: 'nombre',
  },
  {
    key: 'csr',
    table: 'catalogo_csr',
    title: 'CSR (Servicio a Clientes)',
    icon: Headphones,
    description: 'Ejecutivas de servicio al cliente — asignación en Alta',
    color: '#0891B2',
    columns: [
      { key: 'nombre', label: 'Nombre', type: 'text', required: true, editable: true },
      { key: 'email', label: 'Email', type: 'text', required: true, editable: true },
      { key: 'telefono', label: 'Teléfono', type: 'text', editable: true },
      { key: 'empresa', label: 'Empresa', type: 'text', editable: true },
      { key: 'clientes_asignados', label: 'Clientes', type: 'number', editable: true },
      { key: 'activo', label: 'Activo', type: 'boolean', editable: true },
    ],
    defaultSort: 'nombre',
  },
  {
    key: 'cxc',
    table: 'catalogo_cxc',
    title: 'CxC (Cobranza)',
    icon: BadgeDollarSign,
    description: 'Ejecutivos de cuentas por cobrar — asignación en Alta',
    color: '#7C3AED',
    columns: [
      { key: 'nombre', label: 'Nombre', type: 'text', required: true, editable: true },
      { key: 'email', label: 'Email', type: 'text', required: true, editable: true },
      { key: 'telefono', label: 'Teléfono', type: 'text', editable: true },
      { key: 'empresa', label: 'Empresa', type: 'text', editable: true },
      { key: 'clientes_asignados', label: 'Clientes', type: 'number', editable: true },
      { key: 'activo', label: 'Activo', type: 'boolean', editable: true },
    ],
    defaultSort: 'nombre',
  },
];

/* ─── Styles (tokens-aligned, Montserrat headings) ───────── */

const styles = {
  heading: { fontFamily: tokens.fonts.heading, fontWeight: 700 as const },
  body: { fontFamily: tokens.fonts.body },
  bgMain: '#F7F8FA',
  bgCard: '#FFFFFF',
  bgHover: '#F1F5F9',
  border: 'rgba(15, 23, 42, 0.08)',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  primary: '#3B6CE7',
  primaryHover: '#2F5BC4',
  green: '#0D9668',
  red: '#C53030',
  yellow: '#B8860B',
};

/* ─── CatalogosTab Component ─────────────────────────────── */

export default function CatalogosTab() {
  const [selectedCatalog, setSelectedCatalog] = useState<string | null>(null);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState<Record<string, unknown>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const [empresasLookup, setEmpresasLookup] = useState<{ id: string; nombre: string }[]>([]);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const catalog = CATALOGS.find((c) => c.key === selectedCatalog);

  /* ── Toast ── */
  const showToast = useCallback((type: Toast['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ── Load counts for all catalogs ── */
  useEffect(() => {
    async function loadCounts() {
      const newCounts: Record<string, number> = {};
      for (const cat of CATALOGS) {
        const { count, error } = await supabase
          .from(cat.table)
          .select('*', { count: 'exact', head: true });
        newCounts[cat.key] = error ? 0 : (count ?? 0);
      }
      setCounts(newCounts);
    }
    loadCounts();
  }, []);

  /* ── Load empresas for segmentos FK ── */
  useEffect(() => {
    async function loadEmpresas() {
      const { data } = await supabase
        .from('empresas')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre');
      if (data) setEmpresasLookup(data);
    }
    loadEmpresas();
  }, []);

  /* ── Load records when catalog selected ── */
  useEffect(() => {
    if (!catalog) return;
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCatalog]);

  async function loadRecords() {
    if (!catalog) return;
    setLoading(true);
    try {
      let query = supabase
        .from(catalog.table)
        .select('*')
        .order(catalog.defaultSort || 'created_at', { ascending: true });

      /* Paginate beyond Supabase 1000 limit */
      const allData: Record<string, unknown>[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await query.range(from, from + pageSize - 1);
        if (error) {
          showToast('error', 'Error al cargar: ' + error.message);
          break;
        }
        if (data && data.length > 0) {
          allData.push(...data);
          from += pageSize;
          if (data.length < pageSize) hasMore = false;
        } else {
          hasMore = false;
        }
        /* Re-create query for next page */
        query = supabase
          .from(catalog.table)
          .select('*')
          .order(catalog.defaultSort || 'created_at', { ascending: true });
      }
      setRecords(allData);
    } finally {
      setLoading(false);
    }
  }

  /* ── CRUD Operations ── */

  async function handleSaveNew() {
    if (!catalog) return;
    const insertObj: Record<string, unknown> = {};
    for (const col of catalog.columns) {
      if (col.key === 'activo') {
        insertObj[col.key] = newForm[col.key] !== false;
      } else if (newForm[col.key] !== undefined && newForm[col.key] !== '') {
        insertObj[col.key] = newForm[col.key];
      }
    }
    const { error } = await supabase.from(catalog.table).insert(insertObj);
    if (error) {
      showToast('error', 'Error: ' + error.message);
      return;
    }
    showToast('success', 'Registro creado');
    setIsAdding(false);
    setNewForm({});
    await loadRecords();
    setCounts((prev) => ({ ...prev, [catalog.key]: (prev[catalog.key] || 0) + 1 }));
  }

  async function handleSaveEdit() {
    if (!catalog || !editingId) return;
    const updateObj: Record<string, unknown> = {};
    for (const col of catalog.columns) {
      if (col.editable) {
        updateObj[col.key] = editForm[col.key];
      }
    }
    const { error } = await supabase
      .from(catalog.table)
      .update(updateObj)
      .eq('id', editingId);
    if (error) {
      showToast('error', 'Error: ' + error.message);
      return;
    }
    showToast('success', 'Registro actualizado');
    setEditingId(null);
    setEditForm({});
    await loadRecords();
  }

  async function handleDelete(id: string) {
    if (!catalog) return;
    /* Soft delete with deleted_at if column exists, otherwise set activo = false */
    const { error } = await supabase
      .from(catalog.table)
      .update({ activo: false })
      .eq('id', id);
    if (error) {
      showToast('error', 'Error: ' + error.message);
      return;
    }
    showToast('success', 'Registro desactivado');
    await loadRecords();
  }

  function startEdit(record: Record<string, unknown>) {
    setEditingId(record.id as string);
    const form: Record<string, unknown> = {};
    for (const col of catalog!.columns) {
      form[col.key] = record[col.key];
    }
    setEditForm(form);
  }

  function startAdd() {
    const form: Record<string, unknown> = {};
    for (const col of catalog!.columns) {
      if (col.key === 'activo') form[col.key] = true;
      else form[col.key] = '';
    }
    setNewForm(form);
    setIsAdding(true);
  }

  /* ── Filter records ── */
  const filtered = records.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(r).some(
      (v) => typeof v === 'string' && v.toLowerCase().includes(term)
    );
  });

  /* ── Render cell value ── */
  function renderCellValue(col: ColumnDef, value: unknown): string {
    if (col.type === 'boolean') return value ? 'Sí' : 'No';
    if (col.key === 'empresa_id' && typeof value === 'string') {
      const emp = empresasLookup.find((e) => e.id === value);
      return emp ? emp.nombre : value;
    }
    if (value === null || value === undefined) return '—';
    return String(value);
  }

  /* ── Render form field ── */
  function renderFormField(
    col: ColumnDef,
    formData: Record<string, unknown>,
    setFormData: (data: Record<string, unknown>) => void
  ) {
    const val = formData[col.key];
    const fieldStyle: React.CSSProperties = {
      ...styles.body,
      background: styles.bgMain,
      border: '1px solid ' + styles.border,
      borderRadius: 8,
      padding: '8px 12px',
      color: styles.textPrimary,
      width: '100%',
      fontSize: 14,
      outline: 'none',
    };

    if (col.type === 'boolean') {
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!val}
            onChange={(e) => setFormData({ ...formData, [col.key]: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: styles.primary }}
          />
          <span style={{ ...styles.body, color: styles.textSecondary, fontSize: 14 }}>
            {val ? 'Activo' : 'Inactivo'}
          </span>
        </label>
      );
    }

    if (col.type === 'select' && col.options) {
      return (
        <select
          value={String(val || '')}
          onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
          style={fieldStyle}
        >
          <option value="">Seleccionar...</option>
          {col.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (col.key === 'empresa_id') {
      return (
        <select
          value={String(val || '')}
          onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
          style={fieldStyle}
        >
          <option value="">Seleccionar empresa...</option>
          {empresasLookup.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nombre}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={col.type === 'number' ? 'number' : 'text'}
        value={String(val || '')}
        onChange={(e) =>
          setFormData({
            ...formData,
            [col.key]: col.type === 'number' ? Number(e.target.value) : e.target.value,
          })
        }
        placeholder={col.label}
        required={col.required}
        style={fieldStyle}
      />
    );
  }

  /* ══════════════════════════════════════════════════════════
     RENDER — Catalog Card Grid (when no catalog selected)
     ══════════════════════════════════════════════════════════ */

  if (!selectedCatalog) {
    return (
      <ModuleLayout
        titulo="Catálogos"
      >
        <div style={{ background: '#E8EBF0', minHeight: 'calc(100vh - 120px)', padding: '32px 40px' }}>
          <p style={{ ...styles.body, color: styles.textSecondary, fontSize: 14, margin: '0 0 20px 0' }}>
            Selecciona un catalogo para administrar sus registros
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {CATALOGS.map((cat) => {
              const Icon = cat.icon;
              const count = counts[cat.key];
              const isH = hoveredCard === cat.key;

              const bgNormal =
                'linear-gradient(155deg, rgba(18,32,58,0.96) 0%, rgba(12,22,42,0.98) 35%, rgba(8,16,32,1) 70%, rgba(6,12,24,1) 100%), ' +
                'linear-gradient(135deg, rgba(180,100,50,0.28) 0%, rgba(60,90,140,0.25) 50%, rgba(180,100,50,0.28) 100%)';
              const bgHover =
                'linear-gradient(155deg, rgba(28,48,82,1) 0%, rgba(20,35,62,1) 35%, rgba(14,24,45,1) 70%, rgba(10,18,35,1) 100%), ' +
                'linear-gradient(135deg, rgba(240,160,80,0.65) 0%, rgba(220,140,70,0.6) 25%, rgba(70,110,170,0.4) 50%, rgba(220,140,70,0.6) 75%, rgba(240,160,80,0.65) 100%)';

              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    setSelectedCatalog(cat.key);
                    setSearchTerm('');
                    setIsAdding(false);
                    setEditingId(null);
                  }}
                  onMouseEnter={() => setHoveredCard(cat.key)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    minHeight: 70,
                    borderRadius: 10,
                    padding: '12px 16px',
                    backgroundImage: isH ? bgHover : bgNormal,
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    border: '2px solid transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 10,
                    transition: 'all 0.3s ease',
                    transform: isH ? 'translateY(-4px)' : 'none',
                    boxShadow: isH
                      ? '0 4px 8px rgba(0,0,0,0.4), 0 10px 24px rgba(0,0,0,0.6), 0 0 30px rgba(240,160,80,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                      : '0 2px 4px rgba(0,0,0,0.3), 0 6px 16px rgba(0,0,0,0.5), inset -2px -2px 4px rgba(0,0,0,0.2)',
                    fontFamily: styles.heading.fontFamily,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
                    borderTopLeftRadius: 10, borderTopRightRadius: 10,
                    pointerEvents: 'none', opacity: isH ? 0.5 : 0.3,
                    transition: 'opacity 0.3s ease',
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: 10,
                      padding: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.10)',
                    }}>
                      <Icon size={22} style={{ color: isH ? 'rgba(240,160,80,1)' : 'rgba(255,255,255,0.9)', transition: 'color 0.3s ease' }} />
                    </div>
                    <span style={{
                      fontFamily: styles.heading.fontFamily,
                      fontSize: 26, fontWeight: 700,
                      color: isH ? 'rgba(240,160,80,1)' : 'rgba(255,255,255,0.95)',
                      transition: 'color 0.3s ease',
                    }}>
                      {count !== undefined ? count.toLocaleString() : '...'}
                    </span>
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <h3 style={{
                      fontFamily: styles.heading.fontFamily,
                      fontSize: 15, fontWeight: 700,
                      color: '#ffffff', margin: 0,
                      letterSpacing: '0.02em',
                    }}>
                      {cat.title}
                    </h3>
                    <p style={{
                      fontFamily: styles.body.fontFamily,
                      fontSize: 11, fontWeight: 500,
                      color: 'rgba(255,255,255,0.55)',
                      margin: '4px 0 0',
                      letterSpacing: '0.02em',
                    }}>
                      {cat.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </ModuleLayout>
    );
  }

  /* ══════════════════════════════════════════════════════════
     RENDER — Table CRUD View (when catalog is selected)
     ══════════════════════════════════════════════════════════ */

  if (!catalog) return null;
  const Icon = catalog.icon;

  return (
    <ModuleLayout
      titulo={`Catálogos — ${catalog.title}`}
    >
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        height: '100%',
        maxHeight: 'calc(100vh - 260px)',
      }}
    >
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.type === 'success' ? styles.green : styles.red,
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            ...styles.body,
            fontSize: 14,
            fontWeight: 500,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => {
              setSelectedCatalog(null);
              setIsAdding(false);
              setEditingId(null);
            }}
            style={{
              background: 'linear-gradient(180deg, #4A7AF0 0%, #3B6CE7 50%, #2F5BC4 100%)',
              border: '1px solid #2F5BC4',
              borderRadius: 8,
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#FFFFFF',
              ...styles.body,
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.18s ease',
              boxShadow: '0 2px 4px rgba(59,108,231,0.30), 0 6px 14px -3px rgba(59,108,231,0.25), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.18)',
              textShadow: '0 1px 2px rgba(0,0,0,0.20)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(180deg, #3B6CE7 0%, #2F5BC4 100%)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(180deg, #4A7AF0 0%, #3B6CE7 50%, #2F5BC4 100%)';
            }}
          >
            <ArrowLeft size={16} />
            Catálogos
          </button>
          <div
            style={{
              background: catalog.color + '20',
              borderRadius: 10,
              padding: 8,
              display: 'flex',
            }}
          >
            <Icon size={20} style={{ color: catalog.color }} />
          </div>
          <h2
            style={{
              ...styles.heading,
              fontSize: 20,
              color: styles.textPrimary,
              margin: 0,
            }}
          >
            {catalog.title}
          </h2>
          <span
            style={{
              ...styles.body,
              fontSize: 13,
              color: styles.textMuted,
              background: styles.bgCard,
              padding: '4px 12px',
              borderRadius: 20,
            }}
          >
            {filtered.length} registros
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: styles.textMuted,
              }}
            />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                ...styles.body,
                background: styles.bgCard,
                border: '1px solid ' + styles.border,
                borderRadius: 10,
                padding: '8px 12px 8px 34px',
                color: styles.textPrimary,
                fontSize: 13,
                width: 200,
                outline: 'none',
              }}
            />
          </div>

          {/* Add Button */}
          {!isAdding && (
            <button
              onClick={startAdd}
              style={{
                background: 'linear-gradient(180deg, #4A7AF0 0%, #3B6CE7 50%, #2F5BC4 100%)',
                border: 'none',
                borderRadius: 10,
                padding: '9px 18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#fff',
                ...styles.body,
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.18s ease',
                boxShadow: '0 2px 4px rgba(59,108,231,0.30), 0 6px 14px -3px rgba(59,108,231,0.25), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.18)',
                textShadow: '0 1px 2px rgba(0,0,0,0.20)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(180deg, #3B6CE7 0%, #2F5BC4 100%)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(180deg, #4A7AF0 0%, #3B6CE7 50%, #2F5BC4 100%)';
              }}
            >
              <Plus size={16} />
              Agregar
            </button>
          )}
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div
          style={{
            background: styles.bgCard,
            border: '1px solid ' + styles.primary,
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {catalog.columns.map((col) => (
            <div key={col.key} style={{ flex: col.type === 'boolean' ? '0 0 auto' : '1 1 160px' }}>
              <label
                style={{
                  ...styles.body,
                  fontSize: 12,
                  color: styles.textMuted,
                  marginBottom: 4,
                  display: 'block',
                }}
              >
                {col.label}
                {col.required && <span style={{ color: styles.red }}> *</span>}
              </label>
              {renderFormField(col, newForm, setNewForm)}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSaveNew}
              style={{
                background: styles.green,
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: '#fff',
                ...styles.body,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Save size={14} />
              Guardar
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewForm({});
              }}
              style={{
                background: 'transparent',
                border: '1px solid ' + styles.border,
                borderRadius: 8,
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: styles.textMuted,
                ...styles.body,
                fontSize: 13,
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: styles.bgCard,
          border: '1px solid ' + styles.border,
          borderRadius: 12,
          overflow: 'auto',
          flex: 1,
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 60,
              gap: 10,
            }}
          >
            <Loader2 size={24} style={{ color: styles.primary, animation: 'spin 1s linear infinite' }} />
            <span style={{ ...styles.body, color: styles.textSecondary }}>Cargando registros...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 60,
              gap: 8,
            }}
          >
            <Icon size={40} style={{ color: styles.textMuted, opacity: 0.4 }} />
            <p style={{ ...styles.body, color: styles.textMuted, fontSize: 14, margin: 0 }}>
              {searchTerm ? 'Sin resultados para "' + searchTerm + '"' : 'Sin registros. Haz clic en Agregar para crear uno.'}
            </p>
          </div>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              ...styles.body,
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                {catalog.columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      ...styles.heading,
                      fontSize: 12,
                      fontWeight: 600,
                      color: styles.textMuted,
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderBottom: '1px solid ' + styles.border,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col.label}
                  </th>
                ))}
                <th
                  style={{
                    width: 100,
                    padding: '12px 16px',
                    borderBottom: '1px solid ' + styles.border,
                    textAlign: 'right',
                    ...styles.heading,
                    fontSize: 12,
                    fontWeight: 600,
                    color: styles.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => {
                const id = record.id as string;
                const isEditing = editingId === id;
                return (
                  <tr
                    key={id}
                    style={{
                      borderBottom: '1px solid ' + styles.border,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = styles.bgHover;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                    }}
                  >
                    {catalog.columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          padding: '10px 16px',
                          color: col.key === 'activo'
                            ? (record[col.key] ? styles.green : styles.red)
                            : styles.textPrimary,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isEditing && col.editable
                          ? renderFormField(col, editForm, setEditForm)
                          : renderCellValue(col, record[col.key])}
                      </td>
                    ))}
                    <td style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={handleSaveEdit}
                            style={{
                              background: styles.green,
                              border: 'none',
                              borderRadius: 6,
                              padding: '6px 10px',
                              cursor: 'pointer',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Guardar"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditForm({});
                            }}
                            style={{
                              background: 'transparent',
                              border: '1px solid ' + styles.border,
                              borderRadius: 6,
                              padding: '6px 10px',
                              cursor: 'pointer',
                              color: styles.textMuted,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Cancelar"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => startEdit(record)}
                            style={{
                              background: 'transparent',
                              border: '1px solid ' + styles.border,
                              borderRadius: 6,
                              padding: '6px 10px',
                              cursor: 'pointer',
                              color: styles.textSecondary,
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'all 0.2s',
                            }}
                            title="Editar"
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.borderColor = styles.yellow;
                              (e.currentTarget as HTMLButtonElement).style.color = styles.yellow;
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.borderColor = styles.border;
                              (e.currentTarget as HTMLButtonElement).style.color = styles.textSecondary;
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid ' + styles.border,
                              borderRadius: 6,
                              padding: '6px 10px',
                              cursor: 'pointer',
                              color: styles.textSecondary,
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'all 0.2s',
                            }}
                            title="Desactivar"
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.borderColor = styles.red;
                              (e.currentTarget as HTMLButtonElement).style.color = styles.red;
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.borderColor = styles.border;
                              (e.currentTarget as HTMLButtonElement).style.color = styles.textSecondary;
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
    </ModuleLayout>
  );
}
