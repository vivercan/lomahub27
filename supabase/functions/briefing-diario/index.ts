import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function gatherBusinessData(supabase: any) {
  const today = new Date().toISOString().split('T')[0]

  // Leads by estado
  const { data: leads } = await supabase
    .from('leads')
    .select('id, estado, empresa, valor_estimado, created_at, updated_at')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(50)

  const leadsByEstado: Record<string, number> = {}
  let totalValorLeads = 0
  const leadsRecientes: any[] = []
  for (const l of (leads || [])) {
    leadsByEstado[l.estado] = (leadsByEstado[l.estado] || 0) + 1
    totalValorLeads += (l.valor_estimado || 0)
    if (l.updated_at >= today + 'T00:00:00') {
      leadsRecientes.push({ empresa: l.empresa, estado: l.estado, valor: l.valor_estimado })
    }
  }

  // Viajes activos
  const { data: viajes } = await supabase
    .from('viajes')
    .select('id, tipo, estatus, origen, destino, cliente_nombre, tracto_numero, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(20)

  const viajesByEstatus: Record<string, number> = {}
  for (const v of (viajes || [])) {
    viajesByEstatus[v.estatus || 'sin_estatus'] = (viajesByEstatus[v.estatus || 'sin_estatus'] || 0) + 1
  }

  // Clientes stats
  const { count: totalClientes } = await supabase
    .from('clientes')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)

  const { count: clientesActivos } = await supabase
    .from('clientes')
    .select('id', { count: 'exact', head: true })
    .eq('tipo', 'activo')
    .is('deleted_at', null)

  // CXC cuentas
  const { data: cxc } = await supabase
    .from('cxc_cuentas')
    .select('id, cliente_nombre, monto_total, monto_vencido, dias_vencido')
    .is('deleted_at', null)
    .order('monto_vencido', { ascending: false })
    .limit(10)

  let totalCxc = 0
  let totalVencido = 0
  for (const c of (cxc || [])) {
    totalCxc += (c.monto_total || 0)
    totalVencido += (c.monto_vencido || 0)
  }

  // Formatos de venta recientes (ANODOS sync)
  const { count: formatosHoy } = await supabase
    .from('formatos_venta')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', today + 'T00:00:00')

  const { count: formatosTotal } = await supabase
    .from('formatos_venta')
    .select('id', { count: 'exact', head: true })

  // Dedicados
  const { count: dedicadosActivos } = await supabase
    .from('dedicados_segmentos')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)

  // GPS tracking - unidades activas
  const { count: unidadesGps } = await supabase
    .from('gps_unidades')
    .select('id', { count: 'exact', head: true })

  // Flota
  const { count: tractosTotal } = await supabase
    .from('tractos')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)

  const { count: cajasTotal } = await supabase
    .from('cajas')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)

  return {
    fecha: today,
    resumen_negocio: {
      leads: {
        total: (leads || []).length,
        por_estado: leadsByEstado,
        valor_total_estimado: totalValorLeads,
        actualizados_hoy: leadsRecientes
      },
      viajes: {
        activos: (viajes || []).length,
        por_estatus: viajesByEstatus,
        detalle: (viajes || []).slice(0, 5).map(v => ({
          tipo: v.tipo,
          estatus: v.estatus,
          origen: v.origen,
          destino: v.destino,
          cliente: v.cliente_nombre
        }))
      },
      clientes: {
        total: totalClientes || 0,
        activos: clientesActivos || 0
      },
      cobranza: {
        cuentas_abiertas: (cxc || []).length,
        total_por_cobrar: totalCxc,
        total_vencido: totalVencido,
        top_vencidos: (cxc || []).slice(0, 3).map(c => ({
          cliente: c.cliente_nombre,
          monto_vencido: c.monto_vencido,
          dias: c.dias_vencido
        }))
      },
      formatos_venta: {
        total: formatosTotal || 0,
        hoy: formatosHoy || 0
      },
      flota: {
        tractos: tractosTotal || 0,
        cajas: cajasTotal || 0,
        unidades_gps: unidadesGps || 0
      },
      dedicados: {
        segmentos_activos: dedicadosActivos || 0
      }
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!ANTHROPIC_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const body = await req.json()
    const { tipo, usuario_email } = body
    let { datos } = body

    if (!tipo || !usuario_email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: tipo, usuario_email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['morning', 'evening'].includes(tipo)) {
      return new Response(
        JSON.stringify({ error: 'tipo must be morning or evening' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If datos not provided, gather from Supabase automatically
    if (!datos || Object.keys(datos).length === 0) {
      datos = await gatherBusinessData(supabase)
    }

    // Lookup usuario_id from email
    const { data: usuarios } = await supabase
      .from('usuarios_autorizados')
      .select('user_id')
      .eq('email', usuario_email)
      .limit(1)

    const usuario_id = usuarios?.[0]?.user_id || null

    // Build the prompt for Claude
    const systemPrompt = `Eres el AI Chief of Staff de JJ (Juan Viveros), director comercial de TROB, empresa de transporte de carga en Mexico.
Tu trabajo es analizar los datos del dia y presentar un briefing ejecutivo claro, accionable y priorizado.

REGLAS:
- Habla en espanol profesional, tono ejecutivo directo
- Para cada pendiente, sugiere la accion concreta
- Si es posible, redacta el borrador de la respuesta (email, mensaje, etc.)
- Las metricas deben ser numericas y comparables
- Prioriza por impacto en revenue y urgencia
- Secciones del briefing: resumen_ejecutivo, metricas, pendientes, timeline
- Si es tipo evening, incluye tambien cierre_dia con logros, pendientes_manana y metricas_comparadas

CONTEXTO DE NEGOCIO:
- TROB opera tractocamiones y cajas para transporte de carga IMPO/EXPO/NAC/DEDICADO
- Empresas del grupo: TROB, WExpress (WE), SpeedyHaul (SHI), TROB USA
- Pipeline de leads: Nuevo > Contactado > Cotizado > Negociacion > Cerrado Ganado/Perdido
- Los formatos de venta vienen de ANODOS (sistema externo sincronizado)
- CXC = cuentas por cobrar, dias vencidos son criticos

RESPONDE EXCLUSIVAMENTE en JSON valido con esta estructura:
{
  "resumen_ejecutivo": "2-3 parrafos del analisis ejecutivo del dia",
  "metricas": {
    "cotizaciones_pedidas": 0,
    "cotizaciones_enviadas": 0,
    "leads_nuevos": 0,
    "leads_en_negociacion": 0,
    "viajes_activos": 0,
    "cxc_vencida": 0
  },
  "pendientes": [
    {
      "prioridad": "alta|media|baja",
      "titulo": "Titulo corto",
      "descripcion": "Descripcion del pendiente",
      "accion_sugerida": "Que hacer concretamente",
      "tipo_accion": "email_draft|llamada|seguimiento|revision|otro",
      "datos_accion": {}
    }
  ],
  "timeline": [
    {
      "hora": "09:15",
      "evento": "Descripcion del evento",
      "detalle": "Detalle adicional"
    }
  ],
  "cierre_dia": null
}

Si tipo es "evening", cierre_dia debe ser:
{
  "logros": ["Logro 1", "Logro 2"],
  "pendientes_manana": ["Pendiente 1", "Pendiente 2"],
  "metricas_comparadas": {}
}`

    const userMessage = `Tipo de briefing: ${tipo}
Fecha: ${datos.fecha || new Date().toISOString().split('T')[0]}

DATOS DEL DIA:
${JSON.stringify(datos, null, 2)}`

    // Call Anthropic API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text()
      throw new Error(`Anthropic API error ${anthropicResponse.status}: ${errText}`)
    }

    const anthropicData = await anthropicResponse.json()
    const assistantText = anthropicData.content?.[0]?.text || '{}'

    // Parse Claude's JSON response
    let briefingData
    try {
      const jsonMatch = assistantText.match(/\{[\s\S]*\}/)
      briefingData = JSON.parse(jsonMatch ? jsonMatch[0] : assistantText)
    } catch {
      briefingData = {
        resumen_ejecutivo: assistantText,
        metricas: {},
        pendientes: [],
        timeline: [],
        cierre_dia: null,
      }
    }

    // Insert into briefings table
    const { data: briefing, error: insertError } = await supabase
      .from('briefings')
      .insert({
        tipo,
        fecha: datos.fecha || new Date().toISOString().split('T')[0],
        raw_data: datos,
        resumen_ejecutivo: briefingData.resumen_ejecutivo,
        metricas: briefingData.metricas,
        pendientes: briefingData.pendientes,
        timeline: briefingData.timeline,
        cierre_dia: briefingData.cierre_dia,
        usuario_id,
      })
      .select('id, access_token')
      .single()

    if (insertError) {
      throw new Error(`Insert error: ${insertError.message}`)
    }

    const url = `https://v2.jjcrm27.com/briefing/${briefing.id}?token=${briefing.access_token}`

    return new Response(
      JSON.stringify({
        success: true,
        briefing_id: briefing.id,
        access_token: briefing.access_token,
        url,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
