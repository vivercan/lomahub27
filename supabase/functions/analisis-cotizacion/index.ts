// supabase/functions/analisis-cotizacion/index.ts
// Edge Function: Analiza cotizaciones PDF con Anthropic Claude
// Recibe PDF base64, extrae datos clave y sugiere etapa del pipeline

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisRequest {
  file_base64: string
  filename: string
  lead_id: string
  lead_empresa: string
}

interface AnalysisResult {
  resumen: string
  monto_detectado: number
  moneda: string
  vigencia: string
  etapa_sugerida: string
  confianza: number
  notas: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const body: AnalysisRequest = await req.json()
    const { file_base64, filename, lead_id, lead_empresa } = body

    if (!file_base64) {
      throw new Error('file_base64 is required')
    }

    // Call Anthropic Claude API with PDF as base64
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: file_base64,
                },
              },
              {
                type: 'text',
                text: `Analiza esta cotización/propuesta comercial de transporte de carga para la empresa "${lead_empresa}".

Extrae la siguiente información y responde SOLO con un JSON válido (sin markdown, sin texto adicional):

{
  "resumen": "Resumen ejecutivo de 2-3 oraciones sobre qué ofrece la cotización",
  "monto_detectado": 0,
  "moneda": "USD o MXN",
  "vigencia": "Fecha o periodo de vigencia si aparece",
  "etapa_sugerida": "Una de: Nuevo, Contactado, Cotizado, Negociacion, Cerrado Ganado, Cerrado Perdido",
  "confianza": 0,
  "notas": "Observaciones relevantes para el vendedor"
}

Reglas:
- monto_detectado: El monto total más representativo en la cotización. Si hay varios, usa el total general. Si no hay monto claro, pon 0.
- moneda: Detecta si es USD o MXN. Si no es claro, asume USD.
- etapa_sugerida: Basándote en el contenido del documento:
  * Si es una cotización formal con precios → "Cotizado"
  * Si es una propuesta de negociación o contraoferta → "Negociacion"
  * Si indica acuerdo firmado o aceptación → "Cerrado Ganado"
  * Si indica rechazo → "Cerrado Perdido"
  * Si es solo un primer contacto o solicitud → "Contactado"
  * Si no puedes determinar → "Cotizado"
- confianza: Tu nivel de confianza en el análisis de 0 a 100.
- Responde SOLO el JSON, nada más.`,
              },
            ],
          },
        ],
      }),
    })

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text()
      console.error('Anthropic API error:', anthropicResponse.status, errorText)
      throw new Error(`Anthropic API error: ${anthropicResponse.status}`)
    }

    const anthropicData = await anthropicResponse.json()
    const responseText = anthropicData.content?.[0]?.text || '{}'

    // Parse the JSON response from Claude
    let analysis: AnalysisResult
    try {
      // Clean potential markdown code blocks
      const cleanJson = responseText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()
      analysis = JSON.parse(cleanJson)
    } catch (parseErr) {
      console.error('Failed to parse Claude response:', responseText)
      analysis = {
        resumen: 'No se pudo analizar el documento correctamente.',
        monto_detectado: 0,
        moneda: 'USD',
        vigencia: '',
        etapa_sugerida: 'Cotizado',
        confianza: 20,
        notas: `Error al parsear respuesta de IA. Respuesta raw: ${responseText.substring(0, 200)}`,
      }
    }

    // Validate etapa_sugerida
    const validStages = ['Nuevo', 'Contactado', 'Cotizado', 'Negociacion', 'Cerrado Ganado', 'Cerrado Perdido']
    if (!validStages.includes(analysis.etapa_sugerida)) {
      analysis.etapa_sugerida = 'Cotizado'
    }

    // Validate confianza range
    if (typeof analysis.confianza !== 'number' || analysis.confianza < 0 || analysis.confianza > 100) {
      analysis.confianza = 50
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
