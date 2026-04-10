// Rankings Automáticos — Top/Bottom de clientes, tractos y rutas
// Consulta viajes en período, agrega por dimensión y devuelve rankings

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No autorizado')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { periodo_inicio, periodo_fin } = await req.json()

    // âââ Fetch viajes in period ââââââââââââââââââââââââ
    const { data: viajes, error: vErr } = await supabase
      .from('viajes')
      .select('id, cliente_id, tracto_id, ruta_origen, ruta_destino, ingreso_estimado, costo_estimado, status, created_at')
      .gte('created_at', `${periodo_inicio}T00:00:00`)
      .lte('created_at', `${periodo_fin}T23:59:59`)

    if (vErr) throw vErr

    // âââ Fetch previous period for comparison ââââââââââ
    const start = new Date(periodo_inicio)
    const end = new Date(periodo_fin)
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const prevEnd = new Date(start)
    prevEnd.setDate(prevEnd.getDate() - 1)
    const prevStart = new Date(prevEnd)
    prevStart.setDate(prevStart.getDate() - diffDays)

    const { data: viajesPrev } = await supabase
      .from('viajes')
      .select('id, cliente_id, tracto_id, ruta_origen, ruta_destino, ingreso_estimado, costo_estimado')
      .gte('created_at', prevStart.toISOString().split('T')[0] + 'T00:00:00')
      .lte('created_at', prevEnd.toISOString().split('T')[0] + 'T23:59:59')

    // âââ Fetch clientes and tractos for names ââââââââââ
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, razon_social, empresa')

    const { data: tractos } = await supabase
      .from('tractos')
      .select('id, numero_economico, empresa')

    const clienteMap = new Map((clientes || []).map(c => [c.id, c]))
    const tractoMap = new Map((tractos || []).map(t => [t.id, t]))

    // âââ Aggregate by cliente ââââââââââââââââââââââââââ
    const clienteAgg: Record<string, { viajes: number; ingreso: number; costo: number }> = {}
    const clienteAggPrev: Record<string, { viajes: number; ingreso: number }> = {}

    for (const v of (viajes || [])) {
      if (!v.cliente_id) continue
      if (!clienteAgg[v.cliente_id]) clienteAgg[v.cliente_id] = { viajes: 0, ingreso: 0, costo: 0 }
      clienteAgg[v.cliente_id].viajes++
      clienteAgg[v.cliente_id].ingreso += v.ingreso_estimado || 0
      clienteAgg[v.cliente_id].costo += v.costo_estimado || 0
    }

    for (const v of (viajesPrev || [])) {
      if (!v.cliente_id) continue
      if (!clienteAggPrev[v.cliente_id]) clienteAggPrev[v.cliente_id] = { viajes: 0, ingreso: 0 }
      clienteAggPrev[v.cliente_id].viajes++
      clienteAggPrev[v.cliente_id].ingreso += v.ingreso_estimado || 0
    }

    // âââ Aggregate by tracto âââââââââââââââââââââââââââ
    const tractoAgg: Record<string, { viajes: number; ingreso: number; costo: number }> = {}
    const tractoAggPrev: Record<string, { viajes: number; ingreso: number }> = {}

    for (const v of (viajes || [])) {
      if (!v.tracto_id) continue
      if (!tractoAgg[v.tracto_id]) tractoAgg[v.tracto_id] = { viajes: 0, ingreso: 0, costo: 0 }
      tractoAgg[v.tracto_id].viajes++
      tractoAgg[v.tracto_id].ingreso += v.ingreso_estimado || 0
      tractoAgg[v.tracto_id].costo += v.costo_estimado || 0
    }

    for (const v of (viajesPrev || [])) {
      if (!v.tracto_id) continue
      if (!tractoAggPrev[v.tracto_id]) tractoAggPrev[v.tracto_id] = { viajes: 0, ingreso: 0 }
      tractoAggPrev[v.tracto_id].viajes++
      tractoAggPrev[v.tracto_id].ingreso += v.ingreso_estimado || 0
    }

    // âââ Aggregate by ruta âââââââââââââââââââââââââââââ
    const rutaAgg: Record<string, { viajes: number; ingreso: number; costo: number }> = {}
    const rutaAggPrev: Record<string, { viajes: number; ingreso: number }> = {}

    for (const v of (viajes || [])) {
      const rutaKey = `${v.ruta_origen || '?'} â ${v.ruta_destino || '?'}`
      if (!rutaAgg[rutaKey]) rutaAgg[rutaKey] = { viajes: 0, ingreso: 0, costo: 0 }
      rutaAgg[rutaKey].viajes++
      rutaAgg[rutaKey].ingreso += v.ingreso_estimado || 0
      rutaAgg[rutaKey].costo += v.costo_estimado || 0
    }

    for (const v of (viajesPrev || [])) {
      const rutaKey = `${v.ruta_origen || '?'} â ${v.ruta_destino || '?'}`
      if (!rutaAggPrev[rutaKey]) rutaAggPrev[rutaKey] = { viajes: 0, ingreso: 0 }
      rutaAggPrev[rutaKey].viajes++
      rutaAggPrev[rutaKey].ingreso += v.ingreso_estimado || 0
    }

    // âââ Build ranking arrays ââââââââââââââââââââââââââ
    function calcCambio(current: number, prev: number): number {
      if (prev === 0) return current > 0 ? 100 : 0
      return ((current - prev) / prev) * 100
    }

    // Clientes ranked by ingreso
    const clienteRanking = Object.entries(clienteAgg)
      .map(([id, agg]) => {
        const info = clienteMap.get(id)
        const prev = clienteAggPrev[id]
        const margen = agg.ingreso > 0 ? ((agg.ingreso - agg.costo) / agg.ingreso) * 100 : 0
        return {
          id,
          nombre: info?.razon_social || id,
          empresa: info?.empresa || '',
          valor_principal: agg.ingreso,
          valor_secundario: margen,
          label_principal: 'Facturación',
          label_secundario: 'Margen %',
          cambio_pct: calcCambio(agg.ingreso, prev?.ingreso || 0),
          posicion: 0,
        }
      })
      .sort((a, b) => b.valor_principal - a.valor_principal)

    // Tractos ranked by viajes
    const tractoRanking = Object.entries(tractoAgg)
      .map(([id, agg]) => {
        const info = tractoMap.get(id)
        const prev = tractoAggPrev[id]
        const margen = agg.ingreso > 0 ? ((agg.ingreso - agg.costo) / agg.ingreso) * 100 : 0
        return {
          id,
          nombre: info?.numero_economico || id,
          empresa: info?.empresa || '',
          valor_principal: agg.viajes,
          valor_secundario: margen,
          label_principal: 'Viajes',
          label_secundario: 'Margen %',
          cambio_pct: calcCambio(agg.viajes, prev?.viajes || 0),
          posicion: 0,
        }
      })
      .sort((a, b) => b.valor_principal - a.valor_principal)

    // Rutas ranked by frecuencia
    const rutaRanking = Object.entries(rutaAgg)
      .map(([key, agg]) => {
        const prev = rutaAggPrev[key]
        const margen = agg.ingreso > 0 ? ((agg.ingreso - agg.costo) / agg.ingreso) * 100 : 0
        return {
          id: key,
          nombre: key,
          empresa: '',
          valor_principal: agg.viajes,
          valor_secundario: margen,
          label_principal: 'Frecuencia',
          label_secundario: 'Margen %',
          cambio_pct: calcCambio(agg.viajes, prev?.viajes || 0),
          posicion: 0,
        }
      })
      .sort((a, b) => b.valor_principal - a.valor_principal)

    // Assign positions and slice top/bottom 5
    function assignPositions(arr: typeof clienteRanking) {
      arr.forEach((item, i) => { item.posicion = i + 1 })
      return arr
    }

    assignPositions(clienteRanking)
    assignPositions(tractoRanking)
    assignPositions(rutaRanking)

    const clientes_top = clienteRanking.slice(0, 5)
    const clientes_bottom = clienteRanking.length > 5
      ? clienteRanking.slice(-5).reverse().map((item, i) => ({ ...item, posicion: i + 1 }))
      : []
    const tractos_top = tractoRanking.slice(0, 5)
    const tractos_bottom = tractoRanking.length > 5
      ? tractoRanking.slice(-5).reverse().map((item, i) => ({ ...item, posicion: i + 1 }))
      : []
    const rutas_top = rutaRanking.slice(0, 5)
    const rutas_bottom = rutaRanking.length > 5
      ? rutaRanking.slice(-5).reverse().map((item, i) => ({ ...item, posicion: i + 1 }))
      : []

    // âââ Summary âââââââââââââââââââââââââââââââââââââââ
    const totalIngreso = (viajes || []).reduce((s, v) => s + (v.ingreso_estimado || 0), 0)
    const totalCosto = (viajes || []).reduce((s, v) => s + (v.costo_estimado || 0), 0)
    const margenProm = totalIngreso > 0 ? ((totalIngreso - totalCosto) / totalIngreso) * 100 : 0

    return new Response(JSON.stringify({
      ok: true,
      periodo: { inicio: periodo_inicio, fin: periodo_fin },
      resumen: {
        totalClientes: Object.keys(clienteAgg).length,
        totalTractos: Object.keys(tractoAgg).length,
        totalRutas: Object.keys(rutaAgg).length,
        viajesTotal: (viajes || []).length,
        facturacionTotal: totalIngreso,
        margenPromedio: margenProm,
      },
      rankings: {
        clientes_top,
        clientes_bottom,
        tractos_top,
        tractos_bottom,
        rutas_top,
        rutas_bottom,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('rankings-automaticos:', err)
    return new Response(JSON.stringify({
      ok: false,
      mensaje: err instanceof Error ? err.message : 'Error interno',
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
