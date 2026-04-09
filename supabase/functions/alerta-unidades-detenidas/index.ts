// alerta-unidades-detenidas — Cron cada 15 min
// Detecta unidades GPS sin movimiento en viajes activos
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (_req) => {
  try {
    const { data: params } = await supabase
      .from('parametros_sistema').select('valor')
      .eq('clave', 'minutos_detenida_alerta').single()

    const umbral = parseInt(params?.valor || '60')

    const { data: viajesData, error: vErr } = await supabase
      .from('viajes').select('id, tracto_id, cs_asignada, destino')
      .in('estado', ['en_transito', 'en_curso'])

    if (vErr) return new Response(JSON.stringify({ error: vErr.message }), { status: 500 })

    const viajes = Array.isArray(viajesData) ? viajesData : []
    let alertas = 0

    for (const v of viajes) {
      if (!v.tracto_id) continue
      const { data: gps } = await supabase.from('gps_tracking')
        .select('velocidad, ultima_actualizacion').eq('economico', v.tracto_id).single()
      if (!gps) continue

      const mins = Math.round((Date.now() - new Date(gps.ultima_actualizacion).getTime()) / 60000)
      if (gps.velocidad === 0 && mins >= umbral) {
        const { data: ex } = await supabase.from('incidencias').select('id')
          .eq('viaje_id', v.id).eq('tipo', 'unidad_detenida').eq('estado', 'abierta').limit(1)
        if (Array.isArray(ex) && ex.length > 0) continue
        await supabase.from('incidencias').insert({
          viaje_id: v.id, tracto_id: v.tracto_id, tipo: 'unidad_detenida',
          descripcion: `Unidad detenida ${mins}min (umbral: ${umbral})`, estado: 'abierta'
        })
        alertas++
      }
    }
    return new Response(JSON.stringify({ ok: true, alertas, viajes: viajes.length, umbral }),
      { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error interno', detalle: (e as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
