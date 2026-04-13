import { useState } from 'react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { tokens } from '../../lib/tokens'
import { Upload, FileText, Folder, AlertCircle } from 'lucide-react'

interface DocumentSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  files: File[]
}

export default function DocumentosCompania() {
  const [sections, setSections] = useState<DocumentSection[]>([
    {
      id: 'acta',
      title: 'Acta Constitutiva',
      description: 'Documento legal fundamental de la empresa',
      icon: <FileText size={32} />,
      color: '#3B6CE7',
      files: [],
    },
    {
      id: 'formatos',
      title: 'Formatos Oficiales',
      description: 'Plantillas y formatos estandarizados',
      icon: <Folder size={32} />,
      color: '#0D9668',
      files: [],
    },
    {
      id: 'legal',
      title: 'Documentación Legal/Fiscal',
      description: 'RFC, regímenes fiscales y permisos',
      icon: <FileText size={32} />,
      color: '#D97706',
      files: [],
    },
    {
      id: 'operativa',
      title: 'Documentación Operativa',
      description: 'Manuales, políticas y procedimientos',
      icon: <Folder size={32} />,
      color: '#7C3AED',
      files: [],
    },
  ])

  const handleFileSelect = (sectionId: string, selectedFiles: FileList) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          files: [...section.files, ...Array.from(selectedFiles)],
        }
      }
      return section
    }))
  }

  const handleRemoveFile = (sectionId: string, index: number) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          files: section.files.filter((_, i) => i !== index),
        }
      }
      return section
    }))
  }

  const handleUpload = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (section?.files.length) {
      console.log(`Uploading ${section.files.length} files to ${sectionId}`)
      alert(`Cargando ${section.files.length} archivo(s) a ${section.title}...`)
    }
  }

  return (
    <ModuleLayout
      titulo="Documentos de la Compañía"
      subtitulo="Gestión centralizada de documentos legales y operativos"
      moduloPadre={{ nombre: 'Configuración', ruta: '/admin/configuracion' }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '24px 0',
      }}>
        {/* Info Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '16px 20px',
          background: 'rgba(59, 108, 231, 0.08)',
          border: `1px solid rgba(59, 108, 231, 0.2)`,
          borderRadius: '10px',
          color: tokens.colors.textPrimary,
          fontSize: '14px',
          lineHeight: 1.5,
        }}>
          <AlertCircle size={20} style={{ color: tokens.colors.blue, flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Información importante:</strong> Todos los documentos cargados aquí serán almacenados de forma segura y estarán disponibles para referencia legal y operativa.
          </div>
        </div>

        {/* Document Sections Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {sections.map(section => (
            <div
              key={section.id}
              style={{
                padding: '24px',
                background: tokens.colors.bgCard,
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: '12px',
                boxShadow: tokens.effects.cardShadow,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = tokens.effects.cardHover
                e.currentTarget.style.borderColor = section.color
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = tokens.effects.cardShadow
                e.currentTarget.style.borderColor = tokens.colors.border
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  background: `${section.color}15`,
                  borderRadius: '10px',
                  color: section.color,
                }}>
                  {section.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: tokens.colors.textPrimary,
                    fontFamily: tokens.fonts.heading,
                  }}>
                    {section.title}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: tokens.colors.textMuted,
                    marginTop: '2px',
                  }}>
                    {section.description}
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <label style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 16px',
                border: `2px dashed ${section.color}40`,
                borderRadius: '10px',
                background: `${section.color}08`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                gap: '8px',
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.style.borderColor = section.color
                e.currentTarget.style.background = `${section.color}12`
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = `${section.color}40`
                e.currentTarget.style.background = `${section.color}08`
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.style.borderColor = `${section.color}40`
                e.currentTarget.style.background = `${section.color}08`
                handleFileSelect(section.id, e.dataTransfer.files)
              }}
              >
                <Upload size={24} color={section.color} />
                <span style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: section.color,
                }}>
                  Arrastra archivos aquí
                </span>
                <span style={{
                  fontSize: '12px',
                  color: tokens.colors.textMuted,
                }}>
                  o haz clic para seleccionar
                </span>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileSelect(section.id, e.target.files || new FileList())}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.png"
                />
              </label>

              {/* Files List */}
              {section.files.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: tokens.colors.textSecondary,
                  }}>
                    {section.files.length} archivo{section.files.length !== 1 ? 's' : ''} seleccionado{section.files.length !== 1 ? 's' : ''}
                  </div>
                  {section.files.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: tokens.colors.bgHover,
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: tokens.colors.textPrimary,
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {file.name}
                      </span>
                      <button
                        onClick={() => handleRemoveFile(section.id, idx)}
                        style={{
                          padding: '4px 8px',
                          background: 'transparent',
                          border: 'none',
                          color: tokens.colors.red,
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          marginLeft: '8px',
                        }}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {section.files.length > 0 && (
                <button
                  onClick={() => handleUpload(section.id)}
                  style={{
                    padding: '10px 16px',
                    background: section.color,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: tokens.fonts.body,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  Cargar Documentos
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div style={{
          padding: '16px 20px',
          background: tokens.colors.bgHover,
          borderRadius: '10px',
          fontSize: '12px',
          color: tokens.colors.textMuted,
          lineHeight: 1.6,
        }}>
          Formatos permitidos: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG. Tamaño máximo por archivo: 50 MB.
        </div>
      </div>
    </ModuleLayout>
  )
}
