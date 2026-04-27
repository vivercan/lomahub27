// ===================================================================
// Documentos de Compañía — V50 (26/Abr/2026)
// Reemplaza STUB Proximamente. Conectado a tabla `documentos` filtrada
// por categoria='compania' (contratos, polizas, manuales legales).
// ===================================================================
import { useEffect, useState } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Badge } from '../../components/ui/Badge'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/AuthContext'

interface Documento {
  id: string
  nombre: string
  descripcion: string | null
  categoria: string | null
  archivo_url: string | null
  archivo_nombre: string | null
  archivo_size: number | null
  mime_type: string | null
  subido_por: string | null
  created_at: string
}

const CATEGORIAS = ['contrato', 'poliza', 'manual', 'reglamento', 'fiscal', 'otro']

export default function DocumentosCompania() {
  const { user } = useAuthContext()
  const [docs, setDocs] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [filtroCat, setFiltroCat] = useState<string>('')

  // Form state
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('contrato')
  const [descripcion, setDescripcion] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('documentos')
        .select('*')
        .in('categoria', CATEGORIAS)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (err) throw err
      setDocs((data || []) as Documento[])
    } catch (e: any) {
      setError(e.message || 'Error cargando documentos')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !file) {
      setError('Nombre y archivo requeridos')
      return
    }
    setUploading(true)
    setError(null)
    try {
      // 1) Subir archivo a storage bucket 'documentos-compania'
      const ts = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${categoria}/${ts}_${safeName}`
      const { error: upErr } = await supabase.storage.from('documentos-compania').upload(path, file, {
        cacheControl: '3600', upsert: false,
      })
      if (upErr && !upErr.message.includes('already exists')) throw upErr

      const { data: urlData } = supabase.storage.from('documentos-compania').getPublicUrl(path)

      // 2) Insertar registro en tabla documentos
      const { error: insErr } = await supabase.from('documentos').insert({
        nombre: nombre.trim(),
        categoria,
        descripcion: descripcion.trim() || null,
        archivo_url: urlData.publicUrl,
        archivo_nombre: file.name,
        archivo_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        subido_por: user?.id || null,
        permisos: { roles: ['superadmin', 'admin'] },
      })
      if (insErr) throw insErr

      // Reset
      setNombre(''); setDescripcion(''); setFile(null); setAdding(false)
      load()
    } catch (e: any) {
      setError(e.message || 'Error subiendo documento')
    } finally { setUploading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este documento? (soft delete)')) return
    try {
      await supabase.from('documentos').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      load()
    } catch (e: any) { setError(e.message || 'Error eliminando') }
  }

  const filtrados = filtroCat ? docs.filter(d => d.categoria === filtroCat) : docs

  const formatSize = (b: number | null) => {
    if (!b) return '—'
    if (b < 1024) return `${b} B`
    if (b < 1048576) return `${(b/1024).toFixed(1)} KB`
    return `${(b/1048576).toFixed(2)} MB`
  }

  const catBadgeColor = (c: string | null): any => {
    switch (c) {
      case 'contrato': return 'primary'
      case 'poliza': return 'green'
      case 'manual': return 'blue'
      case 'fiscal': return 'orange'
      case 'reglamento': return 'yellow'
      default: return 'gray'
    }
  }

  return (
    <ModuleLayout
      titulo="Documentos de Compañía"
      subtitulo={`${docs.length} documentos · contratos, pólizas, manuales`}
      acciones={
        <button onClick={() => setAdding(!adding)} style={{
          padding: '8px 16px', borderRadius: 10, border: 'none',
          background: adding ? '#94A3B8' : tokens.colors.primary,
          color: '#FFFFFF', fontWeight: 600, fontSize: 13, cursor: 'pointer',
        }}>{adding ? 'Cancelar' : '+ Subir documento'}</button>
      }
    >
      {error && (
        <div style={{
          margin: '8px 0', padding: '10px 14px', borderRadius: 10,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.30)',
          color: '#B91C1C', fontSize: 13,
        }}>⚠ {error}</div>
      )}

      {adding && (
        <form onSubmit={handleUpload} style={{
          background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12,
          padding: 18, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del documento *"
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            <select value={categoria} onChange={e => setCategoria(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
          </div>
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción (opcional)"
            rows={2} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, resize: 'vertical' }} />
          <input type="file" onChange={e => setFile(e.target.files?.[0] || null)}
            style={{ padding: 8, fontSize: 13 }} />
          <button type="submit" disabled={uploading || !nombre.trim() || !file} style={{
            padding: '10px 18px', borderRadius: 10, border: 'none',
            background: uploading || !nombre.trim() || !file ? '#CBD5E1' : tokens.colors.primary,
            color: '#FFFFFF', fontWeight: 600, fontSize: 13,
            cursor: uploading || !nombre.trim() || !file ? 'not-allowed' : 'pointer',
          }}>{uploading ? 'Subiendo...' : 'Guardar documento'}</button>
        </form>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setFiltroCat('')} style={{
          padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB',
          background: filtroCat === '' ? tokens.colors.primary : '#FFFFFF',
          color: filtroCat === '' ? '#FFFFFF' : '#475569',
          fontSize: 12, cursor: 'pointer',
        }}>Todos ({docs.length})</button>
        {CATEGORIAS.map(c => (
          <button key={c} onClick={() => setFiltroCat(c)} style={{
            padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB',
            background: filtroCat === c ? tokens.colors.primary : '#FFFFFF',
            color: filtroCat === c ? '#FFFFFF' : '#475569',
            fontSize: 12, cursor: 'pointer',
          }}>{c.charAt(0).toUpperCase()+c.slice(1)} ({docs.filter(d => d.categoria === c).length})</button>
        ))}
      </div>

      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12,
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8' }}>Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8' }}>
            <p style={{ marginBottom: 6 }}>No hay documentos {filtroCat && `de ${filtroCat}`}.</p>
            <p style={{ fontSize: 11 }}>Click en "+ Subir documento" para agregar el primero.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#1F2937', color: '#FFFFFF' }}>
                <th style={{ padding: 10, textAlign: 'left' }}>Nombre</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Categoría</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Archivo</th>
                <th style={{ padding: 10, textAlign: 'right' }}>Tamaño</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Subido</th>
                <th style={{ padding: 10 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: 10 }}>
                    <div style={{ fontWeight: 600, color: '#0F172A' }}>{d.nombre}</div>
                    {d.descripcion && <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{d.descripcion}</div>}
                  </td>
                  <td style={{ padding: 10 }}><Badge color={catBadgeColor(d.categoria)}>{d.categoria}</Badge></td>
                  <td style={{ padding: 10 }}>
                    {d.archivo_url ? (
                      <a href={d.archivo_url} target="_blank" rel="noreferrer" style={{ color: tokens.colors.primary, textDecoration: 'underline' }}>
                        {d.archivo_nombre || 'descargar'}
                      </a>
                    ) : '—'}
                  </td>
                  <td style={{ padding: 10, textAlign: 'right', color: '#64748B' }}>{formatSize(d.archivo_size)}</td>
                  <td style={{ padding: 10, color: '#64748B', fontSize: 11 }}>{new Date(d.created_at).toLocaleDateString('es-MX')}</td>
                  <td style={{ padding: 10, textAlign: 'right' }}>
                    <button onClick={() => handleDelete(d.id)} style={{
                      padding: '4px 10px', borderRadius: 6, border: '1px solid #FEE2E2',
                      background: '#FEF2F2', color: '#B91C1C', fontSize: 11, cursor: 'pointer',
                    }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ModuleLayout>
  )
}
