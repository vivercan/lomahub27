import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { tokens } from '../../lib/tokens'

export default function AltaCliente() {
  const [paso, setPaso] = useState(1)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    razonSocial: '',
    rfc: '',
    tipo: '',
    segmento: '',
    ciudad: '',
    contactoPrincipal: '',
    telefono: '',
    email: '',
  })

  const pasos = [
    { numero: 1, nombre: 'Comercial' },
    { numero: 2, nombre: 'CS' },
    { numero: 3, nombre: 'CXC' },
    { numero: 4, nombre: 'Cobranza' },
    { numero: 5, nombre: 'Pricing' },
  ]

  const tipoOptions = [
    { value: '', label: 'Seleccionar tipo...' },
    { value: 'pf', label: 'Persona Física' },
    { value: 'pm', label: 'Persona Moral' },
  ]

  const segmentoOptions = [
    { value: '', label: 'Seleccionar segmento...' },
    { value: 'grande', label: 'Empresa Grande' },
    { value: 'mediana', label: 'Empresa Mediana' },
    { value: 'pequeña', label: 'Empresa Pequeña' },
  ]

  const publicLinkUrl = 'https://lomahub.app/public/cliente/QTZx9mK2L'

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLinkUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSiguiente = () => {
    if (paso < 5) {
      setPaso(paso + 1)
    }
  }

  const handleAnterior = () => {
    if (paso > 1) {
      setPaso(paso - 1)
    }
  }

  return (
    <ModuleLayout titulo="Alta de Cliente" subtitulo="Registro de nuevo cliente en el sistema">
      <div className="space-y-6 max-w-3xl">
        {/* Stepper */}
        <div className="flex gap-4 items-center">
          {pasos.map((p, idx) => (
            <div key={p.numero} className="flex items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-all"
                style={{
                  background: paso >= p.numero ? tokens.colors.primary : tokens.colors.bgHover,
                  borderColor: paso >= p.numero ? tokens.colors.primary : tokens.colors.border,
                  color: paso >= p.numero ? '#fff' : tokens.colors.textSecondary,
                }}
              >
                {p.numero}
              </div>
              <div className="ml-2">
                <p
                  className="text-xs uppercase tracking-wider"
                  style={{
                    color: paso >= p.numero ? tokens.colors.primary : tokens.colors.textMuted,
                    fontFamily: tokens.fonts.body,
                  }}
                >
                  {p.nombre}
                </p>
              </div>

              {idx < pasos.length - 1 && (
                <div
                  className="w-8 h-0.5 ml-4"
                  style={{
                    background: paso > p.numero ? tokens.colors.primary : tokens.colors.border,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Formulario Paso 1 */}
        <Card>
          <form className="space-y-4">
            <div>
              <p
                className="text-xs uppercase tracking-wider mb-4"
                style={{
                  color: tokens.colors.textMuted,
                  fontFamily: tokens.fonts.body,
                }}
              >
                Paso {paso}: {pasos.find((p) => p.numero === paso)?.nombre}
              </p>
            </div>

            {paso === 1 && (
              <>
                <Input
                  label="Razón Social *"
                  placeholder="Nombre legal de la empresa"
                  value={formData.razonSocial}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('razonSocial', e.target.value)}
                  required
                />
                <Input
                  label="RFC *"
                  placeholder="RFC de la empresa"
                  value={formData.rfc}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('rfc', e.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Tipo"
                    options={tipoOptions}
                    value={formData.tipo}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('tipo', e.target.value)}
                  />
                  <Select
                    label="Segmento"
                    options={segmentoOptions}
                    value={formData.segmento}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('segmento', e.target.value)}
                  />
                </div>
                <Input
                  label="Ciudad"
                  placeholder="Ciudad principal"
                  value={formData.ciudad}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('ciudad', e.target.value)}
                />
                <Input
                  label="Contacto Principal"
                  placeholder="Nombre del contacto"
                  value={formData.contactoPrincipal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('contactoPrincipal', e.target.value)}
                />
                <Input
                  label="Teléfono"
                  placeholder="+52 1234567890"
                  value={formData.telefono}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('telefono', e.target.value)}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="contacto@empresa.com"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                />
              </>
            )}

            {paso > 1 && paso <= 5 && (
              <div
                className="p-6 rounded-lg text-center"
                style={{
                  background: tokens.colors.bgHover,
                  border: `1px dashed ${tokens.colors.border}`,
                }}
              >
                <p
                  style={{
                    color: tokens.colors.textSecondary,
                    fontFamily: tokens.fonts.body,
                  }}
                >
                  Contenido del paso {paso} — Integración con módulos específicos
                </p>
              </div>
            )}

            {/* Public Link Section */}
            {paso === 1 && (
              <div
                className="p-4 rounded-lg border"
                style={{
                  background: `${tokens.colors.blue}1a`,
                  borderColor: `${tokens.colors.blue}33`,
                }}
              >
                <p
                  className="text-xs uppercase tracking-wider mb-2"
                  style={{
                    color: tokens.colors.textMuted,
                    fontFamily: tokens.fonts.body,
                  }}
                >
                  Link Público
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={publicLinkUrl}
                    readOnly
                    className="flex-1 px-3 py-2 rounded text-xs"
                    style={{
                      background: tokens.colors.bgHover,
                      border: `1px solid ${tokens.colors.border}`,
                      color: tokens.colors.textSecondary,
                      fontFamily: tokens.fonts.body,
                    }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCopyLink}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Card>

        {/* Botones de Navegación */}
        <div className="flex gap-2 justify-between">
          <Button
            variant="secondary"
            onClick={handleAnterior}
            disabled={paso === 1}
          >
            Anterior
          </Button>

          <Button variant="primary" onClick={handleSiguiente} disabled={paso === 5}>
            Siguiente
          </Button>
        </div>

        {paso === 1 && (
          <Button variant="secondary" className="w-full">
            Generar Link Público
          </Button>
        )}
      </div>
    </ModuleLayout>
  )
}
