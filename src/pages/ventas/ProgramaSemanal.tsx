import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, Truck, AlertTriangle, RefreshCw, Package } from 'lucide-react'
import { ModuleLayout } from '../../components/layout/ModuleLayout'
import { Card } from '../../components/ui/Card'
import { KPICard } from '../../components/ui/KPICard'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { tokens } from '../../lib/tokens'
import { supabase } from '../../lib/supabase'

interface ClientePrograma {
  cliente_id: string
  razon_social: string
  promedio_semanal: number
  forecast_proxima: number
  tendencia: 'alza' | 'baja' | 'estable'
  semanas_data: number
}

interface ProgramaResponse {
  ok: boolean
  semana: { inicio: string; fin: string }
  capacidadFlota: { tractos: number; cajas: number }
  forecastTotal: number
  balance: number
  alerta: string | null
  programa: ClientePrograma[]
  mensaje?: string
}

function getMonday(offset: number = 0): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0]
}

export default function ProgramaSemanal() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ProgramaResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [semanaInicio, setSemanaInicio] = useState(getMonday(1))

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('SesiÃ³n expirada')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/programa-semanal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ semana_inicio: semanaInicio }),
        }
      )
      const json: ProgramaResponse = await res.json()
      if (!json.ok) throw new Error(json.mensaje || 'Error al obtener programa')
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const tendenciaIcon = (t: string) => {
    if (t === 'alza') return <TrendingUp size={14} style={{ color: tokens.colors.green }} />
    if (t === 'baja') return <TrendingUp size={14} style={{ color: tokens.colors.red, transform: 'rotate(180deg)' }} />
    return <span style={{ color: tokens.colors.gray, fontSize: '14px' }}>â</span>
  }

  const balanceColor = data && data.balance >= 0 ? tokens.colors.green : tokens.colors.red

  return (
    <ModuleLayout
      titulo="Programa Semanal"
      subtitulo="Forecast de carga vs capacidad de flota"
      acciones={
        <Button variant="secondary" size="sm" onClick={fetchData} loading={loading}>
          <RefreshCw size={16} />
          Actualizar
        </Button>
      }
    >
      {/* Selector de semana */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="text-xs block mb-1" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
            Semana inicio (lunes)
          </label>
          <input
            type="date"
            value={semanaInicio}
            onChange={(e) => setSemanaInicio(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: tokens.colors.bgHover,
              border: `1px solid ${tokens.colors.border}`,
              color: tokens.colors.textPrimary,
              fontFamily: tokens.fonts.body,
            }}
          />
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSemanaInicio(getMonday(0))}>
          Esta semana
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setSemanaInicio(getMonday(1))}>
          PrÃ³xima semana
        </Button>
        <Button variant="primary" size="md" onClick={fetchData} loading={loading}>
          Consultar
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card glow="red" className="mb-6">
          <p className="text-sm" style={{ color: tokens.colors.red, fontFamily: tokens.fonts.body }}>
            {error}
          </p>
        </Card>
      )}

      {/* KPIs */}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <KPICard
              titulo="Forecast Viajes"
              valor={data.forecastTotal}
              color="primary"
              icono={<Calendar size={18} />}
            />
            <KPICard
              titulo="Tractos Disponibles"
              valor={data.capacidadFlota.tractos}
              color="blue"
              icono={<Truck size={18} />}
            />
            <KPICard
              titulo="Cajas Disponibles"
              valor={data.capacidadFlota.cajas}
              color="blue"
              icono={<Package size={18} />}
            />
            <KPICard
              titulo="Balance"
              valor={data.balance >= 0 ? `+${data.balance}` : `${data.balance}`}
              subtitulo={data.balance >= 0 ? 'Capacidad disponible' : 'DÃ©ficit de capacidad'}
              color={data.balance >= 0 ? 'green' : 'red'}
            />
            <KPICard
              titulo="Clientes"
              valor={data.programa.length}
              color="gray"
            />
          </div>

          {/* Alerta de dÃ©ficit */}
          {data.alerta && (
            <Card glow="red" className="mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} style={{ color: tokens.colors.red }} />
                <p className="text-sm font-medium" style={{ color: tokens.colors.red, fontFamily: tokens.fonts.body }}>
                  {data.alerta}
                </p>
              </div>
            </Card>
          )}

          {/* Semana header */}
          {data.semana && (
            <div className="mb-4">
              <p className="text-sm" style={{ color: tokens.colors.textSecondary, fontFamily: tokens.fonts.body }}>
                Semana: <span style={{ color: tokens.colors.textPrimary, fontWeight: 600 }}>
                  {new Date(data.semana.inicio + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} â {new Date(data.semana.fin + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </p>
            </div>
          )}

          {/* Cards de clientes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.programa.length === 0 ? (
              <Card className="col-span-full">
                <p className="text-center text-sm py-8" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
                  No hay datos de viajes para generar el programa semanal
                </p>
              </Card>
            ) : (
              data.programa
                .sort((a, b) => b.forecast_proxima - a.forecast_proxima)
                .map((cliente) => (
                  <Card key={cliente.cliente_id}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.body }}
                        >
                          {cliente.razon_social}
                        </p>
                        <p className="text-xs" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
                          Promedio: {cliente.promedio_semanal.toFixed(1)} viajes/sem
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {tendenciaIcon(cliente.tendencia)}
                        <Badge color={
                          cliente.tendencia === 'alza' ? 'green' :
                          cliente.tendencia === 'baja' ? 'red' : 'gray'
                        }>
                          {cliente.tendencia}
                        </Badge>
                      </div>
                    </div>

                    {/* Forecast bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
                          Forecast prÃ³xima semana
                        </p>
                        <p className="text-lg font-bold" style={{ color: tokens.colors.primary, fontFamily: tokens.fonts.heading }}>
                          {cliente.forecast_proxima}
                        </p>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: tokens.colors.bgHover }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min((cliente.forecast_proxima / Math.max(data.forecastTotal, 1)) * 100 * 3, 100)}%`,
                            background: tokens.colors.primary,
                          }}
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
                        Basado en {cliente.semanas_data} semanas de datos
                      </p>
                    </div>
                  </Card>
                ))
            )}
          </div>

          {/* Resumen visual de balance */}
          <Card className="mt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: tokens.colors.textMuted, fontFamily: tokens.fonts.body }}>
                  Balance Flota vs Demanda
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: balanceColor, fontFamily: tokens.fonts.heading }}>
                  {data.balance >= 0 ? `+${data.balance} unidades disponibles` : `${Math.abs(data.balance)} unidades de dÃ©ficit`}
                </p>
              </div>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: `${balanceColor}1a` }}
              >
                {data.balance >= 0 ? (
                  <Truck size={28} style={{ color: balanceColor }} />
                ) : (
                  <AlertTriangle size={28} style={{ color: balanceColor }} />
                )}
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Loading state */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: tokens.colors.primary, borderTopColor: 'transparent' }} />
        </div>
      )}
    </ModuleLayout>
  )
}
