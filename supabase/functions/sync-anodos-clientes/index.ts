// sync-anodos-clientes — V1 — PRODUCTION
// ANODOS REST: http://34.127.23.213:5216/api/AnodosData/obtenerClientes
// Param: clienteId (int32, optional). Sin param = ALL clientes.
// Batch upsert on anodos_id.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const ANODOS_BASE = 'http://34.127.23.213:5216/api/AnodosData'

Deno.serve(async (_req) => {
  const startTime = Date.now()
  try {
    const res = await fetch(`${ANODOS_BASE}/obtenerClientes`, {
      signal: AbortSignal.timeout(30000)
    })

    if (!res.ok) {
      return json({ ok: false, error: `ANODOS HTTP ${res.status}`, version: 'V1' })
    }

    const clientes: AnodosCliente[] = await res.json()

    if (!Array.isArray(clientes) || clientes.length === 0) {
      return json({ ok: true, clientes: 0, version: 'V1', note: 'No clientes from ANODOS' })
    }

    const syncTime = new Date().toISOString()

    const rows = clientes.map(c => ({
      anodos_id: c.IdCliente,
      nombre: c.Nombre || null,
      razon_social: c.RazonSocial || null,
      tipo_persona: c.TipoPersona || null,
      regimen_fiscal: c.RegimenFiscal,
      origen_destino: c.OrigenDestino ?? false,
      rfc: c.RFC || null,
      curp: c.CURP || null,
      serie_factura: c.SerieFactura || null,
      inicio_operacion: c.InicioOperacion || null,
      p_facturar: c.PFacturar ?? false,
      d_activa: c.DActiva ?? false,
      dias_credito: c.DiasCredito,
      giro_negocio: c.GiroNegocio || null,
      tax_id: c.TaxId || null,
      domicilio: c.Domicilio || null,
      calle: c.Calle || null,
      no_ext: c.NoExt || null,
      no_int: c.NoInt || null,
      colonia: c.Colonia || null,
      pais: c.Pais,
      estado: c.Estado,
      municipio: c.Municipio,
      localidad: c.Localidad,
      latitud: c.Latitud || null,
      longitud: c.Longitud || null,
      metodo_pago: c.MetodoPago,
      forma_pago: c.FormaPago,
      uso_cdfi: c.UsoCDFI,
      ejecutivo_cxc: c.EjecutivoCXC || null,
      ejecutivo_cs: c.EjecutivoCS || null,
      observaciones: c.Observaciones || null,
      fecha_crea: c.FechaCrea || null,
      synced_at: syncTime
    }))

    let upserted = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500)
      const { error, count } = await supabase
        .from('clientes_anodos')
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
      anodos_total: clientes.length,
      upserted,
      errors: errors.length > 0 ? errors : null,
      elapsed_ms: Date.now() - startTime
    })

  } catch (error) {
    console.error('sync-anodos-clientes error:', error)
    return json({ ok: false, error: (error as Error).message, version: 'V1', elapsed_ms: Date.now() - startTime }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

interface AnodosCliente {
  IdCliente: number
  Nombre: string
  PrimerNombre: string | null
  SegundoNombre: string | null
  ApellidoPaterno: string | null
  ApellidoMaterno: string | null
  Nacionalidad: string | null
  RazonSocial: string
  TipoPersona: string | null
  RegimenFiscal: number
  OrigenDestino: boolean
  RFC: string
  CURP: string | null
  SerieFactura: string | null
  InicioOperacion: string | null
  PFacturar: boolean
  DActiva: boolean
  DiasCredito: number
  GiroNegocio: string | null
  TaxId: string | null
  Domicilio: string | null
  Calle: string | null
  NoExt: string | null
  NoInt: string | null
  Colonia: string | null
  Pais: number
  Estado: number
  Municipio: number
  Localidad: number
  Latitud: string | null
  Longitud: string | null
  MetodoPago: number
  FormaPago: number
  UsoCDFI: number
  EjecutivoCXC: string | null
  EjecutivoCS: string | null
  Observaciones: string | null
  FechaCrea: string
}
