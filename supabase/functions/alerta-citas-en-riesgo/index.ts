import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
}

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get active trips with delivery appointments
    const { data: viajesData, error: vErr } = await supabase
      .from('viajes')
      .select('id, tracto_id, cs_asignada, destino, origen, cliente_id, cita_descarga, cita_carga, estado')
      .in('estado', ['en_transito', 'en_curso'])
      .not('cita_descarga', 'is', null)

    if (vErr) {
      return new Response(JSON.stringify({ error: vErr.message }), { status: 500, headers: corsHeaders })
    }

    const viajes = Array.isArray(viajesData) ? viajesData : []

    if (viajes.length === 0) {
      return new Response(JSON.stringify({ ok: true, alertas: 0, message: 'No active trips with appointments' }), { headers: corsHeaders })
    }

    const now = new Date()
    const alertas: any[] = []

    for (const viaje of viajes) {
      const citaDescarga = new Date(viaje.cita_descarga)
      const horasRestantes = (citaDescarga.getTime() - now.getTime()) / (1000 * 60 * 60)

      // Alert if less than 6 hours to appointment
      if (horasRestantes > 0 && horasRestantes <= 6) {
        // Check if there's already an open incident for this trip
        const { data: existingData } = await supabase
          .from('incidencias')
          .select('id')
          .eq('viaje_id', viaje.id)
          .eq('tipo', 'cita_en_riesgo')
          .eq('estado', 'abierta')
          .limit(1)

        const existing = Array.isArray(existingData) ? existingData : []

        if (existing.length === 0) {
          const { error: insErr } = await supabase
            .from('incidencias')
            .insert({
              viaje_id: viaje.id,
              tracto_id: viaje.tracto_id,
              tipo: 'cita_en_riesgo',
              descripcion: `Cita de descarga en ${Math.round(horasRestantes * 10) / 10}h — Destino: ${viaje.destino || 'N/A'}`,
              estado: 'abierta',
              fecha_apertura: now.toISOString(),
              responsable_id: viaje.cs_asignada || null,
            })

          if (!insErr) {
            alertas.push({
              viaje_id: viaje.id,
              destino: viaje.destino,
              horas_restantes: Math.round(horasRestantes * 10) / 10,
            })
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, alertas: alertas.length, detalles: alertas }),
      { headers: corsHeaders }
    )
  } catch (err) {
    console.error('alerta-citas-en-riesgo:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
