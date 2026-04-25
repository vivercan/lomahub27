// TerminalesConfig.tsx — CRUD for Terminales / Geocercas
// Manages terminal locations used by ControlEquipo for inventory-by-terminal matching
import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'
import {
  Plus, Edit2, Trash2, MapPin, Search, X, CheckCircle, AlertCircle, Loader2, ChevronDown
} from 'lucide-react'

/* ——— Types ——————————————————————————————————————— */

interface Terminal {
  id: string
  nombre: string
  latitud: number
  longitud: number
  radio_metros: number
  direccion: string | null
  empresa: string | null
  activa: boolean
  created_at: string
  updated_at: string
}

type FormData = {
  nombre: string
  latitud: string
  longitud: string
  radio_metros: string
  direccion: string
  empresa: string
  activa: boolean
}

const EMPTY_FORM: FormData = {
  nombre: '', latitud: '', longitud: '', radio_metros: '500',
  direccion: '', empresa: 'trob', activa: true,
}

const EMPRESAS = ['trob', 'wexpress', 'speedyhaul', 'trob_usa']

/* ——— Styles ————————————————————————————————————— */

const s = {
  card: {
    backgroundColor: tokens.colors.bgCard,
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: '12px',
    padding: '24px',
  } as React.CSSProperties,
  btn: (variant: 'primary' | 'secondary' | 'danger') => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: tokens.fonts.body,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ...(variant === 'primary' ? {
      backgroundColor: tokens.colors.primary,
      color: '#fff',
    } : variant === 'danger' ? {
      backgroundColor: tokens.colors.red,
      color: '#fff',
    } : {
      backgroundColor: tokens.colors.bgHover,
      color: tokens.colors.textPrimary,
      border: `1px solid ${tokens.colors.border}`,
    }),
  }) as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px 14px',
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: tokens.fonts.body,
    color: tokens.colors.textPrimary,
    backgroundColor: tokens.colors.bgMain,
    outline: 'none',
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: tokens.colors.textSecondary,
    marginBottom: '6px',
    fontFamily: tokens.fonts.body,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
    fontFamily: tokens.fonts.body,
  } as React.CSSProperties,
  th: {
    textAlign: 'left' as const,
    padding: '12px 14px',
    borderBottom: `2px solid ${tokens.colors.border}`,
    color: tokens.colors.textSecondary,
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  } as React.CSSProperties,
  td: {
    padding: '12px 14px',
    borderBottom: `1px solid ${tokens.colors.border}`,
    color: tokens.colors.textPrimary,
    verticalAlign: 'middle' as const,
  } as React.CSSProperties,
}

/* ——— Component ——————————————————————————————————— */

export default function TerminalesConfig() {
  const [terminales, setTerminales] = useState<Terminal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Terminal | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ─── Fetch ──────────────────────────────────────────
  const fetchTerminales = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('terminales')
        .select('*')
        .order('nombre', { ascending: true })
      if (err) throw err
      setTerminales(data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando terminales')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTerminales() }, [fetchTerminales])

  // ─── Flash messages ──────────────────────────────────
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t) }
  }, [success])
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t) }
  }, [error])

  // ─── Form handlers ──────────────────────────────────
  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (t: Terminal) => {
    setEditing(t)
    setForm({
      nombre: t.nombre,
      latitud: String(t.latitud),
      longitud: String(t.longitud),
      radio_metros: String(t.radio_metros),
      direccion: t.direccion || '',
      empresa: t.empresa || 'trob',
      activa: t.activa,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    const lat = parseFloat(form.latitud)
    const lng = parseFloat(form.longitud)
    const radio = parseInt(form.radio_metros, 10)
    if (!form.nombre.trim()) { setError('Nombre es requerido'); return }
    if (isNaN(lat) || lat < -90 || lat > 90) { setError('Latitud debe ser entre -90 y 90'); return }
    if (isNaN(lng) || lng < -180 || lng > 180) { setError('Longitud debe ser entre -180 y 180'); return }
    if (isNaN(radio) || radio < 50 || radio > 50000) { setError('Radio debe ser entre 50 y 50,000 metros'); return }

    try {
      setSubmitting(true)
      const payload = {
        nombre: form.nombre.trim(),
        latitud: lat,
        longitud: lng,
        radio_metros: radio,
        direccion: form.direccion.trim() || null,
        empresa: form.empresa || null,
        activa: form.activa,
        updated_at: new Date().toISOString(),
      }

      if (editing) {
        const { error: err } = await supabase
          .from('terminales')
          .update(payload)
          .eq('id', editing.id)
        if (err) throw err
        setSuccess(`Terminal "${form.nombre}" actualizada`)
      } else {
        const { error: err } = await supabase
          .from('terminales')
          .insert(payload)
        if (err) throw err
        setSuccess(`Terminal "${form.nombre}" creada`)
      }

      closeForm()
      fetchTerminales()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando terminal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (t: Terminal) => {
    if (!confirm(`¿Desactivar terminal "${t.nombre}"? Se usará soft-delete.`)) return
    try {
      setDeletingId(t.id)
      const { error: err } = await supabase
        .from('terminales')
        .update({ activa: false, updated_at: new Date().toISOString() })
        .eq('id', t.id)
      if (err) throw err
      setSuccess(`Terminal "${t.nombre}" desactivada`)
      fetchTerminales()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desactivando terminal')
    } finally {
      setDeletingId(null)
    }
  }

  const handleReactivate = async (t: Terminal) => {
    try {
      const { error: err } = await supabase
        .from('terminales')
        .update({ activa: true, updated_at: new Date().toISOString() })
        .eq('id', t.id)
      if (err) throw err
      setSuccess(`Terminal "${t.nombre}" reactivada`)
      fetchTerminales()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error reactivando')
    }
  }

  // ─── Filter ──────────────────────────────────────────
  const filtered = terminales.filter(t =>
    t.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (t.direccion || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.empresa || '').toLowerCase().includes(search.toLowerCase())
  )

  const activas = terminales.filter(t => t.activa).length
  const inactivas = terminales.length - activas

  // ─── Render ──────────────────────────────────────────
  return (
    <ModuleLayout
      titulo="Terminales y Geocercas"
      subtitulo={`${activas} activa${activas !== 1 ? 's' : ''} · ${inactivas} inactiva${inactivas !== 1 ? 's' : ''}`}
      moduloPadre={{ label: 'Configuración', ruta: '/admin/configuracion' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>

        {/* Flash messages */}
        {success && (
          <div style={{ ...s.card, padding: '12px 16px', backgroundColor: 'rgba(16,185,129,0.08)', borderColor: tokens.colors.green, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} color={tokens.colors.green} />
            <span style={{ color: tokens.colors.green, fontSize: '13px', fontWeight: 500 }}>{success}</span>
          </div>
        )}
        {error && (
          <div style={{ ...s.card, padding: '12px 16px', backgroundColor: 'rgba(239,68,68,0.08)', borderColor: tokens.colors.red, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} color={tokens.colors.red} />
            <span style={{ color: tokens.colors.red, fontSize: '13px', fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '360px' }}>
            <Search size={16} color={tokens.colors.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              placeholder="Buscar terminal..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...s.input, paddingLeft: '36px' }}
            />
          </div>
          <button onClick={openCreate} style={s.btn('primary')}>
            <Plus size={16} /> Nueva Terminal
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ ...s.card, textAlign: 'center', padding: '48px 24px' }}>
            <Loader2 size={32} color={tokens.colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '12px', color: tokens.colors.textSecondary, fontSize: '14px' }}>Cargando terminales...</p>
          </div>
        ) : (
          /* Table */
          <div style={{ ...s.card, padding: 0, overflow: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Estado</th>
                  <th style={s.th}>Nombre</th>
                  <th style={s.th}>Dirección</th>
                  <th style={s.th}>Empresa</th>
                  <th style={s.th}>Lat</th>
                  <th style={s.th}>Lng</th>
                  <th style={s.th}>Radio (m)</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ ...s.td, textAlign: 'center', padding: '32px', color: tokens.colors.textMuted }}>
                      {search ? 'Sin resultados para la búsqueda' : 'No hay terminales configuradas. Agrega la primera.'}
                    </td>
                  </tr>
                ) : filtered.map(t => (
                  <tr key={t.id} style={{ backgroundColor: t.activa ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                    <td style={s.td}>
                      <span style={{
                        display: 'inline-block',
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: t.activa ? tokens.colors.green : tokens.colors.gray,
                      }} />
                    </td>
                    <td style={{ ...s.td, fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color={tokens.colors.primary} />
                        {t.nombre}
                      </div>
                    </td>
                    <td style={{ ...s.td, color: tokens.colors.textSecondary, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.direccion || '—'}
                    </td>
                    <td style={s.td}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                        backgroundColor: tokens.colors.bgHover, color: tokens.colors.textSecondary, textTransform: 'uppercase',
                      }}>
                        {t.empresa || '—'}
                      </span>
                    </td>
                    <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '12px' }}>{t.latitud.toFixed(5)}</td>
                    <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '12px' }}>{t.longitud.toFixed(5)}</td>
                    <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '12px' }}>{t.radio_metros.toLocaleString()}</td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEdit(t)}
                          style={{ ...s.btn('secondary'), padding: '6px 10px', fontSize: '12px' }}
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        {t.activa ? (
                          <button
                            onClick={() => handleDelete(t)}
                            disabled={deletingId === t.id}
                            style={{ ...s.btn('danger'), padding: '6px 10px', fontSize: '12px', opacity: deletingId === t.id ? 0.5 : 1 }}
                            title="Desactivar"
                          >
                            {deletingId === t.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(t)}
                            style={{ ...s.btn('primary'), padding: '6px 10px', fontSize: '12px' }}
                            title="Reactivar"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal — Create / Edit */}
        {showForm && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              ...s.card,
              width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, fontFamily: tokens.fonts.heading, color: tokens.colors.textPrimary }}>
                  {editing ? 'Editar Terminal' : 'Nueva Terminal'}
                </h2>
                <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <X size={20} color={tokens.colors.textMuted} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Nombre */}
                <div>
                  <label style={s.label}>Nombre *</label>
                  <input
                    value={form.nombre}
                    onChange={e => handleChange('nombre', e.target.value)}
                    placeholder="Ej: Terminal Monterrey, Patio Laredo"
                    style={s.input}
                    required
                  />
                </div>

                {/* Lat / Lng */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={s.label}>Latitud *</label>
                    <input
                      type="number"
                      step="any"
                      value={form.latitud}
                      onChange={e => handleChange('latitud', e.target.value)}
                      placeholder="25.6866"
                      style={s.input}
                      required
                    />
                  </div>
                  <div>
                    <label style={s.label}>Longitud *</label>
                    <input
                      type="number"
                      step="any"
                      value={form.longitud}
                      onChange={e => handleChange('longitud', e.target.value)}
                      placeholder="-100.3161"
                      style={s.input}
                      required
                    />
                  </div>
                </div>

                {/* Radio */}
                <div>
                  <label style={s.label}>Radio de geocerca (metros) *</label>
                  <input
                    type="number"
                    value={form.radio_metros}
                    onChange={e => handleChange('radio_metros', e.target.value)}
                    placeholder="500"
                    min="50"
                    max="50000"
                    style={s.input}
                    required
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: tokens.colors.textMuted }}>
                    Rango: 50m — 50,000m. Las cajas dentro de este radio se cuentan como "en patio".
                  </p>
                </div>

                {/* Dirección */}
                <div>
                  <label style={s.label}>Dirección</label>
                  <input
                    value={form.direccion}
                    onChange={e => handleChange('direccion', e.target.value)}
                    placeholder="Av. Industrial #1234, Monterrey, NL"
                    style={s.input}
                  />
                </div>

                {/* Empresa */}
                <div>
                  <label style={s.label}>Empresa</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={form.empresa}
                      onChange={e => handleChange('empresa', e.target.value)}
                      style={{ ...s.input, appearance: 'none', paddingRight: '36px', cursor: 'pointer' }}
                    >
                      {EMPRESAS.map(emp => (
                        <option key={emp} value={emp}>{emp.toUpperCase()}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} color={tokens.colors.textMuted} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                </div>

                {/* Activa toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={form.activa}
                    onChange={e => handleChange('activa', e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: tokens.colors.primary, cursor: 'pointer' }}
                  />
                  <label style={{ fontSize: '14px', color: tokens.colors.textPrimary, cursor: 'pointer', fontFamily: tokens.fonts.body }}>
                    Terminal activa
                  </label>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={closeForm} style={s.btn('secondary')}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={submitting} style={{ ...s.btn('primary'), opacity: submitting ? 0.6 : 1 }}>
                    {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                    {editing ? 'Guardar Cambios' : 'Crear Terminal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ModuleLayout>
  )
}
