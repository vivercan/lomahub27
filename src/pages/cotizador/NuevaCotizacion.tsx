import { useState, useEffect } from 'react'
import { Upload } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

interface SelectOption {
  value: string
  label: string
}

export default function NuevaCotizacion() {
  const [formData, setFormData] = useState({
    cliente: '',
    origen: '',
    destino: '',
    tipoEquipo: '',
    tipoServicio: '',
    tarifa: '',
    costoBase: '',
  })

  const [file, setFile] = useState<File | null>(null)
  const [clienteOptions, setClienteOptions] = useState<SelectOption[]>([
    { value: '', label: 'Seleccionar cliente...' },
  ])

  const tipoEquipoOptions: SelectOption[] = [
    { value: '', label: 'Seleccionar equipo...' },
    { value: 'seco', label: 'Seco' },
    { value: 'refrigerado', label: 'Refrigerado' },
    { value: 'especializado', label: 'Especializado' },
  ]

  const tipoServicioOptions: SelectOption[] = [
    { value: '', label: 'Seleccionar servicio...' },
    { value: 'impo', label: 'IMPO' },
    { value: 'expo', label: 'EXPO' },
    { value: 'nac', label: 'NAC' },
  ]

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('id, nombre')
          .order('nombre', { ascending: true })

        if (error) {
          console.error('Error fetching clientes:', error)
        } else if (data) {
          const options: SelectOption[] = [
            { value: '', label: 'Seleccionar cliente...' },
            ...data.map((c) => ({
              value: c.id,
              label: c.nombre || 'Sin nombre',
            })),
          ]
          setClienteOptions(options)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
      }
    }

    fetchClientes()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const tarifa = parseFloat(formData.tarifa) || 0
  const costoBase = parseFloat(formData.costoBase) || 0
  const margen = costoBase > 0 ? ((tarifa - costoBase) / costoBase) * 100 : 0
  const margenColor =
    margen > 15 ? tokens.colors.green : margen > 0 ? tokens.colors.yellow : tokens.colors.red

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('CotizaciÃ³n enviada:', formData, file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
    }
  }

  return (
    <ModuleLayout titulo="Nueva CotizaciÃ³n" subtitulo="Cotizador rÃ¡pido">
      <div className="space-y-6 max-w-2xl">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Cliente"
              options={clienteOptions}
              value={formData.cliente}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('cliente', e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Origen"
                placeholder="Ciudad/Terminal origen"
                value={formData.origen}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('origen', e.target.value)}
              />
              <Input
                label="Destino"
                placeholder="Ciudad/Terminal destino"
                value={formData.destino}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('destino', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipo Equipo"
                options={tipoEquipoOptions}
                value={formData.tipoEquipo}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('tipoEquipo', e.target.value)}
              />
              <Select
                label="Tipo Servicio"
                options={tipoServicioOptions}
                value={formData.tipoServicio}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('tipoServicio', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tarifa ($)"
                type="number"
                placeholder="Precio cotizado"
                value={formData.tarifa}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('tarifa', e.target.value)}
              />
              <Input
                label="Costo Base ($)"
                type="number"
                placeholder="Costo de operaciÃ³n"
                value={formData.costoBase}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('costoBase', e.target.value)}
              />
            </div>

            <div
              className="p-3 rounded-lg border"
              style={{
                background: `${margenColor}1a`,
                borderColor: `${margenColor}33`,
              }}
            >
              <p
                className="text-xs uppercase tracking-wider mb-1"
                style={{
                  color: tokens.colors.textMuted,
                  fontFamily: tokens.fonts.body,
                }}
              >
                Margen Estimado
              </p>
              <p
                className="text-2xl font-bold"
                style={{
                  color: margenColor,
                  fontFamily: tokens.fonts.heading,
                }}
              >
                {margen.toFixed(1)}%
              </p>
            </div>

            <Button variant="primary" className="w-full">
              Enviar CotizaciÃ³n
            </Button>
          </form>
        </Card>

        <Card>
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5" style={{ color: tokens.colors.primary }} />
              <h3
                className="text-lg font-bold"
                style={{
                  color: tokens.colors.textPrimary,
                  fontFamily: tokens.fonts.heading,
                }}
              >
                Subir PDF del Cliente
              </h3>
            </div>

            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
              style={{
                borderColor: tokens.colors.border,
                background: tokens.colors.bgHover,
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (e.dataTransfer.files?.[0]) {
                  setFile(e.dataTransfer.files[0])
                }
              }}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="cursor-pointer block"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p
                  className="text-sm"
                  style={{
                    color: tokens.colors.textSecondary,
                    fontFamily: tokens.fonts.body,
                  }}
                >
                  {file
                    ? `Archivo: ${file.name}`
                    : 'Arrastra un PDF o haz clic para seleccionar'}
                </p>
              </label>
            </div>

            {file && (
              <p
                className="text-xs"
                style={{
                  color: tokens.colors.green,
                  fontFamily: tokens.fonts.body,
                }}
              >
                â {file.name} seleccionado
              </p>
            )}
          </div>
        </Card>
      </div>
    </ModuleLayout>
  )
}
