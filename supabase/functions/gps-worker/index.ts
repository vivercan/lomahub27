// GPS Worker — Corre cada 10 minutos (cron)
// Actualiza posición de toda la flota desde el proveedor GPS
// V29 — Added diagnostic logging for WideTech API response
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (_req) => {
  try {
    const GPS_URL  = Deno.env.get('GPS_API_URL')!
    const GPS_USER = Deno.env.get('GPS_API_USER')!
    const GPS_PASS = Deno.env.get('GPS_API_PASS')!

    if (!GPS_URL || !GPS_USER || !GPS_PASS) {
      return new Response(JSON.stringify({
        ok: false, error: 'Missing GPS secrets',
        hasUrl: !!GPS_URL, hasUser: !!GPS_USER, hasPass: !!GPS_PASS
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    // Llamar al proveedor GPS (WideTech XML API)
    const response = await fetch(GPS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: `<?xml version="1.0"?>
<request>
  <login>${GPS_USER}</login>
  <password>${GPS_PASS}</password>
</request>`
    })

    const xmlText = await response.text()
    const httpStatus = response.status

    // Diagnostic: log raw response info
    console.log(`[gps-worker] WideTech HTTP ${httpStatus}, body length: ${xmlText.length}, preview: ${xmlText.substring(0, 300)}`)

    if (httpStatus !== 200) {
      return new Response(JSON.stringify({
        ok: false, error: 'WideTech API error',
        httpStatus, bodyPreview: xmlText.substring(0, 500)
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    const units = parseGPSResponse(xmlText)

    // If 0 units, return diagnostic info
    if (units.length === 0) {
      return new Response(JSON.stringify({
        ok: true, units: 0,
        diagnostic: {
          httpStatus,
          bodyLength: xmlText.length,
          bodyPreview: xmlText.substring(0, 500),
          hasUnitTag: xmlText.includes('<Unit>'),
          hasError: xmlText.toLowerCase().includes('error'),
        }
      }), { headers: { 'Content-Type': 'application/json' } })
    }

    // Cargar lookup de tractos y cajas para clasificar tipo_unidad
    const { data: tractosData } = await supabase.from('tractos').select('numero_economico')
    const { data: cajasData }   = await supabase.from('cajas').select('numero_economico')
    const tractosSet = new Set((tractosData || []).map(t => t.numero_economico))
    const cajasSet   = new Set((cajasData || []).map(c => c.numero_economico))

    // Upsert en gps_tracking
    for (const unit of units) {
      let tipo_unidad = 'tracto'
      const segLower = (unit.segmento || '').toLowerCase()
      if (segLower.includes('trailer')) {
        tipo_unidad = 'caja'
      } else if (cajasSet.has(unit.economico)) {
        tipo_unidad = 'caja'
      } else if (tractosSet.has(unit.economico)) {
        tipo_unidad = 'tracto'
      }

      await supabase.from('gps_tracking').upsert({
        economico: unit.economico,
        empresa: unit.empresa,
        segmento: unit.segmento,
        latitud: unit.latitude,
        longitud: unit.longitude,
        velocidad: unit.speed,
        ubicacion: unit.location,
        estatus: unit.status,
        tipo_unidad,
        ultima_actualizacion: new Date().toISOString()
      }, { onConflict: 'economico' })

      // Guardar en historial
      await supabase.from('gps_historial').insert({
        economico: unit.economico,
        latitud: unit.latitude,
        longitud: unit.longitude,
        velocidad: unit.speed
      })
    }

    // Detectar unidades detenidas en viaje activo
    await detectarUnidadesDetenidas()

    return new Response(JSON.stringify({ ok: true, units: units.length }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('GPS Worker error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 })
  }
})

interface GPSUnit {
  economico: string
  empresa: string
  segmento: string
  latitude: number
  longitude: number
  speed: number
  location: string
  status: string
}

function parseGPSResponse(xml: string): GPSUnit[] {
  // Tags WideTech: Latitude, Longitude, Speed, DateTimeGPS, Location (CDATA)
  const units: GPSUnit[] = []
  const unitRegex = /<Unit>([\s\S]*?)<\/Unit>/g
  let match
  while ((match = unitRegex.exec(xml)) !== null) {
    const unitXml = match[1]
    const get = (tag: string) => {
      const m = unitXml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return m ? m[1].trim() : ''
    }
    units.push({
      economico: get('UnitId'),
      empresa: get('Company') || '',
      segmento: get('Segment') || '',
      latitude: parseFloat(get('Latitude')) || 0,
      longitude: parseFloat(get('Longitude')) || 0,
      speed: parseFloat(get('Speed')) || 0,
      location: get('Location'),
      status: get('Status') || 'activo'
    })
  }
  return units
}

async function detectarUnidadesDetenidas() {
  const { data: params } = await supabase
    .from('parametros_sistema')
    .select('valor')
    .eq('clave', 'minutos_detenida_alerta')
    .single()

  const umbral = parseInt(params?.valor || '60')
  const hace = new Date(Date.now() - umbral * 60 * 1000).toISOString()

  const { data: viajesRiesgo } = await supabase
    .from('viajes')
    .select('id, tracto_id, cs_asignada')
    .eq('estado', 'en_transito')
    .lt('updated_at', hace)

  for (const viaje of viajesRiesgo || []) {
    await supabase.from('incidencias').insert({
      viaje_id: viaje.id,
      tracto_id: viaje.tracto_id,
      tipo: 'unidad_detenida',
      descripcion: `Unidad sin movimiento por más de ${umbral} minutos`,
      estado: 'abierta'
    })
  }
}
