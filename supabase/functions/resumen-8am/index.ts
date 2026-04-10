// Resumen 8AM â Genera briefing operativo diario
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (_req) => {
  try {
    const hoy = new Date()
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString()

    const { data: viajes, error: viajesError } = await supabase
      .from('viajes')
      .select('estado')
      .gte('fecha_salida', inicioDia)

    if (viajesError) {
      console.error('resumen-8am: Error fetching viajes:', viajesError)
      return new Response(JSON.stringify({ ok: false, error: 'Failed to fetch viajes: ' + viajesError.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      })
    }

    const enTransito = viajes?.filter(v => v.estado === 'en_transito').length || 0
    const retrasados = viajes?.filter(v => v.estado === 'retrasado').length || 0
    const programados = viajes?.filter(v => v.estado === 'programado').length || 0

    const { data: cajasSinPlan, error: cajasError } = await supabase
      .from('cajas').select('id').eq('estado', 'sin_plan')

    if (cajasError) console.error('resumen-8am: Error fetching cajas:', cajasError)

    const { data: tractosOciosos, error: tractosError } = await supabase
      .from('tractos').select('id').eq('estado_operativo', 'disponible').eq('activo', true)

    if (tractosError) console.error('resumen-8am: Error fetching tractos:', tractosError)

    const briefing = [
      `RESUMEN OPERATIVO â ${new Date().toLocaleDateString('es-MX')}`,
      '',
      `FLOTA`,
      `â¢ Viajes en trÃ¡nsito: ${enTransito}`,
      `â¢ Retrasados: ${retrasados}`,
      `â¢ Programados hoy: ${programados}`,
      '',
      `CAJAS SIN PLAN: ${cajasSinPlan?.length || 0}`,
      `TRACTOS DISPONIBLES: ${tractosOciosos?.length || 0}`,
    ].join('\n')

    const { error: logError } = await supabase.from('auditoria_log').insert({
      accion: 'INSERT',
      tabla: 'resumen_8am',
      datos_nuevos: { briefing, fecha: new Date().toISOString() }
    })

    if (logError) console.error('resumen-8am: Error logging briefing:', logError)

    return new Response(JSON.stringify({ ok: true, briefing }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('resumen-8am critical error:', error)
    return new Response(JSON.stringify({
      ok: false,
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
