import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../lib/tokens'
import { ModuleLayout } from '../../components/layout/ModuleLayout'

interface DocumentoCliente {
  id: string
  cliente_id: string
  tipo_documento: 'CSF' | 'INE' | 'Acta' | 'Poder' | 'Comprobante' | 'Caratula'
  nombre_archivo: string
  storage_path: string
  status: 'pendiente' | 'subido' | 'en_revision' | 'aprobado' | 'rechazado'
  razon_rechazo?: string
  revisado_por?: string
  created_at: string
  updated_at: string
}

interface DocumentActivity {
  tipo: 'subido' | 'revisado' | 'aprobado' | 'rechazado'
  fecha: string
  revisado_por?: string
}

const DOCUMENT_TYPES = [
  { tipo: 'CSF', label: 'Constancia de SituaciÃ³n Fiscal', required: true },
  { tipo: 'INE', label: 'IdentificaciÃ³n (INE)', required: true },
  { tipo: 'Acta', label: 'Acta Constitutiva', required: true },
  { tipo: 'Poder', label: 'Poder Notarial', required: true },
  { tipo: 'Comprobante', label: 'Comprobante de Domicilio', required: true },
  { tipo: 'Caratula', label: 'CarÃ¡tula Bancaria', required: true },
]

const STATUS_CONFIG = {
  pendiente: {
    label: 'Pendiente',
    color: tokens.textSecondary,
    bgColor: '#2A2A36',
    icon: 'â³',
  },
  subido: {
    label: 'Subido',
    color: tokens.primary,
    bgColor: 'rgba(59, 108, 231, 0.1)',
    icon: 'ð¤',
  },
  en_revision: {
    label: 'En RevisiÃ³n',
    color: tokens.yellow,
    bgColor: 'rgba(184, 134, 11, 0.1)',
    icon: 'ðï¸',
  },
  aprobado: {
    label: 'Aprobado',
    color: tokens.green,
    bgColor: 'rgba(13, 150, 104, 0.1)',
    icon: 'â',
  },
  rechazado: {
    label: 'Rechazado',
    color: tokens.red,
    bgColor: 'rgba(197, 48, 48, 0.1)',
    icon: 'â',
  },
}

export default function PortalDocumentosStatus() {
  const [searchParams] = useSearchParams()
  const clienteId = searchParams.get('id') || ''
  const nombreEmpresa = searchParams.get('empresa') || 'Tu Empresa'

  const [documentos, setDocumentos] = useState<DocumentoCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)
  const [activities, setActivities] = useState<Record<string, DocumentActivity[]>>({})

  // Fetch initial documents
  useEffect(() => {
    fetchDocumentos()
  }, [clienteId])

  // Real-time subscription to documentos_cliente table
  useEffect(() => {
    if (!clienteId) return

    const subscription = supabase
      .channel(`documentos_cliente_${clienteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documentos_cliente',
          filter: `cliente_id=eq.${clienteId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDocumentos((prev) => [...prev, payload.new as DocumentoCliente])
          } else if (payload.eventType === 'UPDATE') {
            setDocumentos((prev) =>
              prev.map((doc) =>
                doc.id === payload.new.id ? (payload.new as DocumentoCliente) : doc
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setDocumentos((prev) => prev.filter((doc) => doc.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [clienteId])

  const fetchDocumentos = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('documentos_cliente')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setDocumentos(data || [])
      buildActivities(data || [])
    } catch (err) {
      console.error('Error fetching documentos:', err)
      setError('No se pudieron cargar los documentos')
    } finally {
      setLoading(false)
    }
  }

  const buildActivities = (docs: DocumentoCliente[]) => {
    const actMap: Record<string, DocumentActivity[]> = {}

    docs.forEach((doc) => {
      const acts: DocumentActivity[] = []

      if (doc.created_at) {
        acts.push({
          tipo: 'subido',
          fecha: new Date(doc.created_at).toLocaleString('es-MX'),
        })
      }

      if (doc.status === 'en_revision' && doc.updated_at) {
        acts.push({
          tipo: 'revisado',
          fecha: new Date(doc.updated_at).toLocaleString('es-MX'),
          revisado_por: doc.revisado_por,
        })
      }

      if ((doc.status === 'aprobado' || doc.status === 'rechazado') && doc.updated_at) {
        acts.push({
          tipo: doc.status,
          fecha: new Date(doc.updated_at).toLocaleString('es-MX'),
          revisado_por: doc.revisado_por,
        })
      }

      actMap[doc.id] = acts
    })

    setActivities(actMap)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files[0]) {
      const file = files[0]
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo no debe exceder 10MB')
        return
      }
      setSelectedFile(file)
      setError(null)
    }
  }

  const handleUpload = async (docType: string) => {
    if (!selectedFile || !clienteId) {
      setError('Selecciona un archivo')
      return
    }

    try {
      setUploadingDocType(docType)
      setError(null)

      // Upload to storage
      const fileName = `${clienteId}/${docType}/${Date.now()}_${selectedFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('documentos_onboarding')
        .upload(fileName, selectedFile)

      if (uploadError) throw uploadError

      // Create or update database record
      const existingDoc = documentos.find(
        (doc) => doc.cliente_id === clienteId && doc.tipo_documento === docType
      )

      if (existingDoc) {
        const { error: updateError } = await supabase
          .from('documentos_cliente')
          .update({
            nombre_archivo: selectedFile.name,
            storage_path: fileName,
            status: 'subido',
            updated_at: new Date().toISOString(),
            razon_rechazo: null,
          })
          .eq('id', existingDoc.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('documentos_cliente')
          .insert({
            cliente_id: clienteId,
            tipo_documento: docType,
            nombre_archivo: selectedFile.name,
            storage_path: fileName,
            status: 'subido',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (insertError) throw insertError
      }

      setSuccess(`${docType} subido correctamente`)
      setSelectedFile(null)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Error al subir el archivo')
    } finally {
      setUploadingDocType(null)
    }
  }

  const handleReupload = (docType: string) => {
    setUploadingDocType(docType)
    setSelectedFile(null)
  }

  const getCompletionPercentage = (): number => {
    if (documentos.length === 0) return 0
    const approvedCount = documentos.filter((doc) => doc.status === 'aprobado').length
    return Math.round((approvedCount / DOCUMENT_TYPES.length) * 100)
  }

  const getDocumentoStatus = (docType: string): DocumentoCliente | undefined => {
    return documentos.find((doc) => doc.tipo_documento === docType)
  }

  if (loading) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: tokens.bgMain,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Montserrat, sans-serif',
          color: tokens.textPrimary,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>â³</div>
          <div>Cargando documentos...</div>
        </div>
      </div>
    )
  }

  const completionPercentage = getCompletionPercentage()

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: tokens.bgMain,
        color: tokens.textPrimary,
        fontFamily: 'Montserrat, sans-serif',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      lang="es"
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: tokens.bgCard,
          borderBottom: `1px solid ${tokens.border}`,
          padding: '2rem',
          minHeight: 'fit-content',
        }}
      >
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 600 }}>
          Portal de Documentos
        </h1>
        <p style={{ margin: 0, color: tokens.textSecondary, fontSize: '0.95rem' }}>
          Onboarding para {nombreEmpresa}
        </p>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        {/* Progress Section */}
        <div
          style={{
            backgroundColor: tokens.bgCard,
            border: `1px solid ${tokens.border}`,
            borderRadius: '8px',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
              Progreso de Onboarding
            </h2>
            <span style={{ color: tokens.textSecondary, fontSize: '0.9rem' }}>
              {documentos.filter((d) => d.status === 'aprobado').length}/{DOCUMENT_TYPES.length}{' '}
              aprobados
            </span>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              width: '100%',
              height: '12px',
              backgroundColor: tokens.border,
              borderRadius: '6px',
              overflow: 'hidden',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${completionPercentage}%`,
                backgroundColor: tokens.green,
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ textAlign: 'center', color: tokens.textSecondary, fontSize: '0.9rem' }}>
            {completionPercentage}% completado
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(197, 48, 48, 0.1)',
              border: `1px solid ${tokens.red}`,
              borderRadius: '8px',
              padding: '1rem',
              color: tokens.red,
              fontSize: '0.95rem',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              backgroundColor: 'rgba(13, 150, 104, 0.1)',
              border: `1px solid ${tokens.green}`,
              borderRadius: '8px',
              padding: '1rem',
              color: tokens.green,
              fontSize: '0.95rem',
            }}
          >
            â {success}
          </div>
        )}

        {/* Documents List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {DOCUMENT_TYPES.map((docDef) => {
            const docStatus = getDocumentoStatus(docDef.tipo)
            const status = docStatus?.status || 'pendiente'
            const config = STATUS_CONFIG[status]
            const isExpanded = expandedDoc === docDef.tipo
            const docActivities = docStatus ? activities[docStatus.id] || [] : []

            return (
              <div
                key={docDef.tipo}
                style={{
                  backgroundColor: tokens.bgCard,
                  border: `1px solid ${tokens.border}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Document Header */}
                <div
                  onClick={() =>
                    setExpandedDoc(isExpanded ? null : docDef.tipo)
                  }
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: tokens.bgCard,
                    borderBottom: isExpanded ? `1px solid ${tokens.border}` : 'none',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600 }}>
                      {docDef.label}
                    </h3>
                    <p style={{ margin: 0, color: tokens.textSecondary, fontSize: '0.85rem' }}>
                      {docDef.required && <span>* Documento requerido</span>}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginLeft: '1rem',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: config.bgColor,
                        color: config.color,
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <span>{config.icon}</span>
                      {config.label}
                    </div>
                    <span style={{ color: tokens.textSecondary, fontSize: '1.2rem' }}>
                      {isExpanded ? 'â¼' : 'â¶'}
                    </span>
                  </div>
                </div>

                {/* Document Details (Expanded) */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '1.5rem',
                      borderTop: `1px solid ${tokens.border}`,
                      backgroundColor: `rgba(59, 108, 231, 0.02)`,
                    }}
                  >
                    {/* File Upload Section */}
                    {(status === 'pendiente' || status === 'subido' || status === 'rechazado') && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label
                          style={{
                            display: 'block',
                            marginBottom: '0.75rem',
                            fontWeight: 500,
                            color: tokens.textPrimary,
                          }}
                        >
                          Selecciona un archivo
                        </label>

                        {uploadingDocType !== docDef.tipo && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '0.75rem',
                              marginBottom: '0.75rem',
                            }}
                          >
                            <input
                              type="file"
                              id={`file-${docDef.tipo}`}
                              onChange={handleFileSelect}
                              style={{ display: 'none' }}
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                            />
                            <label
                              htmlFor={`file-${docDef.tipo}`}
                              style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                backgroundColor: tokens.border,
                                borderRadius: '6px',
                                cursor: 'pointer',
                                textAlign: 'center',
                                fontWeight: 500,
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = tokens.primary
                                e.currentTarget.style.color = 'white'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = tokens.border
                                e.currentTarget.style.color = tokens.textPrimary
                              }}
                            >
                              ð Seleccionar archivo
                            </label>

                            <button
                              onClick={() => handleUpload(docDef.tipo)}
                              disabled={!selectedFile || uploadingDocType !== null}
                              style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor:
                                  selectedFile && uploadingDocType === null
                                    ? tokens.green
                                    : tokens.border,
                                color:
                                  selectedFile && uploadingDocType === null
                                    ? 'white'
                                    : tokens.textSecondary,
                                border: 'none',
                                borderRadius: '6px',
                                cursor:
                                  selectedFile && uploadingDocType === null
                                    ? 'pointer'
                                    : 'not-allowed',
                                fontWeight: 500,
                                fontFamily: 'Montserrat, sans-serif',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (selectedFile && uploadingDocType === null) {
                                  e.currentTarget.style.opacity = '0.9'
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1'
                               }}
                            >
                              {uploadingDocType === docDef.tipo ? 'â³ Subiendo...' : 'â Subir'}
                            </button>
                          </div>
                        )}

                        {uploadingDocType === docDef.tipo && (
                          <div
                            style={{
                              padding: '1rem',
                              backgroundColor: tokens.border,
                              borderRadius: '6px',
                              textAlign: 'center',
                              color: tokens.textSecondary,
                            }}
                          >
                            Subiendo archivo...
                          </div>
                        )}

                        {selectedFile && uploadingDocType !== docDef.tipo && (
                          <p style={{ margin: '0.5rem 0 0 0', color: tokens.textSecondary, fontSize: '0.85rem' }}>
                            Archivo seleccionado: {selectedFile.name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {status === 'rechazado' && docStatus?.razon_rechazo && (
                      <div
                        style={{
                          backgroundColor: 'rgba(197, 48, 48, 0.1)',
                          border: `1px solid ${tokens.red}`,
                          borderRadius: '6px',
                          padding: '1rem',
                          marginBottom: '1rem',
                        }}
                      >
                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500, color: tokens.red }}>
                          â ï¸ Motivo del rechazo
                        </p>
                        <p style={{ margin: 0, color: tokens.textPrimary, fontSize: '0.95rem' }}>
                          {docStatus.razon_rechazo}
                        </p>
                      </div>
                    )}

                    {/* Current File Info */}
                    {docStatus && (
                      <div
                        style={{
                          backgroundColor: tokens.border,
                          borderRadius: '6px',
                          padding: '1rem',
                          marginBottom: '1rem',
                        }}
                      >
                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500, color: tokens.textPrimary }}>
                          ð Archivo actual
                        </p>
                        <p style={{ margin: 0, color: tokens.textSecondary, fontSize: '0.9rem' }}>
                          {docStatus.nombre_archivo}
                        </p>
                      </div>
                    )}

                    {/* Timeline */}
                    {docActivities.length > 0 && (
                      <div style={{ marginTop: '1.5rem' }}>
                        <p style={{ margin: '0 0 1rem 0', fontWeight: 500, color: tokens.textPrimary }}>
                          â±ï¸ Historial
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                          }}
                        >
                          {docActivities.map((activity, idx) => {
                            const actConfig = {
                              subido: { icon: 'ð¤', label: 'Archivo subido' },
                              revisado: { icon: 'ðï¸', label: 'En revisiÃ³n' },
                              aprobado: { icon: 'â', label: 'Aprobado' },
                              rechazado: { icon: 'â', label: 'Rechazado' },
                            }
                            const actCfg = actConfig[activity.tipo]

                            return (
                              <div key={idx} style={{ fontSize: '0.85rem' }}>
                                <p style={{ margin: 0, color: tokens.textPrimary }}>
                                  {actCfg.icon} {actCfg.label}
                                </p>
                                <p style={{ margin: '0.25rem 0 0 0', color: tokens.textSecondary, fontSize: '0.8rem' }}>
                                  {activity.fecha}
                                  {activity.revisado_por && ` â¢ Revisado por: ${activity.revisado_por}`}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
ÂöFcà¢Ð¢ÂöFcà¢¢ÒÐ¢ÂöFcà ¢²ò¢VÇfö÷FW"¢÷Ð¢ÆF`¢7GÆS×·°¢&6¶w&÷VæD6öÆ÷#¢Fö¶Vç2æ&t6&BÀ¢&÷&FW#¢6öÆBG·Fö¶Vç2æ&÷&FW'ÖÀ¢&÷&FW%&FW3¢srÀ¢FFæs¢sãW&VÒrÀ¢6öÆ÷#¢Fö¶Vç2çFWE6V6öæF'À¢föçE6¦S¢sã&VÒrÀ¢Ö&våF÷¢s'&VÒrÀ¢×Ð¢à¢Ç7GÆS×·²Ö&vã¢sãsW&VÒrÂföçEvVvC¢S×Óà¢	ù*+ôæV6W6F2VFð¢Â÷à¢ÇVÀ¢7GÆS×·°¢Ö&vã¢À¢FFætÆVgC¢sã#W&VÒrÀ¢F7Æ¢vfÆWrÀ¢fÆWF&V7Föã¢v6öÇVÖârÀ¢v¢sãW&VÒrÀ¢×Ð¢à¢ÆÆåFöF÷2Æ÷2Fö7VÖVçF÷26öâ&WVW&F÷2&6ö×ÆWF"VÂöæ&ö&FæsÂöÆà¢ÆÆäÆ÷2&6f÷26WFF÷26öã¢DbÂ¥rÂärÂvV%Ü:ÖòÔ"ÂöÆà¢ÆÆå6GRFö7VÖVçFòW2&V6¦FòÂ&Wf6VÂÖ÷FfògVVÇfR7V&&ÆóÂöÆà¢ÆÆäVÂ&ö6W6òFR&Wf6;6âVVFRFöÖ"7FC÷&3ÂöÆà¢Â÷VÃà¢ÂöFcà¢ÂöFcà¢ÂöFcà¢§Ð ¢ò ¥5ÂÖw&Föâf÷"Fö7VÖVçF÷5ö6ÆVçFRF&ÆS  ¤5$TDRD$ÄRFö7VÖVçF÷5ö6ÆVçFR¢BUTB$Ô%´UDTdTÅBvVå÷&æFöÕ÷WVBÀ¢6ÆVçFUöBUTBäõBåTÄÂ$TdU$Tä4U26ÆVçFW2BôâDTÄUDR444DRÀ¢FõöFö7VÖVçFòDUBäõBåTÄÂ4T4²FõöFö7VÖVçFòât54brÂtäRrÂt7FrÂuöFW"rÂt6ö×&ö&çFRrÂt6&GVÆrÀ¢æöÖ'&Uö&6fòDUBäõBåTÄÂÀ¢7F÷&vU÷FDUBäõBåTÄÂÀ¢7FGW2DUBäõBåTÄÂDTdTÅBwVæFVçFRr4T4²7FGW2âwVæFVçFRrÂw7V&FòrÂvVå÷&Wf6öârÂv&ö&FòrÂw&V6¦FòrÀ¢&¦öå÷&V6¦òDUBÀ¢&Wf6Fõ÷÷"DUBÀ¢7&VFVEöBDÔU5DÕtDDÔR¤ôäRDTdTÅBæ÷rÀ¢WFFVEöBDÔU5DÕtDDÔR¤ôäRDTdTÅBæ÷rÀ¢TäTR6ÆVçFUöBÂFõöFö7VÖVçFò¢° ¤5$TDRäDUGöFö7VÖVçF÷5ö6ÆVçFUöBôâFö7VÖVçF÷5ö6ÆVçFR6ÆVçFUöB°¤5$TDRäDUGöFö7VÖVçF÷5÷7FGW2ôâFö7VÖVçF÷5ö6ÆVçFR7FGW2°¤5$TDRäDUGöFö7VÖVçF÷5ö7&VFVEöBôâFö7VÖVçF÷5ö6ÆVçFR7&VFVEöB° ¢ÒÒVæ&ÆR$Å0¤ÅDU"D$ÄRFö7VÖVçF÷5ö6ÆVçFRTä$ÄR$õrÄUdTÂ4T5U$E° ¢ÒÒ$Å2öÆ7¢6ÆVçFW26âfWræBÖöFgFV"÷vâFö7VÖVçG0¤5$TDRôÄ5$6ÆVçG26âfWr÷vâFö7VÖVçG2"ôâFö7VÖVçF÷5ö6ÆVçFP¢dõ"4TÄT5BU4är6ÆVçFUöBÒWFçVB° ¤5$TDRôÄ5$6ÆVçG26âWÆöBFö7VÖVçG2"ôâFö7VÖVçF÷5ö6ÆVçFP¢dõ"å4U%BtD4T4²6ÆVçFUöBÒWFçVB° ¤5$TDRôÄ5$6ÆVçG26âWFFR÷vâFö7VÖVçG2"ôâFö7VÖVçF÷5ö6ÆVçFP¢dõ"UDDRU4är6ÆVçFUöBÒWFçVB° ¢ÒÒFÖâöÆ7¢FÖç26âfWrÂWFFR7FGW0¤5$TDRôÄ5$FÖç26âÖævRFö7VÖVçG2"ôâFö7VÖVçF÷5ö6ÆVçFP¢dõ"ÄÂU4är¢U5E2¢4TÄT5Be$ôÒW7V&÷2tU$RBÒWFçVBäB&öÂÒvFÖâp¢¢°¢¢ð
