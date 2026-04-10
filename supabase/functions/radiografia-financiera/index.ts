// Radiografía Financiera — Análisis completo por cliente
// Cruza viajes, facturas, cartera, contratos y presupuestos para generar un perfil financiero 360°

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

    const { cliente_id, meses_historico } = await req.json()
    if (!cliente_id) throw new Error('Se requiere cliente_id')

    const periodoMeses = meses_historico || 12

    // ─── Fetch cliente info ──────────────────────────
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id, razon_social, rfc, tipo, segmento, prioridad, empresa, fecha_alta, activo')
      .eq('id', cliente_id)
      .single()

    if (!cliente) throw new Error('Cliente no encontrado')

    // ─── Build date range ────────────────────────────
    const now = new Date()
    const inicio = new Date(now.getFullYear(), now.getMonth() - periodoMeses, 1)
    const inicioStr = inicio.toISOString().split('T')[0]

    // ─── Fetch viajes del cliente ────────────────────
    const { data: viajes } = await supabase
      .from('viajes')
      .select('id, origen, destino, ingreso_estimado, costo_estimado, status, created_at, tracto_id')
      .eq('cliente_id', cliente_id)
      .gte('created_at', `${inicioStr}T00:00:00`)

    // ─── Fetch facturas del cliente ──────────────────
    const { data: facturas } = await supabase
      .from('cxc_facturas')
      .select('id, folio, monto, fecha_emision, fecha_vencimiento, estado')
      .eq('cliente_id', cliente_id)

    // ─── Fetch cartera del cliente ───────────────────
    const { data: cartera } = await supabase
      .from('cxc_cartera')
      .select('saldo_total, saldo_vencido, dias_credito_pactados, dias_promedio_pago')
      .eq('cliente_id', cliente_id)
      .single()

    // ─── Fetch contratos ─────────────────────────────
    const { data: contratos } = await supabase
      .from('contratos_clientes')
      .select('id, fecha_inicio, fecha_fin, estado')
      .eq('cliente_id', cliente_id)

    // ─── Fetch presupuesto ───────────────────────────
    const { data: presupuestos } = await supabase
      .from('presupuestos_clientes')
      .select('mes, presupuesto')
      .eq('cliente_id', cliente_id)
      .gte('mes', inicioStr)

    // ─── Aggregate viajes by month ───────────────────
    const viajesPorMes: Record<string, { viajes: number; ingreso: number; costo: number }> = {}
    for (const v of (viajes || [])) {
      const mesKey = (v.created_at as string).substring(0, 7) // YYYY-MM
      if (!viajesPorMes[mesKey]) viajesPorMes[mesKey] = { viajes: 0, ingreso: 0, costo: 0 }
      viajesPorMes[mesKey].viajes++
      viajesPorMes[mesKey].ingreso += v.ingreso_estimado || 0
      viajesPorMes[mesKey].costo += v.costo_estimado || 0
    }

    // ─── Build monthly series (last N months) ────────
    const serieMensual = []
    for (let i = periodoMeses - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mesKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const mesData = viajesPorMes[mesKey] || { viajes: 0, ingreso: 0, costo: 0 }
      const presupuesto = presupuestos?.find(p => (p.mes as string).startsWith(mesKey))?.presupuesto || 0

      serieMensual.push({
        mes: mesKey,
        label: d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
        viajes: mesData.viajes,
        ingreso: mesData.ingreso,
        costo: mesData.costo,
        margen: mesData.ingreso > 0 ? Math.round(((mesData.ingreso - mesData.costo) / mesData.ingreso) * 100 * 10) / 10 : 0,
        presupuesto: presupuesto,
        cumplimiento: presupuesto > 0 ? Math.round((mesData.ingreso / presupuesto) * 100 * 10) / 10 : 0,
      })
      }

    // ─── Aggregate top routes ────────────────────
    const rutaAgg: Record<string, { viajes: number; ingreso: number; costo: number }> = {}
    for (const v of (viajes || [])) {
      const ruta = `${v.origen || '?'} → ${v.destino || '?'}`
      if (!rutaAgg[ruta]) rutaAgg[ruta] = { viajes: 0, ingreso: 0, costo: 0 }
      rutaAgg[ruta].viajes++
      rutaAgg[ruta].ingreso += v.ingreso_estimado || 0
      rutaAgg[ruta].costo += v.costo_estimado || 0
    }

    const topRutas = Object.entries(rutaAgg)
      .map(([ruta, d]) => ({
        ruta,
        viajes: d.viajes,
        ingreso: d.ingreso,
        margen: d.ingreso > 0 ? Math.round(((d.ingreso - d.costo) / d.ingreso) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.ingreso - a.ingreso)
      .slice(0, 10)

    // ─── Facturas analysis ───────────────────────────
    const facturasVigentes = (facturas || []).filter(f => f.estado === 'vigente')
    const facturasVencidas = (facturas || []).filter(f => f.estado === 'vencida')
    const facturasPagadas = (facturas || []).filter(f => f.estado === 'pagada')

    const totalFacturado = (facturas || []).reduce((s, f) => s + (f.monto || 0), 0)
    const totalVigente = facturasVigentes.reduce((s, f) => s + (f.monto || 0), 0)
    const totalVencido = facturasVencidas.reduce((s, f) => s + (f.monto || 0), 0)
    const totalPagado = facturasPagadas.reduce((s, f) => s + (f.monto || 0), 0)

    // ─── Trend calculation ───────────────────────────
    const ultimos3 = serieMensual.slice(-3)
    const anteriores3 = serieMensual.slice(-6, -3)
    const ingresoReciente = ultimos3.reduce((s, m) => s + m.ingreso, 0)
    const ingresoAnterior = anteriores3.reduce((s, m) => s + m.ingreso, 0)
    const tendencia = ingresoAnterior > 0
      ? Math.round(((ingresoReciente - ingresoAnterior) / ingresoAnterior) * 100 * 10) / 10
      : 0

    // ─── KPIs resumen ────────────────────────────────
    const totalViajes = (viajes || []).length
    const totalIngreso = (viajes || []).reduce((s, v) => s + (v.ingreso_estimado || 0), 0)
    const totalCosto = (viajes || []).reduce((s, v) => s + (v.costo_estimado || 0), 0)
    const margenGlobal = totalIngreso > 0 ? Math.round(((totalIngreso - totalCosto) / totalIngreso) * 100 * 10) / 10 : 0
    const ticketPromedio = totalViajes > 0 ? Math.round(totalIngreso / totalViajes) : 0
    const viajesPromMensual = Math.round((totalViajes / periodoMeses) * 10) / 10

    // ─── Contrato vigente ────────────────────────────
    const contratoActivo = (contratos || []).find(c => c.estado === 'activo')

    // ─── Risk score (1-10) ───────────────────────────
    let riskScore = 5 // base
    if (totalVencido > 0) riskScore += 2
    if ((cartera?.dias_promedio_pago || 0) > (cartera?.dias_credito_pactados || 30) * 1.5) riskScore += 1
    if (tendencia < -20) riskScore += 1
    if (!contratoActivo) riskScore += 1
    if (tendencia > 20) riskScore -= 1
    if (totalVencido === 0 && totalFacturado > 0) riskScore -= 1
    riskScore = Math.max(1, Math.min(10, riskScore))

    const riskLabel = riskScore <= 3 ? 'bajo' : riskScore <= 6 ? 'medio' : 'alto'

    // ─── Build response ──────────────────────────────
    return new Response(JSON.stringify({
      ok: true,
      cliente: {
        id: cliente.id,
        razon_social: cliente.razon_social,
        rfc: cliente.rfc,
        tipo: cliente.tipo,
        segmento: cliente.segmento,
        prioridad: cliente.prioridad,
        empresa: cliente.empresa,
        antiguedad_meses: Math.floor((now.getTime() - new Date(cliente.fecha_alta).getTime()) / (1000 * 60 * 60 * 24 * 30)),
      },
      kpis: {
        totalViajes,
        totalIngreso,
        totalCosto,
        margenGlobal,
        ticketPromedio,
        viajesPromMensual,
        tendencia,
        periodoMeses,
      },
      cartera: {
        saldoTotal: cartera?.saldo_total || 0,
        saldoVencido: cartera?.saldo_vencido || 0,
        diasCreditoPactados: cartera?.dias_credito_pactados || 30,
        diasPromedioPago: cartera?.dias_promedio_pago || 0,
        totalFacturado,
        totalVigente,
        totalVencido,
        totalPagado,
        facturasVigentes: facturasVigentes.length,
        facturasVencidas: facturasVencidas.length,
      },
      contrato: contratoActivo ? {
        fechaInicio: contratoActivo.fecha_inicio,
        fechaFin: contratoActivo.fecha_fin,
        estado: contratoActivo.estado,
      } : null,
      riesgo: {
        score: riskScore,
        label: riskLabel,
      },
      serieMensual,
      topRutas,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('radiografia-financiera:', err)
    return new Response(JSON.stringify({
      ok: false,
      mensaje: err instanceof Error ? err.message : 'Error interno',
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
