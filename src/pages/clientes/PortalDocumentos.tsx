import type { ReactElement } from 'react'
import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, X, Shield, Building2 } from 'lucide-react'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'
import { useSearchParams } from 'react-router-dom'

interface DocFile {
  name: string
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

const REQUIRED_DOCS = [
  { id: 'csi', label: 'Constancia de Situacion Fiscal', desc: 'PDF emitido por el SAT' },
  { id: 'ine', label: 'INE del representante legal', desc: 'Ambos lados en un solo PDF' },
  { id: 'acta', label: 'Acta constitutiva', desc: 'Copia certificada o escaneada' },
  { id: 'poder', label: 'Poder notarial', desc: 'Si aplica (personas morales)' },
  { id: 'comprobante', label: 'Comprobante de domicilio', desc: 'No mayor a 3 meses' },
  { id: 'caratula', label: 'Caratula bancaria', desc: 'Para depositos y transferencias' },
]

export default function PortalDocumentos(): ReactElement {
  const [searchParams] = useSearchParams()
  const clienteId = searchParams.get('id') || ''
  const empresa = searchParams.get('empresa') || 'Cliente'

  const [files, setFiles] = useState<Record<string, DocFile>>({})
  const [uploading, setUploading] = useState(false)
  const [allDone, setAllDone] = useState(false)

  const handleFileSelect = useCallback((docId: string, file: File) => {
    setFiles(prev => ({ ...prev, [docId]: { name: file.name, file, status: 'pending' } }))
  }, [])

  const removeFile = useCallback((docId: string) => {
    setFiles(prev => {
      const next = { ...prev }
      delete next[docId]
      return next
    })
  }, [])

  const handleUploadAll = async () => {
    if (Object.keys(files).length === 0) return
    setUploading(true)

    for (const [docId, doc] of Object.entries(files)) {
      if (doc.status === 'done') continue
      setFiles(prev => ({ ...prev, [docId]: { ...prev[docId], status: 'uploading' } }))

      const path = `clientes/${clienteId || 'sin-id'}/${docId}_${Date.now()}_${doc.name}`
      const { error } = await supabase.storage.from('documentos').upload(path, doc.file)

      if (error) {
        setFiles(prev => ({ ...prev, [docId]: { ...prev[docId], status: 'error', error: error.message } }))
      } else {
        setFiles(prev => ({ ...prev, [docId]: { ...prev[docId], status: 'done' } }))
      }
    }

    setUploading(false)
    const allCompleted = Object.values(files).every(f => f.status === 'done')
    if (allCompleted) setAllDone(true)
  }

  const completedCount = Object.values(files).filter(f => f.status === 'done').length
  const totalAttached = Object.keys(files).length

  // ── Styles ──
  const ps = {
    input: { width: '100%', padding: '9px 12px', fontSize: '13px', background: tokens.colors.bgMain, border: '1px solid ' + tokens.colors.border, borderRadius: tokens.radius.md, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body, outline: 'none', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' } as React.CSSProperties,
  }

  return (
    <div style={{ minHeight: '100vh', background: tokens.colors.bgMain, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: tokens.fonts.body }}>
      <div style={{ width: '100%', maxWidth: '640px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
            <Building2 size={24} style={{ color: tokens.colors.primary }} />
            <span style={{ fontSize: '22px', fontWeight: 800, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading, letterSpacing: '-0.5px' }}>LomaHUB27</span>
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>
            Portal de Documentos
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: tokens.colors.textSecondary }}>
            {empresa} — Suba su documentacion para completar el alta comercial
          </p>
        </div>

        {/* Success State */}
        {allDone ? (
          <div style={{ background: tokens.colors.bgCard, borderRadius: tokens.radius.lg, border: '1px solid ' + tokens.colors.border, padding: '40px', textAlign: 'center', boxShadow: tokens.effects.cardShadow }}>
            <CheckCircle size={48} style={{ color: tokens.colors.green, marginBottom: '16px' }} />
            <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>Documentos recibidos</h2>
            <p style={{ margin: 0, fontSize: '14px', color: tokens.colors.textSecondary }}>
              Gracias. Su documentacion esta siendo revisada por nuestro equipo comercial.
              Le notificaremos cuando su cuenta sea activada.
            </p>
          </div>
        ) : (
          <div style={{ background: tokens.colors.bgCard, borderRadius: tokens.radius.lg, border: '1px solid ' + tokens.colors.border, boxShadow: tokens.effects.cardShadow, overflow: 'hidden' }}>

            {/* Progress */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + tokens.colors.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} style={{ color: tokens.colors.primary }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: tokens.colors.textPrimary, fontFamily: tokens.fonts.heading }}>Documentacion requerida</span>
              </div>
              <span style={{ fontSize: '12px', color: tokens.colors.textMuted }}>{completedCount} de {REQUIRED_DOCS.length} subidos</span>
            </div>

            {/* Doc List */}
            <div style={{ padding: '8px 0' }}>
              {REQUIRED_DOCS.map(doc => {
                const attached = files[doc.id]
                const isDone = attached?.status === 'done'
                const isError = attached?.status === 'error'
                const isUploading = attached?.status === 'uploading'

                return (
                  <div key={doc.id} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid ' + tokens.colors.border }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: isDone ? tokens.colors.green : tokens.colors.textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isDone ? <CheckCircle size={14} /> : <FileText size={14} style={{ color: tokens.colors.textMuted }} />}
                        {doc.label}
                      </div>
                      <div style={{ fontSize: '11px', color: tokens.colors.textMuted, marginTop: '2px', marginLeft: '22px' }}>
                        {isError ? <span style={{ color: tokens.colors.red }}>{attached.error}</span> : isUploading ? 'Subiendo...' : attached ? attached.name : doc.desc}
                      </div>
                    </div>
                    <div>
                      {isDone ? (
                        <span style={{ fontSize: '11px', color: tokens.colors.green, fontWeight: 600 }}>Listo</span>
                      ) : attached ? (
                        <button onClick={() => removeFile(doc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.colors.textMuted, padding: '4px' }}>
                          <X size={14} />
                        </button>
                      ) : (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: tokens.colors.primary, background: tokens.colors.primary + '15', borderRadius: tokens.radius.md, cursor: 'pointer' }}>
                          <Upload size={12} /> Seleccionar
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleFileSelect(doc.id, e.target.files[0]) }} />
                        </label>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Upload Button */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid ' + tokens.colors.border }}>
              <button onClick={handleUploadAll} disabled={totalAttached === 0 || uploading} style={{
                width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700,
                color: '#fff', background: totalAttached === 0 || uploading ? tokens.colors.bgHover : tokens.colors.primary,
                border: 'none', borderRadius: tokens.radius.md, cursor: totalAttached === 0 ? 'default' : 'pointer',
                fontFamily: tokens.fonts.heading, boxShadow: tokens.effects.glowPrimary,
                opacity: totalAttached === 0 ? 0.5 : 1, transition: 'all 0.15s',
              }}>
                {uploading ? 'Subiendo documentos...' : `Enviar ${totalAttached} documento${totalAttached !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ fontSize: '11px', color: tokens.colors.textMuted }}>
            TROB Logistics &middot; Transporte de carga nacional e internacional
          </p>
        </div>
      </div>
    </div>
  )
}
