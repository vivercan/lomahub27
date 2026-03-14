import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { tokens } from '../../lib/tokens'

export default function NuevoLead() {
  const [formData, setFormData] = useState({
    empresa: '',
    contacto: '',
    telefono: '',
    email: '',
    ciudad: '',
    rutaInteres: '',
    tipoCarga: '',
    fuente: '',
    notas: '',
  })

  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Mostrar advertencia de duplicado si "Transportes" está en el campo empresa
    if (field === 'empresa') {
      setShowDuplicateWarning(value.toLowerCase().includes('transportes'))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Lead guardado:', formData)
    // Aquí iría la lógica para guardar el lead
  }

  const fuenteOptions = [
    { value: '', label: 'Seleccionar fuente...' },
    { value: 'referencia', label: 'Referencia' },
    { value: 'llamada', label: 'Llamada Entrante' },
    { value: 'web', label: 'Sitio Web' },
    { value: 'feria', label: 'Feria/Evento' },
    { value: 'otro', label: 'Otro' },
  ]

  const tipoCargaOptions = [
    { value: '', label: 'Seleccionar tipo...' },
    { value: 'general', label: 'Carga General' },
    { value: 'refrigerado', label: 'Refrigerado' },
    { value: 'peligroso', label: 'Material Peligroso' },
    { value: 'especializado', label: 'Especializado' },
  ]

  return (
    <ModuleLayout titulo="Captura de Lead" subtitulo="Registrar nuevo prospecto">
      <div className="space-y-6 max-w-3xl">
        {/* Form Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Empresa *"
                placeholder="Nombre de la empresa"
                value={formData.empresa}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('empresa', e.target.value)}
                required
              />
              <Input
                label="Contacto"
                placeholder="Nombre del contacto"
                value={formData.contacto}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('contacto', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ciudad"
                placeholder="Ciudad"
                value={formData.ciudad}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('ciudad', e.target.value)}
              />
              <Input
                label="Ruta de Interés"
                placeholder="Ej: CDMX - Monterrey"
                value={formData.rutaInteres}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('rutaInteres', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipo de Carga"
                options={tipoCargaOptions}
                value={formData.tipoCarga}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('tipoCarga', e.target.value)}
              />
              <Select
                label="Fuente"
                options={fuenteOptions}
                value={formData.fuente}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('fuente', e.target.value)}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{
                  color: tokens.colors.textSecondary,
                  fontFamily: tokens.fonts.body,
                }}
              >
                Notas
              </label>
              <textarea
                placeholder="Notas adicionales sobre el prospecto..."
                value={formData.notas}
                onChange={(e) => handleInputChange('notas', e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 resize-none"
                style={{
                  background: tokens.colors.bgHover,
                  border: `1px solid ${tokens.colors.border}`,
                  color: tokens.colors.textPrimary,
                  fontFamily: tokens.fonts.body,
                  // @ts-expect-error CSS custom property
                  '--tw-ring-color': tokens.colors.primary,
                }}
                rows={4}
              />
            </div>

            {/* Duplicate Warning */}
            {showDuplicateWarning && (
              <div
                className="flex items-start gap-3 p-3 rounded-lg border"
                style={{
                  background: `${tokens.colors.yellow}1a`,
                  borderColor: `${tokens.colors.yellow}33`,
                }}
              >
                <AlertCircle
                  className="w-5 h-5 shrink-0 mt-0.5"
                  style={{ color: tokens.colors.yellow }}
                />
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: tokens.colors.yellow,
                      fontFamily: tokens.fonts.body,
                    }}
                  >
                    Posible empresa duplicada
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{
                      color: tokens.colors.textSecondary,
                      fontFamily: tokens.fonts.body,
                    }}
                  >
                    Ya existe una empresa con nombre similar en tu cartera.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="primary">Guardar Lead</Button>
              <Button variant="secondary">Cancelar</Button>
            </div>
          </form>
        </Card>
      </div>
    </ModuleLayout>
  )
}
