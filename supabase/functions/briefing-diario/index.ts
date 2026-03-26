import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function gatherBusinessData(supabase: any) {
  const today = new Date().toISOString().split('T')[0]

  // Run all queries in parallel for speed
  const [
    leadsRes, viajesRes, clientesTotalRes, clientesActivosRes,
    cxcRes, formatosHoyRes, formatosTotalRes,
    dedicadosRes, gpsRes, tractosRes, cajasRes
  ] = await Promise.all([
    supabase.from('leads').select('id, estado, empresa, valor_estimado, created_at, updated_at').is('deleted_at', null).order('updated_at', { ascending: false }).limit(50),
    supabase.from('viajes').select('id, tipo, estatus, origen, destino, cliente_nombre, tracto_numero, created_at').is('deleted_at', null).order('created_at', { ascending: false }).limit(20),
    supabase.from('clientes').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('clientes').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('tipo', 'activo'),
    supabase.from('cxc_cuentas').select('id, cliente_nombre, saldo_total, dias_vencido, estatus').is('deleted_at', null).order('saldo_total', { ascending: false }).limit(20),
    supabase.from('formatos_venta').select('id, tipo_servicio, estatus', { count: 'exact', head: true }).gte('created_at', today + 'T00:00:00'),
    supabase.from('formatos_venta').select('id', { count: 'exact', head: true }),
    supabase.from('dedicados_segmentos').select('id, segmento, cliente, ruta', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('gps_unidades').select('id, unidad, estatus', { count: 'exact', head: true }),
    supabase.from('tractos').select('id, numero, estatus', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('cajas').select('id, numero, tipo', { count: 'exact', head: true }).is('deleted_at', null),
  ])

  // Pipeline summary
  const leads = leadsRes.data || []
  const pipelineByState: Record<string, { count: number; value: number }> = {}
  leads.forEach((l: any) => {
    const st = l.estado || 'Sin estado'
    if (!pipelineByState[st]) pipelineByState[st] = { count: 0, value: 0 }
    pipelineByState[st].count++
    pipelineByState[st].value += Number(l.valor_estimado) || 0
  })

  // CXC summary
  const cxcCuentas = cxcRes.data || []
  const totalVencido = cxcCuentas.reduce((s: number, c: any) => s + (Number(c.saldo_total) || 0), 0)
  const cuentasCriticas = cxcCuentas.filter((c: any) => (c.dias_vencido || 0) > 60).length

  return {
    fecha: today,
    leads: {
      total: leads.length,
      pipeline: pipelineByState,
      recientes: leads.slice(0, 5).map((l: any) => ({
        empresa: l.empresa, estado: l.estado,
        valor: l.valor_estimado, updated: l.updated_at
      }))
    },
    viajes: {
      activos: (viajesRes.data || []).length,
      recientes: (viajesRes.data || []).slice(0, 5).map((v: any) => ({
        tipo: v.tipo, estatus: v.estatus,
        ruta: v.origen + ' -> ' + v.destino,
        cliente: v.cliente_nombre
      }))
    },
    clientes: {
      total: clientesTotalRes.count || 0,
      activos: clientesActivosRes.count || 0
    },
    cobranza: {
      cuentas: cxcCuentas.length,
      totalVencido,
      cuentasCriticas,
      top5: cxcCuentas.slice(0, 5).map((c: any) => ({
        cliente: c.cliente_nombre, saldo: c.saldo_total, dias: c.dias_vencido
      }))
    },
    operaciones: {
      formatosHoy: formatosHoyRes.count || 0,
      formatosTotal: formatosTotalRes.count || 0,
      dedicados: dedicadosRes.count || 0,
      gpsUnidades: gpsRes.count || 0,
      tractos: tractosRes.count || 0,
      cajas: cajasRes.count || 0
    }
  }
}

async function generateBriefing(tipo: string, businessData: any) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const isMorning = tipo === 'morning'
  const systemPrompt = `Eres el AI Chief of Staff de TROB/LomaHUB27, empresa de transporte de carga en Mexico.
Genera un briefing ejecutivo ${isMorning ? 'matutino (7AM)' : 'de cierre de dia (6PM)'} en formato JSON.
El briefing debe ser conciso, accionable, y en espanol.
IMPORTANTE: Responde UNICAMENTE con JSON valido, sin markdown, sin code blocks.`

  const userPrompt = `Datos del negocio al ${businessData.fecha}:
${JSON.stringify(businessData, null, 2)}

Genera un JSON con esta estructura exacta:
{
  "resumen_ejecutivo": "2-3 parrafos con lo mas importante del dia",
  "metricas": [
    {"label": "nombre", "valor": "numero o texto", "tendencia": "up|down|stable", "nota": "contexto breve"}
  ],
  "pendientes": [
    {"titulo": "accion", "prioridad": "alta|media|baja", "detalle": "contexto", "responsable": "area"}
  ],
  "timeline": [
    {"hora": "HH:MM", "evento": "descripcion"}
  ]${!isMorning ? ',\n  "cierre_dia": "reflexion y logros del dia"' : ''}
}`

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
    return JSON.parse(text)
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

    // Parse request
    let tipo = 'morning'
    let usuarioEmail = 'juan.viveros@trob.com.mx'
    try {
      const body = await req.json()
      tipo = body.tipo || 'morning'
      usuarioEmail = body.usuario_email || usuarioEmail
    } catch { /* default values */ }

    // Gather data
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
      JSON.stringify({
        success: true,
        briefing_id: saved.id,
        url: briefingUrl,
        tipo,
        fecha: businessData.fecha
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Briefing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
