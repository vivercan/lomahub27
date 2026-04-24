// GPS Worker — V39 — FIX PARSER: capturar TODOS los <Plate> (con o sin <hst>)
// Bug V38: "if (!hstMatch) continue" descartaba unidades sin reporte reciente
// Fix V39: Plate sin <hst> = unidad conocida sin posición fresca → se guarda en
// gps_unidades_conocidas (catálogo completo). Plate con <hst> = gps_tracking (feed live).
// WideTech SOAP: HistoyDataLastLocationByUser (sLogin, sPassword)
// Namespace: http://shareservice.co/
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
      return json({ ok: false, error: 'Missing GPS secrets' }, 500)
    }

    const NS = 'http://shareservice.co/'

    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <HistoyDataLastLocationByUser xmlns="${NS}">
      <sLogin>${GPS_USER}</sLogin>
      <sPassword>${GPS_PASS}</sPassword>
    </HistoyDataLastLocationByUser>
  </soap:Body>
</soap:Envelope>`

    const res = await fetch(GPS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${NS}HistoyDataLastLocationByUser"`
      },
      body: soapBody
    })

    const xmlText = await res.text()

    if (res.status !== 200) {
      return json({ ok: false, error: `WideTech HTTP ${res.status}`, version: 'V39', bodyPreview: xmlText.substring(0, 500) })
    }

    // Rate limit check
    if (xmlText.includes('<code>109</code>')) {
      return json({ ok: true, units: 0, version: 'V39', rateLimited: true, note: 'Rate limited. Next cron cycle.' })
    }

    // Error code check
    const codeMatch = xmlText.match(/<code>(\d+)<\/code>/)
    const descMatch = xmlText.match(/<description>([^<]+)<\/description>/)
    if (codeMatch && codeMatch[1] !== '100') {
      return json({ ok: false, error: `WideTech code ${codeMatch[1]}: ${descMatch?.[1] || 'unknown'}`, version: 'V39' })
    }

    // V39 — Parse devuelve {units (con <hst>), catalog (sin <hst>)}
    const parsed = parsePlateResponse(xmlText)
    const units = parsed.units
    const catalog = parsed.catalog

    // Catálogo completo: guardar en gps_unidades_conocidas (todos los Plate IDs)
    if (catalog.length > 0) {
      const catalogRows = catalog.map(u => ({
        economico: u.economico,
        mobile_id: u.mobileId,
        img: u.img,
        ultima_vez_visto: new Date().toISOString()
      }))
      await supabase.from('gps_unidades_conocidas').upsert(catalogRows, { onConflict: 'economico' })
    }

    if (units.length === 0 && catalog.length === 0) {
      return json({
        ok: true, units: 0, catalog: 0, version: 'V39',
        diagnostic: { bodyLength: xmlText.length, hasPlateTag: xmlText.includes('<Plate'), bodyPreview: xmlText.substring(0, 800) }
      })
    }

    // Load lookup tables for classification
    const { data: tractosData } = await supabase.from('tractos').select('numero_economico')
    const { data: cajasData }   = await supabase.from('cajas').select('numero_economico')
    const tractosSet = new Set((tractosData || []).map(t => t.numero_economico))
    const cajasSet   = new Set((cajasData || []).map(c => c.numero_economico))

    const now = new Date().toISOString()

    // Build batch arrays
    const trackingRows = units.map(unit => {
      let tipo_unidad = 'tracto'
      const imgLower = (unit.img || '').toLowerCase()
      if (imgLower.includes('trailer') || imgLower.includes('caja') || imgLower.includes('remolque')) {
        tipo_unidad = 'caja'
      } else if (cajasSet.has(unit.economico)) {
        tipo_unidad = 'caja'
      } else if (tractosSet.has(unit.economico)) {
        tipo_unidad = 'tracto'
      }
      return {
        economico: unit.economico,
        empresa: unit.empresa,
        segmento: unit.segmento,
        latitud: unit.latitude,
        longitud: unit.longitude,
        velocidad: unit.speed,
        ubicacion: unit.location,
        estatus: unit.status,
        tipo_unidad,
        ultima_actualizacion: now
      }
    })

    const historialRows = units.map(unit => ({
      economico: unit.economico,
      latitud: unit.latitude,
      longitud: unit.longitude,
      velocidad: unit.speed
    }))

    // BATCH UPSERT — one call for all tracking records
    const { error: trackError, count: trackCount } = await supabase
      .from('gps_tracking')
      .upsert(trackingRows, { onConflict: 'economico', count: 'exact' })

    // BATCH INSERT historial — in chunks of 500 to avoid payload limits
    let historialInserted = 0
    for (let i = 0; i < historialRows.length; i += 500) {
      const chunk = historialRows.slice(i, i + 500)
      const { error: hError } = await supabase.from('gps_historial').insert(chunk)
      if (!hError) historialInserted += chunk.length
    }

    // Detect stopped units (quick — runs a single query)
    await detectarUnidadesDetenidas()

    return json({
      ok: true,
      units: units.length,                // con posición reciente
      catalog: catalog.length,             // conocidas sin <hst>
      total_plates_widetech: units.length + catalog.length,  // TOTAL visto en WideTech
      upserted: trackCount || units.length,
      historial: historialInserted,
      trackError: trackError?.message || null,
      version: 'V39'
    })

  } catch (error) {
    console.error('GPS Worker error:', error)
    return json({ ok: false, error: (error as Error).message, version: 'V39' }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

// === PARSER ===

interface GPSUnit {
  economico: string
  empresa: string
  segmento: string
  latitude: number
  longitude: number
  speed: number
  location: string
  status: string
  img: string
  mobileId: string
}

interface ParseResult {
  units: GPSUnit[]      // Plate CON <hst> → live feed para gps_tracking
  catalog: GPSUnit[]    // Plate SIN <hst> → catálogo en gps_unidades_conocidas
}

function parsePlateResponse(xml: string): ParseResult {
  const units: GPSUnit[] = []
  const catalog: GPSUnit[] = []
  const plateRegex = /<Plate\s+([^>]*)>([\s\S]*?)<\/Plate>/gi
  let plateMatch

  while ((plateMatch = plateRegex.exec(xml)) !== null) {
    const attrs = plateMatch[1]
    const body = plateMatch[2]

    const plateId = attrVal(attrs, 'id')
    const img = attrVal(attrs, 'img')
    const mobileId = attrVal(attrs, 'MobileID')

    if (!plateId) continue

    // V39 FIX — si no hay <hst>, capturar al catálogo (no descartar)
    const hstMatch = body.match(/<hst[^>]*>([\s\S]*?)<\/hst>/)
    if (!hstMatch) {
      catalog.push({
        economico: plateId,
        empresa: '', segmento: '',
        latitude: 0, longitude: 0, speed: 0,
        location: '', status: 'sin_reporte_reciente',
        img, mobileId
      })
      continue
    }

    const hst = hstMatch[1]
    const get = (tag: string) => {
      const m = hst.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'))
      if (!m) return ''
      return m[1]
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&gt;/gi, '>')
        .replace(/&lt;/gi, '<')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&apos;/gi, "'")
        .trim()
    }

    const lat = parseFloat(get('Latitude') || get('latitude')) || 0
    const lng = parseFloat(get('Longitude') || get('longitude') || get('Lon')) || 0
    const speed = parseFloat(get('Speed') || get('speed')) || 0
    const location = get('Location') || get('location') || get('Address') || ''
    const status = get('Status') || (speed > 0 ? 'en_movimiento' : 'detenido')

    units.push({
      economico: plateId,
      empresa: '', segmento: '',
      latitude: lat, longitude: lng, speed,
      location, status, img, mobileId
    })
  }

  return { units, catalog }
}

function attrVal(attrStr: string, name: string): string {
  const m = attrStr.match(new RegExp(`${name}="([^"]*)"`, 'i'))
  return m ? m[1] : ''
}

// === ALERTAS ===

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

  if (!viajesRiesgo || viajesRiesgo.length === 0) return

  const incidencias = viajesRiesgo.map(v => ({
    viaje_id: v.id,
    tracto_id: v.tracto_id,
    tipo: 'unidad_detenida',
    descripcion: `Unidad sin movimiento por más de ${umbral} minutos`,
    estado: 'abierta'
  }))

  await supabase.from('incidencias').insert(incidencias)
}
