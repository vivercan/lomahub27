// sync-anodos-viajes â V1 â PRODUCTION
// ANODOS REST: http://34.127.23.213:5216/api/AnodosData/obtenerInformacionViajes
// Params: fechaInicio, fechaFin (ISO 8601 WITH time), clienteId, tipoOperacion, noViaje
// Syncs last 15 days of trips (to avoid ANODOS timeout). Batch upsert on anodos_id.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const ANODOS_BASE = 'http://34.127.23.213:5216/api/AnodosData'

Deno.serve(async (_req) => {
  const startTime = Date.now()
  try {
    // Last 15 days window (ANODOS can timeout on larger ranges)
    const now = new Date()
    const desde = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
    const fechaInicio = desde.toISOString()
    const fechaFin = now.toISOString()

    const url = `${ANODOS_BASE}/obtenerInformacionViajes?fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}`

    const res = await fetch(url, { signal: AbortSignal.timeout(50000) })

    if (!res.ok) {
      return json({ ok: false, error: `ANODOS HTTP ${res.status}`, version: 'V1' })
    }

    const viajes: AnodosViaje[] = await res.json()

    if (!Array.isArray(viajes) || viajes.length === 0) {
      return json({ ok: true, viajes: 0, version: 'V1', note: 'No viajes in period' })
    }

    const syncTime = new Date().toISOString()

    const rows = viajes.map(v => ({
      anodos_id: v.idViaje,
      viaje: v.Viaje,
      asignacion: v.Asignacion,
      tracto: v.Tracto || null,
      caja: v.Caja || null,
      referencia: v.Referencia || null,
      id_formato_venta: v.idFormatoVenta,
      cita_carga: v.CitaCarga || null,
      cita_descarga: v.CitaDescarga || null,
      llega_cargar: v.LlegaCargar || null,
      inicia_viaje: v.IniciaViaje || null,
      entregar_en: v.entregarEn || null,
      temperatura: v.Temperatura ? String(v.Temperatura) : null,
      kms_viaje: v.KmsViaje || null,
      kms_asignacion: v.KmsAsignacion || null,
      llega_destino: v.LlegaDestino || null,
      par_inter: v.ParInter || null,
      fecha_crea: v.fechaCrea || null,
      disponible: v.Disponible || null,
      tipo: v.Tipo || null,
      cruce: v.Cruce ?? false,
      moneda: v.Moneda === 1 ? 'MXN' : v.Moneda === 2 ? 'USD' : String(v.Moneda || ''),
      formato_venta: v.FormatoVenta,
      cliente: v.Cliente || null,
      origen: v.Origen || null,
      estado_origen: v.EstadoOrigen || null,
      municipio_origen: v.MunicipioOrigen || null,
      destino: v.Destino || null,
      estado_destino: v.EstadoDestino || null,
      municipio_destino: v.MunicipioDestino || null,
      operador: v.Operador || null,
      synced_at: syncTime
    }))

    // Batch upsert in chunks of 500
    let upserted = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500)
      const { error, count } = await supabase
        .from('viajes_anodos')
        .upsert(chunk, { onConflict: 'anodos_id', count: 'exact' })

      if (error) {
        errors.push(`Chunk ${i}-${i + chunk.length}: ${error.message}`)
      } else {
        upserted += count || chunk.length
      }
    }

    return json({
      ok: errors.length === 0,
      version: 'V1',
      anodos_total: viajes.length,
      upserted,
      period: { desde: fechaInicio, hasta: fechaFin },
      errors: errors.length > 0 ? errors : null,
      elapsed_ms: Date.now() - startTime
    })

  } catch (error) {
    console.error('sync-anodos-viajes error:', error)
    return json({ ok: false, error: (error as Error).message, version: 'V1', elapsed_ms: Date.now() - startTime }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

interface AnodosViaje {
  idViaje: number
  Viaje: number
  Asignacion: number
  Tracto: string | null
  Caja: string | null
  Referencia: string | null
  idFormatoVenta: number
  CitaCarga: string | null
  CitaDescarga: string | null
  LlegaCargar: string | null
  IniciaViaje: string | null
  entregarEn: string | null
  Temperatura: number | string | null
  KmsViaje: number | null
  KmsAsignacion: number | null
  LlegaDestino: string | null
  ParInter: string | null
  fechaCrea: string
  Disponible: string | null
  Tipo: string
  Cruce: boolean
  Moneda: number
  FormatoVenta: number
  Cliente: string
  Origen: string
  EstadoOrigen: string
  MunicipioOrigen: string
  Destino: string
  EstadoDestino: string
  MunicipioDestino: string
  Operador: string
}
