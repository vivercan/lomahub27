// Análisis 80/20 (Pareto) — Identifica qué 20% de clientes/unidades/rutas genera el 80% del ingreso
// Cruza viajes con clientes, tractos y rutas para calcular concentración de ingresos

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

    const { mes, anio, dimension } = await req.json()
    // dimension: 'clientes' | 'tractos' | 'rutas' (default: all three)

    // Build date range
    const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`
    const lastDay = new Date(anio, mes, 0).getDate()
    const fin = `${anio}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // âââ Fetch viajes in period ââââââââââââââââââââââââââ
    const { data: viajes } = await supabase
      .from('viajes')
      .select('id, cliente_id, tracto_id, origen, destino, ingreso_estimado, costo_estimado, status')
      .gte('created_at', `${inicio}T00:00:00`)
      .lte('created_at', `${fin}T23:59:59`)

    // âââ Fetch clientes ââââââââââââââââââââââââââââââââââ
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, razon_social, empresa')

    const clienteMap = new Map((clientes || []).map(c => [c.id, c]))

    // âââ Fetch tractos âââââââââââââââââââââââââââââââââââ
    const { data: tractos } = await supabase
      .from('tractos')
      .select('id, numero_economico, marca, modelo, empresa')

    const tractoMap = new Map((tractos || []).map(t => [t.id, t]))

    // âââ Helper: calculate Pareto ââââââââââââââââââââââââ
    function calcPareto(items: { id: string; label: string; sublabel: string; ingreso: number; costo: number; viajes: number }[]) {
      // Sort by ingreso descending
      items.sort((a, b) => b.ingreso - a.ingreso)

      const totalIngreso = items.reduce((s, i) => s + i.ingreso, 0)
      const totalCosto = items.reduce((s, i) => s + i.costo, 0)
      const totalViajes = items.reduce((s, i) => s + i.viajes, 0)

      let acumulado = 0
      let umbral80Count = 0
      let umbral80Found = false

      const detalle = items.map((item, idx) => {
        acumulado += item.ingreso
        const pctAcumulado = totalIngreso > 0 ? (acumulado / totalIngreso) * 100 : 0
        const margen = item.ingreso > 0 ? ((item.ingreso - item.costo) / item.ingreso) * 100 : 0
        const pctDelTotal = totalIngreso > 0 ? (item.ingreso / totalIngreso) * 100 : 0

        if (!umbral80Found && pctAcumulado >= 80) {
          umbral80Count = idx + 1
          umbral80Found = true
        }

        return {
          posicion: idx + 1,
          id: item.id,
          label: item.label,
          sublabel: item.sublabel,
          ingreso: item.ingreso,
          costo: item.costo,
          margen: Math.round(margen * 10) / 10,
          viajes: item.viajes,
          pct_del_total: Math.round(pctDelTotal * 10) / 10,
          pct_acumulado: Math.round(pctAcumulado * 10) / 10,
          zona: pctAcumulado <= 80 ? 'A' : pctAcumulado <= 95 ? 'B' : 'C',
        }
      })

      if (!umbral80Found) umbral80Count = items.length

      return {
        totalItems: items.length,
        totalIngreso,
        totalCosto,
        totalViajes,
        margenGlobal: totalIngreso > 0 ? Math.round(((totalIngreso - totalCosto) / totalIngreso) * 100 * 10) / 10 : 0,
        items80pct: umbral80Count,
        concentracion: items.length > 0 ? Math.round((umbral80Count / items.length) * 100 * 10) / 10 : 0,
        detalle,
      }
    }

    // âââ Aggregate by CLIENTES âââââââââââââââââââââââââââ
    const clienteAgg: Record<string, { ingreso: number; costo: number; viajes: number }> = {}
    for (const v of (viajes || [])) {
      if (!v.cliente_id) continue
      if (!clienteAgg[v.cliente_id]) clienteAgg[v.cliente_id] = { ingreso: 0, costo: 0, viajes: 0 }
      clienteAgg[v.cliente_id].ingreso += v.ingreso_estimado || 0
      clienteAgg[v.cliente_id].costo += v.costo_estimado || 0
      clienteAgg[v.cliente_id].viajes++
    }

    const clienteItems = Object.entries(clienteAgg).map(([id, d]) => {
      const info = clienteMap.get(id)
      return {
        id,
        label: info?.razon_social || id,
        sublabel: info?.empresa || '',
        ingreso: d.ingreso,
        costo: d.costo,
        viajes: d.viajes,
      }
    })

    // âââ Aggregate by TRACTOS ââââââââââââââââââââââââââââ
    const tractoAgg: Record<string, { ingreso: number; costo: number; viajes: number }> = {}
    for (const v of (viajes || [])) {
      if (!v.tracto_id) continue
      if (!tractoAgg[v.tracto_id]) tractoAgg[v.tracto_id] = { ingreso: 0, costo: 0, viajes: 0 }
      tractoAgg[v.tracto_id].ingreso += v.ingreso_estimado || 0
      tractoAgg[v.tracto_id].costo += v.costo_estimado || 0
      tractoAgg[v.tracto_id].viajes++
    }

    const tractoItems = Object.entries(tractoAgg).map(([id, d]) => {
      const info = tractoMap.get(id)
      return {
        id,
        label: info ? `${info.numero_economico} — ${info.marca} ${info.modelo}` : id,
        sublabel: info?.empresa || '',
        ingreso: d.ingreso,
        costo: d.costo,
        viajes: d.viajes,
      }
    })

    // âââ Aggregate by RUTAS ââââââââââââââââââââââââââââââ
    const rutaAgg: Record<string, { ingreso: number; costo: number; viajes: number }> = {}
    for (const v of (viajes || [])) {
      const ruta = `${v.origen || '?'} â ${v.destino || '?'}`
      if (!rutaAgg[ruta]) rutaAgg[ruta] = { ingreso: 0, costo: 0, viajes: 0 }
      rutaAgg[ruta].ingreso += v.ingreso_estimado || 0
      rutaAgg[ruta].costo += v.costo_estimado || 0
      rutaAgg[ruta].viajes++
    }

    const rutaItems = Object.entries(rutaAgg).map(([ruta, d]) => ({
      id: ruta,
      label: ruta,
      sublabel: '',
      ingreso: d.ingreso,
      costo: d.costo,
      viajes: d.viajes,
    }))

    // âââ Build response ââââââââââââââââââââââââââââââââââ
    const response: Record<string, any> = {
      ok: true,
      mes: `${anio}-${String(mes).padStart(2, '0')}`,
    }

    if (!dimension || dimension === 'clientes' || dimension === 'todos') {
      response.clientes = calcPareto(clienteItems)
    }
    if (!dimension || dimension === 'tractos' || dimension === 'todos') {
      response.tractos = calcPareto(tractoItems)
    }
    if (!dimension || dimension === 'rutas' || dimension === 'todos') {
      response.rutas = calcPareto(rutaItems)
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('analisis-8020:', err)
    return new Response(JSON.stringify({
      ok: false,
      mensaje: err instanceof Error ? err.message : 'Error interno',
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
