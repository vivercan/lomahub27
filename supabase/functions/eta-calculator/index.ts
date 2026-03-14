// ETA Calculator — Recalcula ETA usando GPS + Google Maps
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const { viaje_id } = await req.json()

  const { data: viaje } = await supabase
    .from('viajes')
    .select('*, tractos(numero_economico)')
    .eq('id', viaje_id)
    .single()

  if (!viaje) return new Response('Viaje no encontrado', { status: 404 })

  const { data: gps } = await supabase
    .from('gps_tracking')
    .select('latitud, longitud, velocidad')
    .eq('economico', viaje.tractos.numero_economico)
    .single()

  if (!gps?.latitud) return new Response(JSON.stringify({ message: 'Sin datos GPS' }), { status: 200 })

  const MAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')!
  const mapsUrl = `https://maps.googleapis.com/maps/api/distancematrix/json` +
    `?origins=${gps.latitud},${gps.longitud}` +
    `&destinations=${encodeURIComponent(viaje.destino)}` +
    `&key=${MAPS_KEY}`

  const mapsRes = await fetch(mapsUrl)
  const mapsData = await mapsRes.json()

  const duracionSegundos = mapsData.rows?.[0]?.elements?.[0]?.duration?.value || 0
  const eta = new Date(Date.now() + duracionSegundos * 1000)

  await supabase.from('viajes')
    .update({ eta_calculado: eta.toISOString(), updated_at: new Date().toISOString() })
    .eq('id', viaje_id)

  const cita = new Date(viaje.cita_descarga)
  const minutosAntes = (cita.getTime() - eta.getTime()) / 60000

  if (minutosAntes < 0) {
    await supabase.from('viajes').update({ estado: 'retrasado' }).eq('id', viaje_id)
  } else if (minutosAntes < 60) {
    await supabase.from('viajes').update({ estado: 'en_riesgo' }).eq('id', viaje_id)
  }

  return new Response(JSON.stringify({ eta: eta.toISOString(), minutosAntes }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
