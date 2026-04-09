// sync-anodos â V2 â PRODUCTION
// ANODOS REST API: http://34.127.23.213:5216/api/AnodosData/
// Endpoints: obtenerFormatoVenta, obtenerClientes, obtenerInformacionViajes
// No auth required â direct REST GET
// TipoViaje mapping: 2=EXPO, 3=IMPO, 4=NAC, 6=?, 7=VACIO
// Dedicado=true overrides to DEDICADO
// Batch upsert on anodos_id (unique)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const ANODOS_BASE = 'http://34.127.23.213:5216/api/AnodosData'

const TIPO_VIAJE_MAP: Record<number, string> = {
  2: 'EXPO',
  3: 'IMPO',
  4: 'NAC',
  6: 'NAC',
  7: 'VACIO'
}

Deno.serve(async (_req) => {
  const startTime = Date.now()
  try {
    // 1. Fetch ALL formatos from ANODOS
    const res = await fetch(`${ANODOS_BASE}/obtenerFormatoVenta`, {
      signal: AbortSignal.timeout(30000)
    })

    if (!res.ok) {
      return json({
        ok: false,
        error: `ANODOS HTTP ${res.status}`,
        version: 'V2'
      })
    }

    const formatos: AnodosFormato[] = await res.json()

    if (!Array.isArray(formatos) || formatos.length === 0) {
      return json({
        ok: true,
        formatos: 0,
        version: 'V2',
        note: 'No formatos returned from ANODOS'
      })
    }

    // 2. Map ANODOS â formatos_venta rows
    const now = new Date().toISOString()
    const rows = formatos.map(f => {
      let tipoServicio = TIPO_VIAJE_MAP[f.TipoViaje] || 'NAC'
      if (f.Dedicado === true) tipoServicio = 'DEDICADO'

      // Determine empresa from emisor
      const emisorNombre = (f.NombreEmisor || '').toUpperCase()
      let empresa = 'TROB'
      if (emisorNombre.includes('WEXPRESS') || emisorNombre.includes('W EXPRESS')) {
        empresa = 'WEXPRESS'
      } else if (emisorNombre.includes('SPEEDY') || emisorNombre.includes('SHI')) {
        empresa = 'SHI'
      } else if (emisorNombre.includes('TROB USA')) {
        empresa = 'TROB USA'
      }

      return {
        anodos_id: f.idFormato,
        cliente_nombre: f.Nombre || null,
        razon_social: f.RazonSocial || null,
        rfc: f.RFC || null,
        empresa,
        origen: f.NombreOrigen || null,
        destino: f.NombreDestino || null,
        tipo_servicio: tipoServicio,
        cruce: f.Cruce ?? false,
        refrigerado: f.Refrigerado ?? false,
        dedicado: f.Dedicado ?? false,
        moneda: f.Moneda === 1 ? 'MXN' : f.Moneda === 2 ? 'USD' : String(f.Moneda),
        km_total: f.KmOrigenDestino || null,
        estatus_anodos: f.Estatus,
        origen_razon_social: f.RazonSocialOrigen || null,
        destino_razon_social: f.RazonSocialDestino || null,
        observaciones: f.Observaciones || null,
        fecha_vigencia: f.FechaVigencia || null,
        activo: f.Estatus === 1,
        emisor: f.NombreEmisor || null,
        rfc_emisor: f.RFCEmisor || null,
        updated_at: now,
        synced_at: now
      }
    })

    // 3. Batch upsert in chunks of 500 (Supabase payload limit)
    let upserted = 0
    let errors: string[] = []

    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500)
      const { error, count } = await supabase
        .from('formatos_venta')
        .upsert(chunk, { onConflict: 'anodos_id', count: 'exact' })

      if (error) {
        errors.push(`Chunk ${i}-${i + chunk.length}: ${error.message}`)
      } else {
        upserted += count || chunk.length
      }
    }

    const elapsed = Date.now() - startTime

    return json({
      ok: errors.length === 0,
      version: 'V2',
      anodos_total: formatos.length,
      upserted,
      errors: errors.length > 0 ? errors : null,
      elapsed_ms: elapsed
    })

  } catch (error) {
    const elapsed = Date.now() - startTime
    console.error('sync-anodos error:', error)
    return json({
      ok: false,
      error: (error as Error).message,
      version: 'V2',
      elapsed_ms: elapsed
    }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

// === TYPES ===

interface AnodosFormato {
  idFormato: number
  idCliente: number
  idOrigen: number
  idDestino: number
  idCotizacion: number
  Nombre: string
  Dedicado: boolean | null
  TipoViaje: number
  Redondo: boolean
  Refrigerado: boolean
  Temperatura: string | null
  Moneda: number
  TiempoTotal: number
  KmOrigenDestino* number CPAC: boolean
  C	ruce: boolean
  OerGDatorDoble: boolean
  Pistas: boolean
  DobleRemolque: boolean
  PuertaPuerta: boolean
  UnicoUso: boolean
  Contenedor: boolean
  Plataforma: boolean
  DimEx: boolean
  Hazmat: boolean
  Lavado: boolean
  CartaPorte: boolean
  Pedimento: boolean
  Factura: boolean
  PruebasEntrega: boolean
  FactConcepto: boolean
  FactConsolidada: boolean
  SueldoOperador: number
  Requisitos: string | null
  EntregarEn: string | null
  Observaciones: string | null
  Estatus: number
  ComentarioOperador: string | null
  ComentarioOperaciones: string | null
  ComentarioRechazo: string | null
  FechaVigencia: string | null
  FechaCrea: string
  Usuariocrea: string
  FechaModifica: string | null
  UsuarioModifica: string | null
  RazonSocial: string
  RFC: string
  TaxId: string | null
  Domicilio: string | null
  NombreOrigen: string
  RazonSocialOrigen: string
  RFCOrigen: string
  DomicilioOrigen: string
  LatitudOrigen: string | null
  LongitudOrigen: string | null
  NombreDestino: string
  RazonSocialDestino: string
  RFCDestino: string | null
  DomicilioDestino: string
  LatitudDestino: string | null
  LongitudDestino: string | null
  idEmisor: number
  RFCEmisor: string
  NombreEmisor: string
}
