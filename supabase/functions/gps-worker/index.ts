// GPS Worker — V40 — Itera flota_master con HistoyDataLastLocationByPlate
// WideTech limita HistoyDataLastLocationByUser a 51 plates por response.
// Solución V40: iterar cada placa de flota_master.activo=true → 1 call por placa
// 772 unidades × 500ms rate-limit = ~6.5 min por ciclo. Cron cada 15 min.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const NS = 'http://shareservice.co/'
const RATE_LIMIT_MS = 450
const MAX_UNITS_PER_RUN = 250   // por ciclo (cabe en 2 min edge function max)
const CONCURRENCY = 6            // llamadas paralelas

Deno.serve(async (_req) => {
  const started = Date.now()
  try {
    const GPS_URL  = Deno.env.get('GPS_API_URL')!
    const GPS_USER = Deno.env.get('GPS_API_USER')!
    const GPS_PASS = Deno.env.get('GPS_API_PASS')!
    if (!GPS_URL || !GPS_USER || !GPS_PASS) return json({ ok: false, error: 'Missing GPS secrets' }, 500)

    // Leer flota_master activa, ordenada por la menos actualizada primero (fairness)
    const { data: flota, error: flotaErr } = await supabase
      .from('flota_master')
      .select('numero_economico, tipo, linea, empresa')
      .eq('activo', true)
      .order('numero_economico', { ascending: true })
    if (flotaErr) return json({ ok: false, error: flotaErr.message })
    if (!flota || flota.length === 0) return json({ ok: true, units: 0, note: 'flota_master vacía' })

    // Para fairness: rota qué chunk se procesa según minuto del día
    const minute = Math.floor(Date.now() / 60000)
    const chunks = Math.ceil(flota.length / MAX_UNITS_PER_RUN)
    const offset = (minute % chunks) * MAX_UNITS_PER_RUN
    const batch = flota.slice(offset, offset + MAX_UNITS_PER_RUN)

    const results = {
      solicitadas: batch.length,
      con_posicion: 0,
      sin_posicion: 0,
      errores: 0,
      rate_limited: 0,
    }

    // Procesa en grupos concurrentes
    const trackingRows: any[] = []
    const historialRows: any[] = []
    const now = new Date().toISOString()

    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      const group = batch.slice(i, i + CONCURRENCY)
      const promises = group.map(async (u) => {
        const soap = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body><HistoyDataLastLocationByPlate xmlns="${NS}"><sLogin>${GPS_USER}</sLogin><sPassword>${GPS_PASS}</sPassword><sPlate>${u.numero_economico}</sPlate></HistoyDataLastLocationByPlate></soap:Body>
</soap:Envelope>`
        try {
          const r = await fetch(GPS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': `"${NS}HistoyDataLastLocationByPlate"` },
            body: soap
          })
          const xml = await r.text()
          if (xml.includes('<code>109</code>')) { results.rate_limited++; return }
          if (xml.includes('<code>113</code>')) { results.sin_posicion++; return }
          const plateMatch = xml.match(/<Plate[^>]*>([\s\S]*?)<\/Plate>/)
          if (!plateMatch) { results.sin_posicion++; return }
          const body = plateMatch[1]
          const hstMatch = body.match(/<hst[^>]*>([\s\S]*?)<\/hst>/)
          if (!hstMatch) { results.sin_posicion++; return }
          const hst = hstMatch[1]
          const get = (tag: string) => {
            const m = hst.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'))
            return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').trim() : ''
          }
          const lat = parseFloat(get('Latitude')) || null
          const lng = parseFloat(get('Longitude')) || null
          const speed = parseFloat(get('Speed')) || 0
          const location = get('Location') || get('PDI')
          const ignition = get('Ignition')
          const status = ignition === '1' ? (speed > 0 ? 'en_movimiento' : 'detenido_encendido') : 'apagado'
          if (!lat || !lng) { results.sin_posicion++; return }

          trackingRows.push({
            economico: u.numero_economico,
            empresa: u.empresa || '',
            segmento: u.linea || '',
            latitud: lat,
            longitud: lng,
            velocidad: speed,
            ubicacion: location,
            estatus: status,
            tipo_unidad: u.tipo,
            ultima_actualizacion: now,
          })
          historialRows.push({
            economico: u.numero_economico,
            latitud: lat,
            longitud: lng,
            velocidad: speed,
          })
          results.con_posicion++
        } catch (_e) {
          results.errores++
        }
      })

      await Promise.all(promises)
      // Rate limit entre grupos
      if (i + CONCURRENCY < batch.length) await new Promise(r => setTimeout(r, RATE_LIMIT_MS))

      // Budget time — si llevamos >100s, salimos y dejamos el resto al próximo ciclo
      if (Date.now() - started > 100000) break
    }

    // Batch upsert
    if (trackingRows.length > 0) {
      await supabase.from('gps_tracking').upsert(trackingRows, { onConflict: 'economico' })
    }
    if (historialRows.length > 0) {
      for (let i = 0; i < historialRows.length; i += 500) {
        await supabase.from('gps_historial').insert(historialRows.slice(i, i + 500))
      }
    }

    return json({
      ok: true,
      version: 'V40',
      tiempo_ms: Date.now() - started,
      flota_total: flota.length,
      chunks_del_dia: chunks,
      chunk_actual: offset / MAX_UNITS_PER_RUN + 1,
      offset,
      ...results,
      gps_tracking_upserted: trackingRows.length,
      historial_insertado: historialRows.length,
    })
  } catch (error) {
    return json({ ok: false, error: (error as Error).message, version: 'V40' }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
