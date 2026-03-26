import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
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
    const { tipo, usuario_email, datos } = body

    if (!tipo || !usuario_email || !datos) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: tipo, usuario_email, datos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['morning', 'evening'].includes(tipo)) {
      return new Response(
        JSON.stringify({ error: 'tipo must be morning or evening' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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

RESPONDE EXCLUSIVAMENTE en JSON valido con esta estructura:
{
  "resumen_ejecutivo": "2-3 parrafos del analisis ejecutivo del dia",
  "metricas": {
    "cotizaciones_pedidas": 0,
    "cotizaciones_enviadas": 0,
    "leads_nuevos": 0,
    "respuestas_recibidas": 0,
    "correos_entrantes": 0,
    "correos_salientes": 0
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
      // Extract JSON from response (handle markdown code blocks)
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
