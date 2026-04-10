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

    // Get all active tractos
    const { data: tractosData, error: tErr } = await supabase
      .from('tractos')
      .select('id, numero_economico, estado_operativo, segmento, empresa, plaza_id')
      .eq('activo', true)

    if (tErr) {
      return new Response(JSON.stringify({ error: tErr.message }), { status: 500, headers: corsHeaders })
    }

    const tractos = Array.isArray(tractosData) ? tractosData : []

    if (tractos.length === 0) {
      return new Response(JSON.stringify({ ok: true, ociosos: 0, message: 'No active tractos found' }), { headers: corsHeaders })
    }

    // Get tracto IDs that have active trips
    const { data: viajesData, error: vErr } = await supabase
      .from('viajes')
      .select('tracto_id')
      .in('estado', ['en_transito', 'en_curso', 'programado', 'en_carga', 'en_descarga'])

    if (vErr) {
      return new Response(JSON.stringify({ error: vErr.message }), { status: 500, headers: corsHeaders })
    }

    const viajes = Array.isArray(viajesData) ? viajesData : []
    const tractosConViaje = new Set(viajes.map(v => v.tracto_id).filter(Boolean))

    // Find tractos without active trips (idle)
    const tractosOciosos = tractos.filter(t => 
      !tractosConViaje.has(t.id) && 
      t.estado_operativo === 'disponible'
    )

    // For each idle tracto, check if there's already an open incident
    const alertas = []
    const now = new Date()

    for (const tracto of tractosOciosos) {
      const { data: existingData } = await supabase
        .from('incidencias')
        .select('id')
        .eq('tracto_id', tracto.id)
        .eq('tipo', 'tracto_ocioso')
        .eq('estado', 'abierta')
        .limit(1)

      const existing = Array.isArray(existingData) ? existingData : []

      if (existing.length === 0) {
        const { error: insErr } = await supabase
          .from('incidencias')
          .insert({
            tracto_id: tracto.id,
            tipo: 'tracto_ocioso',
            descripcion: `Tracto ${tracto.numero_economico} disponible sin viaje asignado — Empresa: ${tracto.empresa || 'N/A'}, Segmento: ${tracto.segmento || 'N/A'}`,
            estado: 'abierta',
            fecha_apertura: now.toISOString(),
          })

        if (!insErr) {
          alertas.push({
            tracto_id: tracto.id,
            numero_economico: tracto.numero_economico,
            empresa: tracto.empresa,
            segmento: tracto.segmento,
          })
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        total_activos: tractos.length,
        con_viaje: tractosConViaje.size,
        ociosos_disponibles: tractosOciosos.length,
        nuevas_alertas: alertas.length,
        detalles: alertas,
      }),
      { headers: corsHeaders }
    )
  } catch (err) {
    console.error('alerta-tractos-ociosos:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
