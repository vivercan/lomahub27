// Presupuesto Mensual — Compara presupuesto vs facturación real por cliente
// Lee de tabla presupuestos_clientes y cruza con viajes del mes

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

    const { mes, anio } = await req.json()

    // Build date range for the month
    const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`
    const lastDay = new Date(anio, mes, 0).getDate()
    const fin = `${anio}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // Previous month for trend
    const prevMes = mes === 1 ? 12 : mes - 1
    const prevAnio = mes === 1 ? anio - 1 : anio
    const prevInicio = `${prevAnio}-${String(prevMes).padStart(2, '0')}-01`
    const prevLastDay = new Date(prevAnio, prevMes, 0).getDate()
    const prevFin = `${prevAnio}-${String(prevMes).padStart(2, '0')}-${String(prevLastDay).padStart(2, '0')}`

    // âââ Fetch presupuestos ââââââââââââââââââââââââââââ
    const { data: presupuestos } = await supabase
      .from('presupuestos_clientes')
      .select('cliente_id, monto, viajes_estimados')
      .eq('mes', mes)
      .eq('anio', anio)

    // âââ Fetch viajes current month ââââââââââââââââââââ
    const { data: viajes } = await supabase
      .from('viajes')
      .select('id, cliente_id, ingreso_estimado, costo_estimado')
      .gte('created_at', `${inicio}T00:00:00`)
      .lte('created_at', `${fin}T23:59:59`)

    // âââ Fetch viajes previous month âââââââââââââââââââ
    const { data: viajesPrev } = await supabase
      .from('viajes')
      .select('id, cliente_id, ingreso_estimado')
      .gte('created_at', `${prevInicio}T00:00:00`)
      .lte('created_at', `${prevFin}T23:59:59`)

    // âââ Fetch clientes ââââââââââââââââââââââââââââââââ
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, razon_social, empresa')

    const clienteMap = new Map((clientes || []).map(c => [c.id, c]))

    // âââ Aggregate viajes by cliente âââââââââââââââââââ
    const realAgg: Record<string, { ingreso: number; viajes: number }> = {}
    for (const v of (viajes || [])) {
      if (!v.cliente_id) continue
      if (!realAgg[v.cliente_id]) realAgg[v.cliente_id] = { ingreso: 0, viajes: 0 }
      realAgg[v.cliente_id].ingreso += v.ingreso_estimado || 0
      realAgg[v.cliente_id].viajes++
    }

    const prevAgg: Record<string, number> = {}
    for (const v of (viajesPrev || [])) {
      if (!v.cliente_id) continue
      prevAgg[v.cliente_id] = (prevAgg[v.cliente_id] || 0) + (v.ingreso_estimado || 0)
    }

    // âââ Build detalle âââââââââââââââââââââââââââââââââ
    // Get all client IDs from either presupuestos or real data
    const allClientIds = new Set([
      ...(presupuestos || []).map(p => p.cliente_id),
      ...Object.keys(realAgg),
    ])

    const detalle: any[] = []
    let presupuestoTotal = 0
    let realTotal = 0
    let clientesBajoCumplimiento = 0

    for (const clienteId of allClientIds) {
      const pres = (presupuestos || []).find(p => p.cliente_id === clienteId)
      const real = realAgg[clienteId]
      const prev = prevAgg[clienteId] || 0
      const info = clienteMap.get(clienteId)

      const presupuesto = pres?.monto || 0
      const realIngreso = real?.ingreso || 0
      const cumplimiento = presupuesto > 0 ? (realIngreso / presupuesto) * 100 : (realIngreso > 0 ? 100 : 0)
      const diferencia = realIngreso - presupuesto

      let tendencia: 'alza' | 'baja' | 'estable' = 'estable'
      if (prev > 0) {
        const cambio = ((realIngreso - prev) / prev) * 100
        if (cambio > 5) tendencia = 'alza'
        else if (cambio < -5) tendencia = 'baja'
      }

      if (cumplimiento < 80) clientesBajoCumplimiento++

      presupuestoTotal += presupuesto
      realTotal += realIngreso

      detalle.push({
        cliente_id: clienteId,
        razon_social: info?.razon_social || clienteId,
        empresa: info?.empresa || '',
        presupuesto,
        real: realIngreso,
        diferencia,
        cumplimiento_pct: Math.round(cumplimiento * 10) / 10,
        viajes_presupuesto: pres?.viajes_estimados || 0,
        viajes_real: real?.viajes || 0,
        tendencia,
      })
    }

    // Sort by real descending
    detalle.sort((a, b) => b.real - a.real)

    const cumplimientoPct = presupuestoTotal > 0 ? (realTotal / presupuestoTotal) * 100 : 0

    return new Response(JSON.stringify({
      ok: true,
      mes: `${anio}-${String(mes).padStart(2, '0')}`,
      anio,
      resumen: {
        totalClientes: detalle.length,
        presupuestoTotal,
        realTotal,
        cumplimientoPct: Math.round(cumplimientoPct * 10) / 10,
        superavit: realTotal - presupuestoTotal,
        clientesBajoCumplimiento,
      },
      detalle,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('presupuesto-mensual:', err)
    return new Response(JSON.stringify({
      ok: false,
      mensaje: err instanceof Error ? err.message : 'Error interno',
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
