// sync-anodos-historico â V1 â ONE-TIME BULK LOAD
// Loads ANODOS viajes month by month from 2022-01 to 2026-03
// For 2025+, splits into 15-day windows (higher volume)
// Call with ?start=2022-01 to begin from a specific month
// Processes ONE month per invocation to avoid Edge Function timeout
// Call repeatedly advancing the month until done.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const ANODOS_BASE = 'http://34.127.23.213:5216/api/AnodosData'

Deno.serve(async (req) => {
  const startTime = Date.now()
  try {
    const url = new URL(req.url)
    const startParam = url.searchParams.get('start') || '2022-01'
    const [yearStr, monthStr] = startParam.split('-')
    const year = parseInt(yearStr)
    const month = parseInt(monthStr)

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return json({ ok: false, error: 'Invalid start param. Use ?start=2022-01' })
    }

    // Determine end of month
    const monthStart = new Date(year, month - 1, 1)
    const monthEnd = new Date(year, month, 0, 23, 59, 59)
    const monthLabel = `${year}-${String(month).padStart(2, '0')}`

    // For 2025+, split into two halves to avoid timeout
    const needsSplit = year >= 2025

    let allViajes: unknown[] = []

    if (needsSplit) {
      // First half: 1-15
      const half1Start = monthStart.toISOString()
      const half1End = new Date(year, month - 1, 15, 23, 59, 59).toISOString()
      const r1 = await fetchViajes(half1Start, half1End)
      allViajes.push(...r1)

      // Second half: 16-end
      const half2Start = new Date(year, month - 1, 16).toISOString()
      const half2End = monthEnd.toISOString()
      const r2 = await fetchViajes(half2Start, half2End)
      allViajes.push(...r2)
    } else {
      allViajes = await fetchViajes(monthStart.toISOString(), monthEnd.toISOString())
    }

    if (allViajes.length === 0) {
      const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`
      return json({
        ok: true,
        month: monthLabel,
        viajes: 0,
        note: 'No viajes this month',
        next: nextMonth,
        version: 'V1'
      })
    }

    // Map to DB rows
    const syncTime = new Date().toISOString()
    const rows = (allViajes as AnodosViaje[]).map(v => ({
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

    // Batch upsert
    let upserted = 0
    const errors: string[] = []
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500)
      const { error, count } = await supabase
        .from('viajes_anodos')
        .upsert(chunk, { onConflict: 'anodos_id', count: 'exact' })
      if (error) {
        errors.push(`Chunk ${i}: ${error.message}`)
      } else {
        upserted += count || chunk.length
      }
    }

    const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`

    return json({
      ok: errors.length === 0,
      month: monthLabel,
      viajes: allViajes.length,
      upserted,
      errors: errors.length > 0 ? errors : null,
      next: nextMonth,
      elapsed_ms: Date.now() - startTime,
      version: 'V1'
    })

  } catch (error) {
    console.error('sync-anodos-historico:', error)
    return json({ ok: false, error: (error as Error).message, elapsed_ms: Date.now() - startTime }, 500)
  }
})

async function fetchViajes(desde: string, hasta: string): Promise<unknown[]> {
  const url = `${ANODOS_BASE}/obtenerInformacionViajes?fechaInicio=${encodeURIComponent(desde)}&fechaFin=${encodeURIComponent(hasta)}`
  const res = await fetch(url, { signal: AbortSignal.timeout(45000) })
  if (!res.ok) return []
  const text = await res.text()
  if (!text || text === '[]' || text.trim() === '') return []
  try {
    return JSON.parse(text)
  } catch {
    return []
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

interface AnodosViaje {
  idViaje: number; Viaje: number; Asignacion: number; Tracto: string | null
  Caja: string | null; Referencia: string | null; idFormatoVenta: number
  CitaCarga: string | null; CitaDescarga: string | null; LlegaCargar: string | null
  IniciaViaje: string | null; entregarEn: string | null; Temperatura: number | string | null
  KmsViaje: number | null; KmsAsignacion: number | null; LlegaDestino: string | null
  ParInter: string | null; fechaCrea: string; Disponible: string | null
  Tipo: string; Cruce: boolean; Moneda: number; FormatoVenta: number
  Cliente: string; Origen: string; EstadoOrigen: string; MunicipioOrigen: string
  Destino: string; EstadoDestino: string; MunicipioDestino: string; Operador: string
}
