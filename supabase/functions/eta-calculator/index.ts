// ETA Calculator — Cálculo real de ETA con Google Maps Distance Matrix + NOM-087
// Soporta: origen/destino como lat/lon o dirección, hora_salida, viaje_id opcional
// SIN imports de esm.sh — usa fetch() directo al REST API de Supabase

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const sbHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
}

// NOM-087-SCT-2-2017: límite 10h conducción continua, 8h descanso obligatorio
const NOM087_MAX_CONDUCCION_HORAS = 10
const NOM087_DESCANSO_HORAS = 8

interface ETARequest {
  origen: string        // lat,lon o dirección
  destino: string       // lat,lon o dirección
  hora_salida: string   // ISO 8601
  viaje_id?: string     // UUID — si se pasa, guarda en tabla viajes
  cita_descarga?: string // ISO 8601 — para calcular eta_imposible
}

interface ETAResponse {
  eta_timestamp: string
  duracion_minutos: number
  distancia_km: number
  eta_imposible: boolean
  paradas_nom087: number
  horas_descanso_total: number
  detalle: string
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: ETARequest = await req.json()
    const { origen, destino, hora_salida, viaje_id, cita_descarga } = body

    if (!origen || !destino || !hora_salida) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos: origen, destino, hora_salida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Llamar Google Maps Distance Matrix API ---
    const MAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')
    if (!MAPS_KEY) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY no configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const departureTime = Math.floor(new Date(hora_salida).getTime() / 1000)
    const mapsUrl = `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${encodeURIComponent(origen)}` +
      `&destinations=${encodeURIComponent(destino)}` +
      `&mode=driving` +
      `&departure_time=${departureTime > Math.floor(Date.now() / 1000) ? departureTime : 'now'}` +
      `&language=es` +
      `&key=${MAPS_KEY}`

    const mapsRes = await fetch(mapsUrl)
    const mapsData = await mapsRes.json()

    const element = mapsData.rows?.[0]?.elements?.[0]
    if (!element || element.status !== 'OK') {
      return new Response(
        JSON.stringify({
          error: 'No se pudo calcular ruta',
          detalle: element?.status || 'Sin respuesta de Google Maps',
          maps_status: mapsData.status,
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const duracionSegundosGoogle = element.duration_in_traffic?.value || element.duration?.value || 0
    const distanciaMetros = element.distance?.value || 0
    const distanciaKm = Math.round(distanciaMetros / 1000)

    // --- Aplicar NOM-087 ---
    // Cada 10h de conducción = 8h de descanso obligatorio
    // Simplificación: si distancia > 800 km → 1 parada de 8h
    //                  si distancia > 1600 km → 2 paradas de 16h
    let paradasNOM087 = 0
    let horasDescansoTotal = 0

    if (distanciaKm > 1600) {
      paradasNOM087 = 2
      horasDescansoTotal = NOM087_DESCANSO_HORAS * 2
    } else if (distanciaKm > 800) {
      paradasNOM087 = 1
      horasDescansoTotal = NOM087_DESCANSO_HORAS
    }

    // Cálculo más preciso: horas de conducción estimadas
    const horasConduccion = duracionSegundosGoogle / 3600
    const paradasPorTiempo = Math.floor(horasConduccion / NOM087_MAX_CONDUCCION_HORAS)

    // Usar el mayor entre paradas por distancia y por tiempo
    if (paradasPorTiempo > paradasNOM087) {
      paradasNOM087 = paradasPorTiempo
      horasDescansoTotal = paradasPorTiempo * NOM087_DESCANSO_HORAS
    }

    const descansoSegundos = horasDescansoTotal * 3600
    const duracionTotalSegundos = duracionSegundosGoogle + descansoSegundos
    const duracionMinutos = Math.round(duracionTotalSegundos / 60)

    // Calcular ETA = hora_salida + duración total
    const salida = new Date(hora_salida)
    const etaTimestamp = new Date(salida.getTime() + duracionTotalSegundos * 1000)

    // --- Evaluar si ETA es imposible ---
    let etaImposible = false
    let detalle = `Ruta: ${distanciaKm} km, ${Math.round(horasConduccion)}h conducción`

    if (paradasNOM087 > 0) {
      detalle += `, ${paradasNOM087} parada(s) NOM-087 (${horasDescansoTotal}h descanso)`
    }

    // Si hay cita_descarga, verificar si ETA la supera por más de 2h
    let citaDate: Date | null = null
    if (cita_descarga) {
      citaDate = new Date(cita_descarga)
      const diferenciaMinutos = (etaTimestamp.getTime() - citaDate.getTime()) / 60000

      if (diferenciaMinutos > 120) {
        etaImposible = true
        detalle += ` | ETA supera cita por ${Math.round(diferenciaMinutos)} min — IMPOSIBLE sin ajuste`
      } else if (diferenciaMinutos > 0) {
        detalle += ` | ETA supera cita por ${Math.round(diferenciaMinutos)} min — EN RIESGO`
      } else {
        detalle += ` | ETA ${Math.abs(Math.round(diferenciaMinutos))} min antes de cita — OK`
      }
    }

    // --- Guardar en tabla viajes si se pasa viaje_id ---
    if (viaje_id) {
      const updateData: Record<string, unknown> = {
        eta_calculado: etaTimestamp.toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Actualizar estado del viaje basado en ETA
      if (citaDate) {
        const minutosAntesCita = (citaDate.getTime() - etaTimestamp.getTime()) / 60000
        if (minutosAntesCita < -120) {
          updateData.estado = 'retrasado'
        } else if (minutosAntesCita < 0) {
          updateData.estado = 'en_riesgo'
        }
      }

      // UPDATE via REST API (sin esm.sh import)
      await fetch(
        `${SUPABASE_URL}/rest/v1/viajes?id=eq.${viaje_id}`,
        {
          method: 'PATCH',
          headers: sbHeaders,
          body: JSON.stringify(updateData),
        }
      )
    }

    const response: ETAResponse = {
      eta_timestamp: etaTimestamp.toISOString(),
      duracion_minutos: duracionMinutos,
      distancia_km: distanciaKm,
      eta_imposible: etaImposible,
      paradas_nom087: paradasNOM087,
      horas_descanso_total: horasDescansoTotal,
      detalle,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('eta-calculator:', err)
    return new Response(
      JSON.stringify({ error: 'Error interno', detalle: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
