// Resumen 8AM — Genera briefing operativo diario
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (_req) => {
  const hoy = new Date()
  const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString()

  const { data: viajes } = await supabase
    .from('viajes')
    .select('estado')
    .gte('fecha_salida', inicioDia)

  const enTransito = viajes?.filter(v => v.estado === 'en_transito').length || 0
  const retrasados = viajes?.filter(v => v.estado === 'retrasado').length || 0
  const programados = viajes?.filter(v => v.estado === 'programado').length || 0

  const { data: cajasSinPlan } = await supabase
    .from('cajas').select('id').eq('estado', 'sin_plan')

  const { data: tractosOciosos } = await supabase
    .from('tractos').select('id').eq('estado_operativo', 'disponible').eq('activo', true)

  const briefing = [
    `RESUMEN OPERATIVO — ${new Date().toLocaleDateString('es-MX')}`,
    '',
    `FLOTA`,
    `• Viajes en tránsito: ${enTransito}`,
    `• Retrasados: ${retrasados}`,
    `• Programados hoy: ${programados}`,
    '',
    `CAJAS SIN PLAN: ${cajasSinPlan?.length || 0}`,
    `TRACTOS DISPONIBLES: ${tractosOciosos?.length || 0}`,
  ].join('\n')

  await supabase.from('auditoria_log').insert({
    accion: 'INSERT',
    tabla: 'resumen_8am',
    datos_nuevos: { briefing, fecha: new Date().toISOString() }
  })

  return new Response(JSON.stringify({ ok: true, briefing }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
