// programa-semanal — Forecast de carga vs capacidad de flota
// Promedio historico 4 semanas, balance vs flota disponible, alertas sobrecarga
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No autorizado')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const hoy = new Date()
    const hace4Sem = new Date(hoy.getTime() - 28 * 24 * 60 * 60 * 1000)

    const { data: viajes } = await supabase
      .from('viajes').select('id, cliente_id, tipo, fecha_salida, estado')
      .gte('fecha_salida', hace4Sem.toISOString())

    interface CF { cliente_id: string; viajes4s: number; promSem: number; porTipo: Record<string, number> }
    const porCliente: Record<string, CF> = {}

    for (const v of (viajes || [])) {
      if (!v.cliente_id) continue
      if (!porCliente[v.cliente_id]) porCliente[v.cliente_id] = { cliente_id: v.cliente_id, viajes4s: 0, promSem: 0, porTipo: {} }
      porCliente[v.cliente_id].viajes4s++
      const t = v.tipo || 'NAC'
      porCliente[v.cliente_id].porTipo[t] = (porCliente[v.cliente_id].porTipo[t] || 0) + 1
    }

    for (const c of Object.values(porCliente)) c.promSem = Math.round((c.viajes4s / 4) * 10) / 10

    const clienteIds = Object.keys(porCliente)
    const { data: clientes } = await supabase
      .from('clientes').select('id, razon_social')
      .in('id', clienteIds.length > 0 ? clienteIds : ['00000000-0000-0000-0000-000000000000'])

    const cMap = new Map((clientes || []).map(c => [c.id, c.razon_social]))

    const { data: tractosAct } = await supabase.from('tractos').select('id').eq('activo', true).eq('estado_operativo', 'ACTIVO')
    const { data: cajasAct } = await supabase.from('cajas').select('id').eq('activo', true)

    const flota = { tractos: tractosAct?.length || 0, cajas: cajasAct?.length || 0 }
    const totalForecast = Object.values(porCliente).reduce((s, c) => s + c.promSem, 0)
    const cap = Math.min(flota.tractos, flota.cajas)
    const util = cap > 0 ? Math.round((totalForecast / cap) * 100) : 0
    const sobrecarga = totalForecast > cap

    const alertas: string[] = []
    if (sobrecarga) alertas.push(`SOBRECARGA: Forecast ${Math.round(totalForecast)} vs ${cap} unidades`)
    if (util > 85) alertas.push(`Utilizacion alta: ${util}%`)

    const detalle = Object.values(porCliente)
      .map(c => ({ cliente_id: c.cliente_id, razon_social: cMap.get(c.cliente_id) || 'Desconocido', viajes_4_semanas: c.viajes4s, promedio_semanal: c.promSem, por_tipo: c.porTipo }))
      .sort((a, b) => b.promedio_semanal - a.promedio_semanal)

    return new Response(JSON.stringify({
      ok: true,
      periodo_historico: { inicio: hace4Sem.toISOString().split('T')[0], fin: hoy.toISOString().split('T')[0], semanas: 4 },
      forecast: { viajes_estimados: Math.round(totalForecast), capacidad: cap, utilizacion_pct: util, sobrecarga },
      flota, alertas, clientes_activos: detalle.length, detalle,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('programa-semanal:', err)
    return new Response(JSON.stringify({
      ok: false, mensaje: err instanceof Error ? err.message : 'Error interno',
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
