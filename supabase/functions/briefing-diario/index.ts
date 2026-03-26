import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function gatherBusinessData(supabase: any) {
  const today = new Date().toISOString().split('T')[0]

  // REAL table names and columns verified 26/Mar/2026:
  // leads: id, empresa, contacto, estado, valor_estimado, ejecutivo_nombre, fecha_creacion, updated_at, deleted_at
  // viajes: id, cliente_id, origen, destino, tipo, estado, created_at, updated_at (NO estatus, NO cliente_nombre)
  // clientes: id, razon_social, tipo, segmento, empresa, activo, deleted_at
  // cxc_cartera: id, cliente_id, saldo_total, saldo_vencido, dias_promedio_pago (NOT cxc_cuentas)
  // gps_tracking: id, economico, empresa, estatus, velocidad, ubicacion (NOT gps_unidades)
  // tractos: id, numero_economico, empresa, estado_operativo, activo (NO deleted_at)
  // cajas: id, numero_economico, empresa, tipo, estado, activo (NO deleted_at)
  // formatos_venta: id, cliente_id, empresa, tipo_servicio, tarifa, activo, created_at
  // segmentos: replaces dedicados_segmentos

  const [
    leadsRes, viajesRes, clientesTotalRes, clientesActivosRes,
    cxcRes, formatosHoyRes, formatosTotalRes,
    segmentosRes, gpsRes, tractosRes, cajasRes
  ] = await Promise.all([
    supabase.from('leads').select('id, estado, empresa, valor_estimado, ejecutivo_nombre, updated_at').is('deleted_at', null).order('updated_at', { ascending: false }).limit(100),
    supabase.from('viajes').select('id, tipo, estado, origen, destino, created_at').order('created_at', { ascending: false }).limit(20),
    supabase.from('clientes').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('tipo', 'activo').is('deleted_at', null),
    supabase.from('cxc_cartera').select('id, cliente_id, saldo_total, saldo_vencido, dias_promedio_pago').order('saldo_vencido', { ascending: false }).limit(20),
    supabase.from('formatos_venta').select('id', { count: 'exact', head: true }).gte('created_at', today + 'T00:00:00'),
    supabase.from('formatos_venta').select('id', { count: 'exact', head: true }),
    supabase.from('segmentos').select('id', { count: 'exact', head: true }),
    supabase.from('gps_tracking').select('id', { count: 'exact', head: true }),
    supabase.from('tractos').select('id', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('cajas').select('id', { count: 'exact', head: true }).eq('activo', true),
  ])

  // Pipeline summary by estado
  const leads = leadsRes.data || []
  const pipelineByState: Record<string, { count: number; value: number }> = {}
  let totalPipelineValue = 0
  const leadsHoy: any[] = []
  leads.forEach((l: any) => {
    const st = l.estado || 'Sin estado'
    if (!pipelineByState[st]) pipelineByState[st] = { count: 0, value: 0 }
    pipelineByState[st].count++
    const val = Number(l.valor_estimado) || 0
    pipelineByState[st].value += val
    totalPipelineValue += val
    if (l.updated_at >= today + 'T00:00:00') {
      leadsHoy.push({ empresa: l.empresa, estado: l.estado, valor: l.valor_estimado })
    }
  })

  // Viajes by estado
  const viajes = viajesRes.data || []
  const viajesByEstado: Record<string, number> = {}
  viajes.forEach((v: any) => {
    const st = v.estado || 'sin_estado'
    viajesByEstado[st] = (viajesByEstado[st] || 0) + 1
  })

  // CXC summary
  const cxcData = cxcRes.data || []
  const totalSaldoVencido = cxcData.reduce((s: number, c: any) => s + (Number(c.saldo_vencido) || 0), 0)
  const totalSaldo = cxcData.reduce((s: number, c: any) => s + (Number(c.saldo_total) || 0), 0)

  return {
    fecha: today,
    leads: {
      total: leads.length,
      valor_total_pipeline: totalPipelineValue,
      por_estado: pipelineByState,
      actualizados_hoy: leadsHoy.length,
      top_recientes: leads.slice(0, 5).map((l: any) => ({
        empresa: l.empresa, estado: l.estado, valor: l.valor_estimado, ejecutivo: l.ejecutivo_nombre
      }))
    },
    viajes: {
      total: viajes.length,
      por_estado: viajesByEstado,
      recientes: viajes.slice(0, 5).map((v: any) => ({
        tipo: v.tipo, estado: v.estado, ruta: (v.origen || '') + ' -> ' + (v.destino || '')
      }))
    },
    clientes: {
      total: clientesTotalRes.count || 0,
      activos: clientesActivosRes.count || 0
    },
    cobranza: {
      cuentas: cxcData.length,
      saldo_total: totalSaldo,
      saldo_vencido: totalSaldoVencido,
      top_vencidos: cxcData.slice(0, 5).map((c: any) => ({
        saldo_total: c.saldo_total, saldo_vencido: c.saldo_vencido, dias_prom: c.dias_promedio_pago
      }))
    },
    formatos_venta: {
      total: formatosTotalRes.count || 0,
      hoy: formatosHoyRes.count || 0
    },
    flota: {
      tractos_activos: tractosRes.count || 0,
      cajas_activas: cajasRes.count || 0,
      unidades_gps: gpsRes.count || 0
    },
    dedicados: {
      segmentos: segmentosRes.count || 0
    }
  }
}

async function generateBriefing(tipo: string, businessData: any) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const isMorning = tipo === 'morning'

  const systemPrompt = `Eres el AI Chief of Staff de JJ (Juan Viveros), director de TROB, empresa de transporte de carga en Mexico.
Tu trabajo: analizar datos del negocio y generar un briefing ejecutivo ${isMorning ? 'matutino (7AM)' : 'de cierre de dia (6PM)'}.

CONTEXTO CLAVE:
- TROB opera tractocamiones y cajas para transporte IMPO/EXPO/NAC/DEDICADO
- Empresas del grupo: TROB, WExpress, SpeedyHaul, TROB USA
- Pipeline de leads: Nuevo > Contactado > Cotizado > Negociacion > Cerrado Ganado/Perdido
- Los formatos de venta vienen de ANODOS (TMS externo sincronizado cada 10min)
- CXC = cuentas por cobrar

REGLAS DE INTERPRETACION:
- Los TOTALES (leads en pipeline, clientes, flota, GPS) son metricas PERMANENTES del negocio
- "actualizados_hoy" y "formatos_hoy" son metricas de ACTIVIDAD DIARIA
- Si hay 0 actividad diaria pero totales sanos, NO es crisis â es dia sin movimiento registrado
- Siempre reporta PRIMERO los totales del negocio, DESPUES la actividad del dia
- Tono: ejecutivo directo, en espanol, accionable
- Prioriza por impacto en revenue

RESPONDE EXCLUSIVAMENTE en JSON valido (sin markdown, sin code blocks):
{
  "resumen_ejecutivo": "2-3 parrafos: estado general del negocio + actividad del dia + prioridades",
  "metricas": [
    {"label": "Pipeline Total", "valor": "$X MXN", "tendencia": "stable", "nota": "X leads activos"},
    {"label": "Viajes Activos", "valor": "X", "tendencia": "stable", "nota": "contexto"},
    {"label": "Flota GPS", "valor": "X unidades", "tendencia": "stable", "nota": "en rastreo"},
    {"label": "CXC Vencida", "valor": "$X", "tendencia": "up|down|stable", "nota": "X cuentas"},
    {"label": "Formatos Hoy", "valor": "X", "tendencia": "stable", "nota": "de X total"},
    {"label": "Clientes", "valor": "X", "tendencia": "stable", "nota": "X activos"}
  ],
  "pendientes": [
    {"titulo": "accion concreta", "prioridad": "alta|media|baja", "detalle": "contexto", "responsable": "area"}
  ],
  "timeline": [
    {"hora": "HH:MM", "evento": "descripcion"}
  ]${!isMorning ? ',\n  "cierre_dia": "reflexion del dia, logros y pendientes para manana"' : ''}
}`

  const userPrompt = `Datos del negocio al ${businessData.fecha}:
${JSON.stringify(businessData, null, 2)}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Anthropic API error ${response.status}: ${errText}`)
  }

  const result = await response.json()
  const text = result.content?.[0]?.text || '{}'
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    return JSON.parse(jsonMatch ? jsonMatch[0] : text)
  } catch {
    return { resumen_ejecutivo: text, metricas: [], pendientes: [], timeline: [] }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    let tipo = 'morning'
    let usuarioEmail = 'juan.viveros@trob.com.mx'
    try {
      const body = await req.json()
      tipo = body.tipo || 'morning'
      usuarioEmail = body.usuario_email || usuarioEmail
    } catch { /* default values */ }

    // Gather real business data
    const businessData = await gatherBusinessData(supabase)

    // Generate briefing with AI
    const briefing = await generateBriefing(tipo, businessData)

    // Generate access token
    const accessToken = crypto.randomUUID()

    // Look up user
    const { data: usuario } = await supabase
      .from('usuarios_autorizados')
      .select('id')
      .eq('email', usuarioEmail)
      .single()

    // Save to database
    const { data: saved, error: saveError } = await supabase
      .from('briefings')
      .insert({
        tipo,
        fecha: businessData.fecha,
        raw_data: businessData,
        resumen_ejecutivo: briefing.resumen_ejecutivo || '',
        metricas: briefing.metricas || [],
        pendientes: briefing.pendientes || [],
        timeline: briefing.timeline || [],
        cierre_dia: briefing.cierre_dia || null,
        access_token: accessToken,
        usuario_id: usuario?.id || null
      })
      .select('id')
      .single()

    if (saveError) throw saveError

    const briefingUrl = `https://v2.jjcrm27.com/briefing/${saved.id}?token=${accessToken}`

    return new Response(
      JSON.stringify({ success: true, briefing_id: saved.id, url: briefingUrl, tipo, fecha: businessData.fecha }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Briefing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
